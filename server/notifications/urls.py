from django.urls import path
from .views import NotificationListAPIView, NotificationDetailAPIView, MarkNotificationReadAPIView, RetryNotificationAPIView,UnreadCountAPIView
from .admin import send_notification_view

app_name = 'notifications'

urlpatterns = [

  path('', NotificationListAPIView.as_view(), name='notification-list'),
  path('unread-count/', UnreadCountAPIView.as_view(), name='unread-count'),
  path('<int:pk>/', NotificationDetailAPIView.as_view(), name='notification-detail'),
  path('<int:pk>/mark-read/', MarkNotificationReadAPIView.as_view(), name='mark-read'),
  path('<int:pk>/retry/', RetryNotificationAPIView.as_view(), name='retry'),
  path('admin/send-push/', send_notification_view, name='admin-send-push'),


]