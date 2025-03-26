from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Tenant(models.Model):
    name = models.CharField(max_length=100)
    schema_name = models.CharField(max_length=63, unique=True)
    created_on = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User, on_delete=models.PROTECT)
    paid_until = models.DateField(null=True, blank=True)
    on_trial = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.schema_name:
            self.schema_name = self.name.lower().replace(' ', '_')
        super().save(*args, **kwargs)

class Domain(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='domains')
    domain = models.CharField(max_length=253, unique=True)
    is_primary = models.BooleanField(default=True)

    def __str__(self):
        return self.domain
