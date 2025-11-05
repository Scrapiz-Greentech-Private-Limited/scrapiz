"""
Utility functions for inventory and order management.
"""
from decimal import Decimal
from django.db import transaction


def calculate_order_value(order_no):
    """
    Calculate the total value of an order.
    Value = sum of (quantity × average_rate) for each product
    
    Args:
        order_no (OrderNo): OrderNo instance
        
    Returns:
        Decimal: Total order value in rupees
    """
    total_value = Decimal('0.00')
    
    for order in order_no.orders.all():
        product = order.product
        quantity = order.quantity or Decimal('0.00')
        
        # Use average of min and max rate
        if product.min_rate is not None and product.max_rate is not None:
            avg_rate = (Decimal(str(product.min_rate)) + Decimal(str(product.max_rate))) / 2
            total_value += quantity * avg_rate
    
    return total_value


def calculate_total_payout(order_no, scrap_value):
    """
    Calculate total payout for an order including redeemed referral bonus.
    
    Args:
        order_no (OrderNo): OrderNo instance
        scrap_value (Decimal): Value of scrap materials
        
    Returns:
        Decimal: Total payout (scrap_value + redeemed_referral_bonus)
    """
    return Decimal(str(scrap_value)) + order_no.redeemed_referral_bonus


def is_order_eligible_for_rewards(order_no):
    """
    Check if an order is eligible for referral rewards.
    
    Eligibility criteria:
    - Order status is "Completed"
    - User has not completed first order yet
    - User was referred by someone
    - Order value > ₹500
    
    Args:
        order_no (OrderNo): OrderNo instance
        
    Returns:
        bool: True if eligible, False otherwise
    """
    user = order_no.user
    
    # Check if order is completed
    if not order_no.status or order_no.status.name.lower() != 'completed':
        return False
    
    # Check if user already completed first order
    if user.has_completed_first_order:
        return False
    
    # Check if user was referred
    if not user.referred_by:
        return False
    
    # Check order value threshold
    order_value = calculate_order_value(order_no)
    if order_value <= Decimal('500.00'):
        return False
    
    return True


def process_referral_rewards(order_no):
    """
    Process and grant referral rewards for an eligible order.
    
    Args:
        order_no (OrderNo): OrderNo instance
        
    Returns:
        dict: Result with success status and message
    """
    if not is_order_eligible_for_rewards(order_no):
        return {
            'success': False,
            'message': 'Order not eligible for rewards'
        }
    
    user = order_no.user
    referrer = user.referred_by
    
    try:
        with transaction.atomic():
            # Grant rewards
            referrer.referral_balance += Decimal('20.00')
            referrer.save(update_fields=['referral_balance'])
            
            user.referral_balance += Decimal('5.00')
            user.has_completed_first_order = True
            user.save(update_fields=['referral_balance', 'has_completed_first_order'])
            
            return {
                'success': True,
                'message': f'Rewards granted: ₹20 to referrer, ₹5 to user',
                'referrer_balance': referrer.referral_balance,
                'user_balance': user.referral_balance
            }
    except Exception as e:
        return {
            'success': False,
            'message': f'Error processing rewards: {str(e)}'
        }
