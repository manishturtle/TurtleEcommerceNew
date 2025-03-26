from rest_framework import serializers
from .models import (
    FulfillmentLocation,
    Product,
    Inventory,
    InventoryAdjustment,
    AdjustmentReason,
    SerializedInventory
)

class FulfillmentLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = FulfillmentLocation
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class AdjustmentReasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdjustmentReason
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class InventorySerializer(serializers.ModelSerializer):
    available_to_promise = serializers.IntegerField(read_only=True)
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        write_only=True,
        source='product'
    )
    location = FulfillmentLocationSerializer(read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=FulfillmentLocation.objects.all(),
        write_only=True,
        source='location'
    )

    class Meta:
        model = Inventory
        fields = '__all__'
        read_only_fields = ('last_updated',)

class SerializedInventorySerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    location = FulfillmentLocationSerializer(read_only=True)
    last_modified_by = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = SerializedInventory
        fields = '__all__'
        read_only_fields = ('received_date', 'last_updated')

class InventoryAdjustmentSerializer(serializers.ModelSerializer):
    inventory = InventorySerializer(read_only=True)
    inventory_id = serializers.PrimaryKeyRelatedField(
        source='inventory',
        queryset=Inventory.objects.all()
    )
    reason_id = serializers.PrimaryKeyRelatedField(
        source='reason',
        queryset=AdjustmentReason.objects.all()
    )
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = InventoryAdjustment
        fields = (
            'id',
            'inventory',
            'inventory_id',
            'adjustment_type',
            'quantity_change',
            'reason_id',
            'notes',
            'new_stock_quantity',
            'timestamp',
            'user'
        )
        read_only_fields = ('new_stock_quantity', 'timestamp')
