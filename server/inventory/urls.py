from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, StatusViewSet, OrderNoViewSet, OrderViewSet, CreateOrderAPIView

router = DefaultRouter()
router.register("categories", CategoryViewSet)
router.register("products", ProductViewSet)
router.register("statuses", StatusViewSet)
router.register("ordernos", OrderNoViewSet)
router.register("orders", OrderViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("create-order/", CreateOrderAPIView.as_view(), name="create-order"),

]
