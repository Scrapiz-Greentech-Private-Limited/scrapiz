"""
Django signals for authentication and referral system.
Handles automatic reward processing when orders are completed.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import transaction
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender='inventory.OrderNo')
def process_referral_rewards_signal(sender, instance, created, **kwargs):
    """
    Process referral rewards when an order status changes to "Completed".
    
    This signal is triggered after an OrderNo is saved. It checks if:
    1. Order status is "Completed"
    2. User has not completed their first order yet
    3. User was referred by someone
    4. Order value exceeds ₹500
    
    If all conditions are met, grants:
    - ₹20 to the referrer
    - ₹5 to the referred user
    
    Args:
        sender: The model class (OrderNo)
        instance: The actual OrderNo instance being saved
        created: Boolean indicating if this is a new record
        **kwargs: Additional keyword arguments
    """
    # Import here to avoid circular imports
    from inventory.utils import calculate_order_value
    
    # Debug logging
    logger.info(f"🔔 Signal fired for order {instance.order_number}")
    
    # Only process if order has a status
    if not instance.status:
        logger.info(f"❌ Order {instance.order_number} has no status")
        return
    
    logger.info(f"📊 Order {instance.order_number} status: {instance.status.name}")
    
    # Only process completed orders
    if instance.status.name.lower() != 'completed':
        logger.info(f"⏭️ Order {instance.order_number} not completed, skipping")
        return
    
    user = instance.user
    logger.info(f"👤 User: {user.email}")
    
    # Check if user already completed first order
    if user.has_completed_first_order:
        logger.info(f"❌ User {user.email} already completed first order. Skipping rewards.")
        return
    
    logger.info(f"✅ User has NOT completed first order yet")
    
    # Check if user was referred
    if not user.referred_by:
        # Mark as completed even without referral
        user.has_completed_first_order = True
        user.save(update_fields=['has_completed_first_order'])
        logger.info(f"❌ User {user.email} completed first order without referral.")
        return
    
    logger.info(f"✅ User was referred by: {user.referred_by.email}")
    
    # Calculate order value
    order_value = calculate_order_value(instance)
    logger.info(f"💰 Order {instance.order_number} value: ₹{order_value}")
    
    # Check if order meets minimum value requirement
    if order_value <= Decimal('500.00'):
        logger.info(f"❌ Order {instance.order_number} value ₹{order_value} below ₹500 threshold. No rewards.")
        return
    
    logger.info(f"✅ Order value exceeds ₹500 threshold")
    
    # Grant rewards atomically
    try:
        with transaction.atomic():
            referrer = user.referred_by
            
            # Update referrer balance (changed to referred_balance)
            referrer.referred_balance += Decimal('20.00')
            referrer.save(update_fields=['referred_balance'])
            
            # Update referred user balance (changed to referred_balance)
            user.referred_balance += Decimal('5.00')
            user.has_completed_first_order = True
            user.save(update_fields=['referred_balance', 'has_completed_first_order'])
            
            logger.info(
                f"✅ Referral rewards granted for order {instance.order_number}: "
                f"Referrer {referrer.email} +₹20 (total: ₹{referrer.referred_balance}), "
                f"User {user.email} +₹5 (total: ₹{user.referred_balance})"
            )
    except Exception as e:
        logger.error(f"❌ Error processing referral rewards for order {instance.order_number}: {str(e)}")


@receiver(post_save, sender='authentication.User')
def generate_referral_code_on_user_creation(sender, instance, created, **kwargs):
    """
    Automatically generate a referral code when a new user is created.
    
    This ensures every user has a unique referral code they can share.
    
    Args:
        sender: The model class (User)
        instance: The actual User instance being saved
        created: Boolean indicating if this is a new record
        **kwargs: Additional keyword arguments
    """
    # Only process newly created users without a referral code
    if created and not instance.referral_code:
        from authentication.utils import generate_referral_code
        
        try:
            instance.referral_code = generate_referral_code()
            instance.save(update_fields=['referral_code'])
            logger.info(f"Generated referral code {instance.referral_code} for user {instance.email}")
        except Exception as e:
            logger.error(f"Error generating referral code for user {instance.email}: {str(e)}")
