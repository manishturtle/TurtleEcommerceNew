from django.urls import path, include
from rest_framework_nested import routers
from .views import (
    FulfillmentLocationViewSet,
    AdjustmentReasonViewSet,
    InventoryViewSet,
    InventoryAdjustmentViewSet,
    SerializedInventoryViewSet,
    LotViewSet,
)

# Create a top-level router
router = routers.DefaultRouter()
router.register(r'fulfillment-locations', FulfillmentLocationViewSet, basename='fulfillmentlocation')
router.register(r'adjustment-reasons', AdjustmentReasonViewSet, basename='adjustmentreason')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'inventory-adjustments', InventoryAdjustmentViewSet, basename='inventoryadjustment')  # For top-level POST
router.register(r'serialized-inventory', SerializedInventoryViewSet, basename='serializedinventory')
router.register(r'lots', LotViewSet, basename='lot')

# Create a nested router for adjustments under inventory items
inventory_router = routers.NestedDefaultRouter(router, r'inventory', lookup='inventory')
inventory_router.register(r'adjustments', InventoryAdjustmentViewSet, basename='inventory-adjustments-list')
# This registers GET for /api/v1/inventory/{inventory_pk}/adjustments/

urlpatterns = [
    path('', include(router.urls)),
    path('', include(inventory_router.urls)),
]
