"""
Admin API views for notification management.
These endpoints are used by the Next.js admin dashboard.
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.exceptions import AuthenticationFailed
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from authentication.utils import authenticate_request
from .services.dashboard import DashboardNotification
from .services.manager import NotificationManager

logger = logging.getLogger(__name__)


class AdminNotificationHistoryAPIView(APIView):
    """
    Admin endpoint to get notification history.
    Returns all push notifications sent from the admin dashboard.
    """
    
    def get(self, request):
        try:
            # Authenticate admin user
            user = authenticate_request(request, need_user=True)
            
            # Check admin privileges
            if not user.is_staff and not user.is_superuser:
                return Response(
                    {"error": "Admin privileges required"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get notification history from Supabase
            service = DashboardNotification()
            
            # Get filters from query params
            filters = {
                'notification_type': request.GET.get('notification_type', 'PUSH'),
                'limit': int(request.GET.get('limit', 100)),
                'offset': int(request.GET.get('offset', 0))
            }
            
            # Remove None values
            filters = {k: v for k, v in filters.items() if v is not None}
            
            notifications = service.get_notifications(filters)
            
            # Transform to match frontend expected format
            history = []
            for notif in notifications:
                metadata = notif.get('metadata', {})
                history.append({
                    'id': notif.get('id'),
                    'title': metadata.get('title', ''),
                    'message': metadata.get('message', ''),
                    'category': metadata.get('category', 'general'),
                    'recipient_count': metadata.get('sent_count', 0) + metadata.get('failed_count', 0),
                    'sent_count': metadata.get('sent_count', 0),
                    'failed_count': metadata.get('failed_count', 0),
                    'delivery_status': 'sent' if notif.get('status') == 'SENT' else 'failed' if notif.get('status') == 'FAILED' else 'pending',
                    'created_at': notif.get('created_at'),
                    'admin_user_id': metadata.get('admin_user_id'),
                    'deep_link_data': metadata.get('deep_link_data'),
                    'image_url': metadata.get('image_url'),
                    'error': metadata.get('error')
                })
            
            return Response(history, status=status.HTTP_200_OK)
            
        except AuthenticationFailed as auth_error:
            raise auth_error
        except Exception as e:
            logger.error(f"Error fetching notification history: {str(e)}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminSendPushNotificationAPIView(APIView):
    """
    Admin endpoint to send push notifications.
    Used by the Next.js admin dashboard.
    """
    
    def post(self, request):
        try:
            # Authenticate admin user
            user = authenticate_request(request, need_user=True)
            
            # Check admin privileges
            if not user.is_staff and not user.is_superuser:
                return Response(
                    {"error": "Admin privileges required"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Extract data from request
            title = request.data.get('title', '').strip()
            message = request.data.get('message', '').strip()
            category = request.data.get('category', 'general')
            target_users = request.data.get('target_users')  # Optional: list of user IDs
            deep_link_data = request.data.get('deep_link_data')
            image_url = request.data.get('image_url')
            
            # Validation
            errors = []
            
            if not title:
                errors.append("Title is required")
            elif len(title) > 50:
                errors.append("Title must be 50 characters or less")
            
            if not message:
                errors.append("Message is required")
            elif len(message) > 200:
                errors.append("Message must be 200 characters or less")
            
            valid_categories = ['order_updates', 'promotions', 'announcements', 'general']
            if category not in valid_categories:
                errors.append(f"Invalid category. Valid options: {', '.join(valid_categories)}")
            
            if errors:
                return Response(
                    {"error": "; ".join(errors)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Send notification via Celery task
            from .tasks import send_admin_push_notification_task
            
            send_admin_push_notification_task.delay(
                title=title,
                message=message,
                category=category,
                deep_link_data=deep_link_data,
                image_url=image_url,
                admin_user_id=user.id
            )
            
            # Calculate recipient count for response
            recipient_count = self._calculate_recipient_count(category)
            
            return Response({
                "success": True,
                "message": f"Push notification queued successfully! Sending to {recipient_count} user(s).",
                "recipient_count": recipient_count
            }, status=status.HTTP_200_OK)
            
        except AuthenticationFailed as auth_error:
            raise auth_error
        except Exception as e:
            logger.error(f"Error sending push notification: {str(e)}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _calculate_recipient_count(self, category):
        """Calculate the number of users who will receive the notification"""
        from authentication.models import User
        
        category_field_map = {
            'order_updates': 'notify_order_updates',
            'promotions': 'notify_promotions',
            'announcements': 'notify_announcements',
            'general': 'notify_general',
        }
        
        preference_field = category_field_map.get(category, 'notify_general')
        
        filter_kwargs = {
            'push_notification_enabled': True,
            preference_field: True,
            'push_tokens__is_active': True,
        }
        
        return User.objects.filter(**filter_kwargs).distinct().count()


class AdminPushTokensAPIView(APIView):
    """
    Admin endpoint to get all active push tokens.
    """
    
    def get(self, request):
        try:
            # Authenticate admin user
            user = authenticate_request(request, need_user=True)
            
            # Check admin privileges
            if not user.is_staff and not user.is_superuser:
                return Response(
                    {"error": "Admin privileges required"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            from user.models import PushToken
            
            tokens = PushToken.objects.filter(is_active=True).select_related('user').values(
                'id',
                'token',
                'device_name',
                'is_active',
                'created_at',
                'last_used_at',
                'user__id',
                'user__email',
                'user__name'
            )
            
            result = []
            for token in tokens:
                result.append({
                    'id': token['id'],
                    'token': token['token'][:30] + '...' if len(token['token']) > 30 else token['token'],
                    'device_name': token['device_name'],
                    'is_active': token['is_active'],
                    'created_at': token['created_at'].isoformat() if token['created_at'] else None,
                    'last_used_at': token['last_used_at'].isoformat() if token['last_used_at'] else None,
                    'user': {
                        'id': token['user__id'],
                        'email': token['user__email'],
                        'name': token['user__name']
                    }
                })
            
            return Response(result, status=status.HTTP_200_OK)
            
        except AuthenticationFailed as auth_error:
            raise auth_error
        except Exception as e:
            logger.error(f"Error fetching push tokens: {str(e)}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminRetryNotificationAPIView(APIView):
    """
    Admin endpoint to retry a failed notification.
    """
    
    def post(self, request, notification_id):
        try:
            # Authenticate admin user
            user = authenticate_request(request, need_user=True)
            
            # Check admin privileges
            if not user.is_staff and not user.is_superuser:
                return Response(
                    {"error": "Admin privileges required"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get the notification details
            service = DashboardNotification()
            notification = service.client.get_notification(notification_id)
            
            if not notification:
                return Response(
                    {"error": "Notification not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Only allow retrying failed notifications
            if notification.get('status') != 'FAILED':
                return Response(
                    {"error": "Only failed notifications can be retried"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            metadata = notification.get('metadata', {})
            
            # Retry the notification
            from .tasks import send_admin_push_notification_task
            
            send_admin_push_notification_task.delay(
                title=metadata.get('title', ''),
                message=metadata.get('message', ''),
                category=metadata.get('category', 'general'),
                deep_link_data=metadata.get('deep_link_data'),
                image_url=metadata.get('image_url'),
                admin_user_id=user.id
            )
            
            return Response({
                "success": True,
                "message": "Notification retry initiated successfully"
            }, status=status.HTTP_200_OK)
            
        except AuthenticationFailed as auth_error:
            raise auth_error
        except Exception as e:
            logger.error(f"Error retrying notification: {str(e)}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminUsersWithPushTokensAPIView(APIView):
    """
    Admin endpoint to get all users who have opted in for push notifications.
    Returns users with their notification preferences and active token count.
    """
    
    def get(self, request):
        try:
            # Authenticate admin user
            user = authenticate_request(request, need_user=True)
            
            # Check admin privileges
            if not user.is_staff and not user.is_superuser:
                return Response(
                    {"error": "Admin privileges required"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            from authentication.models import User
            from user.models import PushToken
            from django.db.models import Count, Q
            
            # Get users with active push tokens
            users = User.objects.filter(
                push_tokens__is_active=True
            ).annotate(
                active_token_count=Count('push_tokens', filter=Q(push_tokens__is_active=True))
            ).distinct().values(
                'id',
                'name',
                'email',
                'push_notification_enabled',
                'notify_order_updates',
                'notify_promotions',
                'notify_announcements',
                'notify_general',
                'active_token_count'
            )
            
            result = []
            for u in users:
                result.append({
                    'id': u['id'],
                    'name': u['name'] or 'Unknown',
                    'email': u['email'],
                    'push_notification_enabled': u['push_notification_enabled'],
                    'preferences': {
                        'order_updates': u['notify_order_updates'],
                        'promotions': u['notify_promotions'],
                        'announcements': u['notify_announcements'],
                        'general': u['notify_general'],
                    },
                    'active_token_count': u['active_token_count']
                })
            
            return Response(result, status=status.HTTP_200_OK)
            
        except AuthenticationFailed as auth_error:
            raise auth_error
        except Exception as e:
            logger.error(f"Error fetching users with push tokens: {str(e)}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminSendIndividualNotificationAPIView(APIView):
    """
    Admin endpoint to send push notification to a specific user.
    """
    
    def post(self, request, user_id):
        try:
            # Authenticate admin user
            admin_user = authenticate_request(request, need_user=True)
            
            # Check admin privileges
            if not admin_user.is_staff and not admin_user.is_superuser:
                return Response(
                    {"error": "Admin privileges required"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            from authentication.models import User
            from user.models import PushToken
            from notifications.services.push import PushNotificationService
            
            # Get target user
            try:
                target_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user has active push tokens
            active_tokens = PushToken.objects.filter(user=target_user, is_active=True)
            if not active_tokens.exists():
                return Response(
                    {"error": "User has no active push tokens"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Extract data from request
            title = request.data.get('title', '').strip()
            message = request.data.get('message', '').strip()
            category = request.data.get('category', 'general')
            
            # Validation
            if not title:
                return Response({"error": "Title is required"}, status=status.HTTP_400_BAD_REQUEST)
            if len(title) > 50:
                return Response({"error": "Title must be 50 characters or less"}, status=status.HTTP_400_BAD_REQUEST)
            if not message:
                return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)
            if len(message) > 200:
                return Response({"error": "Message must be 200 characters or less"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Send notification directly to this user using user_ids parameter
            try:
                push_service = PushNotificationService()
                
                # Use send_push_notification with user_ids to target specific user
                result = push_service.send_push_notification(
                    title=title,
                    message=message,
                    category=category,
                    deep_link_data={'category': category, 'target_user_id': user_id},
                    user_ids=[user_id]
                )
                
                # Record the notification
                service = DashboardNotification()
                service.client.create_notification({
                    'notification_type': 'PUSH',
                    'status': 'SENT' if result.get('sent_count', 0) > 0 else 'FAILED',
                    'recipient': f'user_{user_id}',
                    'metadata': {
                        'title': title,
                        'message': message,
                        'category': category,
                        'target_user_id': user_id,
                        'target_user_email': target_user.email,
                        'sent_count': result.get('sent_count', 0),
                        'failed_count': result.get('failed_count', 0),
                        'admin_user_id': admin_user.id,
                        'individual_notification': True
                    }
                })
                
                return Response({
                    "success": True,
                    "message": f"Notification sent to {target_user.email}",
                    "sent_count": result.get('sent_count', 0),
                    "failed_count": result.get('failed_count', 0)
                }, status=status.HTTP_200_OK)
                
            except Exception as e:
                logger.error(f"Error sending individual notification: {str(e)}", exc_info=True)
                return Response(
                    {"error": f"Failed to send notification: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except AuthenticationFailed as auth_error:
            raise auth_error
        except Exception as e:
            logger.error(f"Error in individual notification: {str(e)}", exc_info=True)
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
