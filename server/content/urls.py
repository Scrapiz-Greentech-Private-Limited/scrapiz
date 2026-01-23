from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CarouselImageViewSet, app_config, update_app_config

router = DefaultRouter()
router.register(r'carousel', CarouselImageViewSet, basename='carousel')

urlpatterns = [
    path('', include(router.urls)),
    path('app-config/', app_config, name='app-config'),
    path('app-config/update/', update_app_config, name='update-app-config'),
]
