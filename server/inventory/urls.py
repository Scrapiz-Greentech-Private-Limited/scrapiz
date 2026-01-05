from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    ProductViewSet,
    StatusViewSet,
    OrderNoViewSet,
    OrderViewSet,
    CreateOrderAPIView,
    CancelOrderAPIView,
    # Admin endpoints
    AdminOrderListAPIView,
    AdminOrderDetailAPIView,
    AdminUpdateOrderStatusAPIView,
    AdminCancelOrderAPIView,
    AdminStatusListAPIView,
    AdminAssignAgentAPIView,
    AdminUnassignAgentAPIView,
    AdminSendOrderNotificationAPIView,
    AdminSendOrderEmailAPIView,
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
    path("cancel-order/", CancelOrderAPIView.as_view(), name="cancel-order"),
    
    # Admin Dashboard endpoints
    path("admin/orders/", AdminOrderListAPIView.as_view(), name="admin-order-list"),
    path("admin/orders/<int:order_id>/", AdminOrderDetailAPIView.as_view(), name="admin-order-detail"),
    path("admin/orders/<int:order_id>/status/", AdminUpdateOrderStatusAPIView.as_view(), name="admin-update-order-status"),
    path("admin/orders/cancel/", AdminCancelOrderAPIView.as_view(), name="admin-cancel-order"),
    path("admin/statuses/", AdminStatusListAPIView.as_view(), name="admin-status-list"),
    path("admin/orders/<int:order_id>/assign-agent/", AdminAssignAgentAPIView.as_view(), name="admin-assign-agent"),
    path("admin/orders/<int:order_id>/unassign-agent/", AdminUnassignAgentAPIView.as_view(), name="admin-unassign-agent"),
    path("admin/orders/<int:order_id>/send-notification/", AdminSendOrderNotificationAPIView.as_view(), name="admin-send-order-notification"),
    path("admin/orders/<int:order_id>/send-email/", AdminSendOrderEmailAPIView.as_view(), name="admin-send-order-email"),
]
