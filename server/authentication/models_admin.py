"""
Admin User and Permission Models

This module defines models for admin user management with role-based access control.
"""

from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
import secrets


class AdminRole(models.Model):
    """
    Defines roles for admin users (admin, staff)
    """
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('staff', 'Staff'),
    ]
    
    name = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'admin_roles'
        verbose_name = 'Admin Role'
        verbose_name_plural = 'Admin Roles'
    
    def __str__(self):
        return self.get_name_display()


class AdminUser(models.Model):
    """
    Admin users for the dashboard with email/password authentication.
    Separate from regular User model.
    """
    email = models.EmailField(max_length=254, unique=True, db_index=True)
    password = models.CharField(max_length=500)
    name = models.CharField(max_length=100)
    role = models.ForeignKey(
        AdminRole, 
        on_delete=models.PROTECT, 
        related_name='admin_users'
    )
    
    # Account status
    is_active = models.BooleanField(default=False)  # Requires email confirmation
    is_email_verified = models.BooleanField(default=False)
    
    # OTP for email verification and 2FA
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_expiration = models.DateTimeField(blank=True, null=True)
    
    # Session management
    session_token = models.CharField(max_length=255, blank=True, null=True)
    last_login = models.DateTimeField(blank=True, null=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    
    # Audit fields
    created_by = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='created_admins'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'admin_users'
        verbose_name = 'Admin User'
        verbose_name_plural = 'Admin Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.email}) - {self.role.name}"
    
    def set_password(self, raw_password):
        """Hash and set the password"""
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Check if the provided password matches"""
        return check_password(raw_password, self.password)
    
    def generate_otp(self):
        """Generate a 6-digit OTP"""
        self.otp = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        self.otp_expiration = timezone.now() + timezone.timedelta(minutes=10)
        self.save(update_fields=['otp', 'otp_expiration'])
        return self.otp
    
    def verify_otp(self, otp):
        """Verify the OTP"""
        if not self.otp or not self.otp_expiration:
            return False
        if timezone.now() > self.otp_expiration:
            return False
        return self.otp == otp
    
    def clear_otp(self):
        """Clear OTP after successful verification"""
        self.otp = None
        self.otp_expiration = None
        self.save(update_fields=['otp', 'otp_expiration'])
    
    @property
    def is_admin(self):
        """Check if user has admin role"""
        return self.role.name == 'admin'
    
    @property
    def is_staff_role(self):
        """Check if user has staff role"""
        return self.role.name == 'staff'


class PagePermission(models.Model):
    """
    Defines available pages/modules in the dashboard
    """
    PAGE_CHOICES = [
        ('dashboard', 'Dashboard'),
        ('analytics', 'Analytics'),
        ('agents', 'Agents'),
        ('carousel', 'Carousel'),
        ('catalog', 'Catalog'),
        ('notifications', 'Notifications'),
        ('orders', 'Orders'),
        ('referrals', 'Referrals'),
        ('service-orders', 'Service Orders'),
        ('users', 'Users'),
        ('authentication', 'Authentication'),
        ('settings', 'Settings'),
    ]
    
    page_key = models.CharField(max_length=50, choices=PAGE_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)  # Icon name for UI
    route = models.CharField(max_length=100)  # Dashboard route path
    order = models.IntegerField(default=0)  # Display order
    
    class Meta:
        db_table = 'page_permissions'
        verbose_name = 'Page Permission'
        verbose_name_plural = 'Page Permissions'
        ordering = ['order']
    
    def __str__(self):
        return self.display_name


class RolePermission(models.Model):
    """
    Maps roles to page permissions with CRUD access levels
    """
    role = models.ForeignKey(
        AdminRole, 
        on_delete=models.CASCADE, 
        related_name='permissions'
    )
    page = models.ForeignKey(
        PagePermission, 
        on_delete=models.CASCADE, 
        related_name='role_permissions'
    )
    
    # Permission levels
    can_view = models.BooleanField(default=False)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'role_permissions'
        verbose_name = 'Role Permission'
        verbose_name_plural = 'Role Permissions'
        unique_together = ['role', 'page']
    
    def __str__(self):
        perms = []
        if self.can_view: perms.append('View')
        if self.can_create: perms.append('Create')
        if self.can_edit: perms.append('Edit')
        if self.can_delete: perms.append('Delete')
        return f"{self.role.name} - {self.page.display_name}: {', '.join(perms) or 'No permissions'}"


class AdminAuditLog(models.Model):
    """
    Audit log for admin user actions
    """
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('login_failed', 'Login Failed'),
        ('create_admin', 'Create Admin User'),
        ('update_admin', 'Update Admin User'),
        ('delete_admin', 'Delete Admin User'),
        ('change_role', 'Change Role'),
        ('update_permissions', 'Update Permissions'),
        ('activate_user', 'Activate User'),
        ('deactivate_user', 'Deactivate User'),
        ('password_reset', 'Password Reset'),
        ('email_verified', 'Email Verified'),
    ]
    
    admin_user = models.ForeignKey(
        AdminUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    target_user = models.ForeignKey(
        AdminUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='targeted_logs'
    )
    details = models.JSONField(blank=True, null=True)  # Additional action details
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[('success', 'Success'), ('failed', 'Failed')],
        default='success'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'admin_audit_logs'
        verbose_name = 'Admin Audit Log'
        verbose_name_plural = 'Admin Audit Logs'
        ordering = ['-timestamp']
    
    def __str__(self):
        user_email = self.admin_user.email if self.admin_user else 'Unknown'
        return f"{user_email} - {self.get_action_display()} at {self.timestamp}"
