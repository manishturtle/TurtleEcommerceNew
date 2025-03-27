from django.db import connection
import logging
from rest_framework.exceptions import PermissionDenied
from .models import Tenant

logger = logging.getLogger(__name__)

class TenantViewMixin:
    """
    Mixin for views that need to be tenant-aware.
    This ensures that querysets are filtered by the current tenant.
    """
    
    def get_queryset(self):
        """
        Filter the queryset by the current tenant's schema.
        """
        queryset = super().get_queryset()
        
        # Get the current schema from the connection
        schema_name = getattr(connection, 'schema_name', 'public')
        logger.debug(f"Current schema in TenantViewMixin: {schema_name}")
        
        # If we're in a tenant schema (not public), ensure we're only
        # returning objects for the current tenant
        if schema_name != 'public':
            # Add a filter for org_id if the model has this field
            if hasattr(queryset.model, 'org_id'):
                # Get the tenant's org_id
                try:
                    tenant = Tenant.objects.get(schema_name=schema_name)
                    queryset = queryset.filter(org_id=tenant.org_id)
                    logger.debug(f"Filtered queryset by org_id={tenant.org_id}")
                except Tenant.DoesNotExist:
                    logger.warning(f"No tenant found for schema {schema_name}")
        
        return queryset
        
    def get_tenant(self):
        """
        Get the current tenant from the connection schema.
        """
        schema_name = getattr(connection, 'schema_name', 'public')
        if schema_name == 'public':
            return None
            
        try:
            return Tenant.objects.get(schema_name=schema_name)
        except Tenant.DoesNotExist:
            return None
            
    def check_tenant_permissions(self, tenant=None):
        """
        Check if the current user has permissions for the tenant.
        Raises PermissionDenied if not.
        """
        if tenant is None:
            tenant = self.get_tenant()
            
        if tenant is None:
            # No tenant context, allow access (likely admin area)
            return True
            
        user = self.request.user
        
        # Super users can access any tenant
        if user.is_superuser:
            return True
            
        # Check if user is the owner of the tenant
        if tenant.owner == user:
            return True
            
        # Add additional permission checks here as needed
        # For example, check if user belongs to tenant's organization
        
        raise PermissionDenied("You do not have permission to access this tenant.")
        
    def perform_create(self, serializer):
        """
        Set the tenant for newly created objects.
        """
        tenant = self.get_tenant()
        
        # If we're in a tenant context, set the org_id
        if tenant and hasattr(serializer.Meta.model, 'org_id'):
            serializer.save(org_id=tenant.org_id)
        else:
            serializer.save()
            
    def perform_update(self, serializer):
        """
        Ensure tenant-specific fields aren't changed.
        """
        tenant = self.get_tenant()
        
        # If we're in a tenant context, ensure org_id isn't changed
        if tenant and hasattr(serializer.Meta.model, 'org_id'):
            serializer.save(org_id=tenant.org_id)
        else:
            serializer.save()
