from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from inventory.models import (
    Product, FulfillmentLocation, Inventory, AdjustmentReason, 
    InventoryAdjustment, Lot, LotStatus, LocationType
)
from inventory.services import (
    perform_inventory_adjustment, add_quantity_to_lot, 
    find_lots_for_consumption, consume_quantity_from_lot
)

User = get_user_model()

class Command(BaseCommand):
    help = 'Test inventory adjustment functions with lot consumption'

    def handle(self, *args, **options):
        self.stdout.write("Testing inventory adjustment with lot consumption...")
        
        # Setup test data
        self.setup_test_data()
        
        # Test lot consumption with perform_inventory_adjustment
        self.test_lot_consumption()
        
        self.stdout.write(self.style.SUCCESS("Test completed successfully!"))
    
    def setup_test_data(self):
        # Create or get test user
        try:
            self.user = User.objects.get(email='test@example.com')
            self.stdout.write("Using existing test user")
        except User.DoesNotExist:
            self.user = User.objects.create_user(
                email='test@example.com',
                password='testpassword',
                first_name='Test',
                last_name='User'
            )
            self.stdout.write("Created test user")
        
        # Create or get test location
        try:
            self.location = FulfillmentLocation.objects.get(name='Test Location')
            self.stdout.write("Using existing test location")
        except FulfillmentLocation.DoesNotExist:
            self.location = FulfillmentLocation.objects.create(
                name='Test Location',
                location_type=LocationType.WAREHOUSE,
                address_line_1='123 Test St',
                address_line_2='',
                city='Test City',
                state_province='TS',
                postal_code='12345',
                country_code='US'
            )
            self.stdout.write("Created test location")
        
        # Create or get test product
        try:
            self.product = Product.objects.get(sku='TLP001')
            self.stdout.write("Using existing test product")
        except Product.DoesNotExist:
            self.product = Product.objects.create(
                sku='TLP001',
                name='Test Lot Product',
                description='A product for testing lot functionality',
                is_active=True,
                is_lotted=True,
                is_serialized=False
            )
            self.stdout.write("Created test product")
        
        # Create or get inventory record
        try:
            self.inventory = Inventory.objects.get(
                product=self.product,
                location=self.location
            )
            self.stdout.write("Using existing inventory record")
        except Inventory.DoesNotExist:
            self.inventory = Inventory.objects.create(
                product=self.product,
                location=self.location,
                stock_quantity=0,
                reserved_quantity=0,
                low_stock_threshold=10
            )
            self.stdout.write("Created inventory record")
        
        # Create or get adjustment reason
        try:
            self.reason = AdjustmentReason.objects.get(name='Test Reason')
            self.stdout.write("Using existing adjustment reason")
        except AdjustmentReason.DoesNotExist:
            self.reason = AdjustmentReason.objects.create(
                name='Test Reason',
                description='Reason for test adjustments'
            )
            self.stdout.write("Created adjustment reason")
    
    def test_lot_consumption(self):
        self.stdout.write("\nTesting lot consumption with perform_inventory_adjustment...")
        
        # Reset inventory to 0
        self.inventory.stock_quantity = 0
        self.inventory.reserved_quantity = 0
        self.inventory.save()
        
        # Delete any existing lots for this inventory
        Lot.objects.filter(inventory_record=self.inventory).delete()
        
        # Create two lots with different quantities
        lot1_number = 'TESTLOT001'
        lot2_number = 'TESTLOT002'
        
        # Add quantities to lots directly using add_quantity_to_lot
        lot1 = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number=lot1_number,
            quantity_to_add=10,
            expiry_date=date.today() + timedelta(days=30),
            user=self.user
        )
        self.stdout.write(f"Created lot {lot1_number} with 10 units")
        
        lot2 = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number=lot2_number,
            quantity_to_add=15,
            expiry_date=date.today() + timedelta(days=60),
            user=self.user
        )
        self.stdout.write(f"Created lot {lot2_number} with 15 units")
        
        # Update inventory stock quantity to match the lot quantities
        # This is normally done by perform_inventory_adjustment but we're setting it directly for testing
        self.inventory.stock_quantity = lot1.quantity + lot2.quantity
        self.inventory.save()
        self.inventory.refresh_from_db()
        
        # Verify initial state
        self.stdout.write(f"Initial inventory stock quantity: {self.inventory.stock_quantity}")
        self.stdout.write(f"Lot {lot1_number} quantity: {lot1.quantity}")
        self.stdout.write(f"Lot {lot2_number} quantity: {lot2.quantity}")
        
        # Test consumption using perform_inventory_adjustment
        quantity_to_consume = 12
        self.stdout.write(f"\nConsuming {quantity_to_consume} units using perform_inventory_adjustment...")
        
        # First, let's see what lots would be consumed
        lots_to_consume = find_lots_for_consumption(
            inventory=self.inventory,
            quantity_needed=quantity_to_consume,
            strategy='FEFO'
        )
        
        self.stdout.write("Lots that would be consumed:")
        for lot, qty in lots_to_consume:
            self.stdout.write(f"- Lot {lot.lot_number}: {qty} units (expires {lot.expiry_date})")
        
        # Now perform the adjustment
        adjustment = perform_inventory_adjustment(
            user=self.user,
            inventory=self.inventory,
            adjustment_type='SUB',
            quantity_change=quantity_to_consume,
            reason=self.reason,
            notes="Test lot consumption",
            lot_strategy='FEFO'
        )
        
        # Refresh from database
        self.inventory.refresh_from_db()
        lot1.refresh_from_db()
        lot2.refresh_from_db()
        
        # Verify final state
        self.stdout.write(f"\nFinal inventory stock quantity: {self.inventory.stock_quantity}")
        self.stdout.write(f"Lot {lot1_number} quantity: {lot1.quantity}")
        self.stdout.write(f"Lot {lot2_number} quantity: {lot2.quantity}")
        self.stdout.write(f"Adjustment notes: {adjustment.notes}")
        
        # Calculate expected values
        expected_lot1_qty = 0  # Lot1 should be fully consumed (10 units)
        expected_lot2_qty = 15 - (quantity_to_consume - 10)  # Lot2 should have 2 units consumed
        expected_inventory_qty = 25 - quantity_to_consume
        
        # Verify expectations
        assert self.inventory.stock_quantity == expected_inventory_qty, f"Expected inventory quantity {expected_inventory_qty}, got {self.inventory.stock_quantity}"
        assert lot1.quantity == expected_lot1_qty, f"Expected lot1 quantity {expected_lot1_qty}, got {lot1.quantity}"
        assert lot2.quantity == expected_lot2_qty, f"Expected lot2 quantity {expected_lot2_qty}, got {lot2.quantity}"
        
        self.stdout.write(self.style.SUCCESS("Lot consumption test passed!"))
