from .manager import NotificationManager
from .email import EmailNotificationService
from .whatsapp import WhatsappNotification
from .dashboard import DashboardNotification
from .client import ClientService
from .push import PushNotificationService


def send_push_notification_to_user(user_id: int, title: str, message: str, data: dict = None) -> dict:
    """
    Helper function to send a push notification to a specific user.
    
    Args:
        user_id: The ID of the user to send the notification to
        title: Notification title
        message: Notification message
        data: Optional data payload for deep linking
    
    Returns:
        dict with success status and counts
    """
    service = PushNotificationService()
    return service.send_push_notification(
        title=title,
        message=message,
        category='order_updates',
        deep_link_data=data,
        user_ids=[user_id]
    )


__all__ = [
    'NotificationManager',
    'EmailNotificationService', 
    'WhatsappNotification', 
    'DashboardNotification',
    'ClientService',
    'PushNotificationService',
    'send_push_notification_to_user'
]