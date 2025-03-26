from django.shortcuts import render
from rest_framework import viewsets, permissions, filters, mixins, status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F, ExpressionWrapper, fields
from .models import FulfillmentLocation, AdjustmentReason, Inventory, InventoryAdjustment, AdjustmentType, SerializedInventory, Lot
from .serializers import FulfillmentLocationSerializer, AdjustmentReasonSerializer, InventorySerializer, InventoryAdjustmentCreateSerializer, InventoryAdjustmentSerializer, SerializedInventorySerializer, LotSerializer, LotCreateSerializer
from .filters import InventoryFilter, SerializedInventoryFilter, LotFilter
from .services import perform_inventory_adjustment

# Create your views here.

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100

class FulfillmentLocationViewSet(viewsets.ModelViewSet):
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

class AdjustmentReasonViewSet(viewsets.ModelViewSet):
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

    def get_queryset(self):
        """
        Return all adjustment reasons for the current tenant.
        django-tenants handles tenant filtering automatically.
        """
        return AdjustmentReason.objects.all()

    def perform_destroy(self, instance):
        """
        Override destroy to check if reason has been used in adjustments.
        """
        if instance.inventoryadjustment_set.exists():
            raise serializers.ValidationError(
                "Cannot delete adjustment reason that has been used in adjustments. "
                "Consider marking it as inactive instead."
            )
        instance.delete()

class InventoryViewSet(viewsets.ModelViewSet):
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
    """
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    filterset_class = InventoryFilter
    search_fields = [
        'product__sku',
        'product__name',
        'location__name'
    ]
    ordering_fields = [
        'product__sku',
        'product__name',
        'location__name',
        'stock_quantity',
        'reserved_quantity',
        'non_saleable_quantity',
        'on_order_quantity',
        'in_transit_quantity',
        'last_updated',
        'available_qty'  # Annotated field
    ]
    ordering = ['product__name', 'location__name']

    def get_queryset(self):
        """
        Return all inventory records with calculated available quantity.
        Includes select_related for better performance with nested serializers.
        """
        queryset = Inventory.objects.all()
        queryset = queryset.select_related('product', 'location')
        queryset = queryset.annotate(
            available_qty=ExpressionWrapper(
                F('stock_quantity') - F('reserved_quantity'),
                output_field=fields.IntegerField()
            )
        )
        return queryset

class InventoryAdjustmentViewSet(mixins.CreateModelMixin,
                              mixins.ListModelMixin,
                              viewsets.GenericViewSet):
    """
    API endpoint for creating manual Inventory Adjustments
    and listing adjustment history for a specific inventory item.

    POST /api/v1/inventory-adjustments/ - Create a new adjustment.
    GET /api/v1/inventory/{inventory_pk}/adjustments/ - List history for an inventory item.
    """
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == 'create':
            return InventoryAdjustmentCreateSerializer
        return InventoryAdjustmentSerializer

    def get_queryset(self):
        inventory_pk = self.kwargs.get('inventory_pk')
        if inventory_pk:
            if Inventory.objects.filter(pk=inventory_pk).exists():
                return InventoryAdjustment.objects.filter(inventory__pk=inventory_pk) \
                    .select_related('user', 'reason') \
                    .order_by('-timestamp')
        return InventoryAdjustment.objects.none()

    def perform_create(self, serializer):
        try:
            validated_data = serializer.validated_data
            adjustment = perform_inventory_adjustment(
                user=self.request.user,
                inventory=validated_data['inventory'],
                adjustment_type=validated_data['adjustment_type'],
                quantity_change=validated_data['quantity_change'],
                reason=validated_data['reason'],
                notes=validated_data.get('notes')
            )
            serializer.instance = adjustment

        except DjangoValidationError as e:
            raise DRFValidationError(detail=str(e))
        except Exception as e:
            raise DRFValidationError(detail=f"An unexpected error occurred: {str(e)}")

class SerializedInventoryViewSet(mixins.ListModelMixin,
                               mixins.RetrieveModelMixin,
                               mixins.UpdateModelMixin,
                               viewsets.GenericViewSet):
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

    def get_queryset(self):
        return SerializedInventory.objects.select_related('product', 'location').all()

    def perform_update(self, serializer):
        """
        Override perform_update to add any additional logic needed when updating status
        """
        # Add any status transition side effects here (e.g., notifications, logging)
        serializer.save()

class LotViewSet(mixins.ListModelMixin,
               mixins.RetrieveModelMixin,
               mixins.UpdateModelMixin,
               mixins.CreateModelMixin,
               viewsets.GenericViewSet):
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
        if self.action == 'create':
            return LotCreateSerializer
        return LotSerializer

    def get_queryset(self):
        return Lot.objects.select_related('product', 'location').all()

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
