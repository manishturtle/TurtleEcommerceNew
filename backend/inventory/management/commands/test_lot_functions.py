"""
Management command to test lot management functions.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal
from django.utils import timezone

from inventory.models import (
    Inventory, 
    FulfillmentLocation,
    Lot,
    LotStatus,
    AdjustmentReason
)
from inventory.services import (
    add_quantity_to_lot,
    consume_quantity_from_lot,
    find_lots_for_consumption,
    reserve_lot_quantity,
    release_lot_reservation,
    mark_lot_as_expired,
    perform_inventory_adjustment
)
from products.models import Product

User = get_user_model()

class Command(BaseCommand):
    help = 'Test lot management functions'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Testing lot management functions...'))
        
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
            self.stdout.write(self.style.SUCCESS('Created test user'))
        else:
            self.stdout.write(self.style.SUCCESS('Using existing test user'))
        
        # Get or create a test location
        location, created = FulfillmentLocation.objects.get_or_create(
            name='Test Warehouse',
            defaults={
                'location_type': 'WAREHOUSE',
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created test location'))
        else:
            self.stdout.write(self.style.SUCCESS('Using existing test location'))
        
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
            self.stdout.write(self.style.SUCCESS('Created test product'))
        else:
            self.stdout.write(self.style.SUCCESS('Using existing test product'))
            # Make sure it's set as lotted
            if not product.is_lotted:
                product.is_lotted = True
                product.save()
                self.stdout.write(self.style.SUCCESS('Updated product to be lot-tracked'))
        
        # Get or create an inventory record
        inventory, created = Inventory.objects.get_or_create(
            product=product,
            location=location,
            defaults={
                'stock_quantity': 0
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created test inventory record'))
        else:
            self.stdout.write(self.style.SUCCESS('Using existing inventory record'))
            
        # Get or create an adjustment reason
        reason, created = AdjustmentReason.objects.get_or_create(
            name='Test Reason',
            defaults={
                'description': 'Test description',
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created test adjustment reason'))
        else:
            self.stdout.write(self.style.SUCCESS('Using existing adjustment reason'))
        
        # Set up dates for testing
        today = date.today()
        next_week = today + timedelta(days=7)
        next_month = today + timedelta(days=30)
        
        # Test adding quantity to a lot
        self.stdout.write(self.style.NOTICE('\nTesting add_quantity_to_lot...'))
        try:
            # Clear existing lots for this inventory to start fresh
            Lot.objects.filter(inventory_record=inventory).delete()
            inventory.stock_quantity = 0
            inventory.save()
            
            lot = add_quantity_to_lot(
                inventory=inventory,
                lot_number='TEST001',
                quantity_to_add=10,
                expiry_date=next_month,
                user=user
            )
            self.stdout.write(self.style.SUCCESS(f"Successfully added 10 units to lot TEST001"))
            self.stdout.write(self.style.SUCCESS(f"Lot status: {lot.status}"))
            self.stdout.write(self.style.SUCCESS(f"Lot quantity: {lot.quantity}"))
            
            # Refresh inventory to see updated quantities
            inventory.refresh_from_db()
            self.stdout.write(self.style.SUCCESS(f"Inventory stock quantity: {inventory.stock_quantity}"))
            
            # Add another lot with different expiry
            lot2 = add_quantity_to_lot(
                inventory=inventory,
                lot_number='TEST002',
                quantity_to_add=15,
                expiry_date=next_week,  # Expires sooner
                user=user
            )
            self.stdout.write(self.style.SUCCESS(f"Successfully added 15 units to lot TEST002"))
            
            # Test find_lots_for_consumption with FEFO strategy
            self.stdout.write(self.style.NOTICE("\nTesting find_lots_for_consumption with FEFO strategy..."))
            lots_to_consume = find_lots_for_consumption(
                inventory=inventory,
                quantity_needed=20,
                strategy='FEFO'
            )
            
            self.stdout.write(self.style.SUCCESS(f"Found {len(lots_to_consume)} lots to consume:"))
            for lot, qty in lots_to_consume:
                self.stdout.write(self.style.SUCCESS(f"  - Lot {lot.lot_number} (expires {lot.expiry_date}): {qty} units"))
            
            # Test consuming from a specific lot
            self.stdout.write(self.style.NOTICE("\nTesting consume_quantity_from_lot..."))
            if lots_to_consume:
                first_lot, qty_to_consume = lots_to_consume[0]
                # Store the current quantity for comparison
                current_qty = first_lot.quantity
                
                consume_quantity_from_lot(
                    lot=first_lot,
                    quantity_to_consume=qty_to_consume,
                    user=user
                )
                first_lot.refresh_from_db()
                self.stdout.write(self.style.SUCCESS(f"Consumed {qty_to_consume} units from lot {first_lot.lot_number}"))
                self.stdout.write(self.style.SUCCESS(f"Remaining quantity: {first_lot.quantity}"))
                self.stdout.write(self.style.SUCCESS(f"Lot status: {first_lot.status}"))
                
                # Refresh inventory to see updated quantities
                inventory.refresh_from_db()
                self.stdout.write(self.style.SUCCESS(f"Inventory stock quantity: {inventory.stock_quantity}"))
            
            # Test reserving lot quantity
            self.stdout.write(self.style.NOTICE("\nTesting reserve_lot_quantity..."))
            
            # Create a new lot specifically for reservation testing
            reserve_test_lot = add_quantity_to_lot(
                inventory=inventory,
                lot_number=f"RESERVE_TEST_{timezone.now().strftime('%Y%m%d%H%M%S')}",  # Unique lot number
                quantity_to_add=10,
                expiry_date=next_month,
                user=user
            )
            
            self.stdout.write(self.style.SUCCESS(f"Created new lot {reserve_test_lot.lot_number} with 10 available units"))
            
            reserve_qty = 5
            
            reserved_lot = reserve_lot_quantity(
                lot=reserve_test_lot,
                quantity_to_reserve=reserve_qty,
                user=user
            )
            
            reserve_test_lot.refresh_from_db()
            self.stdout.write(self.style.SUCCESS(f"Reserved {reserve_qty} units from lot {reserve_test_lot.lot_number}"))
            self.stdout.write(self.style.SUCCESS(f"Original lot available quantity: {reserve_test_lot.quantity}"))
            self.stdout.write(self.style.SUCCESS(f"Original lot status: {reserve_test_lot.status}"))
            self.stdout.write(self.style.SUCCESS(f"Reserved lot number: {reserved_lot.lot_number}"))
            self.stdout.write(self.style.SUCCESS(f"Reserved lot quantity: {reserved_lot.quantity}"))
            self.stdout.write(self.style.SUCCESS(f"Reserved lot status: {reserved_lot.status}"))
            
            # Refresh inventory to see updated quantities
            inventory.refresh_from_db()
            self.stdout.write(self.style.SUCCESS(f"Inventory stock quantity: {inventory.stock_quantity}"))
            self.stdout.write(self.style.SUCCESS(f"Inventory reserved quantity: {inventory.reserved_quantity}"))
            
            # Test releasing reservation
            self.stdout.write(self.style.NOTICE("\nTesting release_lot_reservation..."))
            release_qty = min(2, reserved_lot.quantity)
            
            release_lot_reservation(
                reserved_lot=reserved_lot,
                quantity_to_release=release_qty,
                user=user
            )
            
            # Refresh both lots
            reserve_test_lot.refresh_from_db()
            reserved_lot.refresh_from_db()
            
            self.stdout.write(self.style.SUCCESS(f"Released {release_qty} units from reserved lot {reserved_lot.lot_number}"))
            self.stdout.write(self.style.SUCCESS(f"Original lot available quantity: {reserve_test_lot.quantity}"))
            self.stdout.write(self.style.SUCCESS(f"Original lot status: {reserve_test_lot.status}"))
            self.stdout.write(self.style.SUCCESS(f"Reserved lot quantity: {reserved_lot.quantity}"))
            self.stdout.write(self.style.SUCCESS(f"Reserved lot status: {reserved_lot.status}"))
            
            # Refresh inventory to see updated quantities
            inventory.refresh_from_db()
            self.stdout.write(self.style.SUCCESS(f"Inventory stock quantity: {inventory.stock_quantity}"))
            self.stdout.write(self.style.SUCCESS(f"Inventory reserved quantity: {inventory.reserved_quantity}"))
            
            # Test marking a lot as expired
            self.stdout.write(self.style.NOTICE("\nTesting mark_lot_as_expired..."))
            # Create a new lot with a short expiry
            exp_lot = add_quantity_to_lot(
                inventory=inventory,
                lot_number='EXPIRE001',
                quantity_to_add=5,
                expiry_date=today + timedelta(days=1),  # Tomorrow
                user=user
            )
            
            mark_lot_as_expired(
                lot=exp_lot,
                user=user
            )
            
            exp_lot.refresh_from_db()
            self.stdout.write(self.style.SUCCESS(f"Marked lot {exp_lot.lot_number} as expired"))
            self.stdout.write(self.style.SUCCESS(f"Lot status: {exp_lot.status}"))
            
            # Test perform_inventory_adjustment with lot-tracked products
            self.stdout.write(self.style.NOTICE("\nTesting perform_inventory_adjustment with lot-tracked products..."))
            
            # First clear existing lots
            Lot.objects.filter(inventory_record=inventory).delete()
            inventory.stock_quantity = 0
            inventory.reserved_quantity = 0
            inventory.save()
            
            # Add inventory using the adjustment function
            adjustment = perform_inventory_adjustment(
                user=user,
                inventory=inventory,
                adjustment_type='ADD',
                quantity_change=10,
                reason=reason,
                notes='Initial lot addition',
                lot_number='ADJ001',
                expiry_date=next_month
            )
            
            inventory.refresh_from_db()
            self.stdout.write(self.style.SUCCESS(f"Added 10 units to inventory using perform_inventory_adjustment"))
            self.stdout.write(self.style.SUCCESS(f"Adjustment type: {adjustment.adjustment_type}"))
            self.stdout.write(self.style.SUCCESS(f"Quantity change: {adjustment.quantity_change}"))
            self.stdout.write(self.style.SUCCESS(f"Inventory stock quantity: {inventory.stock_quantity}"))
            
            # Verify lot was created
            lot = Lot.objects.get(lot_number='ADJ001')
            self.stdout.write(self.style.SUCCESS(f"Lot quantity: {lot.quantity}"))
            
            # Remove inventory using the adjustment function
            adjustment = perform_inventory_adjustment(
                user=user,
                inventory=inventory,
                adjustment_type='SUB',  # Use SUB for subtraction
                quantity_change=5,
                reason=reason,
                notes='Lot consumption',
                lot_strategy='FIFO'
            )
            
            inventory.refresh_from_db()
            lot.refresh_from_db()
            self.stdout.write(self.style.SUCCESS(f"Removed 5 units from inventory using perform_inventory_adjustment"))
            self.stdout.write(self.style.SUCCESS(f"Adjustment type: {adjustment.adjustment_type}"))
            self.stdout.write(self.style.SUCCESS(f"Quantity change: {adjustment.quantity_change}"))
            self.stdout.write(self.style.SUCCESS(f"Inventory stock quantity: {inventory.stock_quantity}"))
            self.stdout.write(self.style.SUCCESS(f"Lot quantity: {lot.quantity}"))
            
            # Test reservation using the adjustment function
            adjustment = perform_inventory_adjustment(
                user=user,
                inventory=inventory,
                adjustment_type='RES',  
                quantity_change=2,
                reason=reason,
                notes='Lot reservation',
                lot_strategy='FIFO'
            )
            
            inventory.refresh_from_db()
            self.stdout.write(self.style.SUCCESS(f"Reserved 2 units using perform_inventory_adjustment"))
            self.stdout.write(self.style.SUCCESS(f"Adjustment type: {adjustment.adjustment_type}"))
            self.stdout.write(self.style.SUCCESS(f"Quantity change: {adjustment.quantity_change}"))
            self.stdout.write(self.style.SUCCESS(f"Inventory stock quantity: {inventory.stock_quantity}"))
            self.stdout.write(self.style.SUCCESS(f"Inventory reserved quantity: {inventory.reserved_quantity}"))
            
            # Find the reserved lot
            reserved_lot = Lot.objects.filter(
                inventory_record=inventory,
                status=LotStatus.RESERVED
            ).first()
            
            if reserved_lot:
                self.stdout.write(self.style.SUCCESS(f"Reserved lot number: {reserved_lot.lot_number}"))
                self.stdout.write(self.style.SUCCESS(f"Reserved lot quantity: {reserved_lot.quantity}"))
                
                # Test release reservation using the adjustment function
                adjustment = perform_inventory_adjustment(
                    user=user,
                    inventory=inventory,
                    adjustment_type='REL_RES',  
                    quantity_change=1,
                    reason=reason,
                    notes='Release lot reservation',
                    lot_number=reserved_lot.lot_number
                )
                
                inventory.refresh_from_db()
                self.stdout.write(self.style.SUCCESS(f"Released 1 unit from reservation using perform_inventory_adjustment"))
                self.stdout.write(self.style.SUCCESS(f"Adjustment type: {adjustment.adjustment_type}"))
                self.stdout.write(self.style.SUCCESS(f"Quantity change: {adjustment.quantity_change}"))
                self.stdout.write(self.style.SUCCESS(f"Inventory stock quantity: {inventory.stock_quantity}"))
                self.stdout.write(self.style.SUCCESS(f"Inventory reserved quantity: {inventory.reserved_quantity}"))
            
            self.stdout.write(self.style.SUCCESS("\nTest completed successfully!"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error during test: {str(e)}"))
