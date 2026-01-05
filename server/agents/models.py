import random
import string
from django.db import models
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone


class Agent(models.Model):
  """
  Core agent model for pickup executors
  Manages agent information, status, KYC verification, capacity, and performance metrics.
  """
  STATUS_CHOICES= [
    ('onboarding', 'Onboarding'),
    ('active', 'Active'),
    ('inactive', 'Inactive'),
    ('suspended', 'Suspended'),
  ]
  KYC_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('verified', 'Verified'),
    ('rejected', 'Rejected'),
  ]
  AVAILABILITY_CHOICES = [
    ('available', 'Available'),
    ('on_duty', 'On Duty'),
    ('offline', 'Offline'),
  ]
  phone_validator = RegexValidator(regex=r'^\+?[1-9]\d{9,14}$')
  agent_code = models.CharField(max_length=12,unique=True,db_index=True,editable=False)
  name = models.CharField(max_length=100)
  phone = models.CharField(max_length=15,unique=True,validators=[phone_validator])
  email = models.EmailField(unique=True)
  address = models.TextField()
  profile_image_url = models.URLField(max_length=500,null=True,blank=True)
  status = models.CharField(max_length=20,choices=STATUS_CHOICES,default='onboarding',db_index=True)
  kyc_status = models.CharField(max_length=20,choices=KYC_STATUS_CHOICES,default='pending',db_index=True)
  availability = models.CharField(max_length=20,choices=AVAILABILITY_CHOICES, default='offline',db_index=True)
  vehicle_number = models.CharField(max_length=20,null=True,blank=True)
  vehicle_type = models.CharField(max_length=50,null=True,blank=True)
  vehicle_registration_url = models.URLField(max_length=500,null=True,blank=True)
  daily_capacity = models.PositiveIntegerField(default=10,validators=[MinValueValidator(1), MaxValueValidator(100)])
  current_day_orders = models.PositiveIntegerField(default=0)
  last_order_reset = models.DateField(auto_now_add=True)
  total_orders = models.PositiveIntegerField(default = 0)
  completed_orders = models.PositiveIntegerField(default=0)
  total_weight_collected = models.DecimalField(max_digits=10,decimal_places=2,default=0,validators=[MinValueValidator(0)])
  average_rating = models.DecimalField(max_digits=3,decimal_places=2,default=0,validators=[MinValueValidator(0), MaxValueValidator(5)])
  rating_count = models.PositiveIntegerField(default=0)
  service_areas = models.ManyToManyField('serviceability.ServiceArea',related_name='agents',blank=True)
  service_pincodes = models.ManyToManyField('serviceability.ServiceablePincode',related_name='pincode_agents',blank=True)
  coverage_location = models.CharField(max_length=255, null=True, blank=True, help_text="Agent's coverage location/area description")
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  
  class Meta:
    verbose_name = 'Agent'
    verbose_name_plural = 'Agents'
    ordering = ['-created_at']
    indexes = [
      models.Index(fields=['agent_code']),
      models.Index(fields=['status', 'kyc_status']),
      models.Index(fields=['availability']),
      models.Index(fields=['phone']),
      models.Index(fields=['email']),
    ]
  @staticmethod
  def generate_agent_code():
    while True:
      code = 'AGT-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
      if not Agent.objects.filter(agent_code=code).exists():
        return code
  def save(self, *args, **kwargs):
    if not self.agent_code:
      self.agent_code = self.generate_agent_code()
    today = timezone.now().date()
    if self.last_order_reset and self.last_order_reset < today:
      self.current_day_orders = 0
      self.last_order_reset = today
    super().save(*args, **kwargs)
  def clean(self):
    super().clean()
    if not self.name or not self.name.strip():
      raise ValidationError({'name': 'Agent name is required'})
    if not self.address or not self.address.strip():
      raise ValidationError({'address': 'Agent address is required'})
  @property
  def is_eligible(self):
    """Check if agent is eligible for order assignment. KYC is optional."""
    has_service_coverage = self.service_areas.exists() or self.service_pincodes.exists()
    return(
      self.status == 'active' and
      self.kyc_status != 'rejected' and  # Only reject if KYC is explicitly rejected
      has_service_coverage and
      self.current_day_orders < self.daily_capacity
    )
  @property
  def today_orders(self):
    return self.current_day_orders

class AgentDocument(models.Model):
  DOCUMENT_TYPES = [
    ('aadhaar', 'Aadhaar Card'),
    ('pan', 'PAN Card'),
    ('driving_license', 'Driving License'),
  ]
  VERIFICATION_STATUS = [
    ('pending', 'Pending'),
    ('verified', 'Verified'),
    ('rejected', 'Rejected'),
  ]
  agent = models.ForeignKey(
    Agent,
    on_delete=models.CASCADE,
    related_name='documents',
  )
  document_type = models.CharField(
    max_length=20,
    choices=DOCUMENT_TYPES
  )
  document_url = models.URLField(max_length=500)
  verification_status = models.CharField(max_length=20,choices=VERIFICATION_STATUS,default='pending',db_index=True)
  rejection_reason = models.TextField(null=True,blank=True)
  uploaded_at = models.DateTimeField(auto_now_add=True)
  verified_at = models.DateTimeField(null=True,blank=True)
  verified_by = models.ForeignKey(
    'authentication.User',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='verified_agent_documents',
  )
  class Meta:
    verbose_name = 'Agent Document'
    verbose_name_plural = 'Agent Documents'
    unique_together = ['agent', 'document_type']
    ordering = ['agent', 'document_type']
    indexes = [
      models.Index(fields=['verification_status']),
      models.Index(fields=['agent', 'document_type']),
    ]
  def verify(self, verified_by_user):
    self.verification_status = 'verified'
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

class AgentAuditLog(models.Model):
  ACTION_CHOICES = [
    ('created', 'Created'),
    ('updated', 'Updated'),
    ('status_changed', 'Status Changed'),
    ('kyc_updated', 'KYC Updated'),
    ('document_uploaded', 'Document Uploaded'),
    ('document_verified', 'Document Verified'),
    ('document_rejected', 'Document Rejected'),
    ('service_area_updated', 'Service Area Updated'),
    ('availability_changed', 'Availability Changed'),
    ('capacity_updated', 'Capacity Updated'),
    ('rating_updated', 'Rating Updated'),
  ]
  agent = models.ForeignKey(Agent,on_delete=models.CASCADE,related_name='audit_logs')
  action = models.CharField(max_length=30,choices=ACTION_CHOICES,db_index=True)
  actor = models.ForeignKey(
    'authentication.User',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='agent_audit_logs'
  )
  timestamp = models.DateTimeField(
    auto_now_add=True,
    db_index=True
  )
  previous_value = models.JSONField(null=True,blank=True)
  new_value = models.JSONField(null=True,blank=True)
  details = models.TextField(null=True,blank=True)
  
  class Meta:
    verbose_name = 'Agent Audit Log'
    ordering = ['-timestamp']
    indexes = [
      models.Index(fields=['agent', 'action']),
      models.Index(fields=['timestamp']),
      models.Index(fields=['actor']),
    ]
  @classmethod
  def log_action(cls, agent, action, actor=None, previous_value=None, new_value=None, details=None):
    return cls.objects.create(
      agent=agent,
      action=action,
      actor=actor,
      previous_value=previous_value,
      new_value=new_value,
      details=details
    )
    
