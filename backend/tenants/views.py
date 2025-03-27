from django.shortcuts import render
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination

from .models import Tenant, Domain
from .serializers import TenantSerializer, TenantCreateSerializer, DomainSerializer
from .mixins import TenantViewMixin


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class TenantViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing tenants.
    
    Only superusers can list all tenants. Regular users can only view their own tenants.
    """
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'schema_name']
    ordering_fields = ['name', 'created_on']
    ordering = ['name']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Tenant.objects.all()
        return Tenant.objects.filter(owner=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TenantCreateSerializer
        return TenantSerializer
    
    def get_permissions(self):
        """
        Only superusers can create new tenants or modify existing ones.
        Regular users can only view their own tenants.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Create a new tenant with the current user as owner"""
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a tenant"""
        tenant = self.get_object()
        tenant.is_active = True
        tenant.save()
        return Response({'status': 'tenant activated'})
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a tenant"""
        tenant = self.get_object()
        tenant.is_active = False
        tenant.save()
        return Response({'status': 'tenant deactivated'})


class DomainViewSet(TenantViewMixin, viewsets.ModelViewSet):
    """
    API endpoint for managing tenant domains.
    
    Only superusers or tenant owners can manage domains.
    """
    serializer_class = DomainSerializer
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        tenant_id = self.kwargs.get('tenant_pk')
        if tenant_id:
            # Filter domains by tenant
            return Domain.objects.filter(tenant_id=tenant_id)
        
        # If user is superuser, return all domains
        user = self.request.user
        if user.is_superuser:
            return Domain.objects.all()
        
        # Otherwise, return domains for tenants owned by the user
        return Domain.objects.filter(tenant__owner=user)
    
    def get_permissions(self):
        """
        Only superusers or tenant owners can manage domains.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        """Ensure domain is created for the correct tenant"""
        tenant_id = self.kwargs.get('tenant_pk')
        if tenant_id:
            serializer.save(tenant_id=tenant_id)
        else:
            serializer.save()
            
    @action(detail=True, methods=['post'])
    def set_primary(self, request, pk=None, tenant_pk=None):
        """Set this domain as the primary domain for the tenant"""
        domain = self.get_object()
        tenant = domain.tenant
        
        # Ensure user has permission
        if not request.user.is_superuser and tenant.owner != request.user:
            return Response(
                {"error": "You don't have permission to modify this tenant's domains"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        with transaction.atomic():
            # Set all other domains as non-primary
            tenant.domains.exclude(pk=domain.pk).update(is_primary=False)
            
            # Set this domain as primary
            domain.is_primary = True
            domain.save()
            
        return Response({'status': 'domain set as primary'})
