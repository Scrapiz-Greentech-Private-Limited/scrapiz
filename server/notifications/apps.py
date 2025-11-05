from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'
    verbose_name = 'Order Notifications'
    
    def ready(self):
        """Import tasks when app is ready"""
        try:
            import notifications.tasks  # noqa
        except ImportError:
            pass
