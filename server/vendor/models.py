import hashlib
from django.db import models
from django.utils import timezone


class Vendor(models.Model):
    VERIFICATION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.OneToOneField(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='vendor',
    )
    full_name = models.CharField(max_length=100)
    age = models.IntegerField(null=True, blank=True)
    profile_image = models.URLField(max_length=500, null=True, blank=True)
    service_city = models.CharField(max_length=100)
    service_area = models.CharField(max_length=255)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    vehicle_type = models.CharField(max_length=50)
    vehicle_number = models.CharField(max_length=50)
    vehicle_owner_name = models.CharField(max_length=100)
    aadhaar_hash = models.CharField(max_length=64, help_text='SHA-256 hash of Aadhaar number')
    id_document_url = models.URLField(max_length=500)
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='pending',
        db_index=True,
    )
    is_active_vendor = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Vendor'
        verbose_name_plural = 'Vendors'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['verification_status']),
            models.Index(fields=['is_active_vendor']),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.get_verification_status_display()})"

    @staticmethod
    def hash_aadhaar(aadhaar_number: str) -> str:
        return hashlib.sha256(aadhaar_number.encode()).hexdigest()


class VendorDocument(models.Model):
    DOCUMENT_TYPES = [
        ('aadhaar', 'Aadhaar Card'),
        ('pan', 'PAN Card'),
        ('driving_license', 'Driving License'),
        ('passport', 'Passport'),
    ]
    VERIFICATION_STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('resubmission_required', 'Resubmission Required'),
    ]

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='documents',
    )
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    document_number = models.CharField(max_length=50)
    document_image_front = models.URLField(max_length=500)
    document_image_back = models.URLField(max_length=500, null=True, blank=True)
    verification_status = models.CharField(
        max_length=25,
        choices=VERIFICATION_STATUS,
        default='pending',
        db_index=True,
    )
    rejection_reason = models.TextField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_vendor_documents',
    )

    class Meta:
        verbose_name = 'Vendor Document'
        verbose_name_plural = 'Vendor Documents'
        unique_together = ['vendor', 'document_type']
        ordering = ['vendor', 'document_type']
        indexes = [
            models.Index(fields=['verification_status']),
        ]

    def verify(self, verified_by_user):
        self.verification_status = 'approved'
        self.verified_at = timezone.now()
        self.verified_by = verified_by_user
        self.rejection_reason = None
        self.save()

    def reject(self, verified_by_user, reason):
        self.verification_status = 'rejected'
        self.verified_at = timezone.now()
        self.verified_by = verified_by_user
        self.rejection_reason = reason
        self.save()

    def request_resubmission(self, verified_by_user, reason):
        self.verification_status = 'resubmission_required'
        self.verified_at = timezone.now()
        self.verified_by = verified_by_user
        self.rejection_reason = reason
        self.save()

    def __str__(self):
        return f"{self.vendor.full_name} - {self.get_document_type_display()}"


class VendorBiometric(models.Model):
    vendor = models.OneToOneField(
        Vendor,
        on_delete=models.CASCADE,
        related_name='biometric',
    )
    embedding_vector = models.JSONField()
    model_version = models.CharField(max_length=50, default='facenet-v1')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Vendor Biometric'
        verbose_name_plural = 'Vendor Biometrics'

    def __str__(self):
        return f"Biometric for {self.vendor.full_name}"


class VendorAuditLog(models.Model):
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('document_uploaded', 'Document Uploaded'),
        ('document_verified', 'Document Verified'),
        ('document_rejected', 'Document Rejected'),
        ('verification_submitted', 'Verification Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('face_uploaded', 'Face Uploaded'),
        ('face_verified', 'Face Verified'),
        ('face_flagged', 'Face Flagged'),
    ]

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='audit_logs',
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES, db_index=True)
    actor = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vendor_audit_logs',
    )
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    previous_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    details = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = 'Vendor Audit Log'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['vendor', 'action']),
            models.Index(fields=['timestamp']),
        ]

    @classmethod
    def log_action(cls, vendor, action, actor=None, previous_value=None, new_value=None, details=None):
        return cls.objects.create(
            vendor=vendor,
            action=action,
            actor=actor,
            previous_value=previous_value,
            new_value=new_value,
            details=details,
        )

    def __str__(self):
        return f"{self.vendor.full_name} - {self.get_action_display()}"


class ArrivalVerification(models.Model):
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='arrival_verifications',
    )
    order = models.ForeignKey(
        'inventory.OrderNo',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    selfie_url = models.URLField(max_length=500)
    similarity_score = models.FloatField()
    is_verified = models.BooleanField(default=False)
    flag_for_manual_review = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Arrival Verification'
        verbose_name_plural = 'Arrival Verifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'is_verified']),
            models.Index(fields=['flag_for_manual_review']),
        ]

    def __str__(self):
        status = 'verified' if self.is_verified else ('flagged' if self.flag_for_manual_review else 'pending')
        return f"Arrival {self.vendor.full_name} - {status}"
