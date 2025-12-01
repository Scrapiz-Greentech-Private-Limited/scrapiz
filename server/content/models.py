from django.db import models
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError

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
