from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
import logging
from .models import ServiceableCity, ServiceablePincode, ServiceArea
from .serializers import (
    ServiceableCitySerializer,
    ServiceablePincodeSerializer,
    PincodeCheckRequestSerializer,
    CoordinateCheckRequestSerializer,
    ServiceabilityResponseSerializer
)
from .services import ServiceabilityService
from utils.usercheck import authenticate_request
from agents.models import Agent
from agents.serializers import AgentListSerializer
from .serializers import (
    ServiceableCitySerializer,
    ServiceAreaSerializer,
    ServiceAreaListSerializer,
    ServiceablePincodeSerializer,
    PincodeCheckRequestSerializer,
    CoordinateCheckRequestSerializer,
    ServiceabilityResponseSerializer
)
logger = logging.getLogger(__name__)

class ServiceableCityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CRUD Operations serviceable cities.
    
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
        
        
        status_filter = self.request.query_params.get('status', None)
        if status_filter in ['available', 'coming_soon']:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    def _get_authenticated_user(self):
      try:
        return authenticate_request(self.request, need_user=True)
      except AuthenticationFailed as e:
        raise e
    def _check_admin_privileges(self, user):
      if not user.is_staff and not user.is_superuser:
        raise AuthenticationFailed('Admin privileges required')
    def list(self, request , *args, **kwargs):
      try:
        user = self._get_authenticated_user()
        self._check_admin_privileges(user)
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
          'count': queryset.count(),
          'results': serializer.data
        },status=status.HTTP_200_OK)
      except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
      except Exception as e:
        logger.error(f"Error listing cities: {str(e)}", exc_info=True)
        return Response(
          {'error': 'Failed to retrieve cities'},
          status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    def create(self, request, *args, **kwargs):
      """
      Create a new serviceable city.
      POST /api/serviceability/cities/
      
      """
      try:
        user = self._get_authenticated_user()
        self._check_admin_privileges(user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        logger.info(f"City '{serializer.data.get('name')}' created by {user.email}")
        return Response(serializer.data, status=status.HTTP_201_CREATED)
      except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
      except Exception as e:
        logger.error(f"Error creating city: {str(e)}", exc_info=True)
        return Response(
          {'error': f'Failed to create city: {str(e)}'},
          status=status.HTTP_400_BAD_REQUEST
        )
    def retrieve(self, request, *args, **kwargs):
      try:
        user = self._get_authenticated_user()
        self._check_admin_privileges(user)
        return super().retrieve(request, *args, **kwargs)
      except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
      except Exception as e:
        logger.error(f"Error retrieving city: {str(e)}", exc_info=True)
        return Response(
          {'error': 'Failed to retrieve city'},
          status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    def update(self, request, *args, **kwargs):
      try:
        user = self._get_authenticated_user()
        self._check_admin_privileges(user)
        instance  = self.get_object()
        old_status = instance.status
        response = super().update(request, *args, **kwargs)
        logger.info(f"City '{instance.name}' updated by {user.email}")
        return response
      except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
      except Exception as e:
        logger.error(f"Error updating city: {str(e)}", exc_info=True)
        return Response(
          {'error': f'Failed to update city: {str(e)}'},
          status=status.HTTP_400_BAD_REQUEST
        )
    def partial_update(self, request, *args, **kwargs):
      try:
        user = self._get_authenticated_user()
        self._check_admin_privileges(user)
        instance = self.get_object()
        old_status = instance.status
        response = super().partial_update(request, *args, **kwargs)
        instance.refresh_from_db()
        if 'status' in request.data and old_status != instance.status:
          logger.info(
            f"City '{instance.name}' status changed from {old_status} to {instance.status} by {user.email}"
          )
        return Response
      except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
      except Exception as e:
        logger.error(f"Error updating city: {str(e)}", exc_info=True)
        return Response(
          {'error': f'Failed to update city: {str(e)}'},
          status=status.HTTP_400_BAD_REQUEST
        )
    def destroy(self, request, *args, **kwargs):
      try:
        user = self._get_authenticated_user()
        self._check_admin_privileges(user)
        instance = self.get_object()
        city_name = instance.name
        pincode_count = instance.pincodes.count()
        logger.info(f"City '{city_name}' with {pincode_count} pincodes deleted by {user.email}")
        return super().destroy(request, *args, **kwargs)
      except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
      except Exception as e:
        logger.error(f"Error deleting city: {str(e)}", exc_info=True)
        return Response(
          {'error': 'Failed to delete city'},
          status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )      


class ServiceablePincodeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for listing serviceable pincodes.
    
    Provides read-only access to serviceable pincodes with city information.
    Supports filtering by city and searching by pincode.
    """
    
    queryset = ServiceablePincode.objects.select_related('city').prefetch_related('pincode_agents', 'areas').all().order_by('pincode')
    serializer_class = ServiceablePincodeSerializer
    def _get_authenticated_user(self):
      try:
        return authenticate_request(self.request, need_user=True)
      except AuthenticationFailed as e:
        raise e
    def _check_admin_privileges(self, user):
      if not user.is_staff and not user.is_superuser:
        raise AuthenticationFailed('Admin privileges required')
        
    def get_queryset(self):
        """
        Optionally filter pincodes by city.
        
        Query parameters:
            city: Filter by city ID
            search: Search by pincode (partial match)
        """
        queryset = super().get_queryset()
        
        
        city_id = self.request.query_params.get('city', None)
        if city_id:
            queryset = queryset.filter(city_id=city_id)
        
        
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(pincode__icontains=search)
        
        return queryset
    def list(self,request,*args,**kwargs):
      try:
        user = self._get_authenticated_user()
        self._check_admin_privileges(user)
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(
        {'count': queryset.count(),
        'results': serializer.data
        },status=status.HTTP_200_OK)
      except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
      except Exception as e:
        logger.error(f"Error listing pincodes: {str(e)}", exc_info=True)
        return Response(
          {'error': 'Failed to retrieve pincodes'},
          status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    def create(self, request, *args, **kwargs):
      try:
        user = self._get_authenticated_user()
        self._check_admin_privileges(user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        logger.info(f"Pincode '{serializer.data.get('pincode')}' created by {user.email}")
        return Response(serializer.data, status=status.HTTP_201_CREATED)
      except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
      except Exception as e:
        logger.error(f"Error creating pincode: {str(e)}", exc_info=True)
        return Response(
          {'error': f'Failed to create pincode: {str(e)}'},
          status=status.HTTP_400_BAD_REQUEST
        )
    def retrieve(self, request, *args, **kwargs):
      try:
        user = self._get_authenticated_user()
        self._check_admin_privileges(user)
        return super().retrieve(request, *args, **kwargs)
      except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
      except Exception as e:
        logger.error(f"Error retrieving pincode: {str(e)}", exc_info=True)
        return Response(
          {'error': 'Failed to retrieve pincode'},
          status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    def update(self, request, *args, **kwargs):
      try:
        user = self._get_authenticated_user()
        self._check_admin_privileges(user)
        instance = self.get_object()
        response = super().update(request, *args, **kwargs)
        logger.info(f"Pincode '{instance.pincode}' updated by {user.email}")
        return response
      except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
      except Exception as e:
        logger.error(f"Error updating pincode: {str(e)}", exc_info=True)
        return Response(
          {'error': f'Failed to update pincode: {str(e)}'},
          status=status.HTTP_400_BAD_REQUEST
        )
    def partial_update(self, request, *args, **kwargs):
      try:
        user = self._get_authenticated_user()
        self._check_admin_privileges(user)
        instance = self.get_object()
        old_city_id = instance.city_id
        response = super().partial_update(request, *args, **kwargs)
        instance.refresh_from_db()
        if 'city' in request.data and old_city_id != instance.city_id:
          logger.info(
            f"Pincode '{instance.pincode}' moved from city {old_city_id} to {instance.city_id} by {user.email}"
          )
        return response
      except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
      except Exception as e:
        logger.error(f"Error updating pincode: {str(e)}", exc_info=True)
        return Response(
          {'error': f'Failed to update pincode: {str(e)}'},
          status=status.HTTP_400_BAD_REQUEST
        )
    def destroy(self, request, *args, **kwargs):
      try:
        user = self._get_authenticated_user()
        self._check_admin_privileges(user)
        instance = self.get_object()
        pincode_value = instance.pincode
        area_name = instance.area_name
        logger.info(f"Pincode '{pincode_value}' ({area_name}) deleted by {user.email}")
        return super().destroy(request, *args, **kwargs)
      except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
      except Exception as e:
        logger.error(f"Error deleting pincode: {str(e)}", exc_info=True)
        return Response(
          {'error': 'Failed to delete pincode'},
          status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    @action(detail=True, methods=['get'], url_path='agents')
    def agents(self, request, pk=None):
      try:
        user = self._get_authenticated_user()
        self._check_admin_privileges(user)
        pincode = self.get_object()
        area_ids = pincode.areas.values_list('id', flat=True)
        all_agents = Agent.objects.filter(
          Q(service_pincodes=pincode) |
          Q(service_areas__id__in=area_ids)
        ).distinct()
        serializer = AgentListSerializer(all_agents, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
      except AuthenticationFailed as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
      except Exception as e:
        logger.error(f"Error getting agents for pincode: {str(e)}", exc_info=True)
        return Response(
              {'error': 'Failed to retrieve agents'},
              status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
class ServiceAreaViewSet(viewsets.ModelViewSet):
  """
  ViewSet for CRUD operations on service areas within pincodes.
  """
  queryset = ServiceArea.objects.select_related('pincode', 'pincode__city').prefetch_related('agents').all().order_by('pincode__pincode', 'name')
  serializer_class = ServiceAreaSerializer
  def _get_authenticated_user(self):
     try:
       return authenticate_request(self.request, need_user=True)
     except AuthenticationFailed as e:
       raise e
  def _check_admin_privileges(self, user):
     if not user.is_staff and not user.is_superuser:
       raise AuthenticationFailed('Admin privileges required')
  def get_queryset(self):
     queryset = super().get_queryset()
     pincode_id = self.request.query_params.get('pincode', None)
     if pincode_id:
       queryset = queryset.filter(pincode_id=pincode_id)
     pincode_code = self.request.query_params.get('pincode_code', None)
     if pincode_code:
       queryset = queryset.filter(pincode__pincode=pincode_code)
     city_id = self.request.query_params.get('city', None)
     if city_id:
       queryset = queryset.filter(pincode__city_id=city_id)
     search = self.request.query_params.get('search', None)
     if search:
       queryset = queryset.filter(name__icontains=search)
     is_active = self.request.query_params.get('is_active', None)
     if is_active is not None:
       queryset = queryset.filter(is_active=is_active.lower() == 'true')
     return queryset
  def list(self,request,*args,**kwargs):
     try:
       user = self._get_authenticated_user()
       self._check_admin_privileges(user)
       queryset = self.get_queryset()
       serializer = self.get_serializer(queryset, many=True)
       return Response({
         'count': queryset.count(),
         'results': serializer.data
       },status=status.HTTP_200_OK)
     except AuthenticationFailed as e:
       return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
     except Exception as e:
       logger.error(f"Error listing areas: {str(e)}", exc_info=True)
       return Response(
         {'error': 'Failed to retrieve areas'},
         status=status.HTTP_500_INTERNAL_SERVER_ERROR
       )
  def create(self, request, *args, **kwargs):
     try:
       user = self._get_authenticated_user()
       self._check_admin_privileges(user)
       serializer = self.get_serializer(data=request.data)
       serializer.is_valid(raise_exception=True)
       serializer.save()
       logger.info(f"Area '{serializer.data.get('name')}' created by {user.email}")
       return Response(serializer.data, status=status.HTTP_201_CREATED)
     except AuthenticationFailed as e:
       return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
     except Exception as e:
       logger.error(f"Error creating area: {str(e)}", exc_info=True)
       error_message = str(e)
       if 'unique' in error_message.lower() or 'duplicate' in error_message.lower():
         return Response({
           'error': 'Area with this name already exists in this pincode'
         }, status=status.HTTP_409_CONFLICT)
       return Response({'error': f'Failed to create area: {str(e)}'},status=status.HTTP_400_BAD_REQUEST)
  def retrieve(self,request,*args,**kwargs):
     try:
       user = self._get_authenticated_user()
       self._check_admin_privileges(user)
       return super().retrieve(request, *args, **kwargs)
     except AuthenticationFailed as e:
       return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
     except Exception as e:
       return Response({
         'error': 'Failed to retrieve area'
       },status=status.HTTP_500_INTERNAL_SERVER_ERROR)
       
  def update(self, request, *args, **kwargs):
     try:
       user = self._get_authenticated_user()
       self._check_admin_privileges(user)
       instance = self.get_object()
       response = super().update(request, *args, **kwargs)
       return response
     except AuthenticationFailed as e:
       return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
     except Exception as e:
       return Response({
         'error': f'Failed to update area: {str(e)}'
       }, status=status.HTTP_400_BAD_REQUEST)
       
  def partial_update(self, request, *args, **kwargs):
     try:
       user = self._get_authenticated_user()
       self._check_admin_privileges(user)
       instance = self.get_object()
       response = super().partial_update(request, *args, **kwargs)
       return response
     except AuthenticationFailed as e:
       return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
     except Exception as e:
       logger.error(f"Error updating area: {str(e)}", exc_info=True)
       return Response(
         {'error': f'Failed to update area: {str(e)}'},
         status=status.HTTP_400_BAD_REQUEST
       )
  def destroy(self, request, *args, **kwargs):
     try:
       user = self._get_authenticated_user()
       self._check_admin_privileges(user)
       instance = self.get_object()
       area_name = instance.name
       pincode = instance.pincode.pincode
       return super().destroy(request, *args, **kwargs)
     except AuthenticationFailed as e:
       return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
     except Exception as e:
       logger.error(f"Error deleting area: {str(e)}", exc_info=True)
       return Response(
         {'error': 'Failed to delete area'},
         status=status.HTTP_500_INTERNAL_SERVER_ERROR
       )
  @action(detail=True, methods=['get'], url_path='agents')
  def agents(self, request, pk=None):
     try:
       user = self._get_authenticated_user()
       self._check_admin_privileges(user)
       area = self.get_object()
       area_agents = area.agents.all()  
       pincode_agents = area.pincode.pincode_agents.all()
       all_agents = (area_agents | pincode_agents).distinct()
       serializer = AgentListSerializer(all_agents, many=True)
       return Response(serializer.data, status=status.HTTP_200_OK)
     except AuthenticationFailed as e:
       return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
     except Exception as e:
       logger.error(f"Error getting agents for area: {str(e)}", exc_info=True)
       return Response({
         'error': 'Failed to retrieve agents'
       }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)   
       
       
     
     
     
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
        
        serializer = PincodeCheckRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'error': 'Invalid request',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        
        pincode = serializer.validated_data['pincode']
        
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
@method_decorator(csrf_exempt, name='dispatch')
class PublicCitiesView(APIView):
  def get(self, request):
    try:
      cities = ServiceableCity.objects.filter(status='available').values(
        'id', 'name', 'state', 'latitude', 'longitude', 'radius_km', 'status'
      )
      cities_list = []
      
      for city in  cities:
        cities_list.append({
          'id': city['id'],
          'name': city['name'],
          'state': city['state'],
          'latitude': float(city['latitude']),
          'longitude': float(city['longitude']),
          'radius_km': float(city['radius_km']),
          'status': city['status'],
        })
      return Response(cities_list, status=status.HTTP_200_OK)
    except Exception as e:
      logger.error(f"Error fetching public cities: {str(e)}", exc_info=True)
      return Response(
        {'error': 'Failed to fetch cities'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
      )
      

      
@method_decorator(csrf_exempt, name='dispatch')
class PublicPincodesView(APIView):
    """
    Public API endpoint to get all serviceable pincodes for mobile app caching.
    
    GET /api/serviceability/public/pincodes/
    
    Response:
        ["400001", "400002", "400003", ...]
    """
    
    def get(self, request):
        """Return all serviceable pincodes (public endpoint for mobile caching)"""
        try:
            # Only return pincodes from available cities
            pincodes = ServiceablePincode.objects.filter(
                city__status='available'
            ).values_list('pincode', flat=True)
            
            return Response(list(pincodes), status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching public pincodes: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch pincodes'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )