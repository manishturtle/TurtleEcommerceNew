from django.db import transaction
from django.core.exceptions import ValidationError
from .models import Inventory, InventoryAdjustment, AdjustmentType

def perform_inventory_adjustment(user, inventory, adjustment_type, quantity_change, reason, notes=None):
    """
    Perform an inventory adjustment with proper validation and locking.
    
    Args:
        user: The user performing the adjustment
        inventory: The Inventory instance to adjust
        adjustment_type: The type of adjustment (from AdjustmentType)
        quantity_change: The quantity to change (positive or negative)
        reason: The AdjustmentReason instance
        notes: Optional notes for the adjustment
    
    Returns:
        InventoryAdjustment: The created adjustment record
        
    Raises:
        ValidationError: If the adjustment cannot be performed
    """
    with transaction.atomic():
        # Lock the inventory record
        inventory = Inventory.objects.select_for_update().get(pk=inventory.pk)
        
        # Perform adjustment based on type
        if adjustment_type == AdjustmentType.ADDITION:
            if quantity_change <= 0:
                raise ValidationError("Quantity must be positive for additions.")
            inventory.stock_quantity += quantity_change

        elif adjustment_type == AdjustmentType.SUBTRACTION:
            if quantity_change >= 0:
                raise ValidationError("Quantity must be negative for subtractions.")
            if abs(quantity_change) > inventory.stock_quantity:
                raise ValidationError("Insufficient stock for subtraction.")
            inventory.stock_quantity += quantity_change  # quantity_change is negative

        elif adjustment_type == AdjustmentType.RESERVATION:
            if quantity_change <= 0:
                raise ValidationError("Quantity must be positive for reservations.")
            if quantity_change > (inventory.stock_quantity - inventory.reserved_quantity):
                raise ValidationError("Insufficient available stock for reservation.")
            inventory.reserved_quantity += quantity_change

        elif adjustment_type == AdjustmentType.RELEASE_RESERVATION:
            if quantity_change >= 0:
                raise ValidationError("Quantity must be negative for releasing reservations.")
            if abs(quantity_change) > inventory.reserved_quantity:
                raise ValidationError("Cannot release more than reserved quantity.")
            inventory.reserved_quantity += quantity_change  # quantity_change is negative

        elif adjustment_type == AdjustmentType.NON_SALEABLE:
            if quantity_change <= 0:
                raise ValidationError("Quantity must be positive for non-saleable adjustments.")
            if quantity_change > inventory.stock_quantity:
                raise ValidationError("Insufficient stock to mark as non-saleable.")
            inventory.stock_quantity -= quantity_change
            inventory.non_saleable_quantity += quantity_change

        elif adjustment_type == AdjustmentType.HOLD:
            if quantity_change <= 0:
                raise ValidationError("Quantity must be positive for hold.")
            if quantity_change > inventory.stock_quantity:
                raise ValidationError("Insufficient stock to place on hold.")
            inventory.stock_quantity -= quantity_change
            inventory.hold_quantity += quantity_change

        elif adjustment_type == AdjustmentType.RELEASE_HOLD:
            if quantity_change >= 0:
                raise ValidationError("Quantity must be negative for releasing hold.")
            if abs(quantity_change) > inventory.hold_quantity:
                raise ValidationError("Cannot release more than held quantity.")
            inventory.hold_quantity += quantity_change  # quantity_change is negative
            inventory.stock_quantity -= quantity_change  # quantity_change is negative, so this adds

        # Save the updated inventory record
        inventory.save()

        # Create and return the adjustment record
        adjustment = InventoryAdjustment.objects.create(
            inventory=inventory,
            user=user,
            adjustment_type=adjustment_type,
            quantity_change=quantity_change,
            reason=reason,
            notes=notes,
            new_stock_quantity=inventory.stock_quantity
        )

        return adjustment
