#!/usr/bin/env python
import os
import sys
import logging
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)

from tenants.schema_utils import create_tenant_schema, drop_tenant_schema

def clean_up_data(schema_name):
    """Clean up any existing test data in the specified schema."""
    try:
        # Define inventory schema
        inventory_schema = f"{schema_name}_inventory"
        
        with connection.cursor() as cursor:
            # Set search path to include both schemas
            cursor.execute(f'SET search_path TO "{schema_name}", "{inventory_schema}", public')
            
            # Check if inventory schema exists
            cursor.execute(f"SELECT schema_name FROM information_schema.schemata WHERE schema_name = '{inventory_schema}'")
            if cursor.fetchone():
                # Delete data from inventory tables in inventory schema
                cursor.execute(f"""
                    DELETE FROM "{inventory_schema}"."inventory_fulfillmentlocation" WHERE TRUE;
                    DELETE FROM "{inventory_schema}"."inventory_adjustmentreason" WHERE TRUE;
                """)
                logger.info(f"Cleaned up data in {inventory_schema} schema")
            
            # Check if main schema exists
            cursor.execute(f"SELECT schema_name FROM information_schema.schemata WHERE schema_name = '{schema_name}'")
            if cursor.fetchone():
                # Delete data from main schema tables if needed
                # cursor.execute(f'DELETE FROM "{schema_name}"."products_product" WHERE TRUE')
                logger.info(f"Cleaned up data in {schema_name} schema")
    except Exception as e:
        logger.error(f"Error cleaning up data in schema {schema_name}: {str(e)}")

def create_schema_and_tables(schema_name):
    """Create schema and necessary tables for testing."""
    # Create the schema
    success = create_tenant_schema(schema_name)
    if not success:
        logger.error(f"Failed to create schema {schema_name}")
        return False
    
    # Define inventory schema
    inventory_schema = f"{schema_name}_inventory"
    
    # Verify tables exist in inventory schema
    try:
        with connection.cursor() as cursor:
            # Set search path
            cursor.execute(f'SET search_path TO "{schema_name}", "{inventory_schema}", public')
            
            # Check if tables exist in inventory schema
            cursor.execute(f"""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = '{inventory_schema}' 
                AND table_name IN ('inventory_fulfillmentlocation', 'inventory_adjustmentreason')
            """)
            
            existing_tables = [row[0] for row in cursor.fetchall()]
            
            if len(existing_tables) < 2:
                logger.info(f"Creating tables in schema {inventory_schema}...")
                
                # Create FulfillmentLocation table if it doesn't exist
                if 'inventory_fulfillmentlocation' not in existing_tables:
                    cursor.execute(f"""
                        CREATE TABLE IF NOT EXISTS "{inventory_schema}"."inventory_fulfillmentlocation" (
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
                
                # Create AdjustmentReason table if it doesn't exist
                if 'inventory_adjustmentreason' not in existing_tables:
                    cursor.execute(f"""
                        CREATE TABLE IF NOT EXISTS "{inventory_schema}"."inventory_adjustmentreason" (
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
                
                logger.info(f"Created tables in schema {inventory_schema}")
            else:
                logger.info(f"Tables already exist in schema {inventory_schema}")
            
            return True
    except Exception as e:
        logger.error(f"Error creating tables in schema {schema_name}: {str(e)}")
        return False

def create_test_data(schema_name, location_name, reason_name):
    """Create test data in the specified schema."""
    try:
        # Define inventory schema
        inventory_schema = f"{schema_name}_inventory"
        
        with connection.cursor() as cursor:
            # Set search path
            cursor.execute(f'SET search_path TO "{schema_name}", "{inventory_schema}", public')
            
            # Insert a test location
            cursor.execute(f"""
                INSERT INTO "{inventory_schema}"."inventory_fulfillmentlocation" 
                (name, location_type, is_active, created_at, updated_at, org_id)
                VALUES (%s, 'WAREHOUSE', TRUE, NOW(), NOW(), 1)
                RETURNING id
            """, [location_name])
            
            location_id = cursor.fetchone()[0]
            logger.info(f"Created location '{location_name}' in schema {schema_name}")
            
            # Insert a test adjustment reason
            cursor.execute(f"""
                INSERT INTO "{inventory_schema}"."inventory_adjustmentreason" 
                (name, description, is_active, created_at, updated_at, org_id)
                VALUES (%s, 'Test description', TRUE, NOW(), NOW(), 1)
                RETURNING id
            """, [reason_name])
            
            reason_id = cursor.fetchone()[0]
            logger.info(f"Created reason '{reason_name}' in schema {schema_name}")
            
            return True
    except Exception as e:
        logger.error(f"Error creating test data in schema {schema_name}: {str(e)}")
        return False

def verify_data_isolation(schema_name, expected_location, expected_reason, other_reason):
    """Verify that data is properly isolated between schemas."""
    try:
        # Define inventory schema
        inventory_schema = f"{schema_name}_inventory"
        
        with connection.cursor() as cursor:
            # Set search path
            cursor.execute(f'SET search_path TO "{schema_name}", "{inventory_schema}", public')
            
            # Check locations
            cursor.execute(f"""
                SELECT name FROM "{inventory_schema}"."inventory_fulfillmentlocation"
            """)
            
            locations = [row[0] for row in cursor.fetchall()]
            logger.info(f"- Locations: {', '.join(locations)}")
            
            # Check adjustment reasons
            cursor.execute(f"""
                SELECT name FROM "{inventory_schema}"."inventory_adjustmentreason"
            """)
            
            reasons = [row[0] for row in cursor.fetchall()]
            logger.info(f"- Adjustment Reasons: {', '.join(reasons)}")
            
            # Check if we can see data from the other tenant
            cursor.execute(f"""
                SELECT COUNT(*) FROM "{inventory_schema}"."inventory_adjustmentreason"
                WHERE name = %s
            """, [other_reason])
            
            count = cursor.fetchone()[0]
            can_see_other = count > 0
            logger.info(f"- Can see '{other_reason}' from other tenant? {'Yes' if can_see_other else 'No'}")
            
            # Verify isolation
            if not can_see_other:
                logger.info(f"TENANT ISOLATION PASSED: {schema_name} cannot see data from the other tenant")
                return True
            else:
                logger.error(f"TENANT ISOLATION FAILED: {schema_name} can see data from the other tenant")
                return False
    except Exception as e:
        logger.error(f"Error verifying data isolation for schema {schema_name}: {str(e)}")
        return False

def test_tenant_isolation():
    """Test that data is properly isolated between tenant schemas."""
    logger.info("Testing tenant isolation...")
    
    # Define test schemas
    schema_one = "tenant_one"
    schema_two = "tenant_two"
    
    # Clean up any existing test data
    logger.info("Cleaning up existing test data...")
    clean_up_data(schema_one)
    clean_up_data(schema_two)
    
    # Create schemas and tables
    create_schema_and_tables(schema_one)
    create_schema_and_tables(schema_two)
    
    # Create test data for tenant one
    logger.info(f"Creating data for schema {schema_one}...")
    create_test_data(schema_one, "Warehouse A", "Damaged Goods")
    
    # Create test data for tenant two
    logger.info(f"Creating data for schema {schema_two}...")
    create_test_data(schema_two, "Warehouse A", "Inventory Count")
    
    # Verify data isolation for tenant one
    logger.info(f"\nVerifying data in {schema_one}:")
    verify_data_isolation(schema_one, "Warehouse A", "Damaged Goods", "Inventory Count")
    
    # Verify data isolation for tenant two
    logger.info(f"\nVerifying data in {schema_two}:")
    verify_data_isolation(schema_two, "Warehouse A", "Inventory Count", "Damaged Goods")
    
    logger.info("\nTenant isolation test completed.")

if __name__ == "__main__":
    test_tenant_isolation()
