import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from inventory.models import OrderNo
from .tasks import send_order_notifications_task

logger = logging.getLogger(__name__)

@receiver(post_save, sender=OrderNo)
def order_created_handler(sender, instance, created, **kwargs):
  """
  Signal handler that triggers notification task when a new order is created.
  """
  if created:
    try:
      logger.info(f"New order created: {instance.order_number} (ID: {instance.id})")
      logger.info(f"Triggering notification task for order ID: {instance.id}")
      send_order_notifications_task.delay(instance.id)
      logger.info(f"Notification task queued for order {instance.order_number}")
    except Exception  as e:
      logger.error(f"Failed to queue notification task for order {instance.id}: {str(e)}", exc_info=True)
