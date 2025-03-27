"""
Test script for the perform_inventory_adjustment service function.
This script uses Django's shell to directly test the function without going through the API.
"""
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

# Import necessary models and functions
from django.contrib.auth import get_user_model
from inventory.models import Inventory, AdjustmentReason, AdjustmentType
from inventory.services import perform_inventory_adjustment
from django.core.exceptions import ValidationError

User = get_user_model()

def test_inventory_adjustment():
    """Test the perform_inventory_adjustment function directly."""
    print("=== Testing Inventory Adjustment Service Function ===")
    
    # 1. Get a user (admin)
    try:
        user = User.objects.filter(is_staff=True).first()
        if not user:
            print("No admin user found. Please create an admin user first.")
            return
        print(f"Using user: {user.username}")
    except Exception as e:
        print(f"Error getting user: {e}")
        return
    
    # 2. Get an inventory item
    try:
        inventory = Inventory.objects.first()
        if not inventory:
            print("No inventory items found. Please create some inventory first.")
            return
        
        print(f"Found inventory item: ID={inventory.id}, Product={inventory.product.name if inventory.product else 'Unknown'}")
        print(f"Current quantities: Stock={inventory.stock_quantity}, Reserved={inventory.reserved_quantity}, Non-saleable={inventory.non_saleable_quantity}")
    except Exception as e:
        print(f"Error getting inventory: {e}")
        return
    
    # 3. Get an adjustment reason
    try:
        reason = AdjustmentReason.objects.first()
        if not reason:
            print("No adjustment reasons found. Please create an adjustment reason first.")
            return
        print(f"Using adjustment reason: {reason.name}")
    except Exception as e:
        print(f"Error getting adjustment reason: {e}")
        return
    
    # 4. Test ADD adjustment
    print("\n=== Testing ADD adjustment ===")
    try:
        original_stock = inventory.stock_quantity
        quantity_change = 5
        
        adjustment = perform_inventory_adjustment(
            user=user,
            inventory=inventory,
            adjustment_type=AdjustmentType.ADD.value,
            quantity_change=quantity_change,
            reason=reason,
            notes="Test ADD adjustment"
        )
        
        # Refresh inventory from database
        inventory.refresh_from_db()
        
        print(f"Adjustment created: {adjustment}")
        print(f"Original stock quantity: {original_stock}")
        print(f"New stock quantity: {inventory.stock_quantity}")
        print(f"Expected stock quantity: {original_stock + quantity_change}")
        
        if inventory.stock_quantity == original_stock + quantity_change:
            print("✅ ADD test PASSED: Stock quantity was updated correctly!")
        else:
            print("❌ ADD test FAILED: Stock quantity was not updated as expected.")
    except ValidationError as e:
        print(f"Validation error: {e}")
    except Exception as e:
        print(f"Error performing ADD adjustment: {e}")
    
    # 5. Test REMOVE adjustment
    print("\n=== Testing REMOVE adjustment ===")
    try:
        original_stock = inventory.stock_quantity
        quantity_change = 2
        
        adjustment = perform_inventory_adjustment(
            user=user,
            inventory=inventory,
            adjustment_type=AdjustmentType.REMOVE.value,
            quantity_change=quantity_change,
            reason=reason,
            notes="Test REMOVE adjustment"
        )
        
        # Refresh inventory from database
        inventory.refresh_from_db()
        
        print(f"Adjustment created: {adjustment}")
        print(f"Original stock quantity: {original_stock}")
        print(f"New stock quantity: {inventory.stock_quantity}")
        print(f"Expected stock quantity: {original_stock - quantity_change}")
        
        if inventory.stock_quantity == original_stock - quantity_change:
            print("✅ REMOVE test PASSED: Stock quantity was updated correctly!")
        else:
            print("❌ REMOVE test FAILED: Stock quantity was not updated as expected.")
    except ValidationError as e:
        print(f"Validation error: {e}")
    except Exception as e:
        print(f"Error performing REMOVE adjustment: {e}")
    
    # 6. Test RESERVE adjustment
    print("\n=== Testing RESERVE adjustment ===")
    try:
        original_stock = inventory.stock_quantity
        original_reserved = inventory.reserved_quantity
        quantity_change = 1
        
        adjustment = perform_inventory_adjustment(
            user=user,
            inventory=inventory,
            adjustment_type=AdjustmentType.RESERVE.value,
            quantity_change=quantity_change,
            reason=reason,
            notes="Test RESERVE adjustment"
        )
        
        # Refresh inventory from database
        inventory.refresh_from_db()
        
        print(f"Adjustment created: {adjustment}")
        print(f"Original stock quantity: {original_stock}")
        print(f"Original reserved quantity: {original_reserved}")
        print(f"New stock quantity: {inventory.stock_quantity}")
        print(f"New reserved quantity: {inventory.reserved_quantity}")
        print(f"Expected stock quantity: {original_stock - quantity_change}")
        print(f"Expected reserved quantity: {original_reserved + quantity_change}")
        
        if (inventory.stock_quantity == original_stock - quantity_change and 
            inventory.reserved_quantity == original_reserved + quantity_change):
            print("✅ RESERVE test PASSED: Stock and reserved quantities were updated correctly!")
        else:
            print("❌ RESERVE test FAILED: Stock and reserved quantities were not updated as expected.")
    except ValidationError as e:
        print(f"Validation error: {e}")
    except Exception as e:
        print(f"Error performing RESERVE adjustment: {e}")
    
    # 7. Test UNRESERVE adjustment
    print("\n=== Testing UNRESERVE adjustment ===")
    try:
        original_stock = inventory.stock_quantity
        original_reserved = inventory.reserved_quantity
        quantity_change = 1
        
        adjustment = perform_inventory_adjustment(
            user=user,
            inventory=inventory,
            adjustment_type=AdjustmentType.UNRESERVE.value,
            quantity_change=quantity_change,
            reason=reason,
            notes="Test UNRESERVE adjustment"
        )
        
        # Refresh inventory from database
        inventory.refresh_from_db()
        
        print(f"Adjustment created: {adjustment}")
        print(f"Original stock quantity: {original_stock}")
        print(f"Original reserved quantity: {original_reserved}")
        print(f"New stock quantity: {inventory.stock_quantity}")
        print(f"New reserved quantity: {inventory.reserved_quantity}")
        print(f"Expected stock quantity: {original_stock + quantity_change}")
        print(f"Expected reserved quantity: {original_reserved - quantity_change}")
        
        if (inventory.stock_quantity == original_stock + quantity_change and 
            inventory.reserved_quantity == original_reserved - quantity_change):
            print("✅ UNRESERVE test PASSED: Stock and reserved quantities were updated correctly!")
        else:
            print("❌ UNRESERVE test FAILED: Stock and reserved quantities were not updated as expected.")
    except ValidationError as e:
        print(f"Validation error: {e}")
    except Exception as e:
        print(f"Error performing UNRESERVE adjustment: {e}")
    
    # 8. Test MARK_NON_SALEABLE adjustment
    print("\n=== Testing MARK_NON_SALEABLE adjustment ===")
    try:
        original_stock = inventory.stock_quantity
        original_non_saleable = inventory.non_saleable_quantity
        quantity_change = 1
        
        adjustment = perform_inventory_adjustment(
            user=user,
            inventory=inventory,
            adjustment_type=AdjustmentType.MARK_NON_SALEABLE.value,
            quantity_change=quantity_change,
            reason=reason,
            notes="Test MARK_NON_SALEABLE adjustment"
        )
        
        # Refresh inventory from database
        inventory.refresh_from_db()
        
        print(f"Adjustment created: {adjustment}")
        print(f"Original stock quantity: {original_stock}")
        print(f"Original non-saleable quantity: {original_non_saleable}")
        print(f"New stock quantity: {inventory.stock_quantity}")
        print(f"New non-saleable quantity: {inventory.non_saleable_quantity}")
        print(f"Expected stock quantity: {original_stock - quantity_change}")
        print(f"Expected non-saleable quantity: {original_non_saleable + quantity_change}")
        
        if (inventory.stock_quantity == original_stock - quantity_change and 
            inventory.non_saleable_quantity == original_non_saleable + quantity_change):
            print("✅ MARK_NON_SALEABLE test PASSED: Stock and non-saleable quantities were updated correctly!")
        else:
            print("❌ MARK_NON_SALEABLE test FAILED: Stock and non-saleable quantities were not updated as expected.")
    except ValidationError as e:
        print(f"Validation error: {e}")
    except Exception as e:
        print(f"Error performing MARK_NON_SALEABLE adjustment: {e}")
    
    # 9. Test MARK_SALEABLE adjustment
    print("\n=== Testing MARK_SALEABLE adjustment ===")
    try:
        original_stock = inventory.stock_quantity
        original_non_saleable = inventory.non_saleable_quantity
        quantity_change = 1
        
        adjustment = perform_inventory_adjustment(
            user=user,
            inventory=inventory,
            adjustment_type=AdjustmentType.MARK_SALEABLE.value,
            quantity_change=quantity_change,
            reason=reason,
            notes="Test MARK_SALEABLE adjustment"
        )
        
        # Refresh inventory from database
        inventory.refresh_from_db()
        
        print(f"Adjustment created: {adjustment}")
        print(f"Original stock quantity: {original_stock}")
        print(f"Original non-saleable quantity: {original_non_saleable}")
        print(f"New stock quantity: {inventory.stock_quantity}")
        print(f"New non-saleable quantity: {inventory.non_saleable_quantity}")
        print(f"Expected stock quantity: {original_stock + quantity_change}")
        print(f"Expected non-saleable quantity: {original_non_saleable - quantity_change}")
        
        if (inventory.stock_quantity == original_stock + quantity_change and 
            inventory.non_saleable_quantity == original_non_saleable - quantity_change):
            print("✅ MARK_SALEABLE test PASSED: Stock and non-saleable quantities were updated correctly!")
        else:
            print("❌ MARK_SALEABLE test FAILED: Stock and non-saleable quantities were not updated as expected.")
    except ValidationError as e:
        print(f"Validation error: {e}")
    except Exception as e:
        print(f"Error performing MARK_SALEABLE adjustment: {e}")

if __name__ == "__main__":
    test_inventory_adjustment()
