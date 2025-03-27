from contextlib import contextmanager
from django.db import connection
import logging

logger = logging.getLogger(__name__)

@contextmanager
def tenant_context(schema_name):
    """
    Context manager for temporarily setting the schema for database operations.
    
    Args:
        schema_name (str): The schema name to use
        
    Yields:
        None
    """
    # Store the original schema if it exists
    previous_schema = getattr(connection, 'schema_name', 'public')
    
    try:
        # Set schema_name attribute on the connection
        if not hasattr(connection, 'schema_name'):
            connection.schema_name = schema_name
        else:
            connection.schema_name = schema_name
            
        # Set search_path to include the schema
        with connection.cursor() as cursor:
            cursor.execute(f'SET search_path TO "{schema_name}", public')
            
        logger.debug(f"Set schema to {schema_name}")
        yield
    finally:
        # Reset to the original schema
        connection.schema_name = previous_schema
        with connection.cursor() as cursor:
            cursor.execute(f'SET search_path TO "{previous_schema}", public')
        logger.debug(f"Reset schema to {previous_schema}")


def get_current_tenant():
    """
    Get the current tenant based on the schema.
    
    Returns:
        Tenant: The current tenant or None if no tenant context
    """
    from .models import Tenant
    
    schema_name = getattr(connection, 'schema_name', 'public')
    if schema_name == 'public':
        return None
    
    try:
        return Tenant.objects.get(schema_name=schema_name)
    except Tenant.DoesNotExist:
        return None


def get_tenant_model_for_schema(schema_name, model_class):
    """
    Get a model instance from a specific schema.
    
    Usage:
        user = get_tenant_model_for_schema('customer1', User, id=1)
    
    Args:
        schema_name: The schema name to query
        model_class: The model class to query
        **kwargs: Filters to apply to the query
    
    Returns:
        A queryset for the specified model in the specified schema
    """
    with tenant_context(schema_name):
        return model_class.objects.all()
