"""
Tests for lot management service functions.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import date, timedelta

from inventory.models import (
    Inventory, 
    AdjustmentReason, 
    InventoryAdjustment,
    FulfillmentLocation,
    Lot,
    LotStatus
)
from inventory.services import (
    perform_inventory_adjustment,
    add_quantity_to_lot,
    consume_quantity_from_lot,
    find_lots_for_consumption,
    reserve_lot_quantity,
    release_lot_reservation,
    mark_lot_as_expired
)
from products.models import Product

User = get_user_model()

class LotManagementServiceTests(TestCase):
    """Test cases for the lot management service functions."""
    
    def setUp(self):
        """Set up test data."""
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create a test location
        self.location = FulfillmentLocation.objects.create(
            name='Test Warehouse',
            location_type='WAREHOUSE',
            is_active=True
        )
        
        # Create a test product with lot tracking enabled
        self.product = Product.objects.create(
            name='Test Lotted Product',
            sku='TLP001',
            is_active=True,
            is_lotted=True
        )
        
        # Create an inventory record
        self.inventory = Inventory.objects.create(
            product=self.product,
            location=self.location,
            stock_quantity=0
        )
        
        # Create an adjustment reason
        self.reason = AdjustmentReason.objects.create(
            name='Test Reason',
            description='Test description',
            is_active=True
        )
        
        # Set up dates for testing
        self.today = date.today()
        self.tomorrow = self.today + timedelta(days=1)
        self.next_week = self.today + timedelta(days=7)
        self.next_month = self.today + timedelta(days=30)
    
    def test_manual_lot_operations(self):
        """Test basic lot operations manually to verify functionality."""
        print("\nTesting basic lot operations...")
        
        # Test adding quantity to a lot
        lot = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number='TEST001',
            quantity_to_add=10,
            expiry_date=self.next_month,
            user=self.user
        )
        print(f"Successfully added 10 units to lot TEST001")
        print(f"Lot status: {lot.status}")
        print(f"Lot quantity: {lot.quantity}")
        
        # Refresh inventory to see updated quantities
        self.inventory.refresh_from_db()
        print(f"Inventory stock quantity: {self.inventory.stock_quantity}")
        
        # Add another lot with different expiry
        lot2 = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number='TEST002',
            quantity_to_add=15,
            expiry_date=self.next_week,  # Expires sooner
            user=self.user
        )
        print(f"Successfully added 15 units to lot TEST002")
        
        # Test find_lots_for_consumption with FEFO strategy
        print("\nTesting find_lots_for_consumption with FEFO strategy...")
        lots_to_consume = find_lots_for_consumption(
            inventory=self.inventory,
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
                user=self.user
            )
            first_lot.refresh_from_db()
            print(f"Consumed {qty_to_consume} units from lot {first_lot.lot_number}")
            print(f"Remaining quantity: {first_lot.quantity}")
            print(f"Lot status: {first_lot.status}")
            
            # Refresh inventory to see updated quantities
            self.inventory.refresh_from_db()
            print(f"Inventory stock quantity: {self.inventory.stock_quantity}")
        
        print("\nTest completed successfully!")
        
        # Verify the expected state after operations
        self.assertEqual(self.inventory.stock_quantity, 10)  # 25 - 15 = 10
        
    def test_add_quantity_to_lot(self):
        """Test adding quantity to a lot."""
        # Add quantity to a new lot
        lot = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number='LOT001',
            quantity_to_add=10,
            expiry_date=self.next_month,
            user=self.user
        )
        
        # Verify the lot was created correctly
        self.assertEqual(lot.lot_number, 'LOT001')
        self.assertEqual(lot.quantity, 10)
        self.assertEqual(lot.status, LotStatus.AVAILABLE)
        self.assertEqual(lot.expiry_date, self.next_month)
        
        # Verify inventory was updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 10)
        
        # Add more quantity to the same lot
        lot = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number='LOT001',
            quantity_to_add=5,
            expiry_date=self.next_month,
            user=self.user
        )
        
        # Verify the lot was updated correctly
        self.assertEqual(lot.quantity, 15)
        
        # Verify inventory was updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 15)
    
    def test_consume_quantity_from_lot(self):
        """Test consuming quantity from a lot."""
        # Create a lot with initial quantity
        lot = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number='LOT001',
            quantity_to_add=20,
            expiry_date=self.next_month,
            user=self.user
        )
        
        # Consume some quantity
        consume_quantity_from_lot(
            lot=lot,
            quantity_to_consume=5,
            user=self.user
        )
        
        # Verify the lot was updated correctly
        lot.refresh_from_db()
        self.assertEqual(lot.quantity, 15)
        
        # Verify inventory was updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 15)
        
        # Consume all remaining quantity
        consume_quantity_from_lot(
            lot=lot,
            quantity_to_consume=15,
            user=self.user
        )
        
        # Verify the lot was updated correctly
        lot.refresh_from_db()
        self.assertEqual(lot.quantity, 0)
        self.assertEqual(lot.status, LotStatus.CONSUMED)
        
        # Verify inventory was updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 0)
    
    def test_find_lots_for_consumption_fefo(self):
        """Test finding lots for consumption using FEFO strategy."""
        # Create lots with different expiry dates
        lot1 = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number='LOT001',
            quantity_to_add=10,
            expiry_date=self.next_month,  # Expires last
            user=self.user
        )
        
        lot2 = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number='LOT002',
            quantity_to_add=15,
            expiry_date=self.next_week,  # Expires second
            user=self.user
        )
        
        lot3 = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number='LOT003',
            quantity_to_add=5,
            expiry_date=self.tomorrow,  # Expires first
            user=self.user
        )
        
        # Find lots for consumption using FEFO
        lots_to_consume = find_lots_for_consumption(
            inventory=self.inventory,
            quantity_needed=20,
            strategy='FEFO'
        )
        
        # Verify the lots are selected in the correct order (earliest expiry first)
        self.assertEqual(len(lots_to_consume), 2)
        self.assertEqual(lots_to_consume[0][0].lot_number, 'LOT003')  # Expires first
        self.assertEqual(lots_to_consume[0][1], 5)  # All 5 units
        self.assertEqual(lots_to_consume[1][0].lot_number, 'LOT002')  # Expires second
        self.assertEqual(lots_to_consume[1][1], 15)  # All 15 units
    
    def test_find_lots_for_consumption_fifo(self):
        """Test finding lots for consumption using FIFO strategy."""
        # Create lots at different times (we'll manipulate the received_date)
        lot1 = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number='LOT001',
            quantity_to_add=10,
            expiry_date=self.next_month,
            user=self.user
        )
        # Manually update the received_date to simulate older lot
        lot1.received_date = self.today - timedelta(days=30)  # Oldest
        lot1.save()
        
        lot2 = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number='LOT002',
            quantity_to_add=15,
            expiry_date=self.next_month,
            user=self.user
        )
        # Manually update the received_date to simulate middle-aged lot
        lot2.received_date = self.today - timedelta(days=15)  # Middle
        lot2.save()
        
        lot3 = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number='LOT003',
            quantity_to_add=5,
            expiry_date=self.next_month,
            user=self.user
        )
        # This will have the most recent received_date
        
        # Find lots for consumption using FIFO
        lots_to_consume = find_lots_for_consumption(
            inventory=self.inventory,
            quantity_needed=20,
            strategy='FIFO'
        )
        
        # Verify the lots are selected in the correct order (oldest first)
        self.assertEqual(len(lots_to_consume), 2)
        self.assertEqual(lots_to_consume[0][0].lot_number, 'LOT001')  # Oldest
        self.assertEqual(lots_to_consume[0][1], 10)  # All 10 units
        self.assertEqual(lots_to_consume[1][0].lot_number, 'LOT002')  # Middle
        self.assertEqual(lots_to_consume[1][1], 10)  # Only 10 of 15 units needed
    
    def test_reserve_and_release_lot_quantity(self):
        """Test reserving and releasing lot quantity."""
        # Create a lot with initial quantity
        lot = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number='LOT001',
            quantity_to_add=20,
            expiry_date=self.next_month,
            user=self.user
        )
        
        # Reserve some quantity
        reserve_lot_quantity(
            lot=lot,
            quantity_to_reserve=8,
            user=self.user
        )
        
        # Verify the lot was updated correctly
        lot.refresh_from_db()
        self.assertEqual(lot.quantity, 12)  # 20 - 8
        self.assertEqual(lot.reserved_quantity, 8)
        self.assertEqual(lot.status, LotStatus.PARTIALLY_RESERVED)
        
        # Verify inventory was updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 12)
        self.assertEqual(self.inventory.reserved_quantity, 8)
        
        # Reserve all remaining quantity
        reserve_lot_quantity(
            lot=lot,
            quantity_to_reserve=12,
            user=self.user
        )
        
        # Verify the lot was updated correctly
        lot.refresh_from_db()
        self.assertEqual(lot.quantity, 0)
        self.assertEqual(lot.reserved_quantity, 20)
        self.assertEqual(lot.status, LotStatus.RESERVED)
        
        # Release some of the reserved quantity
        release_lot_reservation(
            reserved_lot=lot,
            quantity_to_release=5,
            user=self.user
        )
        
        # Verify the lot was updated correctly
        lot.refresh_from_db()
        self.assertEqual(lot.quantity, 5)
        self.assertEqual(lot.reserved_quantity, 15)
        self.assertEqual(lot.status, LotStatus.PARTIALLY_RESERVED)
        
        # Verify inventory was updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 5)
        self.assertEqual(self.inventory.reserved_quantity, 15)
    
    def test_mark_lot_as_expired(self):
        """Test marking a lot as expired."""
        # Create a lot with initial quantity
        lot = add_quantity_to_lot(
            inventory=self.inventory,
            lot_number='LOT001',
            quantity_to_add=20,
            expiry_date=self.tomorrow,
            user=self.user
        )
        
        # Mark the lot as expired
        mark_lot_as_expired(
            lot=lot,
            user=self.user
        )
        
        # Verify the lot was updated correctly
        lot.refresh_from_db()
        self.assertEqual(lot.status, LotStatus.EXPIRED)
        
        # Verify we can't consume from an expired lot
        with self.assertRaises(ValidationError):
            consume_quantity_from_lot(
                lot=lot,
                quantity_to_consume=5,
                user=self.user
            )
    
    def test_perform_inventory_adjustment_with_lots(self):
        """Test perform_inventory_adjustment with lot-tracked products."""
        # Add inventory using the adjustment function
        adjustment = perform_inventory_adjustment(
            user=self.user,
            inventory=self.inventory,
            adjustment_type='ADD',
            quantity_change=10,
            reason=self.reason,
            notes='Initial lot addition',
            lot_number='LOT001',
            expiry_date=self.next_month
        )
        
        # Verify the adjustment was created correctly
        self.assertEqual(adjustment.adjustment_type, 'ADD')
        self.assertEqual(adjustment.quantity_change, 10)
        
        # Verify inventory was updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 10)
        
        # Verify lot was created
        lot = Lot.objects.get(lot_number='LOT001')
        self.assertEqual(lot.quantity, 10)
        
        # Remove inventory using the adjustment function
        adjustment = perform_inventory_adjustment(
            user=self.user,
            inventory=self.inventory,
            adjustment_type='REMOVE',
            quantity_change=5,
            reason=self.reason,
            notes='Lot consumption',
            lot_strategy='FIFO'
        )
        
        # Verify the adjustment was created correctly
        self.assertEqual(adjustment.adjustment_type, 'REMOVE')
        self.assertEqual(adjustment.quantity_change, 5)
        
        # Verify inventory was updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 5)
        
        # Verify lot was updated
        lot.refresh_from_db()
        self.assertEqual(lot.quantity, 5)
