from django.conf import settings

class SchemaRouter:
    """
    A router to control all database operations on models in the
    inventory, products, core, and tenants applications.
    """

    def db_for_read(self, model, **hints):
        """
        Attempts to read inventory models go to inventory schema.
        """
        if model._meta.app_label == 'inventory':
            return 'default'
        app_label = model._meta.app_label
        # Check if app is in PUBLIC_SCHEMA_APPS
        if app_label in [app.split('.')[-1] for app in settings.PUBLIC_SCHEMA_APPS]:
            return 'default'  # Use public schema
        # Check schema-specific apps
        for schema, apps in settings.SCHEMA_APPS.items():
            if app_label in apps:
                return schema
        return 'default'

    def db_for_write(self, model, **hints):
        """
        Attempts to write inventory models go to inventory schema.
        """
        if model._meta.app_label == 'inventory':
            return 'default'
        return self.db_for_read(model, **hints)

    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations if a model in the inventory app is involved.
        """
        if obj1._meta.app_label == 'inventory' or obj2._meta.app_label == 'inventory':
            return True
        obj1_app = obj1._meta.app_label
        obj2_app = obj2._meta.app_label
        
        # Both in public schema
        if (obj1_app in [app.split('.')[-1] for app in settings.PUBLIC_SCHEMA_APPS] and 
            obj2_app in [app.split('.')[-1] for app in settings.PUBLIC_SCHEMA_APPS]):
            return True
            
        # Check if in same schema
        for schema, apps in settings.SCHEMA_APPS.items():
            if obj1_app in apps and obj2_app in apps:
                return True
                
        # Allow relations with public schema
        if (obj1_app in [app.split('.')[-1] for app in settings.PUBLIC_SCHEMA_APPS] or 
            obj2_app in [app.split('.')[-1] for app in settings.PUBLIC_SCHEMA_APPS]):
            return True
            
        return False

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Make sure the inventory app only appears in the inventory schema.
        """
        if app_label == 'inventory':
            return db == 'default'
        # Allow public schema apps to migrate in default
        if db == 'default':
            return app_label in [app.split('.')[-1] for app in settings.PUBLIC_SCHEMA_APPS]
        
        # For other schemas, only allow migrations for configured apps
        return app_label in settings.SCHEMA_APPS.get(db, [])
