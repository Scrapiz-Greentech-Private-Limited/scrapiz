from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CarouselImageViewSet

router = DefaultRouter()
router.register(r'carousel', CarouselImageViewSet, basename='carousel')

urlpatterns = [
    path('', include(router.urls)),
]
