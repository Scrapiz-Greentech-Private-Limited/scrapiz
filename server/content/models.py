from django.db import models
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError


class AppConfig(models.Model):
    """
    Global application configuration (Singleton)
    Only one instance should exist
    """
    enforce_sell_screen_gate = models.BooleanField(
        default=True,
        help_text="If True, users must pass serviceability checks to access sell screen"
    )
    maintenance_mode = models.BooleanField(
        default=False,
        help_text="If True, app shows maintenance screen"
    )
    min_app_version = models.CharField(
        max_length=20,
        default="1.0.0",
        help_text="Minimum required app version (e.g., '1.2.0')"
    )
    enable_location_skip = models.BooleanField(
        default=False,
        help_text="If True, allows skipping location selection for testing"
    )
    force_update_url_android = models.URLField(
        max_length=500,
        default="https://play.google.com/store/apps/details?id=com.scrapiz.app",
        help_text="Play Store URL for Android app updates"
    )
    force_update_url_ios = models.URLField(
        max_length=500,
        default="https://apps.apple.com/app/scrapiz/id123456789",
        help_text="App Store URL for iOS app updates"
    )
    
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='app_config_updates'
    )
    
    class Meta:
        verbose_name = "App Configuration"
        verbose_name_plural = "App Configuration"
    
    def __str__(self):
        return "App Configuration"
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists (singleton pattern)
        if not self.pk and AppConfig.objects.exists():
            raise ValueError("Only one AppConfig instance is allowed")
        return super().save(*args, **kwargs)
    
    @classmethod
    def get_config(cls):
        """Get or create the singleton config instance"""
        config, created = cls.objects.get_or_create(pk=1)
        return config


class CarouselImage(models.Model):
    """Model for managing carousel images displayed on the home screen"""
    title = models.CharField(
        max_length=200, 
        help_text="Title/description of the carousel image (e.g., 'Become A Scrap Seller')"
    )
    image_url = models.URLField(
        max_length=500, 
        help_text="Full S3 URL of the carousel image (e.g., https://scrapiz-inventory.s3.ap-south-1.amazonaws.com/carousel/image.png)"
    )
    order = models.IntegerField(
        default=0, 
        help_text="Display order (0 = first, 1 = second, etc.)"
    )
    is_active = models.BooleanField(
        default=True, 
        help_text="Uncheck to hide this image from the app without deleting it"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = 'Carousel Image'
        verbose_name_plural = 'Carousel Images'
        indexes = [
            models.Index(fields=['order', 'is_active']),
        ]

    def __str__(self):
        status = "✓" if self.is_active else "✗"
        return f"{status} {self.title} (Order: {self.order})"
    
    def clean(self):
        """Validate the image URL"""
        super().clean()
        if self.image_url:
            # Check if URL is from S3
            if 's3' not in self.image_url.lower() and 'amazonaws' not in self.image_url.lower():
                raise ValidationError({
                    'image_url': 'Please provide a valid S3 URL (should contain "s3" or "amazonaws")'
                })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
