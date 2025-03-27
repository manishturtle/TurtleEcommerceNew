#!/usr/bin/env python
"""
Script to update the inventory_lot table in the public schema to include missing columns.
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def update_public_lot_table():
    """
    Update the inventory_lot table in the public schema to include missing columns.
    """
    logger.info("Updating inventory_lot table in public schema")
    
    try:
        with connection.cursor() as cursor:
            # Set search path to public
            cursor.execute('SET search_path TO public')
            
            # Check if the table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    AND table_name = 'inventory_lot'
                )
            """)
            
            table_exists = cursor.fetchone()[0]
            
            if not table_exists:
                logger.warning("inventory_lot table does not exist in public schema")
                return
            
            # Check for missing columns
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'inventory_lot'
            """)
            
            existing_columns = [row[0] for row in cursor.fetchall()]
            
            # Define columns that should exist based on the model
            required_columns = {
                'parent_lot_id': 'integer',
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
                        logger.info(f"Adding missing column {column_name} to inventory_lot table in public schema")
                        
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
                            ALTER TABLE public.inventory_lot 
                            ADD COLUMN IF NOT EXISTS "{column_name}" {column_type} {default_value}
                        """)
            
            logger.info("Successfully updated inventory_lot table in public schema")
            
    except Exception as e:
        logger.error(f"Error updating inventory_lot table in public schema: {str(e)}")
        raise

if __name__ == "__main__":
    update_public_lot_table()
