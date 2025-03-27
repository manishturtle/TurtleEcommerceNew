#!/usr/bin/env python
"""
Test script to verify that lots are being created in the tenant-specific inventory schema.
This script makes API calls to add lots and then verifies the schema where they were created.
"""
import os
import sys
import django
import json
import requests
from datetime import datetime, timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

# Import Django models and utilities
from django.db import connection
from inventory.models import Inventory, Lot, Product
from tenants.models import Tenant

# Test configuration
API_BASE_URL = "http://localhost:8000/api/v1"
TENANT_DOMAIN = "tenant1.localhost"  # Replace with your test tenant domain
ADMIN_USERNAME = "admin"  # Replace with your admin username
ADMIN_PASSWORD = "admin"  # Replace with your admin password


def get_auth_token():
    """Get authentication token for API calls"""
    url = f"{API_BASE_URL}/auth/token/"
    response = requests.post(
        url,
        data={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
        headers={"Host": TENANT_DOMAIN}
    )
    if response.status_code == 200:
        return response.json().get("access")
    else:
        print(f"Auth failed: {response.status_code} - {response.text}")
        sys.exit(1)


def get_inventory_records(token):
    """Get inventory records to use for testing"""
    url = f"{API_BASE_URL}/inventory/"
    response = requests.get(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Host": TENANT_DOMAIN
        }
    )
    if response.status_code == 200:
        data = response.json()
        if data.get("results") and len(data["results"]) > 0:
            return data["results"]
        else:
            print("No inventory records found. Please create some inventory first.")
            sys.exit(1)
    else:
        print(f"Failed to get inventory: {response.status_code} - {response.text}")
        sys.exit(1)


def add_lot_via_api(token, inventory_id):
    """Add a lot via the API and return the response"""
    url = f"{API_BASE_URL}/inventory/{inventory_id}/add-lot/"
    
    # Generate unique lot number based on timestamp
    lot_number = f"TEST-LOT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Set expiry date to 1 year from now
    expiry_date = (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')
    
    payload = {
        "lot_number": lot_number,
        "quantity": 100,
        "expiry_date": expiry_date,
        "cost_price_per_unit": "10.00"
    }
    
    print(f"Adding lot {lot_number} to inventory {inventory_id}...")
    
    response = requests.post(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Host": TENANT_DOMAIN
        }
    )
    
    print(f"API Response: {response.status_code}")
    if response.status_code == 200:
        lot_data = response.json()
        print(f"Lot created: {json.dumps(lot_data, indent=2)}")
        return lot_data
    else:
        print(f"Failed to add lot: {response.status_code} - {response.text}")
        return None


def set_tenant_schema(schema_name):
    """Set the connection to use the tenant schema"""
    with connection.cursor() as cursor:
        inventory_schema = f"{schema_name}_inventory"
        cursor.execute(f'SET search_path TO "{schema_name}", "{inventory_schema}", public')


def verify_lot_schema(lot_id):
    """Verify which schema the lot was created in using direct database queries"""
    # Get the tenant and inventory schema
    tenant = Tenant.objects.get(domain_name=TENANT_DOMAIN)
    schema_name = tenant.schema_name
    inventory_schema = f"{schema_name}_inventory"
    
    # Set connection to use the tenant schema
    set_tenant_schema(schema_name)
    
    print(f"\nVerifying lot {lot_id} schema location...")
    print(f"Tenant schema: {schema_name}")
    print(f"Inventory schema: {inventory_schema}")
    
    # Check if lot exists in inventory schema
    with connection.cursor() as cursor:
        # Check inventory schema
        cursor.execute(f"""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = %s
                AND table_name = 'inventory_lot'
            )
        """, [inventory_schema])
        inventory_table_exists = cursor.fetchone()[0]
        
        if not inventory_table_exists:
            print(f"WARNING: inventory_lot table does not exist in {inventory_schema} schema!")
            return False
        
        # Check if lot exists in inventory schema
        cursor.execute(f"""
            SELECT EXISTS (
                SELECT 1 FROM "{inventory_schema}"."inventory_lot"
                WHERE id = %s
            )
        """, [lot_id])
        exists_in_inventory_schema = cursor.fetchone()[0]
        
        # Check if lot exists in public schema
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'inventory_lot'
            )
        """)
        public_table_exists = cursor.fetchone()[0]
        
        if public_table_exists:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM public.inventory_lot
                    WHERE id = %s
                )
            """, [lot_id])
            exists_in_public = cursor.fetchone()[0]
        else:
            exists_in_public = False
        
        # Check if lot exists in tenant schema
        cursor.execute(f"""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = %s
                AND table_name = 'inventory_lot'
            )
        """, [schema_name])
        tenant_table_exists = cursor.fetchone()[0]
        
        if tenant_table_exists:
            cursor.execute(f"""
                SELECT EXISTS (
                    SELECT 1 FROM "{schema_name}"."inventory_lot"
                    WHERE id = %s
                )
            """, [lot_id])
            exists_in_tenant_schema = cursor.fetchone()[0]
        else:
            exists_in_tenant_schema = False
    
    # Print results
    print("\nLot Schema Location Results:")
    print(f"✓ Inventory schema table exists: {inventory_table_exists}")
    print(f"✓ Lot exists in inventory schema: {exists_in_inventory_schema}")
    print(f"✓ Public schema table exists: {public_table_exists}")
    print(f"✓ Lot exists in public schema: {exists_in_public}")
    print(f"✓ Tenant schema table exists: {tenant_table_exists}")
    print(f"✓ Lot exists in tenant schema: {exists_in_tenant_schema}")
    
    # Determine success
    if exists_in_inventory_schema and not exists_in_public and not exists_in_tenant_schema:
        print("\n✅ SUCCESS: Lot is correctly stored in the inventory schema!")
        return True
    else:
        if exists_in_public:
            print("\n❌ FAILURE: Lot is incorrectly stored in the public schema!")
        if exists_in_tenant_schema:
            print("\n❌ FAILURE: Lot is incorrectly stored in the tenant schema!")
        if not exists_in_inventory_schema:
            print("\n❌ FAILURE: Lot is not stored in the inventory schema!")
        return False


def main():
    """Main test function"""
    print("=" * 80)
    print("TESTING LOT SCHEMA STORAGE".center(80))
    print("=" * 80)
    
    # Get auth token
    token = get_auth_token()
    print(f"Authenticated successfully")
    
    # Get inventory records
    inventory_records = get_inventory_records(token)
    print(f"Found {len(inventory_records)} inventory records")
    
    # Select first inventory record with a lotted product
    inventory_id = None
    for record in inventory_records:
        if record.get("product", {}).get("is_lotted", False):
            inventory_id = record["id"]
            print(f"Selected inventory {inventory_id} for product {record['product']['name']}")
            break
    
    if not inventory_id:
        print("No inventory records with lotted products found. Please create one first.")
        sys.exit(1)
    
    # Add a lot via API
    lot_data = add_lot_via_api(token, inventory_id)
    if not lot_data:
        print("Failed to add lot. Test aborted.")
        sys.exit(1)
    
    # Verify lot schema
    lot_id = lot_data["id"]
    success = verify_lot_schema(lot_id)
    
    # Final result
    print("\n" + "=" * 80)
    if success:
        print("TEST PASSED: Lots are correctly stored in the tenant-specific inventory schema".center(80))
    else:
        print("TEST FAILED: Lots are not correctly stored in the expected schema".center(80))
    print("=" * 80)


if __name__ == "__main__":
    main()
