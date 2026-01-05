"""
Admin Permissions Management Views

Handles role permissions and page access control.
"""

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
import logging

from ..models_admin import AdminRole, PagePermission, RolePermission, AdminAuditLog
from .admin_auth import require_admin_auth, require_admin_role
from utils.audit_client_ip import get_client_ip

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class PagePermissionListView(APIView):
    """
    List all available pages/modules
    
    GET /admin-auth/pages/
    """
    
    @require_admin_auth
    def get(self, request):
        try:
            pages = PagePermission.objects.all().order_by('order')
            
            pages_data = []
            for page in pages:
                pages_data.append({
                    "id": page.id,
                    "page_key": page.page_key,
                    "display_name": page.display_name,
                    "description": page.description,
                    "icon": page.icon,
                    "route": page.route,
                    "order": page.order,
                })
            
            return Response({
                "pages": pages_data
            })
            
        except Exception as e:
            logger.error(f"List pages error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch pages"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class RolePermissionListView(APIView):
    """
    Get permissions for a specific role
    
    GET /admin-auth/permissions/<role>/
    """
    
    @require_admin_auth
    def get(self, request, role_name):
        try:
            try:
                role = AdminRole.objects.get(name=role_name)
            except AdminRole.DoesNotExist:
                return Response(
                    {"error": "Role not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get all pages
            pages = PagePermission.objects.all().order_by('order')
            
            # Get existing permissions for this role
            role_permissions = {
                rp.page_id: rp 
                for rp in RolePermission.objects.filter(role=role)
            }
            
            permissions_data = []
            for page in pages:
                rp = role_permissions.get(page.id)
                permissions_data.append({
                    "page_key": page.page_key,
                    "display_name": page.display_name,
                    "can_view": rp.can_view if rp else False,
                    "can_create": rp.can_create if rp else False,
                    "can_edit": rp.can_edit if rp else False,
                    "can_delete": rp.can_delete if rp else False,
                })
            
            return Response({
                "role": role_name,
                "permissions": permissions_data
            })
            
        except Exception as e:
            logger.error(f"Get role permissions error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch permissions"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class RolePermissionUpdateView(APIView):
    """
    Update permissions for a role (admin only)
    
    PUT /admin-auth/permissions/<role>/
    Body: {
        "permissions": [
            { "page_key": "dashboard", "can_view": true, "can_create": false, ... },
            ...
        ]
    }
    """
    
    @require_admin_role
    def put(self, request, role_name):
        try:
            # Staff cannot modify permissions
            if role_name == 'admin':
                # Only allow modifying admin permissions if you're an admin
                pass
            
            try:
                role = AdminRole.objects.get(name=role_name)
            except AdminRole.DoesNotExist:
                return Response(
                    {"error": "Role not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            permissions_data = request.data.get('permissions', [])
            
            if not permissions_data:
                return Response(
                    {"error": "Permissions data is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                for perm in permissions_data:
                    page_key = perm.get('page_key')
                    if not page_key:
                        continue
                    
                    try:
                        page = PagePermission.objects.get(page_key=page_key)
                    except PagePermission.DoesNotExist:
                        continue
                    
                    # Update or create permission
                    RolePermission.objects.update_or_create(
                        role=role,
                        page=page,
                        defaults={
                            'can_view': perm.get('can_view', False),
                            'can_create': perm.get('can_create', False),
                            'can_edit': perm.get('can_edit', False),
                            'can_delete': perm.get('can_delete', False),
                        }
                    )
                
                # Audit log
                AdminAuditLog.objects.create(
                    admin_user=request.admin_user,
                    action='update_permissions',
                    details={'role': role_name, 'permissions_count': len(permissions_data)},
                    ip_address=get_client_ip(request),
                    status='success'
                )
            
            return Response({
                "message": f"Permissions updated for role: {role_name}"
            })
            
        except Exception as e:
            logger.error(f"Update permissions error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to update permissions"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AllRolesPermissionsView(APIView):
    """
    Get permissions for all roles
    
    GET /admin-auth/permissions/
    """
    
    @require_admin_auth
    def get(self, request):
        try:
            roles = AdminRole.objects.all()
            pages = PagePermission.objects.all().order_by('order')
            
            result = {}
            
            for role in roles:
                role_permissions = {
                    rp.page_id: rp 
                    for rp in RolePermission.objects.filter(role=role)
                }
                
                permissions_data = []
                for page in pages:
                    rp = role_permissions.get(page.id)
                    permissions_data.append({
                        "page_key": page.page_key,
                        "display_name": page.display_name,
                        "can_view": rp.can_view if rp else False,
                        "can_create": rp.can_create if rp else False,
                        "can_edit": rp.can_edit if rp else False,
                        "can_delete": rp.can_delete if rp else False,
                    })
                
                result[role.name] = permissions_data
            
            return Response({
                "roles": ['admin', 'staff'],
                "pages": [
                    {
                        "page_key": p.page_key,
                        "display_name": p.display_name,
                        "icon": p.icon,
                        "route": p.route,
                    }
                    for p in pages
                ],
                "permissions": result
            })
            
        except Exception as e:
            logger.error(f"Get all permissions error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch permissions"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminAuditLogListView(APIView):
    """
    List admin audit logs
    
    GET /admin-auth/audit-logs/
    """
    
    @require_admin_auth
    def get(self, request):
        try:
            logs = AdminAuditLog.objects.select_related(
                'admin_user', 'target_user'
            ).order_by('-timestamp')[:100]  # Last 100 logs
            
            # Filter by action
            action = request.query_params.get('action')
            if action:
                logs = logs.filter(action=action)
            
            # Filter by user
            user_id = request.query_params.get('user_id')
            if user_id:
                logs = logs.filter(admin_user_id=user_id)
            
            logs_data = []
            for log in logs:
                logs_data.append({
                    "id": log.id,
                    "user": log.admin_user.name if log.admin_user else "Unknown",
                    "user_email": log.admin_user.email if log.admin_user else None,
                    "action": log.action,
                    "action_display": log.get_action_display(),
                    "target_user": log.target_user.name if log.target_user else None,
                    "details": log.details,
                    "ip_address": log.ip_address,
                    "status": log.status,
                    "timestamp": log.timestamp.isoformat(),
                })
            
            return Response({
                "logs": logs_data,
                "total": len(logs_data)
            })
            
        except Exception as e:
            logger.error(f"List audit logs error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch audit logs"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminStatsView(APIView):
    """
    Get admin dashboard stats
    
    GET /admin-auth/stats/
    """
    
    @require_admin_auth
    def get(self, request):
        try:
            from ..models_admin import AdminUser
            from django.utils import timezone
            
            total_admins = AdminUser.objects.count()
            active_admins = AdminUser.objects.filter(is_active=True).count()
            admin_role_count = AdminUser.objects.filter(role__name='admin').count()
            staff_role_count = AdminUser.objects.filter(role__name='staff').count()
            
            # Recent activity (last 24 hours)
            day_ago = timezone.now() - timezone.timedelta(days=1)
            recent_logins = AdminAuditLog.objects.filter(
                action='login',
                timestamp__gte=day_ago
            ).count()
            failed_logins = AdminAuditLog.objects.filter(
                action='login_failed',
                timestamp__gte=day_ago
            ).count()
            
            return Response({
                "total_admins": total_admins,
                "active_admins": active_admins,
                "inactive_admins": total_admins - active_admins,
                "admin_role_count": admin_role_count,
                "staff_role_count": staff_role_count,
                "recent_logins_24h": recent_logins,
                "failed_logins_24h": failed_logins,
            })
            
        except Exception as e:
            logger.error(f"Get stats error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch stats"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
