"""
Admin User Management Views

Comprehensive user management endpoints for the admin dashboard.
Supports CRUD operations, user status management, and bulk actions.
"""

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone
from django.db.models import Count, Q
import logging
import csv
from django.http import HttpResponse

from ..models import User, AuditLog
from ..serializers import UserSerializer
from utils.usercheck import authenticate_request
from utils.audit_client_ip import get_client_ip

logger = logging.getLogger(__name__)


def require_admin(func):
    """Decorator to require admin privileges"""
    def wrapper(self, request, *args, **kwargs):
        try:
            user = authenticate_request(request, need_user=True)
            if not user.is_staff and not user.is_superuser:
                return Response(
                    {"error": "Admin privileges required"},
                    status=status.HTTP_403_FORBIDDEN
                )
            request.admin_user = user
            return func(self, request, *args, **kwargs)
        except AuthenticationFailed as e:
            return Response(
                {"error": str(e.detail)},
                status=status.HTTP_401_UNAUTHORIZED
            )
    return wrapper


@method_decorator(csrf_exempt, name='dispatch')
class AdminUserListView(APIView):
    """
    Admin endpoint to list all users with filtering and search.
    
    GET /admin/users/
    Query params:
        - search: Search by name, email, or phone
        - status: Filter by is_active (active/inactive)
        - role: Filter by role (admin/staff/user)
        - gender: Filter by gender
        - has_orders: Filter users with/without orders
        - page: Page number
        - page_size: Items per page (default 50)
    """
    
    @require_admin
    def get(self, request):
        try:
            queryset = User.objects.filter(is_deleted=False).order_by('-date_joined')
            
            # Search filter
            search = request.query_params.get('search', '').strip()
            if search:
                queryset = queryset.filter(
                    Q(name__icontains=search) |
                    Q(email__icontains=search) |
                    Q(phone_number__icontains=search) |
                    Q(referral_code__icontains=search)
                )
            
            # Status filter
            status_filter = request.query_params.get('status')
            if status_filter == 'active':
                queryset = queryset.filter(is_active=True)
            elif status_filter == 'inactive':
                queryset = queryset.filter(is_active=False)
            
            # Role filter
            role = request.query_params.get('role')
            if role == 'admin':
                queryset = queryset.filter(is_superuser=True)
            elif role == 'staff':
                queryset = queryset.filter(is_staff=True, is_superuser=False)
            elif role == 'user':
                queryset = queryset.filter(is_staff=False, is_superuser=False)
            
            # Gender filter
            gender = request.query_params.get('gender')
            if gender:
                queryset = queryset.filter(gender=gender)
            
            # Has orders filter
            has_orders = request.query_params.get('has_orders')
            if has_orders == 'true':
                queryset = queryset.annotate(order_count=Count('orders')).filter(order_count__gt=0)
            elif has_orders == 'false':
                queryset = queryset.annotate(order_count=Count('orders')).filter(order_count=0)
            
            # Get stats before pagination
            total_count = queryset.count()
            
            # Pagination
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 50))
            start = (page - 1) * page_size
            end = start + page_size
            
            users = queryset[start:end]
            serializer = UserSerializer(users, many=True)
            
            return Response({
                'users': serializer.data,
                'total': total_count,
                'page': page,
                'page_size': page_size,
                'total_pages': (total_count + page_size - 1) // page_size
            })
            
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch users"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminUserDetailView(APIView):
    """
    Admin endpoint for single user operations.
    
    GET /admin/users/<id>/
    PATCH /admin/users/<id>/
    DELETE /admin/users/<id>/
    """
    
    @require_admin
    def get(self, request, user_id):
        try:
            user = User.objects.filter(id=user_id, is_deleted=False).first()
            if not user:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = UserSerializer(user)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error fetching user {user_id}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch user"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @require_admin
    def patch(self, request, user_id):
        """Update user fields"""
        try:
            user = User.objects.filter(id=user_id, is_deleted=False).first()
            if not user:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            data = request.data
            updated_fields = []
            
            # Updatable fields
            if 'name' in data:
                user.name = data['name']
                updated_fields.append('name')
            
            if 'phone_number' in data:
                user.phone_number = data['phone_number']
                updated_fields.append('phone_number')
            
            if 'gender' in data:
                if data['gender'] in ['male', 'female', 'prefer_not_to_say', None, '']:
                    user.gender = data['gender'] if data['gender'] else None
                    updated_fields.append('gender')
            
            if 'is_active' in data:
                user.is_active = bool(data['is_active'])
                updated_fields.append('is_active')
            
            if 'is_staff' in data:
                # Only superusers can change staff status
                if request.admin_user.is_superuser:
                    user.is_staff = bool(data['is_staff'])
                    updated_fields.append('is_staff')
            
            if updated_fields:
                user.save(update_fields=updated_fields)
                
                # Audit log
                ip = get_client_ip(request)
                AuditLog.objects.create(
                    user=request.admin_user,
                    action=f"admin_update_user_{user_id}",
                    ip_address=ip
                )
                
                serializer = UserSerializer(user)
                return Response({
                    "message": "User updated successfully",
                    "user": serializer.data,
                    "updated_fields": updated_fields
                })
            else:
                return Response(
                    {"error": "No valid fields to update"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Error updating user {user_id}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to update user"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @require_admin
    def delete(self, request, user_id):
        """Soft delete a user"""
        try:
            user = User.objects.filter(id=user_id, is_deleted=False).first()
            if not user:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Prevent deleting superusers unless you're a superuser
            if user.is_superuser and not request.admin_user.is_superuser:
                return Response(
                    {"error": "Cannot delete superuser accounts"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Prevent self-deletion
            if user.id == request.admin_user.id:
                return Response(
                    {"error": "Cannot delete your own account"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Soft delete
            user.is_deleted = True
            user.deleted_at = timezone.now()
            user.is_active = False
            user.save(update_fields=['is_deleted', 'deleted_at', 'is_active'])
            
            # Audit log
            ip = get_client_ip(request)
            AuditLog.objects.create(
                user=request.admin_user,
                action=f"admin_delete_user_{user_id}",
                ip_address=ip
            )
            
            return Response({
                "message": "User deleted successfully"
            })
            
        except Exception as e:
            logger.error(f"Error deleting user {user_id}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to delete user"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminUserStatusView(APIView):
    """
    Admin endpoint to change user status (activate/deactivate/restrict).
    
    POST /admin/users/<id>/status/
    Body: { "action": "activate" | "deactivate" | "restrict" }
    """
    
    @require_admin
    def post(self, request, user_id):
        try:
            user = User.objects.filter(id=user_id, is_deleted=False).first()
            if not user:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            action = request.data.get('action')
            reason = request.data.get('reason', '')
            
            if action == 'activate':
                user.is_active = True
                message = "User activated successfully"
            elif action == 'deactivate':
                user.is_active = False
                message = "User deactivated successfully"
            elif action == 'restrict':
                # Restrict removes staff privileges
                user.is_staff = False
                user.is_active = False
                message = "User restricted successfully"
            else:
                return Response(
                    {"error": "Invalid action. Use 'activate', 'deactivate', or 'restrict'"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user.save()
            
            # Audit log
            ip = get_client_ip(request)
            AuditLog.objects.create(
                user=request.admin_user,
                action=f"admin_{action}_user_{user_id}",
                ip_address=ip
            )
            
            serializer = UserSerializer(user)
            return Response({
                "message": message,
                "user": serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error changing user status {user_id}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to change user status"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminUserBulkActionView(APIView):
    """
    Admin endpoint for bulk user operations.
    
    POST /admin/users/bulk/
    Body: {
        "action": "activate" | "deactivate" | "delete",
        "user_ids": [1, 2, 3]
    }
    """
    
    @require_admin
    def post(self, request):
        try:
            action = request.data.get('action')
            user_ids = request.data.get('user_ids', [])
            
            if not user_ids:
                return Response(
                    {"error": "No users selected"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if action not in ['activate', 'deactivate', 'delete']:
                return Response(
                    {"error": "Invalid action"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Exclude current admin from bulk operations
            user_ids = [uid for uid in user_ids if uid != request.admin_user.id]
            
            users = User.objects.filter(id__in=user_ids, is_deleted=False)
            
            # Non-superusers can't modify superusers
            if not request.admin_user.is_superuser:
                users = users.filter(is_superuser=False)
            
            count = users.count()
            
            if action == 'activate':
                users.update(is_active=True)
                message = f"{count} users activated"
            elif action == 'deactivate':
                users.update(is_active=False)
                message = f"{count} users deactivated"
            elif action == 'delete':
                users.update(
                    is_deleted=True,
                    deleted_at=timezone.now(),
                    is_active=False
                )
                message = f"{count} users deleted"
            
            # Audit log
            ip = get_client_ip(request)
            AuditLog.objects.create(
                user=request.admin_user,
                action=f"admin_bulk_{action}_{count}_users",
                ip_address=ip
            )
            
            return Response({
                "message": message,
                "affected_count": count
            })
            
        except Exception as e:
            logger.error(f"Error in bulk action: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to perform bulk action"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminUserStatsView(APIView):
    """
    Admin endpoint to get user statistics.
    
    GET /admin/users/stats/
    """
    
    @require_admin
    def get(self, request):
        try:
            total = User.objects.filter(is_deleted=False).count()
            active = User.objects.filter(is_deleted=False, is_active=True).count()
            inactive = User.objects.filter(is_deleted=False, is_active=False).count()
            staff = User.objects.filter(is_deleted=False, is_staff=True).count()
            superusers = User.objects.filter(is_deleted=False, is_superuser=True).count()
            with_orders = User.objects.filter(is_deleted=False).annotate(
                order_count=Count('orders')
            ).filter(order_count__gt=0).count()
            with_referrals = User.objects.filter(
                is_deleted=False,
                referral_code__isnull=False
            ).exclude(referral_code='').count()
            
            # Gender breakdown
            male = User.objects.filter(is_deleted=False, gender='male').count()
            female = User.objects.filter(is_deleted=False, gender='female').count()
            
            # Recent signups (last 7 days)
            week_ago = timezone.now() - timezone.timedelta(days=7)
            recent_signups = User.objects.filter(
                is_deleted=False,
                date_joined__gte=week_ago
            ).count()
            
            return Response({
                'total': total,
                'active': active,
                'inactive': inactive,
                'staff': staff,
                'superusers': superusers,
                'regular_users': total - staff,
                'with_orders': with_orders,
                'with_referrals': with_referrals,
                'gender': {
                    'male': male,
                    'female': female,
                    'other': total - male - female
                },
                'recent_signups': recent_signups
            })
            
        except Exception as e:
            logger.error(f"Error fetching user stats: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch statistics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminUserExportView(APIView):
    """
    Admin endpoint to export users to CSV.
    
    GET /admin/users/export/
    Query params:
        - user_ids: Comma-separated list of user IDs (optional, exports all if not provided)
    """
    
    @require_admin
    def get(self, request):
        try:
            user_ids = request.query_params.get('user_ids', '')
            
            if user_ids:
                ids = [int(id.strip()) for id in user_ids.split(',') if id.strip()]
                users = User.objects.filter(id__in=ids, is_deleted=False)
            else:
                users = User.objects.filter(is_deleted=False)
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="users_export.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'ID', 'Name', 'Email', 'Phone', 'Gender', 'Status',
                'Is Staff', 'Is Superuser', 'Referral Code', 'Referral Balance',
                'First Order Completed', 'Date Joined'
            ])
            
            for user in users:
                writer.writerow([
                    user.id,
                    user.name,
                    user.email,
                    user.phone_number or '',
                    user.gender or '',
                    'Active' if user.is_active else 'Inactive',
                    'Yes' if user.is_staff else 'No',
                    'Yes' if user.is_superuser else 'No',
                    user.referral_code or '',
                    str(user.referred_balance) if user.referred_balance else '0',
                    'Yes' if user.has_completed_first_order else 'No',
                    user.date_joined.strftime('%Y-%m-%d %H:%M:%S')
                ])
            
            # Audit log
            ip = get_client_ip(request)
            AuditLog.objects.create(
                user=request.admin_user,
                action=f"admin_export_users_{users.count()}",
                ip_address=ip
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error exporting users: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to export users"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
