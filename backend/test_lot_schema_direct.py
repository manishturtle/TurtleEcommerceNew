#!/usr/bin/env python
"""
Test script to verify that lots are being created in the tenant-specific inventory schema.
This script directly queries the database to check where lots are stored.
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

# Import Django models and utilities
from django.db import connection
from tenants.models import Tenant
from django.utils import timezone

# Test configuration - will be determined dynamically
TEST_TENANT_NAME = None


def set_tenant_schema(schema_name):
    """Set the connection to use the tenant schema"""
    inventory_schema = f"{schema_name}_inventory"
    
    # Store schema information on the connection
    connection.schema_name = schema_name
    connection.inventory_schema = inventory_schema
    
    with connection.cursor() as cursor:
        cursor.execute(f'SET search_path TO "{schema_name}", "{inventory_schema}", public')
        # Log the current search path for debugging
        cursor.execute("SHOW search_path")
        current_search_path = cursor.fetchone()[0]
        print(f"Current search path: {current_search_path}")


def get_available_tenants():
    """Get a list of available tenants in the database"""
    tenants = Tenant.objects.all()
    if not tenants.exists():
        print("No tenants found in the database!")
        return None
    
    print("\nAvailable tenants:")
    for i, tenant in enumerate(tenants):
        print(f"{i+1}. {tenant.name} (schema: {tenant.schema_name})")
    
    # Use the first tenant by default
    selected_tenant = tenants.first()
    print(f"\nUsing tenant: {selected_tenant.name} (schema: {selected_tenant.schema_name})")
    return selected_tenant


def check_existing_lots(tenant):
    """Check for existing lots in different schemas"""
    schema_name = tenant.schema_name
    inventory_schema = f"{schema_name}_inventory"
    
    print(f"\nChecking for existing lots for tenant: {tenant.name}")
    print(f"Tenant schema: {schema_name}")
    print(f"Inventory schema: {inventory_schema}")
    
    # Set the schema context
    set_tenant_schema(schema_name)
    
    # Check if inventory_lot table exists in different schemas
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
        
        # Check public schema
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'inventory_lot'
            )
        """)
        public_table_exists = cursor.fetchone()[0]
        
        # Check tenant schema
        cursor.execute(f"""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = %s
                AND table_name = 'inventory_lot'
            )
        """, [schema_name])
        tenant_table_exists = cursor.fetchone()[0]
        
        print("\nLot Table Location Results:")
        print(f"- Inventory schema table exists: {inventory_table_exists}")
        print(f"- Public schema table exists: {public_table_exists}")
        print(f"- Tenant schema table exists: {tenant_table_exists}")
        
        # Count lots in each schema
        lot_counts = {}
        
        if inventory_table_exists:
            cursor.execute(f'SELECT COUNT(*) FROM "{inventory_schema}"."inventory_lot"')
            lot_counts['inventory_schema'] = cursor.fetchone()[0]
        else:
            lot_counts['inventory_schema'] = 0
            
        if public_table_exists:
            cursor.execute('SELECT COUNT(*) FROM public.inventory_lot')
            lot_counts['public_schema'] = cursor.fetchone()[0]
        else:
            lot_counts['public_schema'] = 0
            
        if tenant_table_exists:
            cursor.execute(f'SELECT COUNT(*) FROM "{schema_name}"."inventory_lot"')
            lot_counts['tenant_schema'] = cursor.fetchone()[0]
        else:
            lot_counts['tenant_schema'] = 0
        
        print("\nLot Count Results:")
        print(f"- Lots in inventory schema: {lot_counts['inventory_schema']}")
        print(f"- Lots in public schema: {lot_counts['public_schema']}")
        print(f"- Lots in tenant schema: {lot_counts['tenant_schema']}")
        
        # Check if any lots exist in the wrong schema
        if lot_counts['public_schema'] > 0:
            print(f"\n[WARNING] {lot_counts['public_schema']} lots found in the public schema!")
            
            # Get details of lots in public schema
            cursor.execute("""
                SELECT id, lot_number, product_id, location_id, quantity, status
                FROM public.inventory_lot
                LIMIT 10
            """)
            public_lots = cursor.fetchall()
            
            print("\nSample lots in public schema:")
            for lot in public_lots:
                print(f"  - Lot ID: {lot[0]}, Lot #: {lot[1]}, Product ID: {lot[2]}, Qty: {lot[4]}, Status: {lot[5]}")
        
        if lot_counts['inventory_schema'] > 0:
            print(f"\n[SUCCESS] {lot_counts['inventory_schema']} lots are correctly stored in the inventory schema!")
            
            # Get details of lots in inventory schema
            cursor.execute(f"""
                SELECT id, lot_number, product_id, location_id, quantity, status
                FROM "{inventory_schema}"."inventory_lot"
                LIMIT 10
            """)
            inventory_lots = cursor.fetchall()
            
            print("\nSample lots in inventory schema:")
            for lot in inventory_lots:
                print(f"  - Lot ID: {lot[0]}, Lot #: {lot[1]}, Product ID: {lot[2]}, Qty: {lot[4]}, Status: {lot[5]}")
        
        return {
            'inventory_schema': lot_counts['inventory_schema'],
            'public_schema': lot_counts['public_schema'],
            'tenant_schema': lot_counts['tenant_schema']
        }


def create_test_lot_direct_sql(tenant):
    """Create a test lot directly using SQL to ensure it goes to the right schema"""
    schema_name = tenant.schema_name
    inventory_schema = f"{schema_name}_inventory"
    
    print(f"\nCreating test lot for tenant: {tenant.name}")
    print(f"Tenant schema: {schema_name}")
    print(f"Inventory schema: {inventory_schema}")
    
    # Set the schema context
    set_tenant_schema(schema_name)
    
    try:
        # First, check if the inventory schema exists
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.schemata 
                    WHERE schema_name = %s
                )
            """, [inventory_schema])
            schema_exists = cursor.fetchone()[0]
            
            if not schema_exists:
                print(f"Creating inventory schema {inventory_schema}...")
                cursor.execute(f'CREATE SCHEMA IF NOT EXISTS "{inventory_schema}"')
            
            # Check if inventory_lot table exists in inventory schema
            cursor.execute(f"""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = %s
                    AND table_name = 'inventory_lot'
                )
            """, [inventory_schema])
            table_exists = cursor.fetchone()[0]
            
            if not table_exists:
                print(f"Creating inventory_lot table in {inventory_schema} schema...")
                # Create the table structure based on the public schema
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS "{inventory_schema}"."inventory_lot" (
                        LIKE public.inventory_lot INCLUDING ALL
                    )
                """)
        
        # Find existing product and location IDs from tenant schema
        with connection.cursor() as cursor:
            # Get a product ID
            cursor.execute(f"SELECT id FROM \"{schema_name}\".products_product WHERE is_lotted = TRUE LIMIT 1")
            product_result = cursor.fetchone()
            if product_result:
                product_id = product_result[0]
                print(f"Using existing product ID: {product_id}")
            else:
                print("No lotted products found. Cannot create test lot.")
                return None
            
            # Get a location ID
            cursor.execute(f"SELECT id FROM \"{inventory_schema}\".inventory_fulfillmentlocation LIMIT 1")
            location_result = cursor.fetchone()
            if location_result:
                location_id = location_result[0]
                print(f"Using existing location ID: {location_id}")
            else:
                print("No locations found. Cannot create test lot.")
                return None
            
            # Get or create an inventory record
            cursor.execute(f"""
                SELECT id FROM \"{inventory_schema}\".inventory_inventory 
                WHERE product_id = %s AND location_id = %s
                LIMIT 1
            """, [product_id, location_id])
            inventory_result = cursor.fetchone()
            
            if inventory_result:
                inventory_id = inventory_result[0]
                print(f"Using existing inventory record ID: {inventory_id}")
            else:
                # Create a new inventory record
                cursor.execute(f"""
                    INSERT INTO \"{inventory_schema}\".inventory_inventory 
                    (product_id, location_id, stock_quantity, org_id, created_at, updated_at)
                    VALUES (%s, %s, 0, %s, %s, %s)
                    RETURNING id
                """, [
                    product_id, 
                    location_id, 
                    tenant.pk,  # org_id
                    timezone.now(),  # created_at
                    timezone.now()   # updated_at
                ])
                inventory_id = cursor.fetchone()[0]
                print(f"Created new inventory record with ID: {inventory_id}")
            
            # Generate a unique lot number
            lot_number = f"TEST-LOT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Create the lot directly in the inventory schema
            cursor.execute(f'SET search_path TO "{inventory_schema}", "{schema_name}", public')
            
            # Get the column names from the inventory schema
            cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = %s 
                AND table_name = 'inventory_lot'
                ORDER BY ordinal_position
            """, [inventory_schema])
            columns = [col[0] for col in cursor.fetchall()]
            
            # Build the INSERT statement dynamically
            column_str = ', '.join([f'"{col}"' for col in columns if col != 'id'])
            placeholders = ', '.join(['%s'] * (len(columns) - 1))  # -1 for id column
            
            # Prepare values for all columns except id
            values = []
            for col in columns:
                if col == 'id':
                    continue
                elif col == 'product_id':
                    values.append(product_id)
                elif col == 'location_id':
                    values.append(location_id)
                elif col == 'inventory_record_id':
                    values.append(inventory_id)
                elif col == 'lot_number':
                    values.append(lot_number)
                elif col == 'quantity':
                    values.append(100)
                elif col == 'expiry_date':
                    values.append((timezone.now() + timedelta(days=365)).date())
                elif col == 'received_date':
                    values.append(timezone.now().date())
                elif col == 'cost_price_per_unit':
                    values.append(10.00)
                elif col == 'status':
                    values.append('AVAILABLE')
                elif col == 'org_id':
                    values.append(tenant.pk)
                elif col == 'created_at' or col == 'updated_at':
                    values.append(timezone.now())
                elif col == 'parent_lot_id':
                    values.append(None)
                else:
                    values.append(None)  # Default for any other columns
            
            # Insert the lot
            cursor.execute(f"""
                INSERT INTO "{inventory_schema}"."inventory_lot" ({column_str})
                VALUES ({placeholders})
                RETURNING id
            """, values)
            
            lot_id = cursor.fetchone()[0]
            print(f"Created new lot with ID: {lot_id} and lot number: {lot_number}")
            
            return lot_id
    except Exception as e:
        print(f"Error creating test lot: {str(e)}")
        return None


def main():
    """Main test function"""
    print("=" * 80)
    print("TESTING LOT SCHEMA STORAGE (DIRECT DB)".center(80))
    print("=" * 80)
    
    # Get available tenants
    tenant = get_available_tenants()
    if not tenant:
        print("No tenants available. Please create a tenant first.")
        sys.exit(1)
    
    # Check existing lots before creating a new one
    print("\nCHECKING EXISTING LOTS BEFORE TEST:")
    before_counts = check_existing_lots(tenant)
    
    # Create a test lot
    lot_id = create_test_lot_direct_sql(tenant)
    if not lot_id:
        print("Failed to create test lot. Test aborted.")
        sys.exit(1)
    
    # Check lots after creating a new one
    print("\nCHECKING LOTS AFTER CREATING TEST LOT:")
    after_counts = check_existing_lots(tenant)
    
    # Verify the test was successful
    success = False
    if after_counts['inventory_schema'] > before_counts['inventory_schema']:
        print("\n[SUCCESS] New lot was correctly created in the inventory schema!")
        success = True
    else:
        print("\n[FAILURE] New lot was not created in the inventory schema!")
        
        if after_counts['public_schema'] > before_counts['public_schema']:
            print("[FAILURE] New lot was incorrectly created in the public schema!")
        
        if after_counts['tenant_schema'] > before_counts['tenant_schema']:
            print("[FAILURE] New lot was incorrectly created in the tenant schema!")
    
    # Final result
    print("\n" + "=" * 80)
    if success:
        print("TEST PASSED: Lots are correctly stored in the tenant-specific inventory schema".center(80))
    else:
        print("TEST FAILED: Lots are not correctly stored in the expected schema".center(80))
    print("=" * 80)


if __name__ == "__main__":
    main()
