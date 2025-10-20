from django.urls import path, include
from .views import AddressAPIView, NotificationPreferenceAPIView

urlpatterns = [
    path('address/', AddressAPIView.as_view(), name='address'),
    path('notification-settings/', NotificationPreferenceAPIView.as_view(), name='notification-settings'),
]