from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from . import views

# Create a router for tenant endpoints
router = DefaultRouter()
router.register(r'tenants', views.TenantViewSet, basename='tenant')

# Create a nested router for domains within tenants
domains_router = routers.NestedSimpleRouter(router, r'tenants', lookup='tenant')
domains_router.register(r'domains', views.DomainViewSet, basename='tenant-domain')

# Standalone domains router (for superadmin access)
standalone_router = DefaultRouter()
standalone_router.register(r'domains', views.DomainViewSet, basename='domain')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(domains_router.urls)),
    path('', include(standalone_router.urls)),
]
