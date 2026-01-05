"""
Admin Authentication and User Management Views

Handles admin user registration, login, and management with role-based access control.
"""

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction, models
from django.core.mail import send_mail
from django.conf import settings
import jwt
import logging
import secrets

from ..models_admin import AdminUser, AdminRole, PagePermission, RolePermission, AdminAuditLog
from utils.audit_client_ip import get_client_ip

logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = getattr(settings, 'SECRET_KEY', 'your-secret-key')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24


def generate_admin_jwt(admin_user):
    """Generate JWT token for admin user"""
    payload = {
        'admin_id': admin_user.id,
        'email': admin_user.email,
        'role': admin_user.role.name,
        'is_admin': admin_user.is_admin,
        'exp': timezone.now() + timezone.timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': timezone.now(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_admin_jwt(token):
    """Verify and decode admin JWT token"""
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_admin_from_request(request):
    """Extract and verify admin user from request"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header:
        return None
    
    payload = verify_admin_jwt(auth_header)
    if not payload:
        return None
    
    # Check if this is an admin token (has admin_id) vs regular user token (has id)
    admin_id = payload.get('admin_id')
    if not admin_id:
        return None  # Not an admin token, return None gracefully
    
    try:
        admin_user = AdminUser.objects.select_related('role').get(
            id=admin_id,
            is_active=True
        )
        return admin_user
    except AdminUser.DoesNotExist:
        return None


def require_admin_auth(func):
    """Decorator to require admin authentication"""
    def wrapper(self, request, *args, **kwargs):
        admin_user = get_admin_from_request(request)
        if not admin_user:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        request.admin_user = admin_user
        return func(self, request, *args, **kwargs)
    return wrapper


def require_admin_role(func):
    """Decorator to require admin role (not just staff)"""
    def wrapper(self, request, *args, **kwargs):
        admin_user = get_admin_from_request(request)
        if not admin_user:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if not admin_user.is_admin:
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        request.admin_user = admin_user
        return func(self, request, *args, **kwargs)
    return wrapper


def send_verification_email(admin_user, otp):
    """Send OTP verification email"""
    try:
        subject = 'Scrapiz Admin - Email Verification'
        message = f"""
Hello {admin_user.name},

Your email verification code is: {otp}

This code will expire in 10 minutes.

If you did not request this, please ignore this email.

Best regards,
Scrapiz Team
        """
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [admin_user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email: {str(e)}")
        return False


@method_decorator(csrf_exempt, name='dispatch')
class AdminLoginView(APIView):
    """
    Admin login endpoint
    
    POST /admin-auth/login/
    Body: { "email": "...", "password": "..." }
    """
    
    def post(self, request):
        try:
            email = request.data.get('email', '').strip().lower()
            password = request.data.get('password', '')
            
            if not email or not password:
                return Response(
                    {"error": "Email and password are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Find admin user
            try:
                admin_user = AdminUser.objects.select_related('role').get(email=email)
            except AdminUser.DoesNotExist:
                # Log failed attempt
                AdminAuditLog.objects.create(
                    action='login_failed',
                    details={'email': email, 'reason': 'User not found'},
                    ip_address=get_client_ip(request),
                    status='failed'
                )
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check password
            if not admin_user.check_password(password):
                AdminAuditLog.objects.create(
                    admin_user=admin_user,
                    action='login_failed',
                    details={'reason': 'Invalid password'},
                    ip_address=get_client_ip(request),
                    status='failed'
                )
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if account is active
            if not admin_user.is_active:
                return Response(
                    {"error": "Account is not active. Please verify your email or contact an admin."},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Generate JWT and update login info
            token = generate_admin_jwt(admin_user)
            admin_user.last_login = timezone.now()
            admin_user.last_login_ip = get_client_ip(request)
            admin_user.save(update_fields=['last_login', 'last_login_ip'])
            
            # Log successful login
            AdminAuditLog.objects.create(
                admin_user=admin_user,
                action='login',
                ip_address=get_client_ip(request),
                status='success'
            )
            
            # Get user permissions
            permissions = self._get_user_permissions(admin_user)
            
            return Response({
                "jwt": token,
                "user": {
                    "id": admin_user.id,
                    "email": admin_user.email,
                    "name": admin_user.name,
                    "role": admin_user.role.name,
                    "is_admin": admin_user.is_admin,
                },
                "permissions": permissions
            })
            
        except Exception as e:
            logger.error(f"Admin login error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Login failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_user_permissions(self, admin_user):
        """Get permissions for the user's role"""
        role_permissions = RolePermission.objects.filter(
            role=admin_user.role
        ).select_related('page')
        
        permissions = {}
        for rp in role_permissions:
            permissions[rp.page.page_key] = {
                'can_view': rp.can_view,
                'can_create': rp.can_create,
                'can_edit': rp.can_edit,
                'can_delete': rp.can_delete,
            }
        
        return permissions


@method_decorator(csrf_exempt, name='dispatch')
class AdminUserCreateView(APIView):
    """
    Create new admin user (admin only)
    
    POST /admin-auth/users/
    Body: { "email": "...", "name": "...", "password": "...", "role": "admin|staff" }
    """
    
    @require_admin_role
    def post(self, request):
        try:
            email = request.data.get('email', '').strip().lower()
            name = request.data.get('name', '').strip()
            password = request.data.get('password', '')
            role_name = request.data.get('role', 'staff')
            
            # Validation
            if not email or not name or not password:
                return Response(
                    {"error": "Email, name, and password are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if len(password) < 8:
                return Response(
                    {"error": "Password must be at least 8 characters"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if role_name not in ['admin', 'staff']:
                return Response(
                    {"error": "Role must be 'admin' or 'staff'"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if email already exists
            if AdminUser.objects.filter(email=email).exists():
                return Response(
                    {"error": "An admin user with this email already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create role
            role, _ = AdminRole.objects.get_or_create(name=role_name)
            
            with transaction.atomic():
                # Create admin user
                admin_user = AdminUser(
                    email=email,
                    name=name,
                    role=role,
                    created_by=request.admin_user,
                    is_active=False,  # Requires email verification
                    is_email_verified=False
                )
                admin_user.set_password(password)
                admin_user.save()
                
                # Generate and send OTP
                otp = admin_user.generate_otp()
                send_verification_email(admin_user, otp)
                
                # Audit log
                AdminAuditLog.objects.create(
                    admin_user=request.admin_user,
                    action='create_admin',
                    target_user=admin_user,
                    details={'role': role_name},
                    ip_address=get_client_ip(request),
                    status='success'
                )
            
            return Response({
                "message": "Admin user created. Verification email sent.",
                "user": {
                    "id": admin_user.id,
                    "email": admin_user.email,
                    "name": admin_user.name,
                    "role": admin_user.role.name,
                    "is_active": admin_user.is_active,
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Create admin user error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to create admin user"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminVerifyEmailView(APIView):
    """
    Verify admin email with OTP
    
    POST /admin-auth/verify-email/
    Body: { "email": "...", "otp": "..." }
    """
    
    def post(self, request):
        try:
            email = request.data.get('email', '').strip().lower()
            otp = request.data.get('otp', '').strip()
            
            if not email or not otp:
                return Response(
                    {"error": "Email and OTP are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                admin_user = AdminUser.objects.get(email=email)
            except AdminUser.DoesNotExist:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if not admin_user.verify_otp(otp):
                return Response(
                    {"error": "Invalid or expired OTP"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Activate account
            admin_user.is_active = True
            admin_user.is_email_verified = True
            admin_user.clear_otp()
            admin_user.save(update_fields=['is_active', 'is_email_verified'])
            
            # Audit log
            AdminAuditLog.objects.create(
                admin_user=admin_user,
                action='email_verified',
                ip_address=get_client_ip(request),
                status='success'
            )
            
            return Response({
                "message": "Email verified successfully. You can now login."
            })
            
        except Exception as e:
            logger.error(f"Verify email error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Verification failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminResendOTPView(APIView):
    """
    Resend verification OTP
    
    POST /admin-auth/resend-otp/
    Body: { "email": "..." }
    """
    
    def post(self, request):
        try:
            email = request.data.get('email', '').strip().lower()
            
            if not email:
                return Response(
                    {"error": "Email is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                admin_user = AdminUser.objects.get(email=email)
            except AdminUser.DoesNotExist:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if admin_user.is_email_verified:
                return Response(
                    {"error": "Email is already verified"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate and send new OTP
            otp = admin_user.generate_otp()
            if send_verification_email(admin_user, otp):
                return Response({
                    "message": "Verification code sent to your email"
                })
            else:
                return Response(
                    {"error": "Failed to send verification email"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except Exception as e:
            logger.error(f"Resend OTP error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to resend OTP"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminUserListView(APIView):
    """
    List all admin users (admin only)
    
    GET /admin-auth/users/
    """
    
    @require_admin_auth
    def get(self, request):
        try:
            admin_users = AdminUser.objects.select_related('role', 'created_by').all()
            
            # Search filter
            search = request.query_params.get('search', '').strip()
            if search:
                admin_users = admin_users.filter(
                    models.Q(name__icontains=search) |
                    models.Q(email__icontains=search)
                )
            
            # Role filter
            role = request.query_params.get('role')
            if role:
                admin_users = admin_users.filter(role__name=role)
            
            # Status filter
            status_filter = request.query_params.get('status')
            if status_filter == 'active':
                admin_users = admin_users.filter(is_active=True)
            elif status_filter == 'inactive':
                admin_users = admin_users.filter(is_active=False)
            
            users_data = []
            for user in admin_users:
                users_data.append({
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "role": user.role.name,
                    "is_active": user.is_active,
                    "is_email_verified": user.is_email_verified,
                    "last_login": user.last_login.isoformat() if user.last_login else None,
                    "created_at": user.created_at.isoformat(),
                    "created_by": user.created_by.name if user.created_by else None,
                })
            
            return Response({
                "users": users_data,
                "total": len(users_data)
            })
            
        except Exception as e:
            logger.error(f"List admin users error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch admin users"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminUserDetailView(APIView):
    """
    Get, update, or delete admin user
    
    GET /admin-auth/users/<id>/
    PATCH /admin-auth/users/<id>/
    DELETE /admin-auth/users/<id>/
    """
    
    @require_admin_auth
    def get(self, request, user_id):
        try:
            admin_user = AdminUser.objects.select_related('role').get(id=user_id)
            
            return Response({
                "id": admin_user.id,
                "email": admin_user.email,
                "name": admin_user.name,
                "role": admin_user.role.name,
                "is_active": admin_user.is_active,
                "is_email_verified": admin_user.is_email_verified,
                "last_login": admin_user.last_login.isoformat() if admin_user.last_login else None,
                "last_login_ip": admin_user.last_login_ip,
                "created_at": admin_user.created_at.isoformat(),
            })
            
        except AdminUser.DoesNotExist:
            return Response(
                {"error": "Admin user not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Get admin user error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch admin user"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @require_admin_role
    def patch(self, request, user_id):
        """Update admin user (admin only)"""
        try:
            admin_user = AdminUser.objects.select_related('role').get(id=user_id)
            
            # Staff cannot modify other users
            if not request.admin_user.is_admin:
                return Response(
                    {"error": "Admin privileges required"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            updated_fields = []
            
            # Update name
            if 'name' in request.data:
                admin_user.name = request.data['name'].strip()
                updated_fields.append('name')
            
            # Update role (admin only)
            if 'role' in request.data:
                role_name = request.data['role']
                if role_name in ['admin', 'staff']:
                    role, _ = AdminRole.objects.get_or_create(name=role_name)
                    old_role = admin_user.role.name
                    admin_user.role = role
                    updated_fields.append('role')
                    
                    # Log role change
                    AdminAuditLog.objects.create(
                        admin_user=request.admin_user,
                        action='change_role',
                        target_user=admin_user,
                        details={'old_role': old_role, 'new_role': role_name},
                        ip_address=get_client_ip(request),
                        status='success'
                    )
            
            # Update active status
            if 'is_active' in request.data:
                admin_user.is_active = bool(request.data['is_active'])
                updated_fields.append('is_active')
                
                action = 'activate_user' if admin_user.is_active else 'deactivate_user'
                AdminAuditLog.objects.create(
                    admin_user=request.admin_user,
                    action=action,
                    target_user=admin_user,
                    ip_address=get_client_ip(request),
                    status='success'
                )
            
            if updated_fields:
                admin_user.save(update_fields=updated_fields)
                
                AdminAuditLog.objects.create(
                    admin_user=request.admin_user,
                    action='update_admin',
                    target_user=admin_user,
                    details={'updated_fields': updated_fields},
                    ip_address=get_client_ip(request),
                    status='success'
                )
            
            return Response({
                "message": "Admin user updated successfully",
                "user": {
                    "id": admin_user.id,
                    "email": admin_user.email,
                    "name": admin_user.name,
                    "role": admin_user.role.name,
                    "is_active": admin_user.is_active,
                }
            })
            
        except AdminUser.DoesNotExist:
            return Response(
                {"error": "Admin user not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Update admin user error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to update admin user"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @require_admin_role
    def delete(self, request, user_id):
        """Delete admin user (admin only)"""
        try:
            admin_user = AdminUser.objects.get(id=user_id)
            
            # Cannot delete yourself
            if admin_user.id == request.admin_user.id:
                return Response(
                    {"error": "Cannot delete your own account"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Log deletion
            AdminAuditLog.objects.create(
                admin_user=request.admin_user,
                action='delete_admin',
                details={'deleted_email': admin_user.email, 'deleted_name': admin_user.name},
                ip_address=get_client_ip(request),
                status='success'
            )
            
            admin_user.delete()
            
            return Response({
                "message": "Admin user deleted successfully"
            })
            
        except AdminUser.DoesNotExist:
            return Response(
                {"error": "Admin user not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Delete admin user error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to delete admin user"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminCurrentUserView(APIView):
    """
    Get current admin user profile
    
    GET /admin-auth/me/
    """
    
    @require_admin_auth
    def get(self, request):
        try:
            admin_user = request.admin_user
            permissions = self._get_user_permissions(admin_user)
            
            return Response({
                "id": admin_user.id,
                "email": admin_user.email,
                "name": admin_user.name,
                "role": admin_user.role.name,
                "is_admin": admin_user.is_admin,
                "is_active": admin_user.is_active,
                "last_login": admin_user.last_login.isoformat() if admin_user.last_login else None,
                "permissions": permissions
            })
            
        except Exception as e:
            logger.error(f"Get current user error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch user profile"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_user_permissions(self, admin_user):
        """Get permissions for the user's role"""
        role_permissions = RolePermission.objects.filter(
            role=admin_user.role
        ).select_related('page')
        
        permissions = {}
        for rp in role_permissions:
            permissions[rp.page.page_key] = {
                'can_view': rp.can_view,
                'can_create': rp.can_create,
                'can_edit': rp.can_edit,
                'can_delete': rp.can_delete,
            }
        
        return permissions


@method_decorator(csrf_exempt, name='dispatch')
class AdminLogoutView(APIView):
    """
    Admin logout
    
    POST /admin-auth/logout/
    """
    
    @require_admin_auth
    def post(self, request):
        try:
            AdminAuditLog.objects.create(
                admin_user=request.admin_user,
                action='logout',
                ip_address=get_client_ip(request),
                status='success'
            )
            
            return Response({
                "message": "Logged out successfully"
            })
            
        except Exception as e:
            logger.error(f"Logout error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Logout failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Aliases for backward compatibility with server/urls.py
AdminVerifyOTPView = AdminVerifyEmailView
