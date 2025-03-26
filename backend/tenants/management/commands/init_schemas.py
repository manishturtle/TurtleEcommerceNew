from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings

class Command(BaseCommand):
    help = 'Initialize all required schemas for the application'

    def handle(self, *args, **options):
        schemas = ['public', 'tenants', 'inventory', 'products', 'core']
        
        with connection.cursor() as cursor:
            for schema in schemas:
                # Check if schema exists
                cursor.execute("""
                    SELECT schema_name 
                    FROM information_schema.schemata 
                    WHERE schema_name = %s
                """, [schema])
                
                if not cursor.fetchone():
                    # Create schema if it doesn't exist
                    cursor.execute(f'CREATE SCHEMA IF NOT EXISTS {schema}')
                    self.stdout.write(self.style.SUCCESS(f'Created {schema} schema'))
                else:
                    self.stdout.write(f'{schema} schema already exists')
            
            # Set search path to include all schemas
            search_path = ','.join(schemas)
            cursor.execute(f'SET search_path TO {search_path}')
            
            # Create extension if it doesn't exist
            cursor.execute("""
                SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
            """)
            if not cursor.fetchone():
                cursor.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
                self.stdout.write(self.style.SUCCESS('Created uuid-ossp extension'))
