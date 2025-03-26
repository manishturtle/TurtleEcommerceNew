from django.contrib import admin
from .models import (
    FulfillmentLocation,
    Product,
    Inventory,
    InventoryAdjustment,
    AdjustmentReason,
    SerializedInventory
)

# Register your models here.

@admin.register(FulfillmentLocation)
class FulfillmentLocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'location_type', 'city', 'state_province', 'country_code', 'is_active')
    list_filter = ('location_type', 'is_active', 'country_code', 'state_province')
    search_fields = ('name', 'city', 'state_province', 'postal_code')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('sku', 'name', 'is_serialized', 'is_lotted', 'is_active')
    list_filter = ('is_serialized', 'is_lotted', 'is_active')
    search_fields = ('sku', 'name', 'description')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(AdjustmentReason)
class AdjustmentReasonAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = (
        'product', 
        'location', 
        'stock_quantity', 
        'reserved_quantity',
        'available_to_promise',
        'low_stock_threshold'
    )
    list_filter = ('location', 'product__is_active')
    search_fields = ('product__name', 'product__sku', 'location__name')
    readonly_fields = ('last_updated',)
    
    def available_to_promise(self, obj):
        return obj.available_to_promise
    available_to_promise.short_description = 'Available ATP'

@admin.register(SerializedInventory)
class SerializedInventoryAdmin(admin.ModelAdmin):
    list_display = (
        'serial_number',
        'product',
        'location',
        'status',
        'received_date',
        'last_modified_by'
    )
    list_filter = (
        'status',
        'location',
        'product',
        'received_date'
    )
    search_fields = (
        'serial_number',
        'product__name',
        'product__sku',
        'location__name',
        'notes'
    )
    raw_id_fields = ('product', 'location', 'inventory_record', 'last_modified_by')
    readonly_fields = ('received_date', 'last_updated')
    fieldsets = (
        (None, {
            'fields': (
                'product',
                'location',
                'serial_number',
                'status'
            )
        }),
        ('Additional Information', {
            'fields': (
                'inventory_record',
                'notes',
                'last_modified_by'
            )
        }),
        ('Timestamps', {
            'fields': (
                'received_date',
                'last_updated'
            ),
            'classes': ('collapse',)
        })
    )

@admin.register(InventoryAdjustment)
class InventoryAdjustmentAdmin(admin.ModelAdmin):
    list_display = (
        'timestamp',
        'inventory',
        'adjustment_type',
        'quantity_change',
        'reason',
        'user'
    )
    list_filter = ('adjustment_type', 'reason', 'timestamp')
    search_fields = (
        'inventory__product__name',
        'inventory__product__sku',
        'inventory__location__name',
        'reason__name',
        'notes'
    )
    readonly_fields = ('timestamp', 'new_stock_quantity')
    raw_id_fields = ('inventory', 'user', 'reason')
