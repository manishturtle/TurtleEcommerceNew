from celery import shared_task
from django.db import connection
from .utils import tenant_context
import logging

logger = logging.getLogger(__name__)

def with_tenant_context(func):
    """
    Decorator to run a task with the appropriate tenant context.
    
    This decorator ensures that the task runs in the correct tenant schema
    by setting the schema before executing the task and resetting it afterward.
    
    Usage:
        @shared_task
        @with_tenant_context
        def my_task(tenant_id, tenant_schema, *args, **kwargs):
            # This will run in the tenant's schema context
            ...
    """
    def wrapper(tenant_id, tenant_schema, *args, **kwargs):
        # Store the original schema
        original_schema = getattr(connection, 'schema_name', 'public')
        
        try:
            # Use the tenant_context context manager to set the schema
            with tenant_context(tenant_schema):
                logger.info(f"Running task in tenant schema: {tenant_schema}")
                return func(tenant_id, tenant_schema, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error running task in tenant schema {tenant_schema}: {str(e)}")
            raise
        finally:
            # Reset to the original schema
            if hasattr(connection, 'schema_name'):
                connection.schema_name = original_schema
    
    return wrapper


@shared_task
@with_tenant_context
def example_tenant_task(tenant_id, tenant_schema, *args, **kwargs):
    """
    Example task that runs in a tenant context.
    
    Args:
        tenant_id (int): The ID of the tenant
        tenant_schema (str): The schema name of the tenant
        *args, **kwargs: Additional arguments for the task
    """
    from .models import Tenant
    
    tenant = Tenant.objects.get(id=tenant_id)
    logger.info(f"Running example task for tenant: {tenant.name}")
    
    # Your task logic here
    # All database operations will be performed in the tenant's schema
    
    return {
        "status": "success",
        "tenant_id": tenant_id,
        "tenant_name": tenant.name,
        "message": "Task completed successfully"
    }


# How to call a tenant-aware task:
#
# from tenants.tasks import example_tenant_task
# from tenants.models import Tenant
#
# tenant = Tenant.objects.get(id=1)
# task = example_tenant_task.delay(
#     tenant_id=tenant.id,
#     tenant_schema=tenant.schema_name,
#     additional_arg1="value1",
#     additional_arg2="value2"
# )
