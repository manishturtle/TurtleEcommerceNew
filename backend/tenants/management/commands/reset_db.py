from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Reset database tables and run migrations'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Drop all tables
            cursor.execute("""
                DO $$ DECLARE
                    r RECORD;
                BEGIN
                    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname IN ('public', 'tenants', 'inventory', 'products', 'core')) LOOP
                        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                    END LOOP;
                END $$;
            """)
            
            # Reset migrations table
            cursor.execute("""
                DROP TABLE IF EXISTS django_migrations CASCADE;
                CREATE TABLE django_migrations (
                    id serial PRIMARY KEY,
                    app varchar(255) NOT NULL,
                    name varchar(255) NOT NULL,
                    applied timestamp with time zone NOT NULL
                );
            """)
            
        self.stdout.write(self.style.SUCCESS('Database reset complete. Now run migrations.'))
