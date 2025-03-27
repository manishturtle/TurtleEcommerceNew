from django.conf import settings
from django.core.cache import cache
from django.db import connection
import logging

logger = logging.getLogger(__name__)

class TenantSettings:
    """
    Manage tenant-specific settings.
    
    This class provides methods to get and set tenant-specific settings,
    which are stored in the cache with tenant-specific keys.
    """
    
    @staticmethod
    def get_cache_key(tenant_schema, key):
        """
        Generate a tenant-specific cache key.
        
        Args:
            tenant_schema (str): The tenant's schema name
            key (str): The setting key
            
        Returns:
            str: The tenant-specific cache key
        """
        return f"tenant:{tenant_schema}:setting:{key}"
    
    @staticmethod
    def get_current_schema():
        """
        Get the current tenant schema from the database connection.
        
        Returns:
            str: The current schema name or 'public' if no tenant context
        """
        try:
            return connection.schema_name
        except AttributeError:
            return 'public'
    
    @classmethod
    def get(cls, key, default=None):
        """
        Get a tenant-specific setting.
        
        Args:
            key (str): The setting key
            default: The default value if the setting doesn't exist
            
        Returns:
            The setting value or the default value
        """
        schema = cls.get_current_schema()
        cache_key = cls.get_cache_key(schema, key)
        
        # Try to get from cache first
        value = cache.get(cache_key)
        
        if value is None:
            # If not in cache, get from database
            try:
                from .models import TenantSetting
                setting = TenantSetting.objects.filter(key=key).first()
                if setting:
                    value = setting.value
                    # Cache the value
                    cache.set(cache_key, value, timeout=3600)  # 1 hour timeout
                else:
                    # Use default if setting doesn't exist
                    value = default
            except Exception as e:
                logger.error(f"Error getting tenant setting {key}: {str(e)}")
                value = default
                
        return value
    
    @classmethod
    def set(cls, key, value, timeout=3600):
        """
        Set a tenant-specific setting.
        
        Args:
            key (str): The setting key
            value: The setting value
            timeout (int): Cache timeout in seconds
            
        Returns:
            bool: True if successful, False otherwise
        """
        schema = cls.get_current_schema()
        cache_key = cls.get_cache_key(schema, key)
        
        try:
            # Save to database
            from .models import TenantSetting
            setting, created = TenantSetting.objects.update_or_create(
                key=key,
                defaults={'value': value}
            )
            
            # Cache the value
            cache.set(cache_key, value, timeout=timeout)
            return True
        except Exception as e:
            logger.error(f"Error setting tenant setting {key}: {str(e)}")
            return False
    
    @classmethod
    def delete(cls, key):
        """
        Delete a tenant-specific setting.
        
        Args:
            key (str): The setting key
            
        Returns:
            bool: True if successful, False otherwise
        """
        schema = cls.get_current_schema()
        cache_key = cls.get_cache_key(schema, key)
        
        try:
            # Delete from database
            from .models import TenantSetting
            TenantSetting.objects.filter(key=key).delete()
            
            # Delete from cache
            cache.delete(cache_key)
            return True
        except Exception as e:
            logger.error(f"Error deleting tenant setting {key}: {str(e)}")
            return False
