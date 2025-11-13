from django.db import models
from django.core.validators import RegexValidator

class WaitlistEntry(models.Model):
  email = models.EmailField(
  max_length = 255,
  blank = True,
  null =True,
  db_index = True
  )
  
  phone_number = models.CharField(
  max_length = 10,
  blank = True,
  null = True,
  validators = [
    RegexValidator(
      regex=r'^[6-9]\d{9}$',
      message='Phone number must be 10 digits starting with 6-9'
    )
  ],
  db_index = True
  )
  
  city = models.CharField(
  max_length=255,
  db_index=True
  )
  
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  
  
  
  class Meta: 
    db_table = 'waitlist_entry'
    verbose_name = 'Waitlist Entry'
    verbose_name_plural = 'Waitlist Entries'
    ordering = ['-created_at']
    indexes = [
      models.Index(fields=['city', '-created_at']),
      models.Index(fields=['email', 'city']),
      models.Index(fields=['phone_number', 'city']),
    ]
    constraints = [
      models.CheckConstraint(
        check=models.Q(email__isnull=False) | models.Q(phone_number__isnull=False),
        name='at_least_one_contact_method'
      )
    ]
  def _str_(self):
    contact = self.email or self.phone_number
    return f"{contact} - {self.city}"