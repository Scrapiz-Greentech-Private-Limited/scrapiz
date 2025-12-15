from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import CustomUserManager
from django.utils import timezone


class User(AbstractBaseUser, PermissionsMixin):
    name = models.CharField(max_length=50)
    email = models.EmailField(max_length=254, unique=True)
    password = models.CharField(max_length=500)  # Consider using Django's built-in password hashing
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_expiration = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)  # Default to True for active users
    is_staff = models.BooleanField(default=False)  
    date_joined = models.DateTimeField(default=timezone.now)  # Add this line
    is_superuser = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=14, default= False, null=True)
    gender = models.CharField(
        max_length=20,
        choices=[
            ('male', 'Male'),
            ('female', 'Female'),
            ('prefer_not_to_say', 'Prefer not to say'),
        ],
        null=True,
        blank=True
    )
    session_id = models.CharField(max_length=255, null=True, blank=True)
    referral_code = models.CharField(max_length = 255, unique=True , null = True , blank = True , db_index = True)
    referred_by = models.ForeignKey('self',on_delete=models.SET_NULL,null=True,blank=True,related_name='referrals')
    referred_balance = models.DecimalField(max_digits=10,decimal_places=2,default=0.00)
    has_completed_first_order = models.BooleanField(default=False)
    profile_image = models.URLField(max_length=500, null=True, blank=True)
    is_deleted = models.BooleanField(default=False , db_index=True)
    deleted_at = models.DateTimeField(null= True , blank = True)
    apple_user_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text="Apple's unique user identifier (sub claim)"
    )
    
    # Push Notification Preference Fields
    push_notification_enabled = models.BooleanField(default=True)
    notify_order_updates = models.BooleanField(default=True)
    notify_promotions = models.BooleanField(default=True)
    notify_announcements = models.BooleanField(default=True)
    notify_general = models.BooleanField(default=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()
    
    class Meta:
        permissions = [
            ("can_send_push_notifications", "Can send push notifications to users"),
        ]

    def __str__(self):
        return self.email

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('password_reset', 'Password Reset'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('oauth_login', 'OAuth Login'),
        ('apple_oauth_login', 'Apple OAuth Login'),
        ('account_deleted', 'Account Deleted')
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email if self.user else 'Unknown'} - {self.action} at {self.timestamp}"
        
class AccountDeletionFeedback(models.Model):
  REASON_CHOICES = [
    ('better_alternative', 'Found a better alternative'),
    ('not_using', 'Not using the service anymore'),
    ('privacy_concerns', 'Privacy concerns'),
    ('difficult_to_use', 'Difficult to use'),
    ('other', 'Other'),
  ]
  
  user_id = models.IntegerField(
    help_text="Original user ID (preserved for analytics)"
  )
  user_email = models.EmailField(
    max_length=254,
    help_text="Email at time of deletion (for audit trail)"
  )
  
  user_name = models.CharField(max_length=50)
  reason = models.CharField(max_length=50,choices=REASON_CHOICES)
  comments = models.TextField(max_length=500, blank=True, null=True)
  deleted_at = models.DateTimeField(auto_now_add = True)
  class Meta:
    db_table = 'account_deletion_feedback'
    ordering = ['-deleted_at']
    verbose_name = 'Account Deletion Feedback'
    verbose_name_plural = 'Account Deletion Feedbacks'
  def __str__(self):
    return f"Feedback from {self.user_email} - {self.reason}"