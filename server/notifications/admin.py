
import logging
from django.contrib import admin
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.decorators import permission_required
from django.urls import path
from django.db.models import Q
from .models import PushToken
from authentication.models import User
from .tasks import send_admin_push_notification_task

logger = logging.getLogger(__name__)


# Custom AdminSite to add custom URLs
class NotificationsAdminSite(admin.AdminSite):
    """Custom admin site for notifications with custom views"""
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('send-push/', send_notification_view, name='send-push-notification'),
        ]
        return custom_urls + urls


# Create custom admin site instance
# notifications_admin_site = NotificationsAdminSite(name='notifications_admin')


@admin.register(PushToken)
class PushTokenAdmin(admin.ModelAdmin):
    """Admin interface for managing push tokens"""
    
    list_display = ['user_email', 'token_preview', 'device_name', 'is_active', 'created_at', 'last_used_at']
    list_filter = ['is_active', 'created_at', 'last_used_at']
    search_fields = ['user__email', 'user__name', 'token', 'device_name']
    readonly_fields = ['created_at', 'updated_at', 'last_used_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    def user_email(self, obj):
        """Display user email"""
        return obj.user.email
    user_email.short_description = 'User Email'
    user_email.admin_order_field = 'user__email'
    
    def token_preview(self, obj):
        """Display truncated token for readability"""
        return f"{obj.token[:30]}..." if len(obj.token) > 30 else obj.token
    token_preview.short_description = 'Token'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('user')
    
    def changelist_view(self, request, extra_context=None):
        """Add link to send push notification in the changelist view"""
        extra_context = extra_context or {}
        extra_context['send_push_url'] = '/admin/notifications/send-push/'
        return super().changelist_view(request, extra_context=extra_context)



@permission_required('authentication.can_send_push_notifications', raise_exception=True)
def send_notification_view(request):
    """
    Custom admin view for composing and sending push notifications
    
    Requires: can_send_push_notifications permission
    """
    
    # Define notification categories
    categories = [
        ('order_updates', 'Order Updates'),
        ('promotions', 'Promotions'),
        ('announcements', 'Announcements'),
        ('general', 'General'),
    ]
    
    # Define deep link types
    link_types = [
        ('', 'None'),
        ('screen', 'App Screen'),
        ('order_detail', 'Order Detail'),
        ('url', 'External URL'),
    ]
    
    # Handle AJAX request for recipient count
    if request.GET.get('get_recipient_count'):
        from django.http import JsonResponse
        category = request.GET.get('category', 'general')
        recipient_count = _calculate_recipient_count(category)
        return JsonResponse({'recipient_count': recipient_count})
    
    if request.method == 'POST':
        # Extract form data
        title = request.POST.get('title', '').strip()
        message = request.POST.get('message', '').strip()
        category = request.POST.get('category', 'general')
        link_type = request.POST.get('link_type', '').strip()
        link_value = request.POST.get('link_value', '').strip()
        image_url = request.POST.get('image_url', '').strip()
        specific_user_email = request.POST.get('specific_user_email', '').strip()
        
        # Validation
        errors = []
        warnings = []
        
        if not title:
            errors.append("Title is required")
        elif len(title) > 50:
            errors.append("Title must be 50 characters or less")
        
        if not message:
            errors.append("Message is required")
        elif len(message) > 200:
            errors.append("Message must be 200 characters or less")
        
        if category not in dict(categories).keys():
            errors.append("Invalid notification category")
        
        # Validate image URL if provided
        validated_image_url = None
        if image_url:
            from .services.push import PushNotificationService
            push_service = PushNotificationService()
            is_valid, error_message = push_service.validate_notification_image(image_url)
            
            if is_valid:
                validated_image_url = image_url
            else:
                # Add warning but don't block sending - notification will be sent without image
                warnings.append(f"Image validation failed: {error_message}. Notification will be sent without image.")
                logger.warning(f"Image URL validation failed in admin view: {error_message}")
        
        # Handle specific user if provided
        specific_user_ids = None
        if specific_user_email:
            try:
                specific_user = User.objects.get(email=specific_user_email)
                specific_user_ids = [specific_user.id]
                recipient_count = 1
                logger.info(f"Sending notification to specific user: {specific_user_email}")
            except User.DoesNotExist:
                errors.append(f"User with email '{specific_user_email}' not found")
                recipient_count = 0
        else:
            # Calculate recipient count based on category and preferences
            try:
                recipient_count = _calculate_recipient_count(category)
            except Exception as e:
                logger.error(f"Error calculating recipient count: {str(e)}")
                recipient_count = 0
        
        if recipient_count == 0:
            errors.append("No recipients found for this notification category. Users may have disabled this notification type.")
        
        # Display warnings (non-blocking)
        for warning in warnings:
            messages.warning(request, warning)
        
        # If there are validation errors, re-render form with errors
        if errors:
            for error in errors:
                messages.error(request, error)
            
            context = {
                'title': 'Send Push Notification',
                'categories': categories,
                'link_types': link_types,
                'recipient_count': recipient_count,
                'form_data': {
                    'title': title,
                    'message': message,
                    'category': category,
                    'link_type': link_type,
                    'link_value': link_value,
                    'image_url': image_url,
                }
            }
            return render(request, 'admin/send_push_notification.html', context)
        
        # Build deep link data if provided
        deep_link_data = None
        if link_type and link_value:
            deep_link_data = {
                'type': link_type,
                'value': link_value,
                'category': category
            }
            
            # Add specific fields for order_detail type
            if link_type == 'order_detail':
                deep_link_data['orderId'] = link_value
        
        # Trigger Celery task to send push notification
        try:
            send_admin_push_notification_task.delay(
                title=title,
                message=message,
                category=category,
                deep_link_data=deep_link_data,
                image_url=validated_image_url,  # Use validated image URL (None if validation failed)
                admin_user_id=request.user.id
            )
            
            messages.success(
                request,
                f"Push notification queued successfully! Sending to {recipient_count} user(s)."
            )
            return redirect('admin:index')
            
        except Exception as e:
            messages.error(request, f"Failed to queue push notification: {str(e)}")
            
            context = {
                'title': 'Send Push Notification',
                'categories': categories,
                'link_types': link_types,
                'recipient_count': recipient_count,
                'form_data': {
                    'title': title,
                    'message': message,
                    'category': category,
                    'link_type': link_type,
                    'link_value': link_value,
                    'image_url': image_url,
                }
            }
            return render(request, 'admin/send_push_notification.html', context)
    
    # GET request - display form
    try:
        recipient_count = _calculate_recipient_count('general')
    except Exception as e:
        logger.error(f"Error calculating recipient count: {str(e)}")
        recipient_count = 0
    
    context = {
        'title': 'Send Push Notification',
        'categories': categories,
        'link_types': link_types,
        'recipient_count': recipient_count,
        'form_data': {}
    }
    
    return render(request, 'admin/send_push_notification.html', context)


def _calculate_recipient_count(category):
    """
    Calculate the number of users who will receive the notification
    based on active push tokens and user notification preferences
    
    Args:
        category: Notification category (order_updates, promotions, announcements, general)
    
    Returns:
        int: Number of eligible recipients
    """
    # Map category to user preference field
    category_field_map = {
        'order_updates': 'notify_order_updates',
        'promotions': 'notify_promotions',
        'announcements': 'notify_announcements',
        'general': 'notify_general',
    }
    
    # Get the preference field for this category
    preference_field = category_field_map.get(category, 'notify_general')
    
    # Build query to filter users
    # Users must have:
    # 1. push_notification_enabled = True
    # 2. The specific category preference enabled
    # 3. At least one active push token
    filter_kwargs = {
        'push_notification_enabled': True,
        preference_field: True,
        'push_tokens__is_active': True,
    }
    
    # Count distinct users (in case they have multiple tokens)
    recipient_count = User.objects.filter(**filter_kwargs).distinct().count()
    
    return recipient_count
