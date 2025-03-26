from django.conf import settings

class SchemaRouter:
    """
    A router to control all database operations on models for different schemas.
    """
    
    def _get_db(self, model):
        """Helper to get the database for a model"""
        app_label = model._meta.app_label
        return settings.DATABASE_APPS_MAPPING.get(app_label, 'default')

    def db_for_read(self, model, **hints):
        """Point all read operations to the specific database for an app."""
        db = self._get_db(model)
        print(f"Routing READ for {model._meta.app_label}.{model._meta.model_name} to {db}")
        return db

    def db_for_write(self, model, **hints):
        """Point all write operations to the specific database for an app."""
        db = self._get_db(model)
        print(f"Routing WRITE for {model._meta.app_label}.{model._meta.model_name} to {db}")
        return db

    def allow_relation(self, obj1, obj2, **hints):
        """Allow any relation between apps that use the same database."""
        # Allow all relations within the same app
        if obj1._meta.app_label == obj2._meta.app_label:
            return True
            
        # Special case: allow inventory-products relations
        apps = {obj1._meta.app_label, obj2._meta.app_label}
        if apps == {'inventory', 'products'}:
            return True
            
        return False

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """Ensure that apps only appear in their designated databases."""
        intended_db = settings.DATABASE_APPS_MAPPING.get(app_label)
        
        if intended_db is None:
            return db == 'default'
            
        return db == intended_db
