from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

from .models import ServiceableCity, ServiceablePincode
from .serializers import (
    ServiceableCitySerializer,
    ServiceablePincodeSerializer,
    PincodeCheckRequestSerializer,
    CoordinateCheckRequestSerializer,
    ServiceabilityResponseSerializer
)
from .services import ServiceabilityService


class ServiceableCityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing serviceable cities.
    
    Provides read-only access to serviceable cities with pincode counts.
    Supports filtering by status (available/coming_soon).
    """
    
    queryset = ServiceableCity.objects.all().annotate(
        pincode_count=Count('pincodes')
    ).order_by('name')
    serializer_class = ServiceableCitySerializer
    
    def get_queryset(self):
        """
        Optionally filter cities by status.
        
        Query parameters:
            status: Filter by 'available' or 'coming_soon'
        """
        queryset = super().get_queryset()
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter in ['available', 'coming_soon']:
            queryset = queryset.filter(status=status_filter)
        
        return queryset


class ServiceablePincodeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing serviceable pincodes.
    
    Provides read-only access to serviceable pincodes with city information.
    Supports filtering by city and searching by pincode.
    """
    
    queryset = ServiceablePincode.objects.select_related('city').all().order_by('pincode')
    serializer_class = ServiceablePincodeSerializer
    
    def get_queryset(self):
        """
        Optionally filter pincodes by city.
        
        Query parameters:
            city: Filter by city ID
            search: Search by pincode (partial match)
        """
        queryset = super().get_queryset()
        
        # Filter by city if provided
        city_id = self.request.query_params.get('city', None)
        if city_id:
            queryset = queryset.filter(city_id=city_id)
        
        # Search by pincode if provided
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(pincode__icontains=search)
        
        return queryset


@method_decorator(csrf_exempt, name='dispatch')
class CheckPincodeView(APIView):
    """
    API endpoint to check if a pincode is serviceable.
    
    POST /api/serviceability/check-pincode/
    
    Request body:
        {
            "pincode": "400001"
        }
    
    Response:
        {
            "serviceable": true,
            "city": {
                "id": 1,
                "name": "Mumbai",
                "state": "Maharashtra",
                "latitude": 19.076000,
                "longitude": 72.877700,
                "radius_km": 50.00,
                "status": "available"
            },
            "status": "available",
            "message": "Service available in Mumbai"
        }
    """
    
    def post(self, request):
        """Handle pincode serviceability check"""
        
        # Validate request data
        serializer = PincodeCheckRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'error': 'Invalid request',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get validated pincode
        pincode = serializer.validated_data['pincode']
        
        # Check serviceability using business logic
        try:
            result = ServiceabilityService.check_pincode(pincode)
            return Response(result, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {
                    'error': 'Internal server error',
                    'message': 'An error occurred while checking serviceability'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class CheckCoordinatesView(APIView):
    """
    API endpoint to check if coordinates are within a serviceable area.
    
    POST /api/serviceability/check-coordinates/
    
    Request body:
        {
            "latitude": 19.076000,
            "longitude": 72.877700
        }
    
    Response:
        {
            "serviceable": true,
            "city": {
                "id": 1,
                "name": "Mumbai",
                "state": "Maharashtra",
                "latitude": 19.076000,
                "longitude": 72.877700,
                "radius_km": 50.00,
                "status": "available"
            },
            "distance_km": 5.2,
            "message": "Service available in Mumbai"
        }
    """
    
    def post(self, request):
        """Handle coordinate-based serviceability check"""
        
        # Validate request data
        serializer = CoordinateCheckRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'error': 'Invalid request',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get validated coordinates
        latitude = float(serializer.validated_data['latitude'])
        longitude = float(serializer.validated_data['longitude'])
        
        # Check serviceability using business logic
        try:
            result = ServiceabilityService.check_coordinates(latitude, longitude)
            return Response(result, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {
                    'error': 'Internal server error',
                    'message': 'An error occurred while checking serviceability'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FeatureFlagsView(APIView):
    """
    API endpoint to retrieve feature flags for the mobile client.
    
    GET /api/serviceability/feature-flags/
    
    Response:
        {
            "use_backend_serviceability": false
        }
    """
    
    def get(self, request):
        """Return current feature flag values"""
        return Response(
            {
                'use_backend_serviceability': settings.USE_BACKEND_SERVICEABILITY
            },
            status=status.HTTP_200_OK
        )
