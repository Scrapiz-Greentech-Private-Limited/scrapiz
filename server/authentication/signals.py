from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import transaction
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender='inventory.OrderNo')
def process_referral_rewards_signal(sender, instance, created, **kwargs):
  from utils.referral_check import is_order_eligible, calculate_order
  logger.info(f"?? Signal fired for order {instance.order_number}")
  if not instance.status:
    logger.info(f"? Order {instance.order_number} has no status")
    return
  logger.info(f"?? Order {instance.order_number} status: {instance.status.name}")
  if instance.status.name.lower() != 'completed':
    logger.info(f"?? Order {instance.order_number} not completed, skipping")
    return
  user = instance.user
  logger.info(f"?? User: {user.email}")
  
  if user.has_completed_first_order: 
    logger.info(f"? User {user.email} already completed first order. Skipping rewards.")
    return
  logger.info(f"? User has NOT completed first order yet")
  if not user.referred_by:
    user.has_completed_first_order = True
    user.save(update_fields=['has_completed_first_order'])
    logger.info(f"? User {user.email} completed first order without referral.")
    return
    
  logger.info(f"? User was referred by: {user.referred_by.email}")
  order_value = calculate_order(instance)
  logger.info(f"?? Order {instance.order_number} value: ?{order_value}")
  if order_value <= Decimal('500.0'):
    logger.info(f"? Order {instance.order_number} value ?{order_value} below ?500 threshold. No rewards.")
    return
  logger.info(f"? Order value exceeds ?500 threshold")
  try:
    with transaction.atomic():
      referrer = user.referred_by
      referrer.referred_balance += Decimal('20.00')
      referrer.save(update_fields=['referred_balance'])
      user.referred_balance += Decimal('5.00')
      user.has_completed_first_order = True
      user.save(update_fields=['referred_balance', 'has_completed_first_order'])
      logger.info( f"Referral rewards granted for order {instance.order_number}: ")
  except Exception as e:
    logger.error(f"? Error processing referral rewards for order {instance.order_number}: {str(e)}")

  
@receiver(post_save, sender='authentication.User')
def generate_referral_code_on_user_creation(sender,instance, created,**kwargs):
  if created and not instance.referral_code:
    from authentication.utils import generate_referral_code
    try:
      instance.referral_code = generate_referral_code()
      instance.save(update_fields=['referral_code'])
      logger.info(f"Generated referral code {instance.referral_code} for user {instance.email}")
    except Exception as e:
      logger.error(f"Error generating referral code for user {instance.email}: {str(e)}")
  