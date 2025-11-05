from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    ProductViewSet,
    StatusViewSet,
    OrderNoViewSet,
    OrderViewSet,
    CreateOrderAPIView,
    UpdateOrderStatusAPIView,
    CancelOrderAPIView,
)

router = DefaultRouter()
router.register("categories", CategoryViewSet)
router.register("products", ProductViewSet)
router.register("statuses", StatusViewSet)
router.register("ordernos", OrderNoViewSet, basename='orderno')
router.register("orders", OrderViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("create-order/", CreateOrderAPIView.as_view(), name="create-order"),
    path("update-order-status/", UpdateOrderStatusAPIView.as_view(), name="update-order-status"),
    path("cancel-order/", CancelOrderAPIView.as_view(), name="cancel-order"),
]
