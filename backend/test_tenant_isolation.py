"""
Test script to verify tenant isolation works correctly.
This script creates two tenants and adds data to each,
then verifies that data is properly isolated between tenants.
"""
import os
import sys
import django
import logging

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from tenants.models import Tenant, Domain
from inventory.models import FulfillmentLocation, AdjustmentReason
from tenants.utils import tenant_context
from tenants.schema_utils import create_tenant_schema, migrate_tenant_apps
from django.db import connection
from django.core.management import call_command

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

User = get_user_model()

def create_test_tenants():
    """Create two test tenants with domains"""
    # Create admin user if it doesn't exist
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        logger.info("Created admin user")
    
    # Create tenant 1
    tenant1, created = Tenant.objects.get_or_create(
        name='Tenant One',
        schema_name='tenant_one',
        defaults={
            'owner': admin_user,
            'is_active': True
        }
    )
    if created:
        Domain.objects.create(
            tenant=tenant1,
            domain='tenant1.example.com',
            is_primary=True
        )
        logger.info(f"Created tenant: {tenant1.name}")
    
    # Create tenant 2
    tenant2, created = Tenant.objects.get_or_create(
        name='Tenant Two',
        schema_name='tenant_two',
        defaults={
            'owner': admin_user,
            'is_active': True
        }
    )
    if created:
        Domain.objects.create(
            tenant=tenant2,
            domain='tenant2.example.com',
            is_primary=True
        )
        logger.info(f"Created tenant: {tenant2.name}")
    
    return tenant1, tenant2

def create_tables_in_tenant_schema(schema_name):
    """Create necessary tables in the tenant schema"""
    logger.info(f"Creating tables in schema {schema_name}...")
    
    # Set the search path to the tenant schema
    with connection.cursor() as cursor:
        cursor.execute(f'SET search_path TO "{schema_name}", public')
    
    # Create FulfillmentLocation table
    with connection.cursor() as cursor:
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS "{schema_name}"."inventory_fulfillmentlocation" (
                "id" serial PRIMARY KEY,
                "name" varchar(100) NOT NULL,
                "location_type" varchar(50) NOT NULL,
                "address_line_1" varchar(255),
                "address_line_2" varchar(255),
                "city" varchar(100),
                "state_province" varchar(100),
                "postal_code" varchar(20),
                "is_active" boolean NOT NULL,
                "created_at" timestamp with time zone NOT NULL,
                "updated_at" timestamp with time zone NOT NULL,
                "org_id" integer NOT NULL
            )
        """)
    
    # Create AdjustmentReason table
    with connection.cursor() as cursor:
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS "{schema_name}"."inventory_adjustmentreason" (
                "id" serial PRIMARY KEY,
                "name" varchar(100) NOT NULL,
                "description" text,
                "is_active" boolean NOT NULL,
                "created_at" timestamp with time zone NOT NULL,
                "updated_at" timestamp with time zone NOT NULL,
                "org_id" integer NOT NULL,
                UNIQUE ("name", "org_id")
            )
        """)
    
    logger.info(f"Created tables in schema {schema_name}")

def create_tenant_data_with_sql(schema_name, location_name, reason_name):
    """Create test data for a tenant using direct SQL to ensure it's in the right schema"""
    logger.info(f"Creating data for schema {schema_name}...")
    
    with connection.cursor() as cursor:
        # Set the search path to the tenant schema
        cursor.execute(f'SET search_path TO "{schema_name}", public')
        
        # Create a fulfillment location
        cursor.execute(f"""
            INSERT INTO "{schema_name}"."inventory_fulfillmentlocation" 
            (name, location_type, address_line_1, city, state_province, postal_code, is_active, created_at, updated_at, org_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s)
            ON CONFLICT (id) DO NOTHING
            RETURNING id
        """, [
            location_name, 
            'WAREHOUSE', 
            f'123 Main St, {schema_name}', 
            f'City for {schema_name}',
            'State',
            '12345',
            True,
            1
        ])
        location_id = cursor.fetchone()
        if location_id:
            logger.info(f"Created location '{location_name}' in schema {schema_name}")
        
        # Create an adjustment reason
        cursor.execute(f"""
            INSERT INTO "{schema_name}"."inventory_adjustmentreason" 
            (name, description, is_active, created_at, updated_at, org_id)
            VALUES (%s, %s, %s, NOW(), NOW(), %s)
            ON CONFLICT (name, org_id) DO NOTHING
            RETURNING id
        """, [
            reason_name,
            f'Description for {schema_name}',
            True,
            1
        ])
        reason_id = cursor.fetchone()
        if reason_id:
            logger.info(f"Created reason '{reason_name}' in schema {schema_name}")

def clean_test_data_with_sql():
    """Clean up any existing test data using direct SQL"""
    logger.info("Cleaning up existing test data...")
    
    # Clean up in tenant schemas
    for schema_name in ['tenant_one', 'tenant_two']:
        try:
            # First check if the schema exists
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT schema_name 
                    FROM information_schema.schemata 
                    WHERE schema_name = %s
                """, [schema_name])
                
                if not cursor.fetchone():
                    logger.info(f"Schema {schema_name} does not exist, skipping cleanup")
                    continue
            
            # Check if tables exist before trying to delete from them
            with connection.cursor() as cursor:
                # Set search path to the tenant schema
                cursor.execute(f'SET search_path TO "{schema_name}", public')
                
                # Check if adjustment reason table exists
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = %s AND table_name = 'inventory_adjustmentreason'
                    )
                """, [schema_name])
                
                if cursor.fetchone()[0]:
                    cursor.execute(f"""
                        DELETE FROM "{schema_name}"."inventory_adjustmentreason" 
                        WHERE name IN ('Damaged Goods', 'Inventory Count')
                    """)
                
                # Check if fulfillment location table exists
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = %s AND table_name = 'inventory_fulfillmentlocation'
                    )
                """, [schema_name])
                
                if cursor.fetchone()[0]:
                    cursor.execute(f"""
                        DELETE FROM "{schema_name}"."inventory_fulfillmentlocation" 
                        WHERE name = 'Warehouse A'
                    """)
                
                logger.info(f"Cleaned up data in {schema_name} schema")
        except Exception as e:
            logger.error(f"Error cleaning up data in {schema_name}: {str(e)}")

def verify_tenant_isolation_with_sql():
    """Verify tenant isolation using direct SQL queries"""
    # Check tenant 1 data
    schema1 = 'tenant_one'
    logger.info(f"\nVerifying data in {schema1}:")
    
    with connection.cursor() as cursor:
        # Set search path to tenant 1 schema
        cursor.execute(f'SET search_path TO "{schema1}", public')
        
        # Check locations
        cursor.execute(f"""
            SELECT name FROM "{schema1}"."inventory_fulfillmentlocation"
        """)
        locations = [row[0] for row in cursor.fetchall()]
        logger.info(f"- Locations: {', '.join(locations) if locations else 'None'}")
        
        # Check reasons
        cursor.execute(f"""
            SELECT name FROM "{schema1}"."inventory_adjustmentreason"
        """)
        reasons = [row[0] for row in cursor.fetchall()]
        logger.info(f"- Adjustment Reasons: {', '.join(reasons) if reasons else 'None'}")
        
        # Check if tenant 2's data is visible
        cursor.execute(f"""
            SELECT COUNT(*) FROM "{schema1}"."inventory_adjustmentreason"
            WHERE name = 'Inventory Count'
        """)
        inventory_count_exists = cursor.fetchone()[0] > 0
        logger.info(f"- Can see 'Inventory Count' from tenant 2? {'Yes' if inventory_count_exists else 'No'}")
        
        if inventory_count_exists:
            logger.error("TENANT ISOLATION FAILED: Tenant 1 can see data from Tenant 2")
        else:
            logger.info("TENANT ISOLATION PASSED: Tenant 1 cannot see data from Tenant 2")
    
    # Check tenant 2 data
    schema2 = 'tenant_two'
    logger.info(f"\nVerifying data in {schema2}:")
    
    with connection.cursor() as cursor:
        # Set search path to tenant 2 schema
        cursor.execute(f'SET search_path TO "{schema2}", public')
        
        # Check locations
        cursor.execute(f"""
            SELECT name FROM "{schema2}"."inventory_fulfillmentlocation"
        """)
        locations = [row[0] for row in cursor.fetchall()]
        logger.info(f"- Locations: {', '.join(locations) if locations else 'None'}")
        
        # Check reasons
        cursor.execute(f"""
            SELECT name FROM "{schema2}"."inventory_adjustmentreason"
        """)
        reasons = [row[0] for row in cursor.fetchall()]
        logger.info(f"- Adjustment Reasons: {', '.join(reasons) if reasons else 'None'}")
        
        # Check if tenant 1's data is visible
        cursor.execute(f"""
            SELECT COUNT(*) FROM "{schema2}"."inventory_adjustmentreason"
            WHERE name = 'Damaged Goods'
        """)
        damaged_goods_exists = cursor.fetchone()[0] > 0
        logger.info(f"- Can see 'Damaged Goods' from tenant 1? {'Yes' if damaged_goods_exists else 'No'}")
        
        if damaged_goods_exists:
            logger.error("TENANT ISOLATION FAILED: Tenant 2 can see data from Tenant 1")
        else:
            logger.info("TENANT ISOLATION PASSED: Tenant 2 cannot see data from Tenant 1")

def test_tenant_isolation():
    """Test that data is properly isolated between tenants"""
    # Create test tenants
    tenant1, tenant2 = create_test_tenants()
    
    # Clean up existing test data
    clean_test_data_with_sql()
    
    # Ensure schemas exist
    for schema_name in ['tenant_one', 'tenant_two']:
        with connection.cursor() as cursor:
            cursor.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"')
            logger.info(f"Created schema: {schema_name}")
    
    # Create tables in tenant schemas
    create_tables_in_tenant_schema('tenant_one')
    create_tables_in_tenant_schema('tenant_two')
    
    # Create data in tenant 1
    create_tenant_data_with_sql('tenant_one', 'Warehouse A', 'Damaged Goods')
    
    # Create data in tenant 2 with the same location name
    create_tenant_data_with_sql('tenant_two', 'Warehouse A', 'Inventory Count')
    
    # Verify tenant isolation
    verify_tenant_isolation_with_sql()

if __name__ == "__main__":
    logger.info("Testing tenant isolation...")
    test_tenant_isolation()
    logger.info("\nTenant isolation test completed.")
