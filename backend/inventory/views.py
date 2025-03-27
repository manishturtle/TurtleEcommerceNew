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
    queryset = AdjustmentReason.objects.all()
    serializer_class = AdjustmentReasonSerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [
            DjangoFilterBackend,
            filters.SearchFilter,
            filters.OrderingFilter
        ]
    filterset_fields = ['is_active']
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
        from django.db import connection
        
        # Ensure we're using the inventory schema in the search path
        if hasattr(connection, 'inventory_schema') and hasattr(connection, 'schema_name'):
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path TO "{connection.inventory_schema}", "{connection.schema_name}", public')
        
        # Get the queryset with tenant filtering
        queryset = Inventory.objects.all()
        
        # Add available_to_promise as an annotated field
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
        from django.db import connection
        
        # Ensure we're using the inventory schema in the search path
        if hasattr(connection, 'inventory_schema') and hasattr(connection, 'schema_name'):
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path TO "{connection.inventory_schema}", "{connection.schema_name}", public')
        
        inventory = self.get_object()
        lots = Lot.objects.filter(inventory_record=inventory)
        
        # Apply filters if provided
        lot_filter = LotFilter(request.GET, queryset=lots)
        lots = lot_filter.qs
        
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
        from django.db import connection
        
        # Ensure we're using the inventory schema in the search path
        if hasattr(connection, 'inventory_schema') and hasattr(connection, 'schema_name'):
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path TO "{connection.inventory_schema}", "{connection.schema_name}", public')
        
        inventory = self.get_object()
        
        # Validate input
        serializer = LotCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract data
        lot_number = serializer.validated_data.get('lot_number')
        quantity = serializer.validated_data.get('quantity')
        expiry_date = serializer.validated_data.get('expiry_date')
        cost_price_per_unit = serializer.validated_data.get('cost_price_per_unit')
        
        try:
            # Import here to avoid circular imports
            from .services import add_quantity_to_lot
            
            # Add quantity to lot
            lot = add_quantity_to_lot(
                inventory=inventory,
                lot_number=lot_number,
                quantity=quantity,
                expiry_date=expiry_date,
                cost_price_per_unit=cost_price_per_unit,
                user=request.user
            )
            
            return Response(
                LotSerializer(lot).data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
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
        from django.db import connection
        
        # Ensure we're using the inventory schema in the search path
        if hasattr(connection, 'inventory_schema') and hasattr(connection, 'schema_name'):
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path TO "{connection.inventory_schema}", "{connection.schema_name}", public')
        
        inventory = self.get_object()
        
        # Validate input
        quantity = request.data.get('quantity')
        strategy = request.data.get('strategy', 'FEFO')  # Default to FEFO
        lot_number = request.data.get('lot_number')
        
        if not quantity or not isinstance(quantity, (int, float)) or quantity <= 0:
            return Response(
                {"detail": "A positive quantity is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Import here to avoid circular imports
            from .services import consume_quantity_from_lot
            
            # Consume quantity from lots
            consumed_lots = consume_quantity_from_lot(
                inventory=inventory,
                quantity=quantity,
                strategy=strategy,
                specific_lot_number=lot_number,
                user=request.user
            )
            
            return Response(
                LotSerializer(consumed_lots, many=True).data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
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
        from django.db import connection
        
        # Ensure we're using the inventory schema in the search path
        if hasattr(connection, 'inventory_schema') and hasattr(connection, 'schema_name'):
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path TO "{connection.inventory_schema}", "{connection.schema_name}", public')
        
        inventory = self.get_object()
        
        # Validate input
        quantity = request.data.get('quantity')
        strategy = request.data.get('strategy', 'FEFO')  # Default to FEFO
        lot_number = request.data.get('lot_number')
        
        if not quantity or not isinstance(quantity, (int, float)) or quantity <= 0:
            return Response(
                {"detail": "A positive quantity is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Import here to avoid circular imports
            from .services import reserve_lot_quantity
            
            # Reserve quantity from lots
            reserved_lots = reserve_lot_quantity(
                inventory=inventory,
                quantity=quantity,
                strategy=strategy,
                specific_lot_number=lot_number,
                user=request.user
            )
            
            return Response(
                LotSerializer(reserved_lots, many=True).data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def release_lot_reservation(self, request, pk=None):
        """
        Release reserved quantity from lots for this inventory.
        
        Required fields:
        - quantity: The total quantity to release
        - lot_number: Optional specific lot number to release from
        """
        from django.db import connection
        
        # Ensure we're using the inventory schema in the search path
        if hasattr(connection, 'inventory_schema') and hasattr(connection, 'schema_name'):
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path TO "{connection.inventory_schema}", "{connection.schema_name}", public')
        
        inventory = self.get_object()
        
        # Validate input
        quantity = request.data.get('quantity')
        lot_number = request.data.get('lot_number')
        
        if not quantity or not isinstance(quantity, (int, float)) or quantity <= 0:
            return Response(
                {"detail": "A positive quantity is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Import here to avoid circular imports
            from .services import release_lot_reservation
            
            # Release reserved quantity
            released_lots = release_lot_reservation(
                inventory=inventory,
                quantity=quantity,
                specific_lot_number=lot_number,
                user=request.user
            )
            
            return Response(
                LotSerializer(released_lots, many=True).data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
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

    def get_queryset(self):
        """
        Override get_queryset to ensure we're using the inventory schema
        """
        from django.db import connection
        
        # Ensure we're using the inventory schema in the search path
        if hasattr(connection, 'inventory_schema') and hasattr(connection, 'schema_name'):
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path TO "{connection.inventory_schema}", "{connection.schema_name}", public')
        
        # Get the queryset with tenant filtering from TenantViewMixin
        return super().get_queryset()

    def perform_create(self, serializer):
        """
        Override perform_create to ensure we're using the inventory schema
        """
        from django.db import connection
        
        # Ensure we're using the inventory schema in the search path
        if hasattr(connection, 'inventory_schema') and hasattr(connection, 'schema_name'):
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path TO "{connection.inventory_schema}", "{connection.schema_name}", public')
        
        # Save the instance
        serializer.save()

    def perform_update(self, serializer):
        """
        Override perform_update to add logging for quantity changes and ensure
        we're using the inventory schema
        """
        from django.db import connection
        
        # Ensure we're using the inventory schema in the search path
        if hasattr(connection, 'inventory_schema') and hasattr(connection, 'schema_name'):
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path TO "{connection.inventory_schema}", "{connection.schema_name}", public')
        
        old_instance = self.get_object()
        old_quantity = old_instance.quantity
        instance = serializer.save()
        
        # Log quantity changes
        if instance.quantity != old_quantity:
            # In a real app, you might want to create an audit log entry here
            print(f"Lot {instance.lot_number} quantity changed from {old_quantity} to {instance.quantity}")

class AdjustmentTypeView(APIView):
    """
    API endpoint that returns all available adjustment types.
    This is a simple endpoint that returns the choices defined in the AdjustmentType model.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        """
        Return a list of all adjustment types.
        Each type includes a code and display name.
        """
        adjustment_types = [
            {'code': code, 'name': name}
            for code, name in AdjustmentType.choices
        ]
        return Response(adjustment_types)

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
            }, status=status.HTTP_200_OK)
