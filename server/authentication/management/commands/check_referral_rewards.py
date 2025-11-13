
from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from authentication.models import User
from inventory.models import OrderNo
from utils.referral_check import calculate_order
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Check and manually process referral rewards for eligible orders'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-email',
            type=str,
            help='Check specific user by email',
        )
        parser.add_argument(
            '--process',
            action='store_true',
            help='Actually process the rewards (default is dry-run)',
        )
        parser.add_argument(
            '--order-number',
            type=str,
            help='Check specific order by order number',
        )

    def handle(self, *args, **options):
        user_email = options.get('user_email')
        process = options.get('process', False)
        order_number = options.get('order_number')

        self.stdout.write(self.style.SUCCESS('=== Referral Rewards Checker ===\n'))

        if order_number:
            # Check specific order
            self.check_specific_order(order_number, process)
        elif user_email:
            # Check specific user
            self.check_user_orders(user_email, process)
        else:
            # Check all users with referrals
            self.check_all_referrals(process)

    def check_specific_order(self, order_number, process):
        """Check a specific order for referral rewards eligibility"""
        try:
            order = OrderNo.objects.get(order_number=order_number)
        except OrderNo.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Order {order_number} not found'))
            return

        self.stdout.write(f'\n?? Order: {order.order_number}')
        self.stdout.write(f'   User: {order.user.email}')
        self.stdout.write(f'   Status: {order.status.name if order.status else "No status"}')
        
        # Calculate order value
        order_value = calculate_order_value(order)
        self.stdout.write(f'   Order Value: ?{order_value}')
        
        # Check eligibility
        user = order.user
        self.stdout.write(f'\n?? Eligibility Check:')
        self.stdout.write(f'   ? Has referrer: {"Yes" if user.referred_by else "No"}')
        if user.referred_by:
            self.stdout.write(f'     Referred by: {user.referred_by.email}')
        self.stdout.write(f'   ? First order completed: {"Yes" if user.has_completed_first_order else "No"}')
        self.stdout.write(f'   ? Order value > ?500: {"Yes" if order_value > Decimal("500.00") else "No"}')
        self.stdout.write(f'   ? Status is Completed: {"Yes" if order.status and order.status.name.lower() == "completed" else "No"}')
        
        # Check if eligible
        is_eligible = (
            user.referred_by and
            not user.has_completed_first_order and
            order_value > Decimal('500.00') and
            order.status and
            order.status.name.lower() == 'completed'
        )
        
        if is_eligible:
            self.stdout.write(self.style.SUCCESS('\n? Order is ELIGIBLE for referral rewards!'))
            
            if process:
                self.process_reward(order)
            else:
                self.stdout.write(self.style.WARNING('   (Dry-run mode - use --process to actually grant rewards)'))
        else:
            self.stdout.write(self.style.ERROR('\n? Order is NOT eligible for referral rewards'))

    def check_user_orders(self, email, process):
        """Check all orders for a specific user"""
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {email} not found'))
            return

        self.stdout.write(f'\n?? User: {user.email}')
        self.stdout.write(f'   Name: {user.name}')
        self.stdout.write(f'   Referred by: {user.referred_by.email if user.referred_by else "None"}')
        self.stdout.write(f'   First order completed: {"Yes" if user.has_completed_first_order else "No"}')
        self.stdout.write(f'   Referral balance: ?{user.referred_balance}')
        
        # Get all orders
        orders = OrderNo.objects.filter(user=user).order_by('created_at')
        
        if not orders.exists():
            self.stdout.write(self.style.WARNING('\n   No orders found for this user'))
            return
        
        self.stdout.write(f'\n?? Orders ({orders.count()}):')
        
        for order in orders:
            order_value = calculate_order(order)
            status_name = order.status.name if order.status else "No status"
            
            self.stdout.write(f'\n   Order: {order.order_number}')
            self.stdout.write(f'   Status: {status_name}')
            self.stdout.write(f'   Value: ?{order_value}')
            self.stdout.write(f'   Created: {order.created_at}')
            
            # Check if this order is eligible
            is_eligible = (
                user.referred_by and
                not user.has_completed_first_order and
                order_value > Decimal('500.00') and
                order.status and
                order.status.name.lower() == 'completed'
            )
            
            if is_eligible:
                self.stdout.write(self.style.SUCCESS('   ? ELIGIBLE for rewards'))
                if process:
                    self.process_reward(order)
            else:
                self.stdout.write('   ? Not eligible')

    def check_all_referrals(self, process):
        """Check all users who were referred"""
        referred_users = User.objects.filter(referred_by__isnull=False).order_by('date_joined')
        
        if not referred_users.exists():
            self.stdout.write(self.style.WARNING('No referred users found'))
            return
        
        self.stdout.write(f'\n?? Found {referred_users.count()} referred users\n')
        
        for user in referred_users:
            self.stdout.write(f'\n{"="*60}')
            self.check_user_orders(user.email, process)

    def process_reward(self, order):
        """Actually process and grant the referral rewards"""
        user = order.user
        referrer = user.referred_by
        
        try:
            with transaction.atomic():
                # Grant rewards
                referrer.referred_balance += Decimal('20.00')
                referrer.save(update_fields=['referred_balance'])
                
                user.referred_balance += Decimal('5.00')
                user.has_completed_first_order = True
                user.save(update_fields=['referred_balance', 'has_completed_first_order'])
                
                self.stdout.write(self.style.SUCCESS(
                    f'\n?? Rewards Granted:'
                    f'\n   Referrer ({referrer.email}): +?20 (total: ?{referrer.referred_balance})'
                    f'\n   User ({user.email}): +?5 (total: ?{user.referred_balance})'
                ))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n? Error processing rewards: {str(e)}'))
