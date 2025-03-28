from rest_framework import serializers
from django.core.validators import RegexValidator
from .models import (
    FulfillmentLocation,
    Product,
    Inventory,
    InventoryAdjustment,
    AdjustmentReason,
    SerializedInventory,
    AdjustmentType,
    Lot
)
from django.utils import timezone
import warnings

class SimpleProductSerializer(serializers.ModelSerializer):
    """
    Simplified Product serializer for nested relationships.
    """
    class Meta:
        model = Product
        fields = ('id', 'sku', 'name', 'is_active')
        read_only_fields = fields

class SimpleLocationSerializer(serializers.ModelSerializer):
    """
    Simplified FulfillmentLocation serializer for nested relationships.
    """
    class Meta:
        model = FulfillmentLocation
        fields = ('id', 'name', 'location_type')
        read_only_fields = fields

class FulfillmentLocationSerializer(serializers.ModelSerializer):
    country_code = serializers.CharField(
        max_length=2,
        validators=[
            RegexValidator(
                regex='^[A-Z]{2}$',
                message='Country code must be 2 uppercase letters (ISO 3166-1 alpha-2)',
                code='invalid_country_code'
            )
        ]
    )

    class Meta:
        model = FulfillmentLocation
        fields = [
            'id', 'name', 'location_type', 'address_line_1',
            'address_line_2', 'city', 'state_province', 'postal_code',
            'country_code', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')

    def validate_location_type(self, value):
        from .models import LocationType
        if value not in dict(LocationType.choices):
            raise serializers.ValidationError(
                f"Invalid location type. Must be one of: {', '.join(dict(LocationType.choices).keys())}"
            )
        return value

    def validate(self, data):
        # Ensure required address fields are provided together
        address_fields = ['address_line_1', 'city', 'state_province', 'postal_code', 'country_code']
        provided_fields = [field for field in address_fields if data.get(field)]
        
        if provided_fields and len(provided_fields) != len(address_fields):
            missing_fields = set(address_fields) - set(provided_fields)
            raise serializers.ValidationError(
                f"If providing address, all fields are required: {', '.join(missing_fields)}"
            )
        
        return data

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class AdjustmentReasonSerializer(serializers.ModelSerializer):
    """
    Serializer for AdjustmentReason model.
    Handles validation and representation of adjustment reasons for inventory changes.
    """
    class Meta:
        model = AdjustmentReason
        fields = [
            'id', 'name', 'description', 'is_active', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')
        extra_kwargs = {
            'name': {
                'help_text': 'Name of the adjustment reason (e.g., "Damaged in Storage")',
                'error_messages': {
                    'unique': 'An adjustment reason with this name already exists.',
                    'required': 'Please provide a name for the adjustment reason.'
                }
            },
            'description': {
                'help_text': 'Detailed explanation of when to use this adjustment reason',
                'required': False
            }
        }

    def validate_name(self, value):
        """
        Validate that the name is not too generic and follows naming conventions.
        """
        if len(value) < 3:
            raise serializers.ValidationError(
                "Adjustment reason name must be at least 3 characters long."
            )
        
        generic_names = ['test', 'adjustment', 'reason', 'other']
        if value.lower() in generic_names:
            raise serializers.ValidationError(
                f"'{value}' is too generic. Please provide a more descriptive name."
            )
            
        return value
    
    def validate(self, data):
        """
        Additional validation rules for the adjustment reason.
        """
        # Example validation: Require description for certain types of reasons
        if 'name' in data and 'description' in data:
            name = data['name'].lower()
            description = data.get('description', '')
            
            if ('damage' in name or 'loss' in name) and (not description or len(description) < 10):
                raise serializers.ValidationError({
                    'description': 'Detailed description is required for damage or loss reasons.'
                })
                
        return data

class InventorySerializer(serializers.ModelSerializer):
    """
    Serializer for Inventory model with calculated ATP and nested relationships.
    """
    available_to_promise = serializers.IntegerField(read_only=True)
    product = SimpleProductSerializer(read_only=True)
    location = SimpleLocationSerializer(read_only=True)
    
    # Additional calculated fields
    total_available = serializers.SerializerMethodField()
    total_unavailable = serializers.SerializerMethodField()
    stock_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Inventory
        fields = [
            'id', 'product', 'location', 
            'stock_quantity', 'reserved_quantity', 
            'non_saleable_quantity', 'on_order_quantity',
            'in_transit_quantity', 'returned_quantity', 
            'hold_quantity', 'backorder_quantity',
            'low_stock_threshold', 'last_updated',
            'available_to_promise', 'total_available',
            'total_unavailable', 'stock_status'
        ]
        read_only_fields = fields  # All fields are read-only for this endpoint

    def get_total_available(self, obj):
        """
        Calculate total available inventory (stock + in_transit + on_order)
        """
        return (obj.stock_quantity or 0) + \
               (obj.in_transit_quantity or 0) + \
               (obj.on_order_quantity or 0)

    def get_total_unavailable(self, obj):
        """
        Calculate total unavailable inventory 
        (reserved + non_saleable + hold + returned)
        """
        return (obj.reserved_quantity or 0) + \
               (obj.non_saleable_quantity or 0) + \
               (obj.hold_quantity or 0) + \
               (obj.returned_quantity or 0)

    def get_stock_status(self, obj):
        """
        Determine stock status based on ATP and threshold
        """
        atp = obj.available_to_promise
        threshold = obj.low_stock_threshold

        if atp <= 0:
            return 'OUT_OF_STOCK'
        elif threshold and atp <= threshold:
            return 'LOW_STOCK'
        return 'IN_STOCK'

class SerializedInventorySerializer(serializers.ModelSerializer):
    product = SimpleProductSerializer(read_only=True)
    location = SimpleLocationSerializer(read_only=True)
    inventory_record = serializers.PrimaryKeyRelatedField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SerializedInventory
        fields = [
            'id', 'product', 'location', 'inventory_record', 'serial_number',
            'status', 'status_display', 'notes', 'received_date', 'last_updated'
        ]
        read_only_fields = [
            'id', 'product', 'location', 'inventory_record',
            'serial_number', 'received_date', 'last_updated'
        ]

    def validate_status(self, value):
        if value not in SerialNumberStatus.values:
            raise serializers.ValidationError("Invalid status provided.")
        
        # Add validation for status transitions
        if self.instance:
            current_status = self.instance.status
            if current_status == SerialNumberStatus.SOLD and value == SerialNumberStatus.AVAILABLE:
                raise serializers.ValidationError("Cannot change status from SOLD to AVAILABLE directly.")
            if current_status == SerialNumberStatus.DAMAGED and value == SerialNumberStatus.AVAILABLE:
                raise serializers.ValidationError("Cannot change status from DAMAGED to AVAILABLE directly. Must be inspected first.")
        
        return value

class LotSerializer(serializers.ModelSerializer):
    product = SimpleProductSerializer(read_only=True)
    location = SimpleLocationSerializer(read_only=True)
    inventory_record = serializers.PrimaryKeyRelatedField(read_only=True)
    days_until_expiry = serializers.SerializerMethodField()

    class Meta:
        model = Lot
        fields = [
            'id', 'product', 'location', 'inventory_record', 'lot_number',
            'quantity', 'expiry_date', 'received_date', 'created_at', 
            'last_updated', 'days_until_expiry'
        ]
        read_only_fields = [
            'id', 'product', 'location', 'inventory_record', 'lot_number',
            'received_date', 'created_at', 'last_updated'
        ]  # Only 'quantity' and 'expiry_date' are writable

    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative.")
        return value

    def validate_expiry_date(self, value):
        if value and value < timezone.now().date():
            # Raise warning but don't prevent setting past date (might be needed for data correction)
            warnings.warn("Setting expiry date in the past")
        return value

    def get_days_until_expiry(self, obj):
        if not obj.expiry_date:
            return None
        today = timezone.now().date()
        delta = obj.expiry_date - today
        return delta.days

class LotCreateSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_lotted=True),
        help_text="ID of the product (must be lot-tracked)"
    )
    location = serializers.PrimaryKeyRelatedField(
        queryset=FulfillmentLocation.objects.all(),
        help_text="ID of the fulfillment location"
    )
    lot_number = serializers.CharField(
        max_length=50,
        help_text="Unique lot/batch number for this product"
    )
    quantity = serializers.IntegerField(
        min_value=0,
        help_text="Initial quantity in the lot"
    )
    expiry_date = serializers.DateField(
        required=False,
        allow_null=True,
        help_text="Expiry date for the lot (optional)"
    )

    class Meta:
        model = Lot
        fields = [
            'product', 'location', 'lot_number', 'quantity',
            'expiry_date', 'notes'
        ]

    def validate_lot_number(self, value):
        # Check if lot number is unique for this product
        product = self.initial_data.get('product')
        if Lot.objects.filter(product=product, lot_number=value).exists():
            raise serializers.ValidationError(
                "This lot number already exists for this product."
            )
        return value

    def validate(self, data):
        # Additional validation if needed
        if not data['product'].is_lotted:
            raise serializers.ValidationError(
                "Cannot create lot for a non-lot-tracked product."
            )
        return data

    def create(self, validated_data):
        from django.db import connection
        
        # Ensure we're using the inventory schema in the search path
        if hasattr(connection, 'inventory_schema') and hasattr(connection, 'schema_name'):
            with connection.cursor() as cursor:
                # Explicitly set search path to prioritize inventory schema
                cursor.execute(f'SET search_path TO "{connection.inventory_schema}", "{connection.schema_name}", public')
                
                # Log the current search path for debugging
                cursor.execute("SHOW search_path")
                current_search_path = cursor.fetchone()[0]
                print(f"Current search path: {current_search_path}")
        
        # Create the lot directly using the model's save method which now handles schema explicitly
        lot = Lot(**validated_data)
        lot.save()  # This will use InventoryAwareModel's enhanced save method
        
        # Verify the lot was created in the correct schema
        if hasattr(connection, 'inventory_schema'):
            with connection.cursor() as cursor:
                # Check which schema the lot was created in
                cursor.execute(f"""
                    SELECT table_schema 
                    FROM information_schema.tables 
                    WHERE table_name = 'inventory_lot' 
                    AND table_schema = '{connection.inventory_schema}'
                """)
                schema_result = cursor.fetchone()
                if schema_result:
                    print(f"Lot created in schema: {schema_result[0]}")
                else:
                    print("WARNING: Lot may not have been created in the inventory schema!")
        
        # Create initial inventory record if needed
        inventory, created = Inventory.objects.get_or_create(
            product=lot.product,
            location=lot.location,
            defaults={
                'stock_quantity': 0,
                'reserved_quantity': 0,
                'non_saleable_quantity': 0
            }
        )
        
        # Link the lot to the inventory record
        lot.inventory_record = inventory
        lot.save()
        
        # Update inventory quantities
        inventory.stock_quantity = inventory.stock_quantity + lot.quantity
        inventory.save()
        
        return lot

class SimpleUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()

class InventoryAdjustmentCreateSerializer(serializers.ModelSerializer):
    inventory = serializers.PrimaryKeyRelatedField(queryset=Inventory.objects.all())
    reason = serializers.PrimaryKeyRelatedField(queryset=AdjustmentReason.objects.filter(is_active=True))

    class Meta:
        model = InventoryAdjustment
        fields = ['inventory', 'adjustment_type', 'quantity_change', 'reason', 'notes']

    def validate_inventory(self, value):
        if not Inventory.objects.filter(pk=value.pk).exists():
            raise serializers.ValidationError("Inventory record not found.")
        return value

    def validate(self, data):
        adjustment_type = data.get('adjustment_type')
        quantity_change = data.get('quantity_change', 0)

        # Basic validation based on adjustment type
        if adjustment_type in [AdjustmentType.ADDITION, AdjustmentType.RECEIVE_ORDER, AdjustmentType.RETURN_TO_STOCK]:
            if quantity_change <= 0:
                raise serializers.ValidationError({"quantity_change": "Quantity must be positive for additions."})
        
        elif adjustment_type in [AdjustmentType.SUBTRACTION, AdjustmentType.SHIP_ORDER]:
            if quantity_change >= 0:
                raise serializers.ValidationError({"quantity_change": "Quantity must be negative for subtractions."})
            
            # Check if there's enough stock (basic check, detailed check in service layer)
            inventory = data.get('inventory')
            if abs(quantity_change) > inventory.stock_quantity:
                raise serializers.ValidationError({"quantity_change": "Insufficient stock for this adjustment."})

        elif adjustment_type == AdjustmentType.RESERVATION:
            if quantity_change <= 0:
                raise serializers.ValidationError({"quantity_change": "Quantity must be positive for reservations."})
            inventory = data.get('inventory')
            if quantity_change > (inventory.stock_quantity - inventory.reserved_quantity):
                raise serializers.ValidationError({"quantity_change": "Insufficient available stock for reservation."})

        elif adjustment_type == AdjustmentType.RELEASE_RESERVATION:
            if quantity_change >= 0:
                raise serializers.ValidationError({"quantity_change": "Quantity must be negative for releasing reservations."})
            inventory = data.get('inventory')
            if abs(quantity_change) > inventory.reserved_quantity:
                raise serializers.ValidationError({"quantity_change": "Cannot release more than reserved quantity."})

        return data

class InventoryAdjustmentSerializer(serializers.ModelSerializer):
    user = SimpleUserSerializer(read_only=True)
    reason = AdjustmentReasonSerializer(read_only=True)
    adjustment_type = serializers.CharField(source='get_adjustment_type_display', read_only=True)

    class Meta:
        model = InventoryAdjustment
        fields = [
            'id', 'user', 'inventory', 'adjustment_type', 'quantity_change',
            'reason', 'new_stock_quantity', 'notes', 'timestamp'
        ]
        read_only_fields = fields

class InventoryImportSerializer(serializers.Serializer):
    file = serializers.FileField(help_text="CSV file containing inventory data (SKU, Location Name, Quantity, [optional: Cost])")
    import_mode = serializers.ChoiceField(
        choices=[('overwrite', 'Overwrite'), ('update', 'Update')],
        default='update',
        help_text="Import mode: 'overwrite' replaces existing stock, 'update' adds/subtracts from current stock"
    )
