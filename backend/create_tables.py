import os
import sqlite3
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_backend.settings')
django.setup()

# Read the SQL file
with open('create_products_tables.sql', 'r') as f:
    sql_script = f.read()

# Connect to the database
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Execute each statement
for statement in sql_script.split(';'):
    if statement.strip():
        cursor.execute(statement)

conn.commit()
conn.close()

print("Tables created successfully!")
