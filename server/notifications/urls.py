from django.urls import path
from .views import NotificationListAPIView, NotificationDetailAPIView, MarkNotificationReadAPIView, RetryNotificationAPIView,UnreadCountAPIView
from .admin import send_notification_view
from .admin_views import (
    AdminNotificationHistoryAPIView,
    AdminSendPushNotificationAPIView,
    AdminPushTokensAPIView,
    AdminRetryNotificationAPIView,
    AdminUsersWithPushTokensAPIView,
    AdminSendIndividualNotificationAPIView,
)

app_name = 'notifications'

urlpatterns = [
  # User-facing notification endpoints
  path('', NotificationListAPIView.as_view(), name='notification-list'),
  path('unread-count/', UnreadCountAPIView.as_view(), name='unread-count'),
  path('<int:pk>/', NotificationDetailAPIView.as_view(), name='notification-detail'),
  path('<int:pk>/mark-read/', MarkNotificationReadAPIView.as_view(), name='mark-read'),
  path('<int:pk>/retry/', RetryNotificationAPIView.as_view(), name='retry'),
  path('admin/send-push/', send_notification_view, name='admin-send-push'),
  
  # Admin API endpoints (for Next.js dashboard)
  path('admin/history/', AdminNotificationHistoryAPIView.as_view(), name='admin-notification-history'),
  path('admin/send/', AdminSendPushNotificationAPIView.as_view(), name='admin-send-notification'),
  path('admin/push-tokens/', AdminPushTokensAPIView.as_view(), name='admin-push-tokens'),
  path('admin/<int:notification_id>/retry/', AdminRetryNotificationAPIView.as_view(), name='admin-retry-notification'),
  path('admin/users-with-tokens/', AdminUsersWithPushTokensAPIView.as_view(), name='admin-users-with-tokens'),
  path('admin/send-to-user/<int:user_id>/', AdminSendIndividualNotificationAPIView.as_view(), name='admin-send-to-user'),
]