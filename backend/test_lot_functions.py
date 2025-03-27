"""
Simple script to test lot management functions.
"""
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal

from inventory.models import (
    Inventory, 
    FulfillmentLocation,
    Lot,
    LotStatus
)
from inventory.services import (
    add_quantity_to_lot,
    consume_quantity_from_lot,
    find_lots_for_consumption
)
from products.models import Product

User = get_user_model()

def run_test():
    """Run a simple test of lot management functions."""
    print("Testing lot management functions...")
    
    # Get or create a test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'email': 'test@example.com',
            'is_staff': True
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print("Created test user")
    else:
        print("Using existing test user")
    
    # Get or create a test location
    location, created = FulfillmentLocation.objects.get_or_create(
        name='Test Warehouse',
        defaults={
            'location_type': 'WAREHOUSE',
            'is_active': True
        }
    )
    if created:
        print("Created test location")
    else:
        print("Using existing test location")
    
    # Get or create a test product with lot tracking enabled
    product, created = Product.objects.get_or_create(
        sku='TLP001',
        defaults={
            'name': 'Test Lotted Product',
            'is_active': True,
            'is_lotted': True
        }
    )
    if created:
        print("Created test product")
    else:
        print("Using existing test product")
        # Make sure it's set as lotted
        if not product.is_lotted:
            product.is_lotted = True
            product.save()
            print("Updated product to be lot-tracked")
    
    # Get or create an inventory record
    inventory, created = Inventory.objects.get_or_create(
        product=product,
        location=location,
        defaults={
            'stock_quantity': 0
        }
    )
    if created:
        print("Created test inventory record")
    else:
        print("Using existing inventory record")
    
    # Set up dates for testing
    today = date.today()
    next_week = today + timedelta(days=7)
    next_month = today + timedelta(days=30)
    
    # Test adding quantity to a lot
    print("\nTesting add_quantity_to_lot...")
    try:
        lot = add_quantity_to_lot(
            inventory=inventory,
            lot_number='TEST001',
            quantity_to_add=10,
            expiry_date=next_month,
            user=user
        )
        print(f"Successfully added 10 units to lot TEST001")
        print(f"Lot status: {lot.status.label}")
        print(f"Lot quantity: {lot.quantity}")
        
        # Refresh inventory to see updated quantities
        inventory.refresh_from_db()
        print(f"Inventory stock quantity: {inventory.stock_quantity}")
        
        # Add another lot with different expiry
        lot2 = add_quantity_to_lot(
            inventory=inventory,
            lot_number='TEST002',
            quantity_to_add=15,
            expiry_date=next_week,  # Expires sooner
            user=user
        )
        print(f"Successfully added 15 units to lot TEST002")
        
        # Test find_lots_for_consumption with FEFO strategy
        print("\nTesting find_lots_for_consumption with FEFO strategy...")
        lots_to_consume = find_lots_for_consumption(
            inventory=inventory,
            quantity_needed=20,
            strategy='FEFO'
        )
        
        print(f"Found {len(lots_to_consume)} lots to consume:")
        for lot, qty in lots_to_consume:
            print(f"  - Lot {lot.lot_number} (expires {lot.expiry_date}): {qty} units")
        
        # Test consuming from a specific lot
        print("\nTesting consume_quantity_from_lot...")
        if lots_to_consume:
            first_lot, qty_to_consume = lots_to_consume[0]
            consume_quantity_from_lot(
                lot=first_lot,
                quantity_to_consume=qty_to_consume,
                user=user
            )
            first_lot.refresh_from_db()
            print(f"Consumed {qty_to_consume} units from lot {first_lot.lot_number}")
            print(f"Remaining quantity: {first_lot.quantity}")
            print(f"Lot status: {first_lot.status.label}")
            
            # Refresh inventory to see updated quantities
            inventory.refresh_from_db()
            print(f"Inventory stock quantity: {inventory.stock_quantity}")
        
        print("\nTest completed successfully!")
        
    except Exception as e:
        print(f"Error during test: {str(e)}")

if __name__ == "__main__":
    run_test()
