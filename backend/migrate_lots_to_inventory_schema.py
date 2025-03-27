#!/usr/bin/env python
"""
Migration script to move existing lots from the public schema to the tenant-specific inventory schema.
This script should be run once to fix the schema location of existing lots.
"""
import os
import sys
import django
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f'lot_migration_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
    ]
)
logger = logging.getLogger(__name__)

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

# Import Django models and utilities
from django.db import connection
from tenants.models import Tenant


def set_tenant_schema(schema_name):
    """Set the connection to use the tenant schema"""
    inventory_schema = f"{schema_name}_inventory"
    with connection.cursor() as cursor:
        cursor.execute(f'SET search_path TO "{schema_name}", "{inventory_schema}", public')
        # Log the current search path for debugging
        cursor.execute("SHOW search_path")
        current_search_path = cursor.fetchone()[0]
        logger.info(f"Current search path: {current_search_path}")


def get_available_tenants():
    """Get a list of available tenants in the database"""
    tenants = Tenant.objects.all()
    if not tenants.exists():
        logger.error("No tenants found in the database!")
        return []
    
    logger.info("\nAvailable tenants:")
    for i, tenant in enumerate(tenants):
        logger.info(f"{i+1}. {tenant.name} (schema: {tenant.schema_name})")
    
    return list(tenants)


def check_inventory_schema_exists(schema_name):
    """Check if the inventory schema exists and create it if it doesn't"""
    inventory_schema = f"{schema_name}_inventory"
    with connection.cursor() as cursor:
        # Check if inventory schema exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.schemata 
                WHERE schema_name = %s
            )
        """, [inventory_schema])
        schema_exists = cursor.fetchone()[0]
        
        if not schema_exists:
            logger.warning(f"Inventory schema {inventory_schema} does not exist. Creating it...")
            cursor.execute(f'CREATE SCHEMA IF NOT EXISTS "{inventory_schema}"')
            logger.info(f"Created schema {inventory_schema}")
            
            # Create inventory_lot table in the inventory schema
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS "{inventory_schema}"."inventory_lot" (
                    LIKE public.inventory_lot INCLUDING ALL
                )
            """)
            logger.info(f"Created inventory_lot table in {inventory_schema} schema")
            return True
        else:
            logger.info(f"Inventory schema {inventory_schema} already exists")
            
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
                logger.warning(f"inventory_lot table does not exist in {inventory_schema} schema. Creating it...")
                cursor.execute(f"""
                    CREATE TABLE IF NOT EXISTS "{inventory_schema}"."inventory_lot" (
                        LIKE public.inventory_lot INCLUDING ALL
                    )
                """)
                logger.info(f"Created inventory_lot table in {inventory_schema} schema")
                return True
            else:
                logger.info(f"inventory_lot table already exists in {inventory_schema} schema")
                return True


def migrate_lots_for_tenant(tenant):
    """Migrate lots from public schema to tenant-specific inventory schema"""
    schema_name = tenant.schema_name
    inventory_schema = f"{schema_name}_inventory"
    
    logger.info(f"\nMigrating lots for tenant: {tenant.name}")
    logger.info(f"Tenant schema: {schema_name}")
    logger.info(f"Inventory schema: {inventory_schema}")
    
    # Set the schema context
    set_tenant_schema(schema_name)
    
    # Ensure inventory schema exists
    if not check_inventory_schema_exists(schema_name):
        logger.error(f"Failed to create or verify inventory schema for {tenant.name}")
        return False
    
    # Get lots for this tenant from public schema
    with connection.cursor() as cursor:
        # First, check if the org_id field exists in the lots table
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'inventory_lot' 
            AND column_name = 'org_id'
        """)
        org_id_exists = cursor.fetchone() is not None
        
        if org_id_exists:
            # Get tenant's org_id
            cursor.execute(f"""
                SELECT org_id FROM "{schema_name}"."tenants_tenant"
                WHERE id = %s
            """, [tenant.pk])
            result = cursor.fetchone()
            if result:
                org_id = result[0]
            else:
                # Default to tenant's primary key if org_id not found
                org_id = tenant.pk
                
            logger.info(f"Using org_id {org_id} for tenant {tenant.name}")
            
            # Count lots for this tenant
            cursor.execute("""
                SELECT COUNT(*) FROM public.inventory_lot
                WHERE org_id = %s
            """, [org_id])
        else:
            # If org_id doesn't exist, we'll need another way to identify tenant's lots
            logger.warning("org_id column not found in inventory_lot table. Using all lots in public schema.")
            cursor.execute("SELECT COUNT(*) FROM public.inventory_lot")
            
        lot_count = cursor.fetchone()[0]
        
        if lot_count == 0:
            logger.info(f"No lots found for tenant {tenant.name} in public schema")
            return True
        
        logger.info(f"Found {lot_count} lots for tenant {tenant.name} in public schema")
        
        # Get lot details
        if org_id_exists:
            cursor.execute("""
                SELECT * FROM public.inventory_lot
                WHERE org_id = %s
            """, [org_id])
        else:
            cursor.execute("SELECT * FROM public.inventory_lot")
            
        columns = [desc[0] for desc in cursor.description]
        lots = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        # Insert lots into inventory schema
        for lot in lots:
            # Build column and value lists for the INSERT statement
            columns_str = ', '.join([f'"{col}"' for col in lot.keys()])
            placeholders = ', '.join(['%s'] * len(lot))
            values = list(lot.values())
            
            # Insert the lot into the inventory schema
            try:
                cursor.execute(f"""
                    INSERT INTO "{inventory_schema}"."inventory_lot" ({columns_str})
                    VALUES ({placeholders})
                """, values)
                logger.info(f"Migrated lot {lot['id']} (Lot #{lot['lot_number']}) to {inventory_schema} schema")
            except Exception as e:
                logger.error(f"Error migrating lot {lot['id']}: {str(e)}")
                return False
        
        # Verify migration
        if org_id_exists:
            cursor.execute(f"""
                SELECT COUNT(*) FROM "{inventory_schema}"."inventory_lot"
                WHERE org_id = %s
            """, [org_id])
        else:
            cursor.execute(f'SELECT COUNT(*) FROM "{inventory_schema}"."inventory_lot"')
            
        migrated_count = cursor.fetchone()[0]
        
        if migrated_count == lot_count:
            logger.info(f"Successfully migrated all {lot_count} lots to {inventory_schema} schema")
            
            # Ask if we should delete the lots from public schema
            delete_from_public = input(f"Delete {lot_count} lots from public schema for tenant {tenant.name}? (y/n): ").lower() == 'y'
            
            if delete_from_public:
                try:
                    if org_id_exists:
                        cursor.execute("""
                            DELETE FROM public.inventory_lot
                            WHERE org_id = %s
                        """, [org_id])
                    else:
                        cursor.execute("DELETE FROM public.inventory_lot")
                        
                    logger.info(f"Deleted {lot_count} lots from public schema for tenant {tenant.name}")
                except Exception as e:
                    logger.error(f"Error deleting lots from public schema: {str(e)}")
                    return False
            else:
                logger.info("Lots were not deleted from public schema")
            
            return True
        else:
            logger.error(f"Migration verification failed. Expected {lot_count} lots, but found {migrated_count} in {inventory_schema} schema")
            return False


def main():
    """Main migration function"""
    logger.info("=" * 80)
    logger.info("MIGRATING LOTS FROM PUBLIC SCHEMA TO TENANT-SPECIFIC INVENTORY SCHEMA".center(80))
    logger.info("=" * 80)
    
    # Get available tenants
    tenants = get_available_tenants()
    if not tenants:
        logger.error("No tenants available. Migration aborted.")
        sys.exit(1)
    
    # Migrate lots for each tenant
    success_count = 0
    for tenant in tenants:
        if migrate_lots_for_tenant(tenant):
            success_count += 1
    
    # Final result
    logger.info("\n" + "=" * 80)
    if success_count == len(tenants):
        logger.info(f"MIGRATION COMPLETED SUCCESSFULLY FOR ALL {success_count} TENANTS".center(80))
    else:
        logger.info(f"MIGRATION COMPLETED WITH ISSUES. SUCCESSFUL: {success_count}/{len(tenants)} TENANTS".center(80))
    logger.info("=" * 80)


if __name__ == "__main__":
    main()
