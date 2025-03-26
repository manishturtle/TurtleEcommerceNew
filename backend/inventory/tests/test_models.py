from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from inventory.models import (
    FulfillmentLocation,
    Product,
    Inventory,
    InventoryAdjustment,
    AdjustmentReason,
    SerializedInventory,
    SerialNumberStatus
)

User = get_user_model()

class FulfillmentLocationTests(TestCase):
    def setUp(self):
        self.location_data = {
            'name': 'Test Warehouse',
            'location_type': 'WAREHOUSE',
            'address_line_1': '123 Test St',
            'city': 'Test City',
            'state_province': 'Test State',
            'postal_code': '12345',
            'country_code': 'US'
        }
        self.location = FulfillmentLocation.objects.create(**self.location_data)

    def test_create_location(self):
        self.assertEqual(self.location.name, self.location_data['name'])
        self.assertEqual(self.location.location_type, self.location_data['location_type'])
        self.assertTrue(self.location.is_active)

    def test_location_str(self):
        self.assertEqual(str(self.location), self.location_data['name'])

class ProductTests(TestCase):
    def setUp(self):
        self.product_data = {
            'sku': 'TEST-SKU-001',
            'name': 'Test Product',
            'description': 'Test Description',
            'is_serialized': True,
            'is_lotted': False
        }
        self.product = Product.objects.create(**self.product_data)

    def test_create_product(self):
        self.assertEqual(self.product.sku, self.product_data['sku'])
        self.assertEqual(self.product.name, self.product_data['name'])
        self.assertTrue(self.product.is_active)

    def test_product_str(self):
        expected = f"{self.product_data['name']} ({self.product_data['sku']})"
        self.assertEqual(str(self.product), expected)

class InventoryTests(TestCase):
    def setUp(self):
        self.location = FulfillmentLocation.objects.create(
            name='Test Warehouse',
            location_type='WAREHOUSE'
        )
        self.product = Product.objects.create(
            sku='TEST-SKU-001',
            name='Test Product'
        )
        self.inventory = Inventory.objects.create(
            product=self.product,
            location=self.location,
            stock_quantity=100,
            reserved_quantity=20
        )

    def test_create_inventory(self):
        self.assertEqual(self.inventory.stock_quantity, 100)
        self.assertEqual(self.inventory.reserved_quantity, 20)
        self.assertEqual(self.inventory.available_to_promise, 80)

    def test_unique_together_constraint(self):
        with self.assertRaises(Exception):
            Inventory.objects.create(
                product=self.product,
                location=self.location
            )

class InventoryAdjustmentTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.location = FulfillmentLocation.objects.create(
            name='Test Warehouse',
            location_type='WAREHOUSE'
        )
        self.product = Product.objects.create(
            sku='TEST-SKU-001',
            name='Test Product'
        )
        self.inventory = Inventory.objects.create(
            product=self.product,
            location=self.location,
            stock_quantity=100
        )
        self.reason = AdjustmentReason.objects.create(
            name='Test Adjustment',
            description='Test adjustment reason'
        )
        self.adjustment = InventoryAdjustment.objects.create(
            inventory=self.inventory,
            user=self.user,
            adjustment_type='ADDITION',
            quantity_change=50,
            reason=self.reason,
            new_stock_quantity=150
        )

    def test_create_adjustment(self):
        self.assertEqual(self.adjustment.inventory, self.inventory)
        self.assertEqual(self.adjustment.user, self.user)
        self.assertEqual(self.adjustment.quantity_change, 50)
        self.assertEqual(self.adjustment.new_stock_quantity, 150)

    def test_adjustment_str(self):
        expected = f"ADDITION of 50 units for {self.inventory} ({self.reason})"
        self.assertEqual(str(self.adjustment), expected)

class SerializedInventoryTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.location = FulfillmentLocation.objects.create(
            name='Test Warehouse',
            location_type='WAREHOUSE'
        )
        self.product = Product.objects.create(
            sku='TEST-SERIAL-001',
            name='Test Serialized Product',
            is_serialized=True
        )
        self.inventory = Inventory.objects.create(
            product=self.product,
            location=self.location,
            stock_quantity=10
        )

    def test_create_serial_number(self):
        serial = SerializedInventory.objects.create(
            product=self.product,
            location=self.location,
            inventory_record=self.inventory,
            serial_number='SN001',
            last_modified_by=self.user
        )
        self.assertEqual(serial.status, SerialNumberStatus.AVAILABLE)
        self.assertEqual(str(serial), f"{self.product.name} - SN: SN001 @ {self.location.name} (AVAILABLE)")

    def test_unique_serial_per_product(self):
        serial = SerializedInventory.objects.create(
            product=self.product,
            location=self.location,
            serial_number='SN001'
        )
        with self.assertRaises(ValidationError):
            serial2 = SerializedInventory(
                product=self.product,
                location=self.location,
                serial_number='SN001'
            )
            serial2.full_clean()

    def test_non_serialized_product_validation(self):
        non_serial_product = Product.objects.create(
            sku='TEST-NONSERIAL-001',
            name='Non-Serialized Product',
            is_serialized=False
        )
        with self.assertRaises(ValidationError):
            SerializedInventory.objects.create(
                product=non_serial_product,
                location=self.location,
                serial_number='SN001'
            )

    def test_inventory_record_validation(self):
        other_location = FulfillmentLocation.objects.create(
            name='Other Warehouse',
            location_type='WAREHOUSE'
        )
        other_inventory = Inventory.objects.create(
            product=self.product,
            location=other_location,
            stock_quantity=5
        )
        with self.assertRaises(ValidationError):
            SerializedInventory.objects.create(
                product=self.product,
                location=self.location,
                inventory_record=other_inventory,
                serial_number='SN001'
            )

    def test_status_change(self):
        serial = SerializedInventory.objects.create(
            product=self.product,
            location=self.location,
            serial_number='SN001'
        )
        self.assertEqual(serial.status, SerialNumberStatus.AVAILABLE)
        
        serial.status = SerialNumberStatus.RESERVED
        serial.save()
        self.assertEqual(serial.status, SerialNumberStatus.RESERVED)

    def test_product_serialized_lotted_validation(self):
        with self.assertRaises(ValidationError):
            Product.objects.create(
                sku='TEST-INVALID-001',
                name='Invalid Product',
                is_serialized=True,
                is_lotted=True
            )
