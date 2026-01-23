from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from .models import CarouselImage, AppConfig
from .serializers import CarouselImageSerializer
from authentication.views.admin_auth import get_admin_from_request


class IsAdminDashboardUser(permissions.BasePermission):
    """
    Custom permission class that checks for AdminUser authentication.
    Works with the separate AdminUser model used by the admin dashboard.
    """
    
    def has_permission(self, request, view):
        # Check for AdminUser JWT authentication
        admin_user = get_admin_from_request(request)
        if admin_user:
            # Attach admin_user to request for use in views
            request.admin_user = admin_user
            return True
        
        # Fallback to Django's built-in staff check
        return request.user and request.user.is_staff


class CarouselImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing carousel images.
    
    Public endpoints:
    - GET /api/content/carousel/ - List active carousel images (no auth required)
    
    Admin endpoints (require authentication):
    - POST /api/content/carousel/ - Create new carousel image
    - PUT/PATCH /api/content/carousel/{id}/ - Update carousel image
    - DELETE /api/content/carousel/{id}/ - Delete carousel image
    - POST /api/content/carousel/reorder/ - Reorder carousel images
    """
    queryset = CarouselImage.objects.all()
    serializer_class = CarouselImageSerializer
    
    def get_permissions(self):
        """
        Allow public read access for active images,
        require admin authentication for modifications
        """
        if self.action == 'list':
            return [permissions.AllowAny()]
        return [IsAdminDashboardUser()]
    
    def get_queryset(self):
        """
        Return only active images for public list view,
        return all images for admin views
        """
        # Check for AdminUser authentication
        admin_user = get_admin_from_request(self.request)
        if self.action == 'list' and not admin_user and not self.request.user.is_staff:
            return CarouselImage.objects.filter(is_active=True)
        return CarouselImage.objects.all()
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminDashboardUser])
    def reorder(self, request):
        """
        Reorder carousel images.
        Expects: { "orders": [{"id": 1, "order": 0}, {"id": 2, "order": 1}, ...] }
        """
        orders = request.data.get('orders', [])
        
        if not orders:
            return Response(
                {'error': 'No order data provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            for item in orders:
                carousel_id = item.get('id')
                new_order = item.get('order')
                
                if carousel_id is None or new_order is None:
                    continue
                
                CarouselImage.objects.filter(id=carousel_id).update(order=new_order)
            
            return Response({'message': 'Carousel images reordered successfully'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def app_config(request):
    """
    Public endpoint that returns app configuration flags.
    Used for feature toggles, version enforcement, and testing modes.
    
    GET /api/content/app-config/
    
    Query params:
    - app_version: Client app version (e.g., '1.2.0')
    - platform: 'ios' or 'android'
    
    Returns:
    {
        "enable_location_skip": true/false,
        "maintenance_mode": false,
        "min_app_version": "1.0.0",
        "force_update": true/false,
        "update_url": "https://play.google.com/..."
    }
    """
    from packaging import version as version_parser
    
    try:
        config = AppConfig.get_config()
        
        # Get client version and platform from query params
        client_version = request.GET.get('app_version', '0.0.0')
        platform = request.GET.get('platform', 'android').lower()
        
        # Check if force update is required
        force_update = False
        update_url = config.force_update_url_android
        
        try:
            if version_parser.parse(client_version) < version_parser.parse(config.min_app_version):
                force_update = True
                update_url = config.force_update_url_ios if platform == 'ios' else config.force_update_url_android
        except Exception as e:
            # If version parsing fails, don't force update
            print(f"Version parsing error: {e}")
        
        response_data = {
            'enable_location_skip': config.enable_location_skip,
            'maintenance_mode': config.maintenance_mode,
            'min_app_version': config.min_app_version,
            'enforce_sell_screen_gate': config.enforce_sell_screen_gate,
            'force_update': force_update,
            'update_url': update_url,
        }
        
        return Response(response_data)
        
    except Exception as e:
        # Return safe defaults on error
        return Response({
            'enable_location_skip': False,
            'maintenance_mode': False,
            'min_app_version': '1.0.0',
            'enforce_sell_screen_gate': True,
            'force_update': False,
            'update_url': 'https://play.google.com/store/apps/details?id=com.scrapiz.app',
        })


@api_view(['PATCH'])
@permission_classes([IsAdminDashboardUser])
def update_app_config(request):
    """
    Update application configuration
    Admin only endpoint
    
    PATCH /api/content/app-config/update/
    
    Body:
    {
        "enforce_sell_screen_gate": true/false,
        "maintenance_mode": true/false,
        "min_app_version": "1.2.0",
        "enable_location_skip": true/false,
        "force_update_url_android": "https://...",
        "force_update_url_ios": "https://..."
    }
    """
    try:
        config = AppConfig.get_config()
        
        # Update fields if provided
        if 'enforce_sell_screen_gate' in request.data:
            config.enforce_sell_screen_gate = request.data['enforce_sell_screen_gate']
        
        if 'maintenance_mode' in request.data:
            config.maintenance_mode = request.data['maintenance_mode']
        
        if 'min_app_version' in request.data:
            config.min_app_version = request.data['min_app_version']
        
        if 'enable_location_skip' in request.data:
            config.enable_location_skip = request.data['enable_location_skip']
        
        if 'force_update_url_android' in request.data:
            config.force_update_url_android = request.data['force_update_url_android']
        
        if 'force_update_url_ios' in request.data:
            config.force_update_url_ios = request.data['force_update_url_ios']
        
        # Set updated_by if user is authenticated
        if hasattr(request, 'admin_user'):
            # AdminUser from admin dashboard
            config.updated_by = None  # AdminUser is separate model
        elif request.user and request.user.is_authenticated:
            config.updated_by = request.user
        
        config.save()
        
        return Response({
            'enforce_sell_screen_gate': config.enforce_sell_screen_gate,
            'maintenance_mode': config.maintenance_mode,
            'min_app_version': config.min_app_version,
            'enable_location_skip': config.enable_location_skip,
            'force_update_url_android': config.force_update_url_android,
            'force_update_url_ios': config.force_update_url_ios,
            'message': 'Configuration updated successfully'
        })
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
