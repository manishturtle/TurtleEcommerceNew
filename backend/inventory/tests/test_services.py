"""
Tests for inventory service functions.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from decimal import Decimal

from inventory.models import (
    Inventory, 
    AdjustmentReason, 
    InventoryAdjustment,
    FulfillmentLocation
)
from inventory.services import perform_inventory_adjustment
from products.models import Product

User = get_user_model()

class InventoryAdjustmentServiceTests(TestCase):
    """Test cases for the inventory adjustment service functions."""
    
    def setUp(self):
        """Set up test data."""
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword',
            is_staff=True
        )
        
        # Create a product
        self.product = Product.objects.create(
            name='Test Product',
            description='Test product description',
            sku='TEST-SKU-001',
            price=Decimal('10.00')
        )
        
        # Create a fulfillment location
        self.location = FulfillmentLocation.objects.create(
            name='Test Location',
            location_type='WAREHOUSE',
            address_line_1='123 Test St',
            city='Test City',
            state_province='TS',
            postal_code='12345',
            country_code='US'
        )
        
        # Create an inventory item
        self.inventory = Inventory.objects.create(
            product=self.product,
            location=self.location,
            stock_quantity=100,
            reserved_quantity=0,
            non_saleable_quantity=0
        )
        
        # Create an adjustment reason
        self.reason = AdjustmentReason.objects.create(
            name='Test Reason',
            description='Test reason description'
        )
    
    def test_add_adjustment(self):
        """Test adding inventory."""
        original_quantity = self.inventory.stock_quantity
        quantity_change = 10
        
        # Perform the adjustment
        adjustment = perform_inventory_adjustment(
            user=self.user,
            inventory=self.inventory,
            adjustment_type='ADD',
            quantity_change=quantity_change,
            reason=self.reason,
            notes='Test add adjustment'
        )
        
        # Refresh inventory from database
        self.inventory.refresh_from_db()
        
        # Verify the adjustment
        self.assertEqual(adjustment.adjustment_type, 'ADD')
        self.assertEqual(adjustment.quantity_change, quantity_change)
        self.assertEqual(adjustment.user, self.user)
        self.assertEqual(adjustment.reason, self.reason)
        self.assertEqual(adjustment.notes, 'Test add adjustment')
        
        # Verify the inventory was updated
        self.assertEqual(self.inventory.stock_quantity, original_quantity + quantity_change)
    
    def test_remove_adjustment(self):
        """Test removing inventory."""
        original_quantity = self.inventory.stock_quantity
        quantity_change = 10
        
        # Perform the adjustment
        adjustment = perform_inventory_adjustment(
            user=self.user,
            inventory=self.inventory,
            adjustment_type='SUB',
            quantity_change=quantity_change,
            reason=self.reason,
            notes='Test remove adjustment'
        )
        
        # Refresh inventory from database
        self.inventory.refresh_from_db()
        
        # Verify the adjustment
        self.assertEqual(adjustment.adjustment_type, 'SUB')
        self.assertEqual(adjustment.quantity_change, quantity_change)
        
        # Verify the inventory was updated
        self.assertEqual(self.inventory.stock_quantity, original_quantity - quantity_change)
    
    def test_remove_adjustment_insufficient_stock(self):
        """Test removing more inventory than available."""
        # Set a lower stock quantity
        self.inventory.stock_quantity = 5
        self.inventory.save()
        
        quantity_change = 10
        
        # Attempt to remove more than available should raise ValidationError
        with self.assertRaises(ValidationError):
            perform_inventory_adjustment(
                user=self.user,
                inventory=self.inventory,
                adjustment_type='SUB',
                quantity_change=quantity_change,
                reason=self.reason,
                notes='Test remove too much'
            )
        
        # Verify the inventory was not changed
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 5)
    
    def test_reserve_adjustment(self):
        """Test reserving inventory."""
        original_stock = self.inventory.stock_quantity
        original_reserved = self.inventory.reserved_quantity
        quantity_change = 10
        
        # Perform the adjustment
        adjustment = perform_inventory_adjustment(
            user=self.user,
            inventory=self.inventory,
            adjustment_type='RES',
            quantity_change=quantity_change,
            reason=self.reason,
            notes='Test reserve adjustment'
        )
        
        # Refresh inventory from database
        self.inventory.refresh_from_db()
        
        # Verify the adjustment
        self.assertEqual(adjustment.adjustment_type, 'RES')
        self.assertEqual(adjustment.quantity_change, quantity_change)
        
        # Verify the inventory was updated
        self.assertEqual(self.inventory.stock_quantity, original_stock - quantity_change)
        self.assertEqual(self.inventory.reserved_quantity, original_reserved + quantity_change)
    
    def test_unreserve_adjustment(self):
        """Test unreserving inventory."""
        # First reserve some inventory
        self.inventory.stock_quantity = 90
        self.inventory.reserved_quantity = 10
        self.inventory.save()
        
        original_stock = self.inventory.stock_quantity
        original_reserved = self.inventory.reserved_quantity
        quantity_change = 5
        
        # Perform the adjustment
        adjustment = perform_inventory_adjustment(
            user=self.user,
            inventory=self.inventory,
            adjustment_type='REL_RES',
            quantity_change=quantity_change,
            reason=self.reason,
            notes='Test unreserve adjustment'
        )
        
        # Refresh inventory from database
        self.inventory.refresh_from_db()
        
        # Verify the adjustment
        self.assertEqual(adjustment.adjustment_type, 'REL_RES')
        self.assertEqual(adjustment.quantity_change, quantity_change)
        
        # Verify the inventory was updated
        self.assertEqual(self.inventory.stock_quantity, original_stock + quantity_change)
        self.assertEqual(self.inventory.reserved_quantity, original_reserved - quantity_change)
    
    def test_unreserve_adjustment_too_much(self):
        """Test unreserving more inventory than reserved."""
        # Set a lower reserved quantity
        self.inventory.reserved_quantity = 5
        self.inventory.save()
        
        quantity_change = 10
        
        # Attempt to unreserve more than reserved should raise ValidationError
        with self.assertRaises(ValidationError):
            perform_inventory_adjustment(
                user=self.user,
                inventory=self.inventory,
                adjustment_type='REL_RES',
                quantity_change=quantity_change,
                reason=self.reason,
                notes='Test unreserve too much'
            )
        
        # Verify the inventory was not changed
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.reserved_quantity, 5)
    
    def test_mark_non_saleable_adjustment(self):
        """Test marking inventory as non-saleable."""
        original_stock = self.inventory.stock_quantity
        original_non_saleable = self.inventory.non_saleable_quantity
        quantity_change = 10
        
        # Perform the adjustment
        adjustment = perform_inventory_adjustment(
            user=self.user,
            inventory=self.inventory,
            adjustment_type='NON_SALE',
            quantity_change=quantity_change,
            reason=self.reason,
            notes='Test mark non-saleable adjustment'
        )
        
        # Refresh inventory from database
        self.inventory.refresh_from_db()
        
        # Verify the adjustment
        self.assertEqual(adjustment.adjustment_type, 'NON_SALE')
        self.assertEqual(adjustment.quantity_change, quantity_change)
        
        # Verify the inventory was updated
        self.assertEqual(self.inventory.stock_quantity, original_stock - quantity_change)
        self.assertEqual(self.inventory.non_saleable_quantity, original_non_saleable + quantity_change)
    
    def test_mark_saleable_adjustment(self):
        """Test marking inventory as saleable."""
        # First mark some inventory as non-saleable
        self.inventory.stock_quantity = 90
        self.inventory.non_saleable_quantity = 10
        self.inventory.save()
        
        original_stock = self.inventory.stock_quantity
        original_non_saleable = self.inventory.non_saleable_quantity
        quantity_change = 5
        
        # Perform the adjustment
        adjustment = perform_inventory_adjustment(
            user=self.user,
            inventory=self.inventory,
            adjustment_type='RET_STOCK',
            quantity_change=quantity_change,
            reason=self.reason,
            notes='Test mark saleable adjustment'
        )
        
        # Refresh inventory from database
        self.inventory.refresh_from_db()
        
        # Verify the adjustment
        self.assertEqual(adjustment.adjustment_type, 'RET_STOCK')
        self.assertEqual(adjustment.quantity_change, quantity_change)
        
        # Verify the inventory was updated
        self.assertEqual(self.inventory.stock_quantity, original_stock + quantity_change)
        self.assertEqual(self.inventory.non_saleable_quantity, original_non_saleable - quantity_change)
    
    def test_mark_saleable_adjustment_too_much(self):
        """Test marking more inventory as saleable than non-saleable."""
        # Set a lower non-saleable quantity
        self.inventory.non_saleable_quantity = 5
        self.inventory.save()
        
        quantity_change = 10
        
        # Attempt to mark more as saleable than non-saleable should raise ValidationError
        with self.assertRaises(ValidationError):
            perform_inventory_adjustment(
                user=self.user,
                inventory=self.inventory,
                adjustment_type='RET_STOCK',
                quantity_change=quantity_change,
                reason=self.reason,
                notes='Test mark saleable too much'
            )
        
        # Verify the inventory was not changed
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.non_saleable_quantity, 5)
    
    def test_invalid_adjustment_type(self):
        """Test an invalid adjustment type."""
        with self.assertRaises(ValidationError):
            perform_inventory_adjustment(
                user=self.user,
                inventory=self.inventory,
                adjustment_type='INVALID_TYPE',
                quantity_change=10,
                reason=self.reason,
                notes='Test invalid type'
            )
    
    def test_negative_quantity_change(self):
        """Test a negative quantity change."""
        with self.assertRaises(ValidationError):
            perform_inventory_adjustment(
                user=self.user,
                inventory=self.inventory,
                adjustment_type='ADD',
                quantity_change=-10,
                reason=self.reason,
                notes='Test negative quantity'
            )
