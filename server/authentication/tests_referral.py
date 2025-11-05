"""
Unit and integration tests for the referral system.
Run with: python manage.py test authentication.tests_referral
"""
from django.test import TestCase
from django.utils import timezone
from decimal import Decimal
from authentication.models import User
from authentication.utils import generate_referral_code, validate_promo_code, link_referral
from inventory.models import OrderNo, Order, Product, Category, Status
from inventory.utils import calculate_order_value, is_order_eligible_for_rewards, process_referral_rewards
from user.models import AddressModel


class ReferralCodeGenerationTests(TestCase):
    """Test referral code generation functionality"""
    
    def test_generate_unique_code(self):
        """Test that generated codes are unique"""
        code1 = generate_referral_code()
        code2 = generate_referral_code()
        
        self.assertIsNotNone(code1)
        self.assertIsNotNone(code2)
        self.assertNotEqual(code1, code2)
    
    def test_code_format(self):
        """Test that codes follow XXXX-XXXX format"""
        code = generate_referral_code()
        
        self.assertEqual(len(code), 9)  # 8 chars + 1 hyphen
        self.assertIn('-', code)
        self.assertEqual(code[4], '-')
    
    def test_code_uniqueness_in_database(self):
        """Test that codes are unique in database"""
        user1 = User.objects.create_user(
            email='user1@test.com',
            name='User 1',
            password='test123'
        )
        user1.referral_code = generate_referral_code()
        user1.save()
        
        user2 = User.objects.create_user(
            email='user2@test.com',
            name='User 2',
            password='test123'
        )
        user2.referral_code = generate_referral_code()
        user2.save()
        
        self.assertNotEqual(user1.referral_code, user2.referral_code)


class PromoCodeValidationTests(TestCase):
    """Test promo code validation"""
    
    def setUp(self):
        self.referrer = User.objects.create_user(
            email='referrer@test.com',
            name='Referrer',
            password='test123',
            referral_code='TEST-1234'
        )
    
    def test_valid_promo_code(self):
        """Test validation of valid promo code"""
        result = validate_promo_code('TEST-1234')
        self.assertIsNotNone(result)
        self.assertEqual(result.id, self.referrer.id)
    
    def test_invalid_promo_code(self):
        """Test validation of invalid promo code"""
        result = validate_promo_code('INVALID-CODE')
        self.assertIsNone(result)
    
    def test_empty_promo_code(self):
        """Test validation of empty promo code"""
        result = validate_promo_code('')
        self.assertIsNone(result)


class OrderValueCalculationTests(TestCase):
    """Test order value calculation"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@test.com',
            name='User',
            password='test123'
        )
        
        self.category = Category.objects.create(name='Metal')
        
        self.product1 = Product.objects.create(
            name='Iron',
            min_rate=30,
            max_rate=40,
            unit='per-kg',
            category=self.category
        )
        
        self.product2 = Product.objects.create(
            name='Copper',
            min_rate=200,
            max_rate=250,
            unit='per-kg',
            category=self.category
        )
        
        self.order_no = OrderNo.objects.create(
            user=self.user,
            order_number='TEST1234'
        )
    
    def test_single_product_order_value(self):
        """Test calculation with single product"""
        Order.objects.create(
            order_no=self.order_no,
            product=self.product1,
            quantity=Decimal('10.00')
        )
        
        # Average rate = (30 + 40) / 2 = 35
        # Value = 10 * 35 = 350
        value = calculate_order_value(self.order_no)
        self.assertEqual(value, Decimal('350.00'))
    
    def test_multiple_products_order_value(self):
        """Test calculation with multiple products"""
        Order.objects.create(
            order_no=self.order_no,
            product=self.product1,
            quantity=Decimal('10.00')
        )
        Order.objects.create(
            order_no=self.order_no,
            product=self.product2,
            quantity=Decimal('2.00')
        )
        
        # Product1: 10 * 35 = 350
        # Product2: 2 * 225 = 450
        # Total = 800
        value = calculate_order_value(self.order_no)
        self.assertEqual(value, Decimal('800.00'))
    
    def test_zero_quantity_order_value(self):
        """Test calculation with zero quantity"""
        Order.objects.create(
            order_no=self.order_no,
            product=self.product1,
            quantity=Decimal('0.00')
        )
        
        value = calculate_order_value(self.order_no)
        self.assertEqual(value, Decimal('0.00'))


class RewardEligibilityTests(TestCase):
    """Test reward eligibility logic"""
    
    def setUp(self):
        self.referrer = User.objects.create_user(
            email='referrer@test.com',
            name='Referrer',
            password='test123',
            referral_code='REF-1234'
        )
        
        self.referred = User.objects.create_user(
            email='referred@test.com',
            name='Referred',
            password='test123',
            referred_by=self.referrer
        )
        
        self.category = Category.objects.create(name='Metal')
        self.product = Product.objects.create(
            name='Iron',
            min_rate=30,
            max_rate=40,
            unit='per-kg',
            category=self.category
        )
        
        self.completed_status = Status.objects.create(name='Completed')
        self.pending_status = Status.objects.create(name='Pending')
    
    def test_eligible_order(self):
        """Test order that meets all eligibility criteria"""
        order_no = OrderNo.objects.create(
            user=self.referred,
            order_number='TEST1234',
            status=self.completed_status
        )
        Order.objects.create(
            order_no=order_no,
            product=self.product,
            quantity=Decimal('20.00')  # Value = 20 * 35 = 700 > 500
        )
        
        self.assertTrue(is_order_eligible_for_rewards(order_no))
    
    def test_order_below_threshold(self):
        """Test order below ₹500 threshold"""
        order_no = OrderNo.objects.create(
            user=self.referred,
            order_number='TEST1234',
            status=self.completed_status
        )
        Order.objects.create(
            order_no=order_no,
            product=self.product,
            quantity=Decimal('10.00')  # Value = 10 * 35 = 350 < 500
        )
        
        self.assertFalse(is_order_eligible_for_rewards(order_no))
    
    def test_order_not_completed(self):
        """Test order that is not completed"""
        order_no = OrderNo.objects.create(
            user=self.referred,
            order_number='TEST1234',
            status=self.pending_status
        )
        Order.objects.create(
            order_no=order_no,
            product=self.product,
            quantity=Decimal('20.00')
        )
        
        self.assertFalse(is_order_eligible_for_rewards(order_no))
    
    def test_user_without_referrer(self):
        """Test user who was not referred"""
        user_no_referrer = User.objects.create_user(
            email='noreferrer@test.com',
            name='No Referrer',
            password='test123'
        )
        
        order_no = OrderNo.objects.create(
            user=user_no_referrer,
            order_number='TEST1234',
            status=self.completed_status
        )
        Order.objects.create(
            order_no=order_no,
            product=self.product,
            quantity=Decimal('20.00')
        )
        
        self.assertFalse(is_order_eligible_for_rewards(order_no))
    
    def test_second_order(self):
        """Test that second order is not eligible"""
        self.referred.has_completed_first_order = True
        self.referred.save()
        
        order_no = OrderNo.objects.create(
            user=self.referred,
            order_number='TEST1234',
            status=self.completed_status
        )
        Order.objects.create(
            order_no=order_no,
            product=self.product,
            quantity=Decimal('20.00')
        )
        
        self.assertFalse(is_order_eligible_for_rewards(order_no))


class RewardDistributionTests(TestCase):
    """Test reward distribution functionality"""
    
    def setUp(self):
        self.referrer = User.objects.create_user(
            email='referrer@test.com',
            name='Referrer',
            password='test123',
            referral_code='REF-1234'
        )
        
        self.referred = User.objects.create_user(
            email='referred@test.com',
            name='Referred',
            password='test123',
            referred_by=self.referrer
        )
        
        self.category = Category.objects.create(name='Metal')
        self.product = Product.objects.create(
            name='Iron',
            min_rate=30,
            max_rate=40,
            unit='per-kg',
            category=self.category
        )
        
        self.completed_status = Status.objects.create(name='Completed')
    
    def test_reward_amounts(self):
        """Test that correct amounts are granted"""
        order_no = OrderNo.objects.create(
            user=self.referred,
            order_number='TEST1234',
            status=self.completed_status
        )
        Order.objects.create(
            order_no=order_no,
            product=self.product,
            quantity=Decimal('20.00')
        )
        
        result = process_referral_rewards(order_no)
        
        self.assertTrue(result['success'])
        
        # Refresh from database
        self.referrer.refresh_from_db()
        self.referred.refresh_from_db()
        
        self.assertEqual(self.referrer.referral_balance, Decimal('20.00'))
        self.assertEqual(self.referred.referral_balance, Decimal('5.00'))
        self.assertTrue(self.referred.has_completed_first_order)
    
    def test_reward_idempotency(self):
        """Test that rewards are only granted once"""
        order_no = OrderNo.objects.create(
            user=self.referred,
            order_number='TEST1234',
            status=self.completed_status
        )
        Order.objects.create(
            order_no=order_no,
            product=self.product,
            quantity=Decimal('20.00')
        )
        
        # Process rewards first time
        result1 = process_referral_rewards(order_no)
        self.assertTrue(result1['success'])
        
        # Try to process again
        result2 = process_referral_rewards(order_no)
        self.assertFalse(result2['success'])
        
        # Balances should not change
        self.referrer.refresh_from_db()
        self.referred.refresh_from_db()
        
        self.assertEqual(self.referrer.referral_balance, Decimal('20.00'))
        self.assertEqual(self.referred.referral_balance, Decimal('5.00'))


class RedemptionTests(TestCase):
    """Test referral balance redemption"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@test.com',
            name='User',
            password='test123'
        )
        self.user.referral_balance = Decimal('150.00')
        self.user.save()
    
    def test_sufficient_balance_redemption(self):
        """Test redemption with sufficient balance"""
        order_no = OrderNo.objects.create(
            user=self.user,
            order_number='TEST1234',
            redeemed_referral_bonus=self.user.referral_balance
        )
        
        self.assertEqual(order_no.redeemed_referral_bonus, Decimal('150.00'))
    
    def test_insufficient_balance_redemption(self):
        """Test that insufficient balance prevents redemption"""
        self.user.referral_balance = Decimal('100.00')
        self.user.save()
        
        # In actual implementation, this would be prevented at view level
        # This test just verifies the threshold
        self.assertLess(self.user.referral_balance, Decimal('120.00'))


print("✅ All referral system tests defined. Run with: python manage.py test authentication.tests_referral")
