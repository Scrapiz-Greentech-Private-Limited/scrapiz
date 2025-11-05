"""
Celery tasks for asynchronous notification processing
"""
import logging
from celery import shared_task
from django.conf import settings
from .services.notification_manager import NotificationManager
from .services.dashboard_service import DashboardNotificationService
from .config import NotificationConfig

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_notifications_task(self, order_no_id: int):
    """
    Main task to send all notifications for an order
    Retries 3 times with exponential backoff
    
    Args:
        order_no_id: ID of the OrderNo instance
        
    Returns:
        Dictionary with notification results
    """
    try:
        logger.info(f"Starting notification task for order ID {order_no_id}")
        
        # Check if notifications are enabled
        if not NotificationConfig.is_enabled():
            logger.warning("Notification system is disabled")
            return {'error': 'Notification system disabled'}
        
        # Send notifications
        manager = NotificationManager()
        results = manager.send_order_notifications(order_no_id)
        
        if not results['overall_success']:
            logger.warning(f"All notification channels failed for order {order_no_id}")
            # Retry the task
            raise Exception("All notification channels failed")
        
        logger.info(f"Notification task completed for order {order_no_id}: {results}")
        return results
        
    except Exception as exc:
        logger.error(f"Error in notification task for order {order_no_id}: {str(exc)}", exc_info=True)
        
        # Retry with exponential backoff
        retry_count = self.request.retries
        countdown = 60 * (2 ** retry_count)  # 60s, 120s, 240s
        
        logger.info(f"Retrying notification task (attempt {retry_count + 1}/3) in {countdown}s")
        raise self.retry(exc=exc, countdown=countdown)


@shared_task
def retry_failed_notifications_task():
    """r
    Periodic task to retry failed notifications
    Runs every hour via Celery Beat
    
    Returns:
        Dictionary with retry statistics
    """
    try:
        logger.info("Starting failed notifications retry task")
        
        dashboard_service = DashboardNotificationService()
        max_retries = NotificationConfig.get_max_retries()
        
        # Get failed notifications
        failed_notifications = dashboard_service.supabase_client.get_failed_notifications(max_retries)
        
        if not failed_notifications:
            logger.info("No failed notifications to retry")
            return {'retried': 0, 'succeeded': 0, 'failed': 0}
        
        logger.info(f"Found {len(failed_notifications)} failed notifications to retry")
        
        # Retry each notification
        manager = NotificationManager()
        succeeded = 0
        failed = 0
        
        for notification in failed_notifications:
            notification_id = notification['id']
            try:
                success = manager.retry_failed_notification(notification_id)
                if success:
                    succeeded += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Error retrying notification {notification_id}: {str(e)}")
                failed += 1
        
        results = {
            'retried': len(failed_notifications),
            'succeeded': succeeded,
            'failed': failed
        }
        
        logger.info(f"Failed notifications retry completed: {results}")
        return results
        
    except Exception as e:
        logger.error(f"Error in retry failed notifications task: {str(e)}", exc_info=True)
        return {'error': str(e)}


@shared_task
def send_daily_failure_summary_task():
    """
    Send summary of failed notifications every 4 days
    Runs every 4 days via Celery Beat
    
    Returns:
        Dictionary with summary statistics
    """
    try:
        logger.info("Starting 4-day failure summary task")
        
        from datetime import timedelta
        from django.utils import timezone
        
        dashboard_service = DashboardNotificationService()
        
        # Get failed notifications from last 4 days
        four_days_ago = timezone.now() - timedelta(days=4)
        filters = {
            'status': 'FAILED',
            'date_from': four_days_ago.isoformat(),
            'limit': 50  # Reduced from 100 to save resources
        }
        
        failed_notifications = dashboard_service.get_notifications(filters)
        
        if not failed_notifications:
            logger.info("No failed notifications in the last 4 days")
            return {'failed_count': 0}
        
        logger.info(f"Found {len(failed_notifications)} failed notifications in last 4 days")
        
        # Group by notification type
        summary = {
            'EMAIL': 0,
            'WHATSAPP': 0,
            'DASHBOARD': 0
        }
        
        for notification in failed_notifications:
            notification_type = notification.get('notification_type', 'UNKNOWN')
            if notification_type in summary:
                summary[notification_type] += 1
        
        # Send summary email to admins (only if there are failures)
        admin_emails = NotificationConfig.get_admin_emails()
        if admin_emails and len(failed_notifications) > 0:
            from django.core.mail import send_mail
            
            subject = f"⚠️ 4-Day Notification Failure Summary - {len(failed_notifications)} Failed"
            message = f"""
4-Day Notification Failure Summary
Period: {four_days_ago.strftime('%Y-%m-%d')} to {timezone.now().strftime('%Y-%m-%d')}

Total Failed: {len(failed_notifications)}

Breakdown by Channel:
- Email: {summary['EMAIL']}
- WhatsApp: {summary['WHATSAPP']}
- Dashboard: {summary['DASHBOARD']}

Please review the failed notifications in the admin dashboard.
            """
            
            try:
                send_mail(
                    subject,
                    message,
                    settings.EMAIL_HOST_USER,
                    admin_emails,
                    fail_silently=False
                )
                logger.info("Daily failure summary email sent")
            except Exception as e:
                logger.error(f"Failed to send daily summary email: {str(e)}")
        
        results = {
            'failed_count': len(failed_notifications),
            'summary': summary
        }
        
        logger.info(f"Daily failure summary completed: {results}")
        return results
        
    except Exception as e:
        logger.error(f"Error in daily failure summary task: {str(e)}", exc_info=True)
        return {'error': str(e)}


@shared_task
def test_notification_system():
    """
    Test task to verify notification system is working
    Can be called manually for testing
    
    Returns:
        Configuration validation results
    """
    try:
        logger.info("Testing notification system configuration")
        
        validation = NotificationConfig.validate_config()
        
        logger.info(f"Notification system test results: {validation}")
        return validation
        
    except Exception as e:
        logger.error(f"Error testing notification system: {str(e)}", exc_info=True)
        return {'error': str(e)}
