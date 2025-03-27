"""
URL configuration for erp_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken import views as drf_views

# API URL patterns
api_patterns = [
    path('inventory/', include('inventory.urls')),
    path('tenants/', include('tenants.urls')),  # Add tenant management URLs
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_patterns)),  # Version 1 of our API
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),  # DRF browsable API login
    path('api-token-auth/', drf_views.obtain_auth_token),  # Token authentication
    path('', include('core.urls')),  # Add the core URLs at root path
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
