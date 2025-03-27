import os
import logging
from django.db import connection
from django.conf import settings
from django.core.management import call_command

logger = logging.getLogger(__name__)

def create_tenant_schema(schema_name):
    """
    Create a new PostgreSQL schema for a tenant.
    
    Args:
        schema_name: The name of the schema to create
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        with connection.cursor() as cursor:
            # Create the schema if it doesn't exist
            cursor.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"')
            logger.info(f"Created schema: {schema_name}")
            
            # Create inventory-specific schema
            inventory_schema = f"{schema_name}_inventory"
            cursor.execute(f'CREATE SCHEMA IF NOT EXISTS "{inventory_schema}"')
            logger.info(f"Created inventory schema: {inventory_schema}")
            
            # Set the search path to include the new schemas
            cursor.execute(f'SET search_path TO "{schema_name}", "{inventory_schema}", public')
            
            # Migrate the tenant apps to create tables in the new schema
            migrate_tenant_apps(schema_name)
            
            return True
    except Exception as e:
        logger.error(f"Error creating schema {schema_name}: {str(e)}")
        return False

def drop_tenant_schema(schema_name):
    """
    Drop a PostgreSQL schema and all its tables.
    
    Args:
        schema_name: The name of the schema to drop
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        with connection.cursor() as cursor:
            # Drop the main schema and all objects within it
            cursor.execute(f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE')
            logger.info(f"Dropped schema: {schema_name}")
            
            # Drop the inventory schema
            inventory_schema = f"{schema_name}_inventory"
            cursor.execute(f'DROP SCHEMA IF EXISTS "{inventory_schema}" CASCADE')
            logger.info(f"Dropped inventory schema: {inventory_schema}")
            
            return True
    except Exception as e:
        logger.error(f"Error dropping schema {schema_name}: {str(e)}")
        return False

def migrate_tenant_apps(schema_name):
    """
    Run migrations for tenant-specific apps in the specified schema.
    
    Args:
        schema_name: The name of the schema to migrate
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Store the original schema name to restore it later
        original_schema = getattr(connection, 'schema_name', 'public')
        
        # Set the schema for the connection
        connection.schema_name = schema_name
        
        # Set environment variable for migration context
        os.environ['TENANT_SCHEMA'] = schema_name
        
        # Set the search path to the tenant schema and inventory schema
        inventory_schema = f"{schema_name}_inventory"
        with connection.cursor() as cursor:
            cursor.execute(f'SET search_path TO "{schema_name}", "{inventory_schema}", public')
        
        # Define which apps are tenant-specific
        tenant_apps = [
            'products',
            'orders',
            # Add other tenant-specific apps here
        ]
        
        # Define inventory-specific apps
        inventory_apps = ['inventory']
        
        # Run migrations for each tenant app
        for app in tenant_apps:
            logger.info(f"Migrating app {app} in schema {schema_name}")
            try:
                # Create the necessary tables in the tenant schema
                call_command('migrate', app, '--database=default', '--noinput')
            except Exception as app_error:
                logger.error(f"Error migrating app {app} in schema {schema_name}: {str(app_error)}")
        
        # Create inventory tables in the inventory schema
        create_inventory_tables(schema_name, inventory_schema)
        
        # Reset environment variable
        os.environ.pop('TENANT_SCHEMA', None)
        
        # Restore original schema
        connection.schema_name = original_schema
        with connection.cursor() as cursor:
            cursor.execute(f'SET search_path TO "{original_schema}", public')
        
        return True
    except Exception as e:
        logger.error(f"Error migrating tenant apps for schema {schema_name}: {str(e)}")
        # Reset environment variable in case of error
        os.environ.pop('TENANT_SCHEMA', None)
        return False

def create_inventory_tables(schema_name, inventory_schema):
    """
    Create inventory-specific tables in the inventory schema.
    
    Args:
        schema_name: The main tenant schema name
        inventory_schema: The inventory-specific schema name
    """
    logger.info(f"Creating inventory tables in schema {inventory_schema}")
    
    try:
        with connection.cursor() as cursor:
            # Set search path to include the inventory schema
            cursor.execute(f'SET search_path TO "{schema_name}", "{inventory_schema}", public')
            
            # Create FulfillmentLocation table
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
            
            # Create AdjustmentReason table
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
            
            # Create Inventory table
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS "{inventory_schema}"."inventory_inventory" (
                    "id" serial PRIMARY KEY,
                    "product_id" integer NOT NULL,
                    "location_id" integer NOT NULL,
                    "quantity_on_hand" numeric(15,5) NOT NULL,
                    "quantity_reserved" numeric(15,5) NOT NULL DEFAULT 0,
                    "quantity_available" numeric(15,5) NOT NULL,
                    "reorder_point" numeric(15,5),
                    "reorder_quantity" numeric(15,5),
                    "created_at" timestamp with time zone NOT NULL,
                    "updated_at" timestamp with time zone NOT NULL,
                    "org_id" integer NOT NULL,
                    UNIQUE ("product_id", "location_id", "org_id")
                )
            """)
            
            # Create InventoryAdjustment table
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS "{inventory_schema}"."inventory_inventoryadjustment" (
                    "id" serial PRIMARY KEY,
                    "inventory_id" integer NOT NULL,
                    "adjustment_type" varchar(20) NOT NULL,
                    "quantity" numeric(15,5) NOT NULL,
                    "reason_id" integer,
                    "reference_number" varchar(100),
                    "notes" text,
                    "created_at" timestamp with time zone NOT NULL,
                    "updated_at" timestamp with time zone NOT NULL,
                    "created_by_id" integer,
                    "org_id" integer NOT NULL
                )
            """)
            
            # Create SerializedInventory table
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS "{inventory_schema}"."inventory_serializedinventory" (
                    "id" serial PRIMARY KEY,
                    "inventory_id" integer,
                    "serial_number" varchar(255) NOT NULL,
                    "status" varchar(20) NOT NULL,
                    "notes" text,
                    "created_at" timestamp with time zone NOT NULL,
                    "updated_at" timestamp with time zone NOT NULL,
                    "org_id" integer NOT NULL
                )
            """)
            
            # Create Lot table for lot management
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS "{inventory_schema}"."inventory_lot" (
                    "id" serial PRIMARY KEY,
                    "product_id" integer NOT NULL,
                    "location_id" integer NOT NULL,
                    "inventory_record_id" integer,
                    "lot_number" varchar(100) NOT NULL,
                    "quantity" numeric(15,5) NOT NULL,
                    "status" varchar(20) NOT NULL DEFAULT 'AVAILABLE',
                    "expiry_date" date,
                    "manufacturing_date" date,
                    "received_date" date NOT NULL,
                    "quantity_reserved" numeric(15,5) NOT NULL DEFAULT 0,
                    "cost_price_per_unit" numeric(15,5),
                    "notes" text,
                    "created_at" timestamp with time zone NOT NULL,
                    "last_updated" timestamp with time zone NOT NULL,
                    "last_modified_by_id" integer,
                    "parent_lot_id" integer,
                    "org_id" integer NOT NULL,
                    UNIQUE ("product_id", "location_id", "lot_number", "org_id", "status")
                )
            """)
            
            logger.info(f"Successfully created inventory tables in schema {inventory_schema}")
    except Exception as e:
        logger.error(f"Error creating inventory tables in schema {inventory_schema}: {str(e)}")

def get_tenant_model_table_names():
    """
    Get a list of table names for tenant-specific models.
    
    Returns:
        list: A list of table names
    """
    # This is a simplified approach - in a real application, you would
    # introspect the models to get the actual table names
    return [
        'inventory_fulfillmentlocation',
        'inventory_adjustmentreason',
        'inventory_inventory',
        'inventory_inventoryadjustment',
        'inventory_serializedinventory',
        'inventory_lot',
        'products_product',
        'products_category',
        'orders_order',
        'orders_orderitem',
        # Add other tenant-specific tables here
    ]
