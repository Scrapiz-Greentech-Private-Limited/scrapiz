from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ServiceableCityViewSet,
    ServiceablePincodeViewSet,
    CheckPincodeView,
    CheckCoordinatesView,
    FeatureFlagsView
)

# Create router for viewsets
router = DefaultRouter()
router.register(r'cities', ServiceableCityViewSet, basename='serviceable-city')
router.register(r'pincodes', ServiceablePincodeViewSet, basename='serviceable-pincode')

# URL patterns
urlpatterns = [
    # ViewSet routes (GET /api/serviceability/cities/, GET /api/serviceability/pincodes/)
    path('', include(router.urls)),
    
    # Custom API endpoints
    path('check-pincode/', CheckPincodeView.as_view(), name='check-pincode'),
    path('check-coordinates/', CheckCoordinatesView.as_view(), name='check-coordinates'),
    path('feature-flags/', FeatureFlagsView.as_view(), name='feature-flags'),
]
