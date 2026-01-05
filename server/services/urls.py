from django.urls import path
from .views import (
    ServiceBookingAPIView,
    AdminServiceBookingListAPIView,
    AdminServiceBookingDetailAPIView,
    AdminUpdateServiceBookingStatusAPIView,
)

urlpatterns = [
    path('bookings/', ServiceBookingAPIView.as_view(), name='service-bookings'),
    
    # Admin Dashboard endpoints
    path('admin/bookings/', AdminServiceBookingListAPIView.as_view(), name='admin-service-booking-list'),
    path('admin/bookings/<int:booking_id>/', AdminServiceBookingDetailAPIView.as_view(), name='admin-service-booking-detail'),
    path('admin/bookings/<int:booking_id>/status/', AdminUpdateServiceBookingStatusAPIView.as_view(), name='admin-update-service-booking-status'),
]
