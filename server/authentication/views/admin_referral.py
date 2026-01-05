"""
Admin Referral Management Views

These views handle referral management for the admin dashboard,
providing access to all users' referral data and transactions.
"""

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from django.db.models import Sum, Count, Q, F
from decimal import Decimal
import logging

from ..models import User, AuditLog
from ..serializers import ReferredUserSerializer
from utils.usercheck import authenticate_request

logger = logging.getLogger(__name__)


def check_admin_privileges(user):
    """Helper to verify admin privileges"""
    if not user.is_staff and not user.is_superuser:
        return False
    return True


@method_decorator(csrf_exempt, name='dispatch')
class AdminAllReferredUsersView(APIView):
    """
    Admin endpoint to get all referred users across the platform.
    Returns users who were referred by someone (have referred_by set).
    """
    
    def get(self, request):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        if not check_admin_privileges(user):
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all users who were referred by someone
        referred_users = User.objects.filter(
            referred_by__isnull=False,
            is_deleted=False
        ).select_related('referred_by').order_by('-date_joined')
        
        referrals_data = []
        for referred_user in referred_users:
            referrals_data.append({
                'id': referred_user.id,
                'name': referred_user.name,
                'email': referred_user.email,
                'date_joined': referred_user.date_joined.isoformat(),
                'has_completed_first_order': referred_user.has_completed_first_order,
                'referrer': {
                    'id': referred_user.referred_by.id,
                    'name': referred_user.referred_by.name,
                    'email': referred_user.referred_by.email,
                    'referral_code': referred_user.referred_by.referral_code,
                } if referred_user.referred_by else None
            })
        
        return Response({
            'referrals': referrals_data
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class AdminAllReferralTransactionsView(APIView):
    """
    Admin endpoint to get all referral transactions across the platform.
    Includes referrer bonuses, referee bonuses, and redemptions.
    """
    
    def get(self, request):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        if not check_admin_privileges(user):
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from inventory.models import OrderNo
        
        transactions = []
        transaction_id = 1
        
        # 1. Referrer bonuses - when referred users complete their first order
        successful_referrals = User.objects.filter(
            referred_by__isnull=False,
            has_completed_first_order=True,
            is_deleted=False
        ).select_related('referred_by')
        
        for referred_user in successful_referrals:
            first_order = OrderNo.objects.filter(
                user=referred_user,
                status__name__iexact='completed'
            ).order_by('created_at').first()
            
            if first_order and referred_user.referred_by:
                transactions.append({
                    'id': transaction_id,
                    'transaction_type': 'referrer_bonus',
                    'amount': '20.00',
                    'description': f'{referred_user.referred_by.name} earned bonus for referring {referred_user.name}',
                    'created_at': first_order.created_at.isoformat(),
                    'order_id': first_order.id,
                    'user': {
                        'id': referred_user.referred_by.id,
                        'name': referred_user.referred_by.name,
                        'email': referred_user.referred_by.email,
                    },
                    'related_user': {
                        'id': referred_user.id,
                        'name': referred_user.name,
                    }
                })
                transaction_id += 1
        
        # 2. Referee bonuses - when new users complete their first order after being referred
        for referred_user in successful_referrals:
            first_order = OrderNo.objects.filter(
                user=referred_user,
                status__name__iexact='completed'
            ).order_by('created_at').first()
            
            if first_order:
                transactions.append({
                    'id': transaction_id,
                    'transaction_type': 'referee_bonus',
                    'amount': '10.00',
                    'description': f'{referred_user.name} received sign-up bonus',
                    'created_at': first_order.created_at.isoformat(),
                    'order_id': first_order.id,
                    'user': {
                        'id': referred_user.id,
                        'name': referred_user.name,
                        'email': referred_user.email,
                    },
                    'related_user': {
                        'id': referred_user.referred_by.id if referred_user.referred_by else None,
                        'name': referred_user.referred_by.name if referred_user.referred_by else None,
                    } if referred_user.referred_by else None
                })
                transaction_id += 1
        
        # 3. Redemptions - when users redeem their referral balance
        redeemed_orders = OrderNo.objects.filter(
            redeemed_referral_bonus__gt=0
        ).select_related('user').order_by('-created_at')
        
        for order in redeemed_orders:
            if order.user and not order.user.is_deleted:
                transactions.append({
                    'id': transaction_id,
                    'transaction_type': 'redemption',
                    'amount': str(order.redeemed_referral_bonus),
                    'description': f'{order.user.name} redeemed ₹{order.redeemed_referral_bonus} on order #{order.order_number}',
                    'created_at': order.created_at.isoformat(),
                    'order_id': order.id,
                    'user': {
                        'id': order.user.id,
                        'name': order.user.name,
                        'email': order.user.email,
                    },
                    'related_user': None
                })
                transaction_id += 1
        
        # Sort by date descending
        transactions.sort(key=lambda x: x['created_at'], reverse=True)
        
        return Response({
            'transactions': transactions
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class AdminUserReferralDetailsView(APIView):
    """
    Admin endpoint to get detailed referral information for a specific user.
    """
    
    def get(self, request, user_id):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        if not check_admin_privileges(user):
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            target_user = User.objects.get(id=user_id, is_deleted=False)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        from inventory.models import OrderNo
        
        # Get users referred by this user
        referred_users = User.objects.filter(
            referred_by=target_user,
            is_deleted=False
        ).order_by('-date_joined')
        
        referred_users_data = []
        for ref_user in referred_users:
            referred_users_data.append({
                'id': ref_user.id,
                'name': ref_user.name,
                'email': ref_user.email,
                'date_joined': ref_user.date_joined.isoformat(),
                'has_completed_first_order': ref_user.has_completed_first_order,
                'earned_amount': 20.00 if ref_user.has_completed_first_order else 0.00
            })
        
        # Build transaction history for this user
        transactions = []
        
        # Earnings from referrals
        for ref_user in referred_users:
            if ref_user.has_completed_first_order:
                first_order = OrderNo.objects.filter(
                    user=ref_user,
                    status__name__iexact='completed'
                ).order_by('created_at').first()
                
                if first_order:
                    transactions.append({
                        'id': f'earned-{ref_user.id}',
                        'type': 'earned',
                        'amount': 20.00,
                        'description': f'Referral bonus from {ref_user.name}',
                        'created_at': first_order.created_at.isoformat(),
                        'related_user_name': ref_user.name,
                        'order_number': first_order.order_number,
                    })
        
        # Sign-up bonus if user was referred
        if target_user.referred_by and target_user.has_completed_first_order:
            first_order = OrderNo.objects.filter(
                user=target_user,
                status__name__iexact='completed'
            ).order_by('created_at').first()
            
            if first_order:
                transactions.append({
                    'id': f'signup-{target_user.id}',
                    'type': 'earned',
                    'amount': 10.00,
                    'description': f'Sign-up bonus (referred by {target_user.referred_by.name})',
                    'created_at': first_order.created_at.isoformat(),
                    'related_user_name': target_user.referred_by.name,
                    'order_number': first_order.order_number,
                })
        
        # Redemptions
        redeemed_orders = OrderNo.objects.filter(
            user=target_user,
            redeemed_referral_bonus__gt=0
        ).order_by('-created_at')
        
        for order in redeemed_orders:
            transactions.append({
                'id': f'redeemed-{order.id}',
                'type': 'redeemed',
                'amount': float(order.redeemed_referral_bonus),
                'description': f'Redeemed on order #{order.order_number}',
                'created_at': order.created_at.isoformat(),
                'order_number': order.order_number,
            })
        
        # Sort transactions by date
        transactions.sort(key=lambda x: x['created_at'], reverse=True)
        
        return Response({
            'user': {
                'id': target_user.id,
                'name': target_user.name,
                'email': target_user.email,
                'referral_code': target_user.referral_code,
                'referred_balance': str(target_user.referred_balance or '0.00'),
                'has_completed_first_order': target_user.has_completed_first_order,
            },
            'referred_by': {
                'id': target_user.referred_by.id,
                'name': target_user.referred_by.name,
                'referral_code': target_user.referred_by.referral_code,
            } if target_user.referred_by else None,
            'referred_users': referred_users_data,
            'transactions': transactions,
            'stats': {
                'total_referrals': len(referred_users_data),
                'successful_referrals': len([u for u in referred_users_data if u['has_completed_first_order']]),
                'total_earned': sum(u['earned_amount'] for u in referred_users_data),
                'current_balance': float(target_user.referred_balance or 0),
            }
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class AdminReferralStatsView(APIView):
    """
    Admin endpoint to get overall referral program statistics.
    """
    
    def get(self, request):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        if not check_admin_privileges(user):
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from inventory.models import OrderNo
        
        # Total users with referral codes
        total_users_with_codes = User.objects.filter(
            referral_code__isnull=False,
            is_deleted=False
        ).count()
        
        # Total referred users
        total_referred = User.objects.filter(
            referred_by__isnull=False,
            is_deleted=False
        ).count()
        
        # Successful referrals (completed first order)
        successful_referrals = User.objects.filter(
            referred_by__isnull=False,
            has_completed_first_order=True,
            is_deleted=False
        ).count()
        
        # Total bonus paid (referrer + referee)
        total_referrer_bonus = successful_referrals * 20  # ₹20 per referrer
        total_referee_bonus = successful_referrals * 10   # ₹10 per referee
        total_bonus_paid = total_referrer_bonus + total_referee_bonus
        
        # Total redeemed
        total_redeemed = OrderNo.objects.filter(
            redeemed_referral_bonus__gt=0
        ).aggregate(total=Sum('redeemed_referral_bonus'))['total'] or Decimal('0')
        
        # Pending balance (sum of all user balances)
        pending_balance = User.objects.filter(
            is_deleted=False
        ).aggregate(total=Sum('referred_balance'))['total'] or Decimal('0')
        
        # Top referrers
        top_referrers = User.objects.filter(
            is_deleted=False,
            referral_code__isnull=False
        ).annotate(
            referral_count=Count('referrals', filter=Q(referrals__is_deleted=False))
        ).filter(
            referral_count__gt=0
        ).order_by('-referral_count', '-referred_balance')[:10]
        
        top_referrers_data = [{
            'id': u.id,
            'name': u.name,
            'email': u.email,
            'referral_code': u.referral_code,
            'referral_count': u.referral_count,
            'balance': str(u.referred_balance or '0.00'),
        } for u in top_referrers]
        
        return Response({
            'stats': {
                'total_users_with_codes': total_users_with_codes,
                'total_referred': total_referred,
                'successful_referrals': successful_referrals,
                'conversion_rate': round((successful_referrals / total_referred * 100), 1) if total_referred > 0 else 0,
                'total_bonus_paid': float(total_bonus_paid),
                'total_referrer_bonus': float(total_referrer_bonus),
                'total_referee_bonus': float(total_referee_bonus),
                'total_redeemed': float(total_redeemed),
                'pending_balance': float(pending_balance),
            },
            'top_referrers': top_referrers_data
        }, status=status.HTTP_200_OK)
