import logging
from celery import shared_task
from django.conf import settings
from inventory.models import OrderNo

from .services.dashboard import DashboardNotification
from .services.email import EmailNotificationService
from .config import NotificationConfig


logger = logging.getLogger(__name__)



@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_notifications_task(self, order_id: int):
  try:
    logger.info(f"Starting notification task for order ID {order_id}")
    if not NotificationConfig.is_enabled():
      logger.warning("Notifications are not enabled")
      return {"status": "skipped", "reason": "Notifications disabled"}
    from .services.manager import NotificationManager
    manager = NotificationManager()
    
    results = manager.send_order_notifications(order_id)
    if not results['overall_success']:
       logger.warning(f"All notification channels failed for order {order_id}")
       raise Exception("All notification channels failed")
    logger.info(f"Notification task completed for order {order_id}: {results}")
    return results
  except Exception as e:
    logger.error(f"Error in notification task for order {order_id}: {str(e)}", exc_info=True)
    current_retry = self.request.retries
    max_retries = self.max_retries if self.max_retries is not None else 3
    countdown = settings.NOTIFICATION_RETRY_DELAY * (2 ** current_retry)
    logger.warning( 
    f"Retrying notification task for Order ID: {order_id} in {countdown} seconds "
    f"(Attempt {current_retry + 1}/{max_retries + 1})"
    )
    raise self.retry(exc=e, countdown=countdown)

@shared_task
def retry_failed_notifications_task():

  try:
    logger.info("Starting failed notifications retry task")
    dashboard = DashboardNotification()
    max_retries = NotificationConfig.get_max_retries()
    failed_notifications = dashboard.client.get_failed_notifications(max_retries)
    if not failed_notifications:
            logger.info("No failed notifications to retry")
            return {'retried': 0, 'succeeded': 0, 'failed': 0}
    logger.info(f"Found {len(failed_notifications)} failed notifications to retry")
    from .services.manager import NotificationManager
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
def summary_task():
  try:
    from datetime import timedelta
    from django.utils import timezone
    dashboard = DashboardNotification()
    four_days_ago = timezone.now() - timedelta(days=4)
    filters = {
    'status': 'FAILED',
    'date_from': four_days_ago.isoformat(),
    'limit':50
    }
    failed_notifications = dashboard.get_notifications(filters)
    logger.info(f"Found {len(failed_notifications)} failed notifications in last 4 days")
    summary = {
            'EMAIL': 0,
            'WHATSAPP': 0,
            'DASHBOARD': 0
    }
    for notification in failed_notifications:
      notification_type = notification.get('notification_type', 'UNKNOWN')
      if notification_type in summary:
        summary[notification_type] += 1
    admin_emails = NotificationConfig.get_admin_emails()
    if admin_emails and len(failed_notifications) > 0:
      from django.core.mail import send_mail
      subject = f"Notification Failure Summary - {len(failed_notifications)} Failed"
      message= f"""
      Notification Failure Summary
      Period: {four_days_ago.strftime('%Y-%m-%d')} to {timezone.now().strftime('%Y-%m-%d')}
      Total Failed: {len(failed_notifications)}

      Breakdown by Channel:
      - Email: {summary['EMAIL']}
      - WhatsApp: {summary['WHATSAPP']}
      - Dashboard: {summary['DASHBOARD']}

      Please review the failed notifications in the admin dashboard.
      """
      try:
        send_mail(subject, message, settings.EMAIL_HOST_USER, admin_emails, fail_silently=False)
        logger.info('Sent email')
      except Exception as e:
         logger.error(f"Failed to summary email: {str(e)}") 
    results = {
    'failed_count': len(failed_notifications),
    'summary':summary
    }
    logger.info(f"Daily failure summary completed: {results}")
    return results
  except Exception as e:
    logger.error(f"Error in daily failure summary task: {str(e)}", exc_info=True)
    return {'error': str(e)}
  
@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_user_confirmation_email_task(self, order_no_id: int):
  try:
    logger.info(f"Starting user confirmation email task for order ID {order_no_id}")
    order_no = OrderNo.objects.select_related(
      'user', 'status', 'address'
    ).prefetch_related(
      'orders__product__category'
    ).get(id=order_no_id)
    email = EmailNotificationService()
    success = email.send_user_confirmation_email(order_no)
    if success:
      logger.info(f"User confirmation email sent successfully for order {order_no.order_number}")
      return {'success': True, 'order_number': order_no.order_number}
    else:
      logger.error(f"Failed to send user confirmation email for order {order_no.order_number}")
      raise Exception("Failed to send user confirmation email")
  except Exception as e:
    logger.error(f"Error in user confirmation email task for order {order_no_id}: {str(e)}", exc_info=True)
    retry_count = self.request.retries
    countdown = 60 * (2 ** retry_count)
    logger.info(f"Retrying user confirmation email task (attempt {retry_count + 1}/3) in {countdown}s")
    raise self.retry(exc=e, countdown=countdown)
    
    
    
    