from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from .models import CarouselImage
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
    Used for feature toggles and testing modes.
    
    GET /api/content/app-config/
    
    Returns:
    {
        "enable_location_skip": true/false,
        "maintenance_mode": false,
        "min_app_version": "1.0.0"
    }
    """
    config = {
        # Enable location skip for testers
        # Can be controlled via Django settings or environment variable
        'enable_location_skip': getattr(settings, 'ENABLE_LOCATION_SKIP', False),
        
        # Other app-wide configuration flags
        'maintenance_mode': getattr(settings, 'MAINTENANCE_MODE', False),
        'min_app_version': getattr(settings, 'MIN_APP_VERSION', '1.0.0'),
    }
    
    return Response(config)
