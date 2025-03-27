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
            
            # Set the search path to include the new schema
            cursor.execute(f'SET search_path TO "{schema_name}", public')
            
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
            # Drop the schema and all objects within it
            cursor.execute(f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE')
            logger.info(f"Dropped schema: {schema_name}")
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
        
        # Set the search path to the tenant schema
        with connection.cursor() as cursor:
            cursor.execute(f'SET search_path TO "{schema_name}", public')
        
        # Define which apps are tenant-specific
        tenant_apps = [
            'inventory',
            'products',
            'orders',
            # Add other tenant-specific apps here
        ]
        
        # Run migrations for each tenant app
        for app in tenant_apps:
            logger.info(f"Migrating app {app} in schema {schema_name}")
            try:
                # Create the necessary tables in the tenant schema
                call_command('migrate', app, '--database=default', '--noinput')
            except Exception as app_error:
                logger.error(f"Error migrating app {app} in schema {schema_name}: {str(app_error)}")
        
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
        'products_product',
        'products_category',
        'orders_order',
        'orders_orderitem',
        # Add other tenant-specific tables here
    ]
