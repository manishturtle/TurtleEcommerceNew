#!/usr/bin/env python
"""
Script to inspect the database structure and find where tables are located.
"""
import os
import sys
import django
import logging

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

# Import Django models and utilities
from django.db import connection
from tenants.models import Tenant

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def inspect_schemas():
    """List all schemas in the database"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT schema_name
            FROM information_schema.schemata
            WHERE schema_name NOT LIKE 'pg_%'
            AND schema_name != 'information_schema'
            ORDER BY schema_name
        """)
        schemas = [row[0] for row in cursor.fetchall()]
        
        print("\nAvailable schemas:")
        for schema in schemas:
            print(f"- {schema}")
        
        return schemas

def inspect_tables_in_schema(schema_name):
    """List all tables in a specific schema"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = %s
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """, [schema_name])
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"\nTables in schema '{schema_name}':")
        for table in tables:
            print(f"- {table}")
        
        return tables

def find_product_tables():
    """Find all tables that might be product tables"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_name LIKE '%product%'
            AND table_type = 'BASE TABLE'
            ORDER BY table_schema, table_name
        """)
        product_tables = [(row[0], row[1]) for row in cursor.fetchall()]
        
        print("\nPotential product tables:")
        for schema, table in product_tables:
            print(f"- {schema}.{table}")
        
        return product_tables

def inspect_table_columns(schema_name, table_name):
    """List all columns in a specific table"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = %s
            AND table_name = %s
            ORDER BY ordinal_position
        """, [schema_name, table_name])
        columns = [(row[0], row[1], row[2]) for row in cursor.fetchall()]
        
        print(f"\nColumns in table '{schema_name}.{table_name}':")
        for name, data_type, nullable in columns:
            nullable_str = "NULL" if nullable == "YES" else "NOT NULL"
            print(f"- {name}: {data_type} {nullable_str}")
        
        return columns

def inspect_table_data(schema_name, table_name, limit=5):
    """Show sample data from a table"""
    try:
        with connection.cursor() as cursor:
            cursor.execute(f"""
                SELECT * FROM "{schema_name}"."{table_name}"
                LIMIT {limit}
            """)
            rows = cursor.fetchall()
            
            # Get column names
            cursor.execute("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = %s
                AND table_name = %s
                ORDER BY ordinal_position
            """, [schema_name, table_name])
            columns = [row[0] for row in cursor.fetchall()]
            
            print(f"\nSample data from '{schema_name}.{table_name}' (up to {limit} rows):")
            if not rows:
                print("No data found.")
                return
            
            # Print column headers
            header = " | ".join(columns)
            print(header)
            print("-" * len(header))
            
            # Print rows
            for row in rows:
                row_str = " | ".join(str(val) for val in row)
                print(row_str)
            
            return rows
    except Exception as e:
        print(f"Error inspecting table data: {str(e)}")
        return None

def main():
    """Main function to inspect the database structure"""
    print("=" * 80)
    print("DATABASE STRUCTURE INSPECTION".center(80))
    print("=" * 80)
    
    # List all schemas
    schemas = inspect_schemas()
    
    # Find product tables
    product_tables = find_product_tables()
    
    # Inspect each product table
    for schema, table in product_tables:
        inspect_table_columns(schema, table)
        inspect_table_data(schema, table)
    
    # Inspect tenant schemas
    tenants = Tenant.objects.all()
    print(f"\nFound {len(tenants)} tenants:")
    for tenant in tenants:
        print(f"- {tenant.name} (schema: {tenant.schema_name})")
        
        # Inspect tables in tenant schema
        inspect_tables_in_schema(tenant.schema_name)
        
        # Inspect tables in tenant inventory schema
        inventory_schema = f"{tenant.schema_name}_inventory"
        inspect_tables_in_schema(inventory_schema)

if __name__ == "__main__":
    main()
