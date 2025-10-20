from django.urls import path
from .views import ServiceBookingAPIView

urlpatterns = [
    path('bookings/', ServiceBookingAPIView.as_view(), name='service-bookings'),
]
