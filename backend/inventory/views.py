from django.shortcuts import render
from rest_framework import viewsets, permissions, filters, mixins, status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework import serializers
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import F, ExpressionWrapper, fields
from django.utils import timezone

from .models import (
    FulfillmentLocation,
    AdjustmentReason,
    Inventory,
    InventoryAdjustment,
    SerializedInventory,
    Lot,
    AdjustmentType
)
from .serializers import (
    FulfillmentLocationSerializer,
    AdjustmentReasonSerializer,
    InventorySerializer,
    InventoryAdjustmentSerializer,
    InventoryAdjustmentCreateSerializer,
    SerializedInventorySerializer,
    LotSerializer,
    LotCreateSerializer,
    InventoryImportSerializer
)
from .filters import InventoryFilter, SerializedInventoryFilter, LotFilter
from rest_framework.parsers import MultiPartParser, FormParser
from .tasks import process_inventory_import
from celery.result import AsyncResult
from rest_framework_csv.renderers import CSVRenderer
from datetime import datetime
from .services import perform_inventory_adjustment, update_serialized_status, reserve_serialized_item, ship_serialized_item, receive_serialized_item, find_available_serial_for_reservation
from tenants.mixins import TenantViewMixin

# Create your views here.

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100

class FulfillmentLocationViewSet(TenantViewMixin, viewsets.ModelViewSet):
    """
    API endpoint that allows Fulfillment Locations to be viewed or edited.
    
    list:
    Return a paginated list of all fulfillment locations for the current tenant.
    Results can be filtered by location_type, is_active, and country_code.
    
    create:
    Create a new fulfillment location for the current tenant.
    All address fields (except address_line_2) are required if any address field is provided.
    
    retrieve:
    Return the details of a specific fulfillment location.
    
    update:
    Update all fields of a specific fulfillment location.
    
    partial_update:
    Update one or more fields of a specific fulfillment location.
    
    destroy:
    Delete a specific fulfillment location.
    Note: This may be restricted if the location has associated inventory.
    """
    serializer_class = FulfillmentLocationSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    filterset_fields = ['location_type', 'is_active', 'country_code']
    search_fields = ['name', 'city', 'state_province', 'country_code']
    ordering_fields = ['name', 'created_at', 'location_type']
    ordering = ['name']

    def get_queryset(self):
        """
        Return all locations for the current tenant.
        django-tenants handles tenant filtering automatically.
        """
        return FulfillmentLocation.objects.all()

    def perform_destroy(self, instance):
        """
        Override destroy to check if location has associated inventory.
        """
        if instance.inventory_set.exists():
            raise serializers.ValidationError(
                "Cannot delete location with existing inventory. "
                "Please transfer or remove inventory first."
            )
        instance.delete()

class AdjustmentReasonViewSet(TenantViewMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing Inventory Adjustment Reasons.
    
    list:
    Return a paginated list of all adjustment reasons for the current tenant.
    Results can be filtered by is_active status.
    
    create:
    Create a new adjustment reason for the current tenant.
    Name must be unique and descriptive.
    
    retrieve:
    Return the details of a specific adjustment reason.
    
    update:
    Update all fields of a specific adjustment reason.
    
    partial_update:
    Update one or more fields of a specific adjustment reason.
    
    destroy:
    Delete a specific adjustment reason.
    Note: This may be restricted if the reason has been used in adjustments.
    """
    serializer_class = AdjustmentReasonSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [
            DjangoFilterBackend,
            filters.SearchFilter,
            filters.OrderingFilter
        ]
    filterset_fields = ['is_active', 'requires_note', 'requires_approval']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    # No need for get_queryset method as TenantViewMixin handles tenant filtering

    def perform_destroy(self, instance):
        """
        Override destroy to check if reason has been used in adjustments.
        """
        # Check if this reason has been used in any adjustments
        if instance.adjustments.exists():
            raise serializers.ValidationError(
                "Cannot delete reason that has been used in adjustments. Consider marking it as inactive instead."
            )
        instance.delete()

class InventoryViewSet(TenantViewMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing Inventory levels.
    
    list:
    Return a paginated list of all inventory records.
    Results can be filtered by product, location, stock status, etc.
    
    create:
    Create a new inventory record.
    Requires product, location, and stock quantities.
    
    retrieve:
    Return the details of a specific inventory record.
    
    update:
    Update all fields of a specific inventory record.
    
    partial_update:
    Update one or more fields of a specific inventory record.
    
    destroy:
    Delete a specific inventory record.
    
    Filtering Options:
    - Product: SKU, name, active status
    - Location: ID, type
    - Stock Status: In stock, out of stock, low stock
    - Quantities: Min/max stock, has backorders, has reserved
    
    Searching:
    - Product SKU, name
    - Location name
    
    Ordering:
    - Product: SKU, name
    - Location name
    - Stock quantities
    - Last updated
    - Available to promise
    
    Custom Actions:
    - GET /api/v1/inventory/{id}/lots/ - List all lots for this inventory
    - POST /api/v1/inventory/{id}/add-lot/ - Add quantity to a lot
    - POST /api/v1/inventory/{id}/consume-lot/ - Consume quantity from lots
    - POST /api/v1/inventory/{id}/reserve-lot/ - Reserve quantity from lots
    - POST /api/v1/inventory/{id}/release-lot-reservation/ - Release reserved lot quantity
    """
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    filterset_class = InventoryFilter
    search_fields = ['product__sku', 'product__name', 'location__name']
    ordering_fields = [
        'product__sku', 'product__name', 'location__name',
        'stock_quantity', 'reserved_quantity', 'last_updated',
        'available_to_promise'
    ]
    ordering = ['product__name', 'location__name']

    def get_queryset(self):
        """
        Return all inventory records for the current tenant.
        django-tenants handles tenant filtering automatically.
        """
        queryset = Inventory.objects.select_related('product', 'location').all()
        
        # Annotate with available_to_promise (stock - reserved)
        queryset = queryset.annotate(
            available_to_promise=ExpressionWrapper(
                F('stock_quantity') - F('reserved_quantity'),
                output_field=fields.IntegerField()
            )
        )
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def lots(self, request, pk=None):
        """
        List all lots for a specific inventory record.
        """
        inventory = self.get_object()
        
        # Check if product is lot-tracked
        if not inventory.product.is_lotted:
            return Response(
                {"detail": "This product is not lot-tracked."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all lots for this inventory
        lots = Lot.objects.filter(inventory_record=inventory)
        
        # Apply pagination
        page = self.paginate_queryset(lots)
        if page is not None:
            serializer = LotSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = LotSerializer(lots, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_lot(self, request, pk=None):
        """
        Add quantity to a lot for this inventory.
        
        Required fields:
        - lot_number: The lot number to add to
        - quantity: The quantity to add
        - expiry_date: The expiry date for the lot (if new)
        - cost_price_per_unit: Optional cost price per unit
        """
        inventory = self.get_object()
        
        # Check if product is lot-tracked
        if not inventory.product.is_lotted:
            return Response(
                {"detail": "This product is not lot-tracked."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate request data
        lot_number = request.data.get('lot_number')
        quantity = request.data.get('quantity')
        expiry_date = request.data.get('expiry_date')
        cost_price_per_unit = request.data.get('cost_price_per_unit')
        
        if not lot_number:
            return Response(
                {"detail": "Lot number is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response(
                    {"detail": "Quantity must be a positive number."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response(
                {"detail": "Invalid quantity value."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse expiry date if provided
        if expiry_date:
            try:
                expiry_date = datetime.strptime(expiry_date, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {"detail": "Invalid expiry date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Parse cost price if provided
        if cost_price_per_unit:
            try:
                from decimal import Decimal
                cost_price_per_unit = Decimal(cost_price_per_unit)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "Invalid cost price value."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            # Use the service function to add quantity to the lot
            from .services import add_quantity_to_lot
            
            lot = add_quantity_to_lot(
                inventory=inventory,
                lot_number=lot_number,
                quantity_to_add=quantity,
                expiry_date=expiry_date,
                cost_price_per_unit=cost_price_per_unit,
                user=request.user
            )
            
            # Create an adjustment record
            reason, _ = AdjustmentReason.objects.get_or_create(
                name="Lot Addition",
                defaults={
                    'description': 'Quantity added to lot',
                    'is_active': True,
                    'requires_note': False
                }
            )
            
            perform_inventory_adjustment(
                user=request.user,
                inventory=inventory,
                adjustment_type='ADD',
                quantity_change=quantity,
                reason=reason,
                notes=f"Added {quantity} units to lot {lot_number}",
                lot_number=lot_number,
                expiry_date=expiry_date,
                cost_price_per_unit=cost_price_per_unit
            )
            
            return Response(
                {
                    "detail": f"Successfully added {quantity} units to lot {lot_number}",
                    "lot": LotSerializer(lot).data
                },
                status=status.HTTP_200_OK
            )
            
        except DjangoValidationError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def consume_lot(self, request, pk=None):
        """
        Consume quantity from lots for this inventory.
        
        Required fields:
        - quantity: The total quantity to consume
        - strategy: The lot selection strategy ('FEFO' or 'FIFO')
        - lot_number: Optional specific lot number to consume from
        """
        inventory = self.get_object()
        
        # Check if product is lot-tracked
        if not inventory.product.is_lotted:
            return Response(
                {"detail": "This product is not lot-tracked."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate request data
        quantity = request.data.get('quantity')
        strategy = request.data.get('strategy', 'FEFO')
        specific_lot = request.data.get('lot_number')
        
        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response(
                    {"detail": "Quantity must be a positive number."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response(
                {"detail": "Invalid quantity value."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if strategy not in ['FEFO', 'FIFO']:
            return Response(
                {"detail": "Strategy must be either 'FEFO' or 'FIFO'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # If specific lot is provided, consume from that lot only
            if specific_lot:
                try:
                    lot = Lot.objects.get(
                        inventory_record=inventory,
                        lot_number=specific_lot,
                        status=LotStatus.AVAILABLE
                    )
                    
                    from .services import consume_quantity_from_lot
                    
                    consume_quantity_from_lot(
                        lot=lot,
                        quantity_to_consume=quantity,
                        user=request.user
                    )
                    
                    consumed_lots = [(lot, quantity)]
                    
                except Lot.DoesNotExist:
                    return Response(
                        {"detail": f"Lot {specific_lot} not found or not available."},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # Use the service function to find and consume from lots
                from .services import find_lots_for_consumption, consume_quantity_from_lot
                
                lots_to_consume = find_lots_for_consumption(
                    inventory=inventory,
                    quantity_needed=quantity,
                    strategy=strategy
                )
                
                # Consume from each lot
                consumed_lots = []
                for lot, qty_to_consume in lots_to_consume:
                    consume_quantity_from_lot(
                        lot=lot,
                        quantity_to_consume=qty_to_consume,
                        user=request.user
                    )
                    consumed_lots.append((lot, qty_to_consume))
            
            # Create an adjustment record
            reason, _ = AdjustmentReason.objects.get_or_create(
                name="Lot Consumption",
                defaults={
                    'description': 'Quantity consumed from lots',
                    'is_active': True,
                    'requires_note': False
                }
            )
            
            perform_inventory_adjustment(
                user=request.user,
                inventory=inventory,
                adjustment_type='REMOVE',
                quantity_change=quantity,
                reason=reason,
                notes=f"Consumed {quantity} units using {strategy} strategy",
                lot_strategy=strategy
            )
            
            # Prepare response data
            consumed_data = [
                {
                    "lot_number": lot.lot_number,
                    "quantity_consumed": qty_consumed,
                    "remaining_quantity": lot.quantity
                }
                for lot, qty_consumed in consumed_lots
            ]
            
            return Response(
                {
                    "detail": f"Successfully consumed {quantity} units",
                    "consumed_lots": consumed_data
                },
                status=status.HTTP_200_OK
            )
            
        except DjangoValidationError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reserve_lot(self, request, pk=None):
        """
        Reserve quantity from lots for this inventory.
        
        Required fields:
        - quantity: The total quantity to reserve
        - strategy: The lot selection strategy ('FEFO' or 'FIFO')
        - lot_number: Optional specific lot number to reserve from
        """
        inventory = self.get_object()
        
        # Check if product is lot-tracked
        if not inventory.product.is_lotted:
            return Response(
                {"detail": "This product is not lot-tracked."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate request data
        quantity = request.data.get('quantity')
        strategy = request.data.get('strategy', 'FEFO')
        specific_lot = request.data.get('lot_number')
        
        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response(
                    {"detail": "Quantity must be a positive number."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response(
                {"detail": "Invalid quantity value."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if strategy not in ['FEFO', 'FIFO']:
            return Response(
                {"detail": "Strategy must be either 'FEFO' or 'FIFO'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # If specific lot is provided, reserve from that lot only
            if specific_lot:
                try:
                    lot = Lot.objects.get(
                        inventory_record=inventory,
                        lot_number=specific_lot,
                        status=LotStatus.AVAILABLE
                    )
                    
                    from .services import reserve_lot_quantity
                    
                    reserve_lot_quantity(
                        lot=lot,
                        quantity_to_reserve=quantity,
                        user=request.user
                    )
                    
                    reserved_lots = [(lot, quantity)]
                    
                except Lot.DoesNotExist:
                    return Response(
                        {"detail": f"Lot {specific_lot} not found or not available."},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # Use the service function to find and reserve from lots
                from .services import find_lots_for_consumption, reserve_lot_quantity
                
                lots_to_reserve = find_lots_for_consumption(
                    inventory=inventory,
                    quantity_needed=quantity,
                    strategy=strategy
                )
                
                # Reserve from each lot
                reserved_lots = []
                for lot, qty_to_reserve in lots_to_reserve:
                    reserve_lot_quantity(
                        lot=lot,
                        quantity_to_reserve=qty_to_reserve,
                        user=request.user
                    )
                    reserved_lots.append((lot, qty_to_reserve))
            
            # Create an adjustment record
            reason, _ = AdjustmentReason.objects.get_or_create(
                name="Lot Reservation",
                defaults={
                    'description': 'Quantity reserved from lots',
                    'is_active': True,
                    'requires_note': False
                }
            )
            
            perform_inventory_adjustment(
                user=request.user,
                inventory=inventory,
                adjustment_type='RESERVE',
                quantity_change=quantity,
                reason=reason,
                notes=f"Reserved {quantity} units using {strategy} strategy",
                lot_strategy=strategy
            )
            
            # Prepare response data
            reserved_data = [
                {
                    "lot_number": lot.lot_number,
                    "quantity_reserved": qty_reserved,
                    "remaining_quantity": lot.quantity
                }
                for lot, qty_reserved in reserved_lots
            ]
            
            return Response(
                {
                    "detail": f"Successfully reserved {quantity} units",
                    "reserved_lots": reserved_data
                },
                status=status.HTTP_200_OK
            )
            
        except DjangoValidationError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def release_lot_reservation(self, request, pk=None):
        """
        Release reserved quantity from lots for this inventory.
        
        Required fields:
        - quantity: The total quantity to release
        - lot_number: Optional specific lot number to release from
        """
        inventory = self.get_object()
        
        # Check if product is lot-tracked
        if not inventory.product.is_lotted:
            return Response(
                {"detail": "This product is not lot-tracked."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate request data
        quantity = request.data.get('quantity')
        specific_lot = request.data.get('lot_number')
        
        try:
            quantity = int(quantity)
            if quantity <= 0:
                return Response(
                    {"detail": "Quantity must be a positive number."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (TypeError, ValueError):
            return Response(
                {"detail": "Invalid quantity value."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # If specific lot is provided, release from that lot only
            if specific_lot:
                try:
                    lot = Lot.objects.get(
                        inventory_record=inventory,
                        lot_number=specific_lot,
                        status=LotStatus.RESERVED
                    )
                    
                    from .services import release_lot_reservation
                    
                    release_lot_reservation(
                        reserved_lot=lot,
                        quantity_to_release=quantity,
                        user=request.user
                    )
                    
                    released_lots = [(lot, quantity)]
                    
                except Lot.DoesNotExist:
                    return Response(
                        {"detail": f"Reserved lot {specific_lot} not found."},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # Find reserved lots to release from
                reserved_lots = Lot.objects.filter(
                    inventory_record=inventory,
                    status=LotStatus.RESERVED
                ).order_by('received_date')
                
                if not reserved_lots.exists():
                    return Response(
                        {"detail": "No reserved lots found for this inventory."},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Release from each lot
                from .services import release_lot_reservation
                
                quantity_to_release = quantity
                released_lots = []
                
                for reserved_lot in reserved_lots:
                    qty_from_this_lot = min(reserved_lot.quantity, quantity_to_release)
                    if qty_from_this_lot > 0:
                        release_lot_reservation(
                            reserved_lot=reserved_lot,
                            quantity_to_release=qty_from_this_lot,
                            user=request.user
                        )
                        released_lots.append((reserved_lot, qty_from_this_lot))
                        quantity_to_release -= qty_from_this_lot
                    
                    if quantity_to_release <= 0:
                        break
                
                if quantity_to_release > 0:
                    return Response(
                        {"detail": f"Could only release {quantity - quantity_to_release} units out of {quantity} requested."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Create an adjustment record
            reason, _ = AdjustmentReason.objects.get_or_create(
                name="Lot Reservation Release",
                defaults={
                    'description': 'Reserved quantity released from lots',
                    'is_active': True,
                    'requires_note': False
                }
            )
            
            perform_inventory_adjustment(
                user=request.user,
                inventory=inventory,
                adjustment_type='RELEASE_RESERVATION',
                quantity_change=quantity,
                reason=reason,
                notes=f"Released {quantity} units from reservation"
            )
            
            # Prepare response data
            released_data = [
                {
                    "lot_number": lot.lot_number,
                    "quantity_released": qty_released,
                    "remaining_quantity": lot.quantity
                }
                for lot, qty_released in released_lots
            ]
            
            return Response(
                {
                    "detail": f"Successfully released {quantity} units from reservation",
                    "released_lots": released_data
                },
                status=status.HTTP_200_OK
            )
            
        except DjangoValidationError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class InventoryAdjustmentViewSet(TenantViewMixin, viewsets.ModelViewSet):
    """
    API endpoint for creating manual Inventory Adjustments
    and listing adjustment history for a specific inventory item.

    POST /api/v1/inventory-adjustments/ - Create a new adjustment.
    GET /api/v1/inventory/{inventory_pk}/adjustments/ - List history for an inventory item.
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InventoryAdjustmentCreateSerializer
        return InventoryAdjustmentSerializer

    # No need for get_queryset method as TenantViewMixin handles tenant filtering

    def perform_create(self, serializer):
        with transaction.atomic():
            # Get the validated data
            inventory = serializer.validated_data['inventory']
            adjustment_type = serializer.validated_data['adjustment_type']
            quantity = serializer.validated_data['quantity']
            reason = serializer.validated_data['reason']
            notes = serializer.validated_data.get('notes', None)
            serial_number = serializer.validated_data.get('serial_number', None)
            lot_number = serializer.validated_data.get('lot_number', None)
            expiry_date = serializer.validated_data.get('expiry_date', None)
            
            # Use the service function to perform the adjustment
            perform_inventory_adjustment(
                user=self.request.user,
                inventory=inventory,
                adjustment_type=adjustment_type,
                quantity_change=quantity,
                reason=reason,
                notes=notes,
                serial_number=serial_number,
                lot_number=lot_number,
                expiry_date=expiry_date
            )

class SerializedInventoryViewSet(TenantViewMixin, viewsets.ModelViewSet):
    """
    API endpoint for viewing and updating the status of Serialized Inventory items.
    Creation/Deletion might be handled by other processes (e.g., receiving, shipping).
    """
    serializer_class = SerializedInventorySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = SerializedInventoryFilter
    search_fields = ['serial_number', 'product__sku', 'product__name', 'location__name']
    ordering_fields = ['serial_number', 'product__name', 'location__name', 'status', 'received_date', 'last_updated']
    ordering = ['product__name', 'serial_number']

    # No need for get_queryset method as TenantViewMixin handles tenant filtering

    def perform_update(self, serializer):
        """
        Override perform_update to use the update_serialized_status service function
        for proper status transition validation and side effects.
        """
        instance = serializer.instance
        new_status = serializer.validated_data.get('status')
        
        if new_status and new_status != instance.status:
            # Use the service function to handle status transitions
            update_serialized_status(
                serialized_item=instance,
                new_status=new_status,
                user=self.request.user,
                notes=serializer.validated_data.get('notes')
            )
            # Skip the default save since the service function handles it
            return
            
        # For other field updates, use the default behavior
        serializer.save(last_modified_by=self.request.user)

    @action(detail=True, methods=['post'])
    def reserve(self, request, pk=None):
        """
        Reserve a specific serialized inventory item.
        """
        serialized_item = self.get_object()
        
        try:
            reserve_serialized_item(
                serialized_item=serialized_item,
                user=request.user,
                notes=request.data.get('notes')
            )
            return Response(
                {"message": f"Serial number {serialized_item.serial_number} has been reserved."},
                status=status.HTTP_200_OK
            )
        except DjangoValidationError as e:
            raise DRFValidationError(detail=str(e))

    @action(detail=True, methods=['post'])
    def ship(self, request, pk=None):
        """
        Mark a serialized inventory item as shipped/sold.
        """
        serialized_item = self.get_object()
        
        try:
            ship_serialized_item(
                serialized_item=serialized_item,
                user=request.user,
                notes=request.data.get('notes')
            )
            return Response(
                {"message": f"Serial number {serialized_item.serial_number} has been marked as shipped."},
                status=status.HTTP_200_OK
            )
        except DjangoValidationError as e:
            raise DRFValidationError(detail=str(e))

class LotViewSet(TenantViewMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing Inventory Lots.
    
    list:
        Get a list of all lots with filtering options
    
    create:
        Create a new lot with initial quantity
        
    retrieve:
        Get details of a specific lot
        
    update:
        Update quantity or expiry date of a lot
        WARNING: Direct quantity updates bypass the adjustment audit trail
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LotFilter
    search_fields = ['lot_number', 'product__sku', 'product__name', 'location__name']
    ordering_fields = [
        'lot_number', 'product__name', 'location__name',
        'quantity', 'expiry_date', 'received_date', 'last_updated'
    ]
    ordering = ['product__name', 'expiry_date', 'lot_number']  # Default order for FEFO

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LotCreateSerializer
        return LotSerializer

    # No need for get_queryset method as TenantViewMixin handles tenant filtering

    def perform_update(self, serializer):
        """
        Override perform_update to add logging for quantity changes
        """
        old_instance = self.get_object()
        old_quantity = old_instance.quantity
        instance = serializer.save()
        
        # Log quantity changes
        if instance.quantity != old_quantity:
            # In a real app, you might want to create an audit log entry here
            print(f"Lot {instance.lot_number} quantity changed from {old_quantity} to {instance.quantity}")

class InventoryImportView(TenantViewMixin, APIView):
    """
    Upload a CSV file to asynchronously import inventory data.
    Expects 'file' field in multipart/form-data.
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        serializer = InventoryImportSerializer(data=request.data)
        if serializer.is_valid():
            csv_file = serializer.validated_data['file']
            
            # Get the current tenant
            tenant = self.get_tenant()
            if not tenant:
                return Response(
                    {"error": "No tenant context available for this import"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Start async task with tenant info
            task = process_inventory_import.delay(
                csv_file.read().decode('utf-8'),
                tenant_id=tenant.id,
                tenant_schema=tenant.schema_name,
                user_id=request.user.id
            )
            
            return Response({
                "task_id": task.id,
                "status": "PENDING",
                "message": "Inventory import started. Check status with GET request using task_id."
            }, status=status.HTTP_202_ACCEPTED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, *args, **kwargs):
        """
        Check the status of an import task.
        Requires task_id query parameter.
        """
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response(
                {"error": "task_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        task_result = AsyncResult(task_id)
        
        if task_result.ready():
            if task_result.successful():
                return Response({
                    "task_id": task_id,
                    "status": "SUCCESS",
                    "result": task_result.result
                })
            else:
                return Response({
                    "task_id": task_id,
                    "status": "FAILURE",
                    "error": str(task_result.result)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({
                "task_id": task_id,
                "status": "PENDING"
            })
