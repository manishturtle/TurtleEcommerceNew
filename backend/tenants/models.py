from django.db import models
from django.contrib.auth import get_user_model
from django.db import connection
from .schema_utils import create_tenant_schema, drop_tenant_schema
import json
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class TenantAwareModel(models.Model):
    """
    Abstract base model for all tenant-specific models.
    This ensures all tenant models have common functionality.
    """
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    org_id = models.IntegerField(default=1)

    class Meta:
        abstract = True

    @classmethod
    def get_current_schema_name(cls):
        """Get the current schema name from the connection"""
        return getattr(connection, 'schema_name', 'public')

    def save(self, *args, **kwargs):
        """Ensure the org_id is set based on the current schema"""
        if not self.org_id:
            schema_name = self.get_current_schema_name()
            if schema_name != 'public':
                try:
                    from .models import Tenant
                    tenant = Tenant.objects.get(schema_name=schema_name)
                    self.org_id = tenant.org_id
                except Tenant.DoesNotExist:
                    # Default to 1 if tenant not found
                    self.org_id = 1
        super().save(*args, **kwargs)


class Tenant(models.Model):
    name = models.CharField(max_length=100)
    schema_name = models.CharField(max_length=63, unique=True)
    created_on = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User, on_delete=models.PROTECT)
    paid_until = models.DateField(null=True, blank=True)
    on_trial = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    org_id = models.AutoField(primary_key=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Generate schema_name from name if not provided
        if not self.schema_name:
            self.schema_name = self.name.lower().replace(' ', '_')
            
        # Check if this is a new tenant being created
        is_new = self.pk is None
        
        # Save the tenant first
        super().save(*args, **kwargs)
        
        # Create schema for new tenants
        if is_new:
            logger.info(f"Creating schema for new tenant: {self.name} ({self.schema_name})")
            success = create_tenant_schema(self.schema_name)
            if success:
                logger.info(f"Successfully created schema for tenant: {self.name}")
            else:
                logger.error(f"Failed to create schema for tenant: {self.name}")

    def delete(self, *args, **kwargs):
        """Override delete to drop the schema when a tenant is deleted"""
        schema_name = self.schema_name
        
        # Delete the tenant first
        super().delete(*args, **kwargs)
        
        # Drop the schema
        logger.info(f"Dropping schema for deleted tenant: {self.name} ({schema_name})")
        success = drop_tenant_schema(schema_name)
        if success:
            logger.info(f"Successfully dropped schema for tenant: {self.name}")
        else:
            logger.error(f"Failed to drop schema for tenant: {self.name}")


class Domain(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='domains')
    domain = models.CharField(max_length=253, unique=True)
    is_primary = models.BooleanField(default=True)
    org_id = models.IntegerField(default=1)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.domain


class TenantSetting(TenantAwareModel):
    """Store tenant-specific settings."""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='settings')
    key = models.CharField(max_length=255)
    value_text = models.TextField(null=True, blank=True)
    
    class Meta:
        unique_together = [['tenant', 'key', 'org_id']]
    
    def __str__(self):
        return f"{self.tenant.name}: {self.key}"
    
    @property
    def value(self):
        """Get the setting value, attempting to parse JSON if possible"""
        if not self.value_text:
            return None
        
        try:
            return json.loads(self.value_text)
        except json.JSONDecodeError:
            # If it's not valid JSON, return the raw text
            return self.value_text
    
    @value.setter
    def value(self, val):
        """Set the setting value, converting to JSON if needed"""
        if val is None:
            self.value_text = None
        elif isinstance(val, (dict, list, bool, int, float)):
            # Convert Python objects to JSON string
            self.value_text = json.dumps(val)
        else:
            # Store strings and other types as-is
            self.value_text = str(val)


from django.db.models.signals import post_delete
from django.dispatch import receiver

@receiver(post_delete, sender=Tenant)
def tenant_post_delete(sender, instance, **kwargs):
    """
    Drop the schema when a tenant is deleted.
    """
    logger.info(f"Deleting schema for tenant: {instance.name}")
    success = drop_tenant_schema(instance.schema_name)
    if not success:
        logger.error(f"Failed to drop schema for tenant: {instance.name}")
