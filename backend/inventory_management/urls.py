from django.urls import path
from . import views

urlpatterns = [
    path('items/', views.get_inventory, name='get_inventory'),
]
