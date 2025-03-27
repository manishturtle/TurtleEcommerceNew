"""
Tests for serialized inventory service functions.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction

from inventory.models import (
    Inventory,
    SerializedInventory,
    SerialNumberStatus,
    FulfillmentLocation
)
from inventory.services import (
    receive_serialized_item,
    update_serialized_status,
    find_available_serial_for_reservation,
    reserve_serialized_item,
    ship_serialized_item
)
from products.models import Product

User = get_user_model()

class SerializedInventoryServiceTests(TestCase):
    """Test cases for the serialized inventory service functions."""
    
    def setUp(self):
        """Set up test data."""
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword',
            is_staff=True
        )
        
        # Create a serialized product
        self.product = Product.objects.create(
            name='Test Serialized Product',
            description='Test serialized product description',
            sku='TEST-SERIAL-001',
            is_serialized=True  # Important: Product must be serialized
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
            stock_quantity=0,  # Start with 0 since serialized items will be added individually
            reserved_quantity=0,
            non_saleable_quantity=0,
            low_stock_threshold=5
        )
        
        # Create a serialized inventory item
        self.serial_number = "TEST-SN-001"
        with transaction.atomic():
            self.serialized_item = receive_serialized_item(
                user=self.user,
                product=self.product,
                location=self.location,
                serial_number=self.serial_number,
                notes="Test serialized item"
            )
    
    def test_receive_serialized_item(self):
        """Test receiving a serialized item."""
        serial_number = "TEST-SN-002"
        
        # Perform the operation
        with transaction.atomic():
            serialized_item = receive_serialized_item(
                user=self.user,
                product=self.product,
                location=self.location,
                serial_number=serial_number,
                notes="Test receipt"
            )
        
        # Verify the serialized item was created
        self.assertEqual(serialized_item.serial_number, serial_number)
        self.assertEqual(serialized_item.status, SerialNumberStatus.AVAILABLE)
        self.assertEqual(serialized_item.product, self.product)
        self.assertEqual(serialized_item.location, self.location)
        self.assertEqual(serialized_item.notes, "Test receipt")
        
        # Verify the inventory was updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 2)  # Original + new item
    
    def test_receive_duplicate_serial_number(self):
        """Test receiving a serialized item with a duplicate serial number."""
        # Try to create another serialized item with the same serial number
        with self.assertRaises(ValidationError):
            with transaction.atomic():
                receive_serialized_item(
                    user=self.user,
                    product=self.product,
                    location=self.location,
                    serial_number=self.serial_number,  # Same as in setUp
                    notes="Duplicate serial number"
                )
    
    def test_update_serialized_status(self):
        """Test updating the status of a serialized item."""
        # Update the status
        updated_item = update_serialized_status(
            serialized_item=self.serialized_item,
            new_status=SerialNumberStatus.RESERVED,
            notes="Test status update"
        )
        
        # Verify the status was updated
        self.assertEqual(updated_item.status, SerialNumberStatus.RESERVED)
        self.assertEqual(updated_item.notes, "Test status update")
        
        # Refresh from database to confirm persistence
        updated_item.refresh_from_db()
        self.assertEqual(updated_item.status, SerialNumberStatus.RESERVED)
    
    def test_invalid_status_transition(self):
        """Test an invalid status transition."""
        # First update to RESERVED
        update_serialized_status(
            serialized_item=self.serialized_item,
            new_status=SerialNumberStatus.RESERVED,
            notes="Reserving item"
        )
        
        # Then try to update directly to SOLD (should fail)
        with self.assertRaises(ValidationError):
            update_serialized_status(
                serialized_item=self.serialized_item,
                new_status=SerialNumberStatus.SOLD,
                notes="Invalid transition"
            )
    
    def test_find_available_serial(self):
        """Test finding an available serial number for reservation."""
        # Add another serialized item
        with transaction.atomic():
            receive_serialized_item(
                user=self.user,
                product=self.product,
                location=self.location,
                serial_number="TEST-SN-003",
                notes="Another test item"
            )
        
        # Find an available serial
        available_serial = find_available_serial_for_reservation(inventory=self.inventory)
        
        # Verify an available serial was found
        self.assertIsNotNone(available_serial)
        self.assertEqual(available_serial.status, SerialNumberStatus.AVAILABLE)
    
    def test_reserve_serialized_item(self):
        """Test reserving a serialized item."""
        # Reserve the item
        reserved_item = reserve_serialized_item(
            serialized_item=self.serialized_item,
            notes="Test reservation"
        )
        
        # Verify the item was reserved
        self.assertEqual(reserved_item.status, SerialNumberStatus.RESERVED)
        self.assertEqual(reserved_item.notes, "Test reservation")
        
        # Refresh from database to confirm persistence
        reserved_item.refresh_from_db()
        self.assertEqual(reserved_item.status, SerialNumberStatus.RESERVED)
        
        # Verify the inventory was updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.reserved_quantity, 1)
        self.assertEqual(self.inventory.stock_quantity, 0)  # Moved from stock to reserved
    
    def test_ship_serialized_item(self):
        """Test shipping a serialized item."""
        # First reserve the item
        reserve_serialized_item(
            serialized_item=self.serialized_item,
            notes="Test reservation"
        )
        
        # Then ship the item
        shipped_item = ship_serialized_item(
            serialized_item=self.serialized_item,
            notes="Test shipping"
        )
        
        # Verify the item was shipped
        self.assertEqual(shipped_item.status, SerialNumberStatus.SOLD)
        self.assertEqual(shipped_item.notes, "Test shipping")
        
        # Refresh from database to confirm persistence
        shipped_item.refresh_from_db()
        self.assertEqual(shipped_item.status, SerialNumberStatus.SOLD)
        
        # Verify the inventory was updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.reserved_quantity, 0)  # No longer reserved
