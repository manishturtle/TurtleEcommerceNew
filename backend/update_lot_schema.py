#!/usr/bin/env python
"""
Script to update the inventory_lot table schema in all tenant inventory schemas
to match the current model definition, adding missing columns like parent_lot_id.
"""
import os
import sys
import django
import logging
from django.db import connection, transaction

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

# Import models after Django setup
from tenants.models import Tenant

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def update_lot_table_schema(tenant):
    """
    Update the inventory_lot table schema for a specific tenant to include missing columns.
    """
    schema_name = tenant.schema_name
    inventory_schema = f"{schema_name}_inventory"
    
    logger.info(f"Updating inventory_lot table schema for tenant {tenant.name} ({schema_name})")
    
    try:
        with connection.cursor() as cursor:
            # Set search path to the tenant's inventory schema
            cursor.execute(f'SET search_path TO "{inventory_schema}", "{schema_name}", public')
            
            # Check if the table exists
            cursor.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = %s
                    AND table_name = 'inventory_lot'
                )
            """, [inventory_schema])
            
            table_exists = cursor.fetchone()[0]
            
            if not table_exists:
                logger.warning(f"inventory_lot table does not exist in schema {inventory_schema}")
                return
            
            # Check for missing columns
            cursor.execute(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = %s 
                AND table_name = 'inventory_lot'
            """, [inventory_schema])
            
            existing_columns = [row[0] for row in cursor.fetchall()]
            
            # Define columns that should exist based on the model
            required_columns = {
                'parent_lot_id': 'integer',
                'product_id': 'integer',
                'location_id': 'integer',
                'inventory_record_id': 'integer',
                'status': 'varchar(20)',
                'manufacturing_date': 'date',
                'received_date': 'date',
                'notes': 'text',
                'last_modified_by_id': 'integer',
                'last_updated': 'timestamp with time zone'
            }
            
            # Add missing columns
            with transaction.atomic():
                for column_name, column_type in required_columns.items():
                    if column_name not in existing_columns:
                        logger.info(f"Adding missing column {column_name} to inventory_lot table in schema {inventory_schema}")
                        
                        # Default values for non-nullable columns
                        default_value = ""
                        if column_name == 'status':
                            default_value = "DEFAULT 'AVAILABLE'"
                        elif column_name == 'received_date':
                            default_value = "DEFAULT CURRENT_DATE"
                        elif column_name == 'last_updated':
                            default_value = "DEFAULT CURRENT_TIMESTAMP"
                        
                        # Add the column
                        cursor.execute(f"""
                            ALTER TABLE "{inventory_schema}"."inventory_lot" 
                            ADD COLUMN IF NOT EXISTS "{column_name}" {column_type} {default_value}
                        """)
                
                # If inventory_id exists but product_id and location_id don't, we need to migrate the data
                if 'inventory_id' in existing_columns and 'product_id' in required_columns and 'location_id' in required_columns:
                    if 'product_id' not in existing_columns or 'location_id' not in existing_columns:
                        logger.info(f"Migrating data from inventory_id to product_id and location_id in schema {inventory_schema}")
                        
                        # Add the columns if they don't exist
                        if 'product_id' not in existing_columns:
                            cursor.execute(f"""
                                ALTER TABLE "{inventory_schema}"."inventory_lot" 
                                ADD COLUMN IF NOT EXISTS "product_id" integer
                            """)
                        
                        if 'location_id' not in existing_columns:
                            cursor.execute(f"""
                                ALTER TABLE "{inventory_schema}"."inventory_lot" 
                                ADD COLUMN IF NOT EXISTS "location_id" integer
                            """)
                        
                        # Update the new columns with data from the inventory table
                        cursor.execute(f"""
                            UPDATE "{inventory_schema}"."inventory_lot" lot
                            SET product_id = inv.product_id, location_id = inv.location_id
                            FROM "{inventory_schema}"."inventory_inventory" inv
                            WHERE lot.inventory_id = inv.id
                        """)
                        
                        # Make the columns NOT NULL after populating them
                        cursor.execute(f"""
                            ALTER TABLE "{inventory_schema}"."inventory_lot" 
                            ALTER COLUMN "product_id" SET NOT NULL,
                            ALTER COLUMN "location_id" SET NOT NULL
                        """)
                
                # Update the unique constraint if needed
                cursor.execute(f"""
                    SELECT con.conname
                    FROM pg_constraint con
                    JOIN pg_class rel ON rel.oid = con.conrelid
                    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                    WHERE nsp.nspname = %s
                    AND rel.relname = 'inventory_lot'
                    AND con.contype = 'u'
                """, [inventory_schema])
                
                constraints = [row[0] for row in cursor.fetchall()]
                
                # Drop the old unique constraint if it exists
                for constraint in constraints:
                    cursor.execute(f"""
                        ALTER TABLE "{inventory_schema}"."inventory_lot" 
                        DROP CONSTRAINT IF EXISTS "{constraint}"
                    """)
                
                # Add the new unique constraint
                cursor.execute(f"""
                    ALTER TABLE "{inventory_schema}"."inventory_lot" 
                    ADD CONSTRAINT inventory_lot_unique_constraint 
                    UNIQUE ("product_id", "location_id", "lot_number", "org_id", "status")
                """)
            
            logger.info(f"Successfully updated inventory_lot table schema for tenant {tenant.name}")
            
    except Exception as e:
        logger.error(f"Error updating inventory_lot table schema for tenant {tenant.name}: {str(e)}")
        raise

def main():
    """
    Update the inventory_lot table schema for all tenants.
    """
    logger.info("Starting inventory_lot table schema update for all tenants")
    
    tenants = Tenant.objects.all()
    logger.info(f"Found {len(tenants)} tenants")
    
    for tenant in tenants:
        try:
            update_lot_table_schema(tenant)
        except Exception as e:
            logger.error(f"Failed to update schema for tenant {tenant.name}: {str(e)}")
    
    logger.info("Completed inventory_lot table schema update for all tenants")

if __name__ == "__main__":
    main()
