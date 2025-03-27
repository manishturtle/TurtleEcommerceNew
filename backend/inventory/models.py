from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from products.models import Product
from tenants.models import TenantAwareModel

class LocationType(models.TextChoices):
    WAREHOUSE = 'WAREHOUSE', 'Warehouse'
    STORE = 'STORE', 'Retail Store'
    FULFILLMENT_CENTER = 'FULFILLMENT_CENTER', 'Fulfillment Center'

class AdjustmentType(models.TextChoices):
    ADDITION = 'ADD', 'Addition'
    SUBTRACTION = 'SUB', 'Subtraction'
    RESERVATION = 'RES', 'Reservation'
    RELEASE_RESERVATION = 'REL_RES', 'Release Reservation'
    NON_SALEABLE = 'NON_SALE', 'Mark Non-Saleable'
    RECEIVE_ORDER = 'RECV_PO', 'Receive Purchase Order'
    SHIP_ORDER = 'SHIP_ORD', 'Ship Sales Order'
    RETURN_TO_STOCK = 'RET_STOCK', 'Return to Stock'
    MOVE_TO_NON_SALEABLE = 'RET_NON_SALE', 'Return to Non-Saleable'
    HOLD = 'HOLD', 'Place on Hold'
    RELEASE_HOLD = 'REL_HOLD', 'Release from Hold'
    CYCLE_COUNT = 'CYCLE', 'Cycle Count Adjustment'
    INITIAL_STOCK = 'INIT', 'Initial Stock Load'

class SerialNumberStatus(models.TextChoices):
    AVAILABLE = 'AVAILABLE', 'Available'
    RESERVED = 'RESERVED', 'Reserved (Order Pending)'
    SOLD = 'SOLD', 'Sold (Shipped)'
    IN_TRANSIT = 'IN_TRANSIT', 'In Transit (Transfer)'
    RETURNED = 'RETURNED', 'Returned (Pending Inspection)'
    DAMAGED = 'DAMAGED', 'Damaged / Non-Saleable'

class LotStatus(models.TextChoices):
    AVAILABLE = 'AVAILABLE', 'Available'
    RESERVED = 'RESERVED', 'Reserved (Order Pending)'
    EXPIRED = 'EXPIRED', 'Expired'
    QUARANTINE = 'QUARANTINE', 'In Quarantine'
    DAMAGED = 'DAMAGED', 'Damaged / Non-Saleable'

class FulfillmentLocation(TenantAwareModel):
    name = models.CharField(max_length=255)
    location_type = models.CharField(max_length=50, choices=LocationType.choices)
    address_line_1 = models.CharField(max_length=255, blank=True, null=True)
    address_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state_province = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    country_code = models.CharField(max_length=2, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Fulfillment Location"
        verbose_name_plural = "Fulfillment Locations"
        ordering = ['name']
        unique_together = ('name', 'org_id')

    def __str__(self):
        return self.name

class AdjustmentReason(TenantAwareModel):
    name = models.CharField(
        max_length=100, 
        help_text="Short name for the reason (e.g., 'Cycle Count Discrepancy')"
    )
    description = models.TextField(
        blank=True, 
        null=True, 
        help_text="Optional longer description"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Inventory Adjustment Reason"
        verbose_name_plural = "Inventory Adjustment Reasons"
        ordering = ['name']
        unique_together = ('name', 'org_id')

    def __str__(self):
        return self.name

class Inventory(TenantAwareModel):
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='inventory_levels'
    )
    location = models.ForeignKey(
        FulfillmentLocation, 
        on_delete=models.CASCADE, 
        related_name='inventory_levels'
    )
    stock_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    reserved_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    non_saleable_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    on_order_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    in_transit_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    returned_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    hold_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    backorder_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    low_stock_threshold = models.PositiveIntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)]
    )
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'location', 'org_id')
        verbose_name_plural = 'Inventories'
        ordering = ['product__name', 'location__name']

    @property
    def available_to_promise(self):
        return max(0, self.stock_quantity - self.reserved_quantity)

    def __str__(self):
        return f"{self.product} at {self.location}"

class SerializedInventory(TenantAwareModel):
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='serial_numbers',
        limit_choices_to={'is_serialized': True}
    )
    location = models.ForeignKey(
        'FulfillmentLocation', 
        on_delete=models.CASCADE, 
        related_name='serial_numbers'
    )
    inventory_record = models.ForeignKey(
        'Inventory', 
        on_delete=models.CASCADE, 
        related_name='serial_numbers', 
        null=True, 
        blank=True,
        help_text="Link to the main Inventory record for this product/location"
    )
    serial_number = models.CharField(
        max_length=255, 
        db_index=True,
        help_text="Unique serial number for this product unit"
    )
    status = models.CharField(
        max_length=20, 
        choices=SerialNumberStatus.choices,
        default=SerialNumberStatus.AVAILABLE,
        db_index=True
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Optional notes about this serial number (e.g., damage details)"
    )
    received_date = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    last_modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='modified_serial_numbers',
        help_text="User who last modified this record"
    )

    class Meta:
        verbose_name = "Serialized Inventory Item"
        verbose_name_plural = "Serialized Inventory Items"
        unique_together = ('product', 'serial_number', 'org_id')
        ordering = ['product__name', 'serial_number']
        indexes = [
            models.Index(fields=['product', 'serial_number']),
            models.Index(fields=['status', 'location']),
        ]

    def clean(self):
        if not self.product.is_serialized:
            raise ValidationError(
                f"Cannot create serial number for non-serialized product {self.product}"
            )
        
        if self.inventory_record and (
            self.inventory_record.product != self.product or 
            self.inventory_record.location != self.location
        ):
            raise ValidationError(
                "Inventory record must match the product and location"
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} - SN: {self.serial_number} @ {self.location.name} ({self.status})"

class Lot(TenantAwareModel):
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='lots',
        limit_choices_to={'is_lotted': True}
    )
    location = models.ForeignKey(
        'FulfillmentLocation',
        on_delete=models.CASCADE,
        related_name='lots'
    )
    inventory_record = models.ForeignKey(
        'Inventory', 
        on_delete=models.CASCADE, 
        related_name='lots', 
        null=True, 
        blank=True,
        help_text="Link to the main Inventory record for this product/location"
    )
    lot_number = models.CharField(
        max_length=100, 
        db_index=True, 
        help_text="Identifier for the batch/lot"
    )
    quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Quantity of this product from this lot at this location"
    )
    status = models.CharField(
        max_length=20,
        choices=LotStatus.choices,
        default=LotStatus.AVAILABLE,
        db_index=True
    )
    expiry_date = models.DateField(
        null=True, 
        blank=True, 
        db_index=True, 
        help_text="Expiry date for this lot, if applicable"
    )
    manufacturing_date = models.DateField(
        null=True,
        blank=True,
        help_text="Manufacturing date for this lot"
    )
    received_date = models.DateField(
        default=timezone.now,
        db_index=True,
        help_text="Date this lot was received"
    )
    cost_price_per_unit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Cost price per unit for this lot"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Optional notes about this lot"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    last_modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='modified_lots',
        help_text="User who last modified this record"
    )

    class Meta:
        verbose_name = "Inventory Lot/Batch"
        verbose_name_plural = "Inventory Lots/Batches"
        unique_together = ('product', 'location', 'lot_number', 'org_id')
        ordering = ['product', 'location', 'received_date', 'expiry_date']
        indexes = [
            models.Index(fields=['product', 'lot_number']),
            models.Index(fields=['status', 'location']),
            models.Index(fields=['expiry_date']),
        ]

    def clean(self):
        if self.quantity < 0:
            raise ValidationError("Lot quantity cannot be negative.")
        
        if self.product_id:
            try:
                product = Product.objects.get(id=self.product_id)
                if not product.is_lotted:
                    raise ValidationError(f"Product {product.sku} is not marked for lot tracking.")
            except Product.DoesNotExist:
                pass  # Let the database handle this error
            
        if self.expiry_date and self.manufacturing_date:
            if self.expiry_date <= self.manufacturing_date:
                raise ValidationError("Expiry date must be after manufacturing date.")

    def save(self, *args, **kwargs):
        self.clean()
        # Update status if expired
        if self.expiry_date and self.expiry_date < timezone.now().date():
            self.status = LotStatus.EXPIRED
        super().save(*args, **kwargs)

    def is_expired(self):
        if not self.expiry_date:
            return False
        return self.expiry_date < timezone.now().date()

    def __str__(self):
        status_str = f" [{self.status}]" if self.status != LotStatus.AVAILABLE else ""
        expiry_str = f", Expires: {self.expiry_date}" if self.expiry_date else ""
        return f"Lot: {self.lot_number} ({self.product.name} @ {self.location.name}) - Qty: {self.quantity}{status_str}{expiry_str}"

class InventoryAdjustment(models.Model):
    inventory = models.ForeignKey(
        Inventory, 
        on_delete=models.CASCADE, 
        related_name='adjustments'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who performed the adjustment"
    )
    adjustment_type = models.CharField(
        max_length=20, 
        choices=AdjustmentType.choices
    )
    quantity_change = models.IntegerField(
        help_text="The change in quantity (positive for additions, negative for subtractions)"
    )
    reason = models.ForeignKey(
        AdjustmentReason,
        on_delete=models.PROTECT,
        related_name='adjustments'
    )
    notes = models.TextField(
        blank=True, 
        null=True, 
        help_text="Optional additional details for the adjustment"
    )
    new_stock_quantity = models.IntegerField(
        help_text="The stock_quantity AFTER this adjustment"
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Inventory Adjustment"
        verbose_name_plural = "Inventory Adjustments"

    def __str__(self):
        return f"{self.adjustment_type} of {abs(self.quantity_change)} units for {self.inventory} ({self.reason})"
