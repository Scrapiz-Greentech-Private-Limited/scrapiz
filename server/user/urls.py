from django.urls import path, include
from .views import (
    AddressAPIView, 
    NotificationPreferenceAPIView,
    RegisterPushTokenAPIView,
    UnregisterPushTokenAPIView,
    PushNotificationPreferencesAPIView
)
from .admin_views import AdminUserAddressesView, AdminAddressDetailView

urlpatterns = [
    path('address/', AddressAPIView.as_view(), name='address'),
    path('address/<int:pk>/', AddressAPIView.as_view(), name='address-detail'),
    path('notification-settings/', NotificationPreferenceAPIView.as_view(), name='notification-settings'),
    path('register-push-token/', RegisterPushTokenAPIView.as_view(), name='register-push-token'),
    path('unregister-push-token/', UnregisterPushTokenAPIView.as_view(), name='unregister-push-token'),
    path('notification-preferences/', PushNotificationPreferencesAPIView.as_view(), name='notification-preferences'),
    # Admin endpoints
    path('admin/addresses/<int:user_id>/', AdminUserAddressesView.as_view(), name='admin-user-addresses'),
    path('admin/address/<int:address_id>/', AdminAddressDetailView.as_view(), name='admin-address-detail'),
]