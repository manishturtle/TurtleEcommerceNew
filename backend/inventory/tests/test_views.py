"""
Tests for inventory views and API endpoints.
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from decimal import Decimal

from inventory.models import (
    Inventory, 
    AdjustmentReason, 
    InventoryAdjustment,
    FulfillmentLocation
)
from products.models import Product

User = get_user_model()

class InventoryAdjustmentViewSetTests(TestCase):
    """Test cases for the InventoryAdjustmentViewSet."""
    
    def setUp(self):
        """Set up test data."""
        # Create a test admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpassword',
            is_staff=True,
            is_superuser=True
        )
        
        # Create a regular user (should not have access)
        self.regular_user = User.objects.create_user(
            username='regular',
            email='regular@example.com',
            password='regularpassword'
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
        
        # Set up API client
        self.client = APIClient()
    
    def test_create_adjustment_as_admin(self):
        """Test creating an inventory adjustment as an admin user."""
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Prepare adjustment data
        adjustment_data = {
            'inventory': self.inventory.id,
            'adjustment_type': 'ADD',
            'quantity_change': 10,
            'reason': self.reason.id,
            'notes': 'Test adjustment via API'
        }
        
        # Make the API request
        url = reverse('inventoryadjustment-list')
        response = self.client.post(url, adjustment_data, format='json')
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify adjustment was created
        self.assertEqual(InventoryAdjustment.objects.count(), 1)
        adjustment = InventoryAdjustment.objects.first()
        self.assertEqual(adjustment.adjustment_type, 'ADD')
        self.assertEqual(adjustment.quantity_change, 10)
        
        # Verify inventory was updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 110)
    
    def test_create_adjustment_as_regular_user(self):
        """Test creating an inventory adjustment as a regular user (should fail)."""
        # Authenticate as regular user
        self.client.force_authenticate(user=self.regular_user)
        
        # Prepare adjustment data
        adjustment_data = {
            'inventory': self.inventory.id,
            'adjustment_type': 'ADD',
            'quantity_change': 10,
            'reason': self.reason.id,
            'notes': 'Test adjustment via API'
        }
        
        # Make the API request
        url = reverse('inventoryadjustment-list')
        response = self.client.post(url, adjustment_data, format='json')
        
        # Check response (should be forbidden)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify no adjustment was created
        self.assertEqual(InventoryAdjustment.objects.count(), 0)
        
        # Verify inventory was not updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 100)
    
    def test_create_adjustment_unauthenticated(self):
        """Test creating an inventory adjustment without authentication (should fail)."""
        # No authentication
        
        # Prepare adjustment data
        adjustment_data = {
            'inventory': self.inventory.id,
            'adjustment_type': 'ADD',
            'quantity_change': 10,
            'reason': self.reason.id,
            'notes': 'Test adjustment via API'
        }
        
        # Make the API request
        url = reverse('inventoryadjustment-list')
        response = self.client.post(url, adjustment_data, format='json')
        
        # Check response (should be unauthorized)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Verify no adjustment was created
        self.assertEqual(InventoryAdjustment.objects.count(), 0)
        
        # Verify inventory was not updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 100)
    
    def test_create_adjustment_invalid_data(self):
        """Test creating an inventory adjustment with invalid data."""
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Prepare invalid adjustment data (negative quantity)
        adjustment_data = {
            'inventory': self.inventory.id,
            'adjustment_type': 'ADD',
            'quantity_change': -10,  # Invalid negative quantity
            'reason': self.reason.id,
            'notes': 'Test invalid adjustment via API'
        }
        
        # Make the API request
        url = reverse('inventoryadjustment-list')
        response = self.client.post(url, adjustment_data, format='json')
        
        # Check response (should be bad request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verify no adjustment was created
        self.assertEqual(InventoryAdjustment.objects.count(), 0)
        
        # Verify inventory was not updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 100)
    
    def test_create_adjustment_insufficient_stock(self):
        """Test creating a REMOVE adjustment with insufficient stock."""
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Prepare adjustment data with quantity higher than stock
        adjustment_data = {
            'inventory': self.inventory.id,
            'adjustment_type': 'SUB',
            'quantity_change': 200,  # More than available stock
            'reason': self.reason.id,
            'notes': 'Test insufficient stock adjustment via API'
        }
        
        # Make the API request
        url = reverse('inventoryadjustment-list')
        response = self.client.post(url, adjustment_data, format='json')
        
        # Check response (should be bad request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verify no adjustment was created
        self.assertEqual(InventoryAdjustment.objects.count(), 0)
        
        # Verify inventory was not updated
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.stock_quantity, 100)
    
    def test_list_adjustments_for_inventory(self):
        """Test listing adjustments for a specific inventory item."""
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Create a few adjustments
        for i in range(3):
            InventoryAdjustment.objects.create(
                inventory=self.inventory,
                user=self.admin_user,
                adjustment_type='ADD',
                quantity_change=5,
                reason=self.reason,
                notes=f'Test adjustment {i+1}',
                new_stock_quantity=self.inventory.stock_quantity + 5 * (i + 1)
            )
        
        # Make the API request to list adjustments for this inventory
        url = reverse('inventory-adjustments-list', kwargs={'inventory_pk': self.inventory.id})
        response = self.client.get(url)
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the correct number of adjustments is returned
        self.assertEqual(len(response.data['results']), 3)
    
    def test_list_adjustments_for_nonexistent_inventory(self):
        """Test listing adjustments for a nonexistent inventory item."""
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Make the API request with a non-existent inventory ID
        url = reverse('inventory-adjustments-list', kwargs={'inventory_pk': 999})
        response = self.client.get(url)
        
        # Check response (should be successful but empty)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify empty results
        self.assertEqual(len(response.data['results']), 0)
