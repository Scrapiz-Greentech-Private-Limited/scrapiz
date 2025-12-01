from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CarouselImage
from .serializers import CarouselImageSerializer

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
        return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        """
        Return only active images for public list view,
        return all images for admin views
        """
        if self.action == 'list' and not self.request.user.is_staff:
            return CarouselImage.objects.filter(is_active=True)
        return CarouselImage.objects.all()
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
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
