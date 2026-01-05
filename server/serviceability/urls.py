from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ServiceableCityViewSet,
    ServiceablePincodeViewSet,
    ServiceAreaViewSet,
    CheckPincodeView,
    CheckCoordinatesView,
    FeatureFlagsView,
    PublicCitiesView,
    PublicPincodesView
)

# Create router for viewsets
router = DefaultRouter()
router.register(r'cities', ServiceableCityViewSet, basename='serviceable-city')
router.register(r'pincodes', ServiceablePincodeViewSet, basename='serviceable-pincode')
router.register(r'areas', ServiceAreaViewSet, basename='service-area')

# URL patterns
urlpatterns = [
    # ViewSet routes (GET /api/serviceability/cities/, GET /api/serviceability/pincodes/, GET /api/serviceability/areas/)
    path('', include(router.urls)),
    
    # Custom API endpoints
    path('check-pincode/', CheckPincodeView.as_view(), name='check-pincode'),
    path('check-coordinates/', CheckCoordinatesView.as_view(), name='check-coordinates'),
    path('feature-flags/', FeatureFlagsView.as_view(), name='feature-flags'),
    
    # Public endpoints for mobile app caching (no auth required)
    path('public/cities/', PublicCitiesView.as_view(), name='public-cities'),
    path('public/pincodes/', PublicPincodesView.as_view(), name='public-pincodes'),
]
