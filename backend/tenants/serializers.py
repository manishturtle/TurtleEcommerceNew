from rest_framework import serializers
from .models import Tenant, Domain


class DomainSerializer(serializers.ModelSerializer):
    """Serializer for Domain model"""
    
    class Meta:
        model = Domain
        fields = ['id', 'domain', 'is_primary', 'tenant']
        read_only_fields = ['id']


class TenantSerializer(serializers.ModelSerializer):
    """Serializer for Tenant model with nested domains"""
    
    domains = DomainSerializer(many=True, read_only=True)
    
    class Meta:
        model = Tenant
        fields = ['id', 'name', 'schema_name', 'created_on', 'owner', 
                 'paid_until', 'on_trial', 'is_active', 'domains']
        read_only_fields = ['id', 'created_on', 'schema_name']


class TenantCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new tenant with a primary domain"""
    
    domain = serializers.CharField(
        max_length=253,
        write_only=True,
        help_text="Primary domain for this tenant (e.g., customer1.example.com)"
    )
    
    class Meta:
        model = Tenant
        fields = ['name', 'domain', 'paid_until', 'on_trial', 'is_active']
    
    def create(self, validated_data):
        domain_name = validated_data.pop('domain')
        
        # Create the tenant
        tenant = Tenant.objects.create(
            owner=self.context['request'].user,
            **validated_data
        )
        
        # Create the primary domain for this tenant
        Domain.objects.create(
            tenant=tenant,
            domain=domain_name,
            is_primary=True
        )
        
        return tenant
