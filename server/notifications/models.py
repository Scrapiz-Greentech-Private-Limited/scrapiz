from user.models import PushToken as UserPushToken


class PushToken(UserPushToken):
    """
    Proxy model for PushToken to display under Notifications in admin
    """
    class Meta:
        proxy = True
        verbose_name = 'Push Token'
        verbose_name_plural = 'Push Tokens'