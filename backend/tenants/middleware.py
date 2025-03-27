from django.conf import settings
from django.db import connection
from django.http import Http404
from django.utils.deprecation import MiddlewareMixin
from .models import Tenant, Domain
import logging

logger = logging.getLogger(__name__)

class TenantMiddleware(MiddlewareMixin):
    """
    Middleware that sets the schema for the current tenant based on the request domain.
    This should be placed after Django's CommonMiddleware.
    """
    
    def process_request(self, request):
        """
        Process each request to identify and set the correct tenant schema.
        """
        # Get the hostname from the request
        hostname = request.get_host().split(':')[0]
        
        try:
            # Try to find the domain and associated tenant
            domain = Domain.objects.select_related('tenant').get(domain=hostname)
            tenant = domain.tenant
            
            # Check if tenant is active
            if not tenant.is_active:
                raise Http404("Tenant is not active")
            
            # Set the tenant on the request object for easy access in views
            request.tenant = tenant
            
            # Set the schema_name on the connection
            if not hasattr(connection, 'schema_name'):
                connection.schema_name = tenant.schema_name
            else:
                connection.schema_name = tenant.schema_name
            
            # Set the PostgreSQL search_path to use the tenant schema
            with connection.cursor() as cursor:
                cursor.execute(f'SET search_path TO "{tenant.schema_name}", public')
            
            logger.debug(f"Set tenant schema to {tenant.schema_name} for {hostname}")
            
        except Domain.DoesNotExist:
            # If no matching domain is found, use the public schema
            # This is typically for the main site or admin site
            if not hasattr(connection, 'schema_name'):
                connection.schema_name = 'public'
            else:
                connection.schema_name = 'public'
                
            with connection.cursor() as cursor:
                cursor.execute('SET search_path TO public')
                
            request.tenant = None
            logger.debug(f"No tenant found for {hostname}, using public schema")
    
    def process_response(self, request, response):
        """
        Reset the schema when the request is complete.
        """
        # No need to reset schema here as each request will set its own schema
        return response
