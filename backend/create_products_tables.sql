-- Create products_product table
CREATE TABLE IF NOT EXISTS products_product (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_serialized BOOLEAN NOT NULL DEFAULT 0,
    is_lotted BOOLEAN NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create products_productcategory table
CREATE TABLE IF NOT EXISTS products_productcategory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES products_productcategory(id)
);

-- Create products_productattribute table
CREATE TABLE IF NOT EXISTS products_productattribute (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    data_type VARCHAR(20) NOT NULL DEFAULT 'text',
    is_required BOOLEAN NOT NULL DEFAULT 0,
    options JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create products_productattributevalue table
CREATE TABLE IF NOT EXISTS products_productattributevalue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    attribute_id INTEGER NOT NULL,
    value JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products_product(id),
    FOREIGN KEY (attribute_id) REFERENCES products_productattribute(id),
    UNIQUE(product_id, attribute_id)
);

-- Create django_migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS django_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied DATETIME NOT NULL
);

-- Insert migration record
INSERT INTO django_migrations (app, name, applied)
SELECT 'products', '0001_initial', CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'products' AND name = '0001_initial'
);
