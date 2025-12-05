from django.db import models
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
import re


class ServiceableCity(models.Model):
    """Model for managing cities where Scrapiz provides services"""
    
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('coming_soon', 'Coming Soon'),
    ]
    
    name = models.CharField(
        max_length=100,
        help_text="Name of the city (e.g., 'Mumbai', 'Delhi')"
    )
    state = models.CharField(
        max_length=100,
        help_text="State where the city is located (e.g., 'Maharashtra', 'Delhi')"
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[
            MinValueValidator(-90.0, message="Latitude must be between -90 and 90"),
            MaxValueValidator(90.0, message="Latitude must be between -90 and 90")
        ],
        help_text="Latitude coordinate of the city center"
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[
            MinValueValidator(-180.0, message="Longitude must be between -180 and 180"),
            MaxValueValidator(180.0, message="Longitude must be between -180 and 180")
        ],
        help_text="Longitude coordinate of the city center"
    )
    radius_km = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0.01, message="Radius must be greater than 0")],
        help_text="Service radius in kilometers from the city center"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='available',
        help_text="Service status: 'available' for active service, 'coming_soon' for planned expansion"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Serviceable City'
        verbose_name_plural = 'Serviceable Cities'
        ordering = ['name']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['latitude', 'longitude']),
        ]
    
    def __str__(self):
        status_icon = "✓" if self.status == 'available' else "⏳"
        return f"{status_icon} {self.name}, {self.state}"
    
    def clean(self):
        """Validate model fields"""
        super().clean()
        
        # Validate that name and state are not empty
        if not self.name or not self.name.strip():
            raise ValidationError({'name': 'City name is required'})
        
        if not self.state or not self.state.strip():
            raise ValidationError({'state': 'State name is required'})
        
        # Validate latitude range
        if self.latitude is not None and (self.latitude < -90 or self.latitude > 90):
            raise ValidationError({'latitude': 'Latitude must be between -90 and 90'})
        
        # Validate longitude range
        if self.longitude is not None and (self.longitude < -180 or self.longitude > 180):
            raise ValidationError({'longitude': 'Longitude must be between -180 and 180'})
        
        # Validate radius
        if self.radius_km is not None and self.radius_km <= 0:
            raise ValidationError({'radius_km': 'Radius must be greater than 0'})
    
    def save(self, *args, **kwargs):
        """Override save to ensure validation"""
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def pincode_count(self):
        """Return the count of pincodes associated with this city"""
        return self.pincodes.count()


class ServiceablePincode(models.Model):
    """Model for managing pincodes within serviceable cities"""
    
    # Pincode validator: exactly 6 digits, starting with 1-9
    pincode_validator = RegexValidator(
        regex=r'^[1-9]\d{5}$',
        message='Pincode must be exactly 6 digits and start with 1-9'
    )
    
    pincode = models.CharField(
        max_length=6,
        unique=True,
        validators=[pincode_validator],
        help_text="6-digit Indian postal code (e.g., '400001')"
    )
    city = models.ForeignKey(
        ServiceableCity,
        on_delete=models.CASCADE,
        related_name='pincodes',
        help_text="The serviceable city this pincode belongs to"
    )
    area_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Optional area name for this pincode (e.g., 'Andheri West')"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Serviceable Pincode'
        verbose_name_plural = 'Serviceable Pincodes'
        ordering = ['pincode']
        indexes = [
            models.Index(fields=['pincode']),
        ]
    
    def __str__(self):
        if self.area_name:
            return f"{self.pincode} - {self.area_name} ({self.city.name})"
        return f"{self.pincode} ({self.city.name})"
    
    def clean(self):
        """Validate pincode format"""
        super().clean()
        
        if self.pincode:
            # Remove any whitespace
            self.pincode = self.pincode.strip()
            
            # Validate format: exactly 6 digits, starting with 1-9
            if not re.match(r'^[1-9]\d{5}$', self.pincode):
                raise ValidationError({
                    'pincode': 'Pincode must be exactly 6 digits and start with 1-9'
                })
    
    def save(self, *args, **kwargs):
        """Override save to ensure validation"""
        self.full_clean()
        super().save(*args, **kwargs)
