from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from inventory.models import (
    FulfillmentLocation,
    Product,
    Inventory,
    InventoryAdjustment,
    AdjustmentReason
)
from inventory.serializers import (
    FulfillmentLocationSerializer,
    ProductSerializer,
    InventorySerializer,
    InventoryAdjustmentSerializer
)

User = get_user_model()

class FulfillmentLocationSerializerTests(TestCase):
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

    def test_serializer_with_valid_data(self):
        serializer = FulfillmentLocationSerializer(data=self.location_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_with_invalid_type(self):
        invalid_data = self.location_data.copy()
        invalid_data['location_type'] = 'INVALID'
        serializer = FulfillmentLocationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())

class ProductSerializerTests(TestCase):
    def setUp(self):
        self.product_data = {
            'sku': 'TEST-SKU-001',
            'name': 'Test Product',
            'description': 'Test Description',
            'is_serialized': True,
            'is_lotted': False
        }

    def test_serializer_with_valid_data(self):
        serializer = ProductSerializer(data=self.product_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_with_duplicate_sku(self):
        Product.objects.create(**self.product_data)
        serializer = ProductSerializer(data=self.product_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('sku', serializer.errors)

class InventorySerializerTests(TestCase):
    def setUp(self):
        self.location = FulfillmentLocation.objects.create(
            name='Test Warehouse',
            location_type='WAREHOUSE'
        )
        self.product = Product.objects.create(
            sku='TEST-SKU-001',
            name='Test Product'
        )
        self.inventory_data = {
            'product_id': self.product.id,
            'location_id': self.location.id,
            'stock_quantity': 100,
            'reserved_quantity': 20,
            'low_stock_threshold': 10
        }

    def test_serializer_with_valid_data(self):
        serializer = InventorySerializer(data=self.inventory_data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_read_only_fields(self):
        inventory = Inventory.objects.create(
            product=self.product,
            location=self.location,
            stock_quantity=100,
            reserved_quantity=20
        )
        serializer = InventorySerializer(inventory)
        self.assertIn('available_to_promise', serializer.data)
        self.assertEqual(serializer.data['available_to_promise'], 80)

class InventoryAdjustmentSerializerTests(TestCase):
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
        self.adjustment_data = {
            'inventory_id': self.inventory.id,
            'adjustment_type': 'ADD',
            'quantity_change': 50,
            'reason_id': self.reason.id
        }
        self.factory = APIRequestFactory()
        self.request = self.factory.post('/fake-url/')
        self.request.user = self.user

    def test_serializer_with_valid_data(self):
        serializer = InventoryAdjustmentSerializer(
            data=self.adjustment_data,
            context={'request': self.request}
        )
        valid = serializer.is_valid()
        print("Validation errors:", serializer.errors)
        print("Input data:", self.adjustment_data)
        self.assertTrue(valid, f"Validation failed: {serializer.errors}")

    def test_serializer_read_only_fields(self):
        adjustment = InventoryAdjustment.objects.create(
            inventory=self.inventory,
            user=self.user,
            adjustment_type='ADD',
            quantity_change=50,
            reason=self.reason,
            new_stock_quantity=150
        )
        serializer = InventoryAdjustmentSerializer(adjustment)
        self.assertIn('new_stock_quantity', serializer.data)
        self.assertEqual(serializer.data['new_stock_quantity'], 150)
