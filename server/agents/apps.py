from django.apps import AppConfig


class AgentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'agents'
    verbose_name = 'Agent Management'

    def ready(self):
        # Import signals when app is ready
        try:
            import agents.signals  # noqa
        except ImportError:
            pass
