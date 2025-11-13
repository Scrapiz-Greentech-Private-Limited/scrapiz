from decimal import Decimal
from django.db import transaction

def calculate_order(order_no):
  total_value = Decimal('0.00')
  for order in order_no.orders.all():
    product = order.product
    quantity = order.quantity
    if product.min_rate is not None and product.max_rate is not None:
      average_rate = (Decimal(str(product.min_rate)) + Decimal(str(product.max_rate))) / 2
      total_value += quantity * average_rate
  return total_value


def total_payout(order_no , quantity):
  return (Decimal)(str(quantity)) + order_no.redeemed_referral_bonus
  
def is_order_eligible(order_no):
  user = order_no.user
  if not order_no.status.lower != 'completed':
    return False
  if user.has_completed_first_order:
    return False
  if not user.referred_by:
    return False
  order_value = calculate_order(order_no)
  if order_value < Decimal('500'):
    return False
  return True
  
  
def post_referral(order_no):
  if not is_order_eligible(order_no):
     return {
     'success':False,
     'message': 'Order not eligible for rewards'
      }
  user = order_no.user
  
  referrer = user.referred_by
  
  try:
    with transaction.atomic():
      referrer.referred_balance += Decimal('20.00')
      referrer.save(update_fields=['referral_balance'])
      user.referred_balance += Decimal('5.00')
      
      user.has_completed_first_order = True
      user.save(update_fields=['referral_balance', 'has_completed_first_order'])
      return {
      'success':True,
      'message':f'Rewards granted',
      'referrer_balance': referrer.referred_balance,
      'user_balance': user.referred_balance
      }
  except Exception as e:
    return {
    'success':False,
    'message': f'Error processing rewards: {str(e)}'
    }
      
      