from django.urls import path, include
from .views import AddressAPIView, NotificationPreferenceAPIView

urlpatterns = [
    path('address/', AddressAPIView.as_view(), name='address-list'),
    path('address/<int:pk>/', AddressAPIView.as_view(), name='address-detail'),
    path('notification-settings/', NotificationPreferenceAPIView.as_view(), name='notification-settings'),
]