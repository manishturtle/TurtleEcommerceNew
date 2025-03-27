import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

# Import models and services
from inventory.models import Inventory, SerializedInventory, SerialNumberStatus, Product, FulfillmentLocation
from inventory.services import (
    receive_serialized_item,
    update_serialized_status,
    find_available_serial_for_reservation,
    reserve_serialized_item,
    ship_serialized_item
)
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

def test_serialized_inventory_services():
    """
    Test the serialized inventory service functions.
    """
    print("Testing serialized inventory services...")
    
    # Get or create test data
    try:
        # Get the first user for testing
        user = User.objects.first()
        if not user:
            print("No users found in the database. Please create a user first.")
            return
        
        # Get or create a test product with serialized tracking
        product, created = Product.objects.get_or_create(
            sku="TEST-SERIAL-001",
            defaults={
                "name": "Test Serialized Product",
                "is_active": True,
                "is_serialized": True,  # Important: Product must be serialized
                "unit_cost": 100.00,
                "unit_price": 200.00
            }
        )
        if created:
            print(f"Created test product: {product.name}")
        else:
            # Ensure the product is marked as serialized
            if not product.is_serialized:
                product.is_serialized = True
                product.save()
                print(f"Updated product {product.name} to be serialized")
        
        # Get or create a test location
        location, created = FulfillmentLocation.objects.get_or_create(
            name="Test Warehouse",
            defaults={
                "location_type": "WAREHOUSE",
                "is_active": True
            }
        )
        if created:
            print(f"Created test location: {location.name}")
        
        # Get or create inventory record
        inventory, created = Inventory.objects.get_or_create(
            product=product,
            location=location,
            defaults={
                "stock_quantity": 0,
                "low_stock_threshold": 5
            }
        )
        if created:
            print(f"Created inventory record for {product.name} at {location.name}")
        
        # Test 1: Receive a serialized item
        print("\n1. Testing receive_serialized_item...")
        serial_number = "SN12345678"
        
        # Check if the serial number already exists
        existing_serial = SerializedInventory.objects.filter(serial_number=serial_number).first()
        if existing_serial:
            print(f"Serial number {serial_number} already exists with status: {existing_serial.status}")
        else:
            with transaction.atomic():
                serialized_item = receive_serialized_item(
                    user=user,
                    product=product,
                    location=location,
                    serial_number=serial_number,
                    notes="Test receipt"
                )
                print(f"Created serialized item with serial number: {serialized_item.serial_number}")
                print(f"Status: {serialized_item.status}")
                print(f"Received date: {serialized_item.received_date}")
        
        # Test 2: Update serialized status
        print("\n2. Testing update_serialized_status...")
        try:
            serialized_item = SerializedInventory.objects.get(serial_number=serial_number)
            updated_item = update_serialized_status(
                serialized_item=serialized_item,
                new_status=SerialNumberStatus.RESERVED,
                notes="Testing status update"
            )
            print(f"Updated status to: {updated_item.status}")
        except SerializedInventory.DoesNotExist:
            print(f"Serialized item with serial number {serial_number} not found")
        except Exception as e:
            print(f"Error updating status: {str(e)}")
        
        # Test 3: Find available serial for reservation
        print("\n3. Testing find_available_serial_for_reservation...")
        # Create another serialized item for testing
        another_serial = "SN87654321"
        try:
            with transaction.atomic():
                another_item = receive_serialized_item(
                    user=user,
                    product=product,
                    location=location,
                    serial_number=another_serial,
                    notes="Another test item"
                )
                print(f"Created another serialized item: {another_item.serial_number}")
        except Exception as e:
            print(f"Error creating another serialized item: {str(e)}")
            another_item = SerializedInventory.objects.filter(serial_number=another_serial).first()
            if another_item:
                print(f"Using existing serialized item: {another_item.serial_number}")
        
        available_serial = find_available_serial_for_reservation(inventory=inventory)
        if available_serial:
            print(f"Found available serial: {available_serial.serial_number}")
        else:
            print("No available serials found")
        
        # Test 4: Reserve serialized item
        print("\n4. Testing reserve_serialized_item...")
        if available_serial:
            try:
                reserved_item = reserve_serialized_item(
                    serialized_item=available_serial,
                    notes="Test reservation"
                )
                print(f"Reserved item: {reserved_item.serial_number}")
                print(f"Status: {reserved_item.status}")
            except Exception as e:
                print(f"Error reserving item: {str(e)}")
        
        # Test 5: Ship serialized item
        print("\n5. Testing ship_serialized_item...")
        # Get the first serialized item
        serialized_item = SerializedInventory.objects.filter(
            product=product,
            location=location
        ).first()
        
        if serialized_item:
            try:
                shipped_item = ship_serialized_item(
                    serialized_item=serialized_item,
                    notes="Test shipping"
                )
                print(f"Shipped item: {shipped_item.serial_number}")
                print(f"Status: {shipped_item.status}")
            except Exception as e:
                print(f"Error shipping item: {str(e)}")
        else:
            print("No serialized items found to ship")
        
        # Print summary of all serialized items
        print("\nSummary of all serialized items:")
        all_items = SerializedInventory.objects.filter(product=product)
        for item in all_items:
            print(f"Serial: {item.serial_number}, Status: {item.status}, Notes: {item.notes}")
        
    except Exception as e:
        print(f"Error during testing: {str(e)}")

if __name__ == "__main__":
    test_serialized_inventory_services()
