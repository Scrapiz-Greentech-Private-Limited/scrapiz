from django.db import models
from django.conf import settings
from authentication.models import User


class PushToken(models.Model):
    """Store Expo Push Tokens for user devices"""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='push_tokens'
    )
    token = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Expo Push Token (ExponentPushToken[...])"
    )
    device_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Optional device identifier"
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this token is valid and active"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time a notification was sent to this token"
    )
    
    class Meta:
        db_table = 'push_tokens'
        ordering = ['-created_at']
        verbose_name = 'Push Token'
        verbose_name_plural = 'Push Tokens'
        indexes = [
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.token[:20]}..."


class AddressModel(models.Model):
    name = models.CharField( max_length=50, null=True, blank=True) #ye delivery location ka naam hai
    user = models.ForeignKey(User, related_name="addresses", on_delete=models.CASCADE)
    phone_number = models.CharField( max_length=13, null=True, blank=True)
    room_number = models.CharField(max_length=50, null=True, blank=True)
    street =  models.CharField(max_length=50, null=True, blank=True)
    area =  models.CharField(max_length=50, null=True, blank=True)
    city =  models.CharField(max_length=50, null=True, blank=True)
    state =  models.CharField(max_length=50, null=True, blank=True)
    country =  models.CharField(max_length=50, null=True, blank=True)
    pincode = models.IntegerField(null= True, blank=True)
    delivery_suggestion = models.CharField(max_length=500, null=True, blank=True)


    def __str__(self):
        return f"{self.name} of user {self.user.email}"


class NotificationPreference(models.Model):
    user = models.OneToOneField(User, related_name="notification_preferences", on_delete=models.CASCADE)
    push_notifications = models.BooleanField(default=True)
    pickup_reminders = models.BooleanField(default=True)
    order_updates = models.BooleanField(default=True)
    payment_alerts = models.BooleanField(default=True)
    promotional_offers = models.BooleanField(default=False)
    weekly_reports = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification preferences for {self.user.email}"