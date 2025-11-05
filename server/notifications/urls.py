"""
URL configuration for notifications API
"""
from django.urls import path
from .views import (
    NotificationListAPIView,
    NotificationDetailAPIView,
    MarkNotificationReadAPIView,
    RetryNotificationAPIView,
    UnreadCountAPIView,
    NotificationHealthAPIView,
    TestNotificationAPIView,
)

app_name = 'notifications'

urlpatterns = [
    # List and filter notifications
    path('', NotificationListAPIView.as_view(), name='notification-list'),
    
    # Unread count
    path('unread-count/', UnreadCountAPIView.as_view(), name='unread-count'),
    
    # Health check
    path('health/', NotificationHealthAPIView.as_view(), name='health'),
    
    # Test notification
    path('test/', TestNotificationAPIView.as_view(), name='test'),
    
    # Single notification operations
    path('<int:pk>/', NotificationDetailAPIView.as_view(), name='notification-detail'),
    path('<int:pk>/mark-read/', MarkNotificationReadAPIView.as_view(), name='mark-read'),
    path('<int:pk>/retry/', RetryNotificationAPIView.as_view(), name='retry'),
]
