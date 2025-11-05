"""
Test script for referral transactions endpoint.
Run with: python manage.py shell < test_referral_transactions.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from authentication.models import User
from inventory.models import OrderNo, Status, Product, Category, Order
from user.models import AddressModel
from decimal import Decimal
from django.utils import timezone

print("=" * 60)
print("Testing Referral Transactions Endpoint")
print("=" * 60)

# Create test users
print("\n1. Creating test users...")
referrer = User.objects.create_user(
    email='referrer@test.com',
    name='Referrer User',
    password='test123'
)
referrer.referral_code = 'TEST-1234'
referrer.referral_balance = Decimal('145.00')  # Has some balance
referrer.save()
print(f"✓ Created referrer: {referrer.email} with code {referrer.referral_code}")

referred_user1 = User.objects.create_user(
    email='referred1@test.com',
    name='Referred User 1',
    password='test123'
)
referred_user1.referred_by = referrer
referred_user1.has_completed_first_order = True
referred_user1.referral_balance = Decimal('5.00')
referred_user1.save()
print(f"✓ Created referred user 1: {referred_user1.email}")

referred_user2 = User.objects.create_user(
    email='referred2@test.com',
    name='Referred User 2',
    password='test123'
)
referred_user2.referred_by = referrer
referred_user2.has_completed_first_order = True
referred_user2.referral_balance = Decimal('5.00')
referred_user2.save()
print(f"✓ Created referred user 2: {referred_user2.email}")

# Create status
print("\n2. Creating order status...")
completed_status, _ = Status.objects.get_or_create(name='Completed')
print(f"✓ Created status: {completed_status.name}")

# Create address
print("\n3. Creating address...")
address = AddressModel.objects.create(
    user=referrer,
    address_type='Home',
    street='Test Street',
    area='Test Area',
    city='Test City',
    pincode='123456'
)
print(f"✓ Created address for referrer")

# Create orders for referred users (to simulate earned transactions)
print("\n4. Creating completed orders for referred users...")
order1 = OrderNo.objects.create(
    user=referred_user1,
    order_number='ORD001',
    status=completed_status,
    address=address
)
print(f"✓ Created order {order1.order_number} for {referred_user1.name}")

order2 = OrderNo.objects.create(
    user=referred_user2,
    order_number='ORD002',
    status=completed_status,
    address=address
)
print(f"✓ Created order {order2.order_number} for {referred_user2.name}")

# Create order with redemption for referrer
print("\n5. Creating order with redemption...")
redeemed_order = OrderNo.objects.create(
    user=referrer,
    order_number='ORD003',
    status=completed_status,
    address=address,
    redeemed_referral_bonus=Decimal('125.00')
)
print(f"✓ Created order {redeemed_order.order_number} with ₹125 redemption")

# Test the view
print("\n6. Testing ReferralTransactionsView...")
from authentication.views.user import ReferralTransactionsView
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request

factory = APIRequestFactory()
request = factory.get('/api/authentication/referrals/transactions')

# Mock authentication
from unittest.mock import patch

with patch('authentication.views.user.authenticate_request', return_value=referrer):
    view = ReferralTransactionsView.as_view()
    response = view(request)
    
    print(f"\n✓ Response status: {response.status_code}")
    
    if response.status_code == 200:
        transactions = response.data.get('transactions', [])
        print(f"✓ Found {len(transactions)} transactions")
        
        print("\nTransaction Details:")
        print("-" * 60)
        for i, txn in enumerate(transactions, 1):
            print(f"\n{i}. {txn['type'].upper()}")
            print(f"   ID: {txn['id']}")
            print(f"   Amount: ₹{txn['amount']}")
            print(f"   Description: {txn['description']}")
            print(f"   Date: {txn['created_at']}")
            if 'related_user_name' in txn:
                print(f"   Related User: {txn['related_user_name']}")
            if 'order_number' in txn:
                print(f"   Order: {txn['order_number']}")
        
        # Verify transaction types
        earned_count = sum(1 for t in transactions if t['type'] == 'earned')
        redeemed_count = sum(1 for t in transactions if t['type'] == 'redeemed')
        
        print("\n" + "=" * 60)
        print("Summary:")
        print(f"  Earned transactions: {earned_count}")
        print(f"  Redeemed transactions: {redeemed_count}")
        print(f"  Total transactions: {len(transactions)}")
        print("=" * 60)
        
        # Expected: 2 earned (from 2 successful referrals) + 1 redeemed = 3 total
        if len(transactions) == 3 and earned_count == 2 and redeemed_count == 1:
            print("\n✅ TEST PASSED: All transactions retrieved correctly!")
        else:
            print(f"\n⚠️  Expected 3 transactions (2 earned, 1 redeemed), got {len(transactions)}")
    else:
        print(f"❌ Error: {response.data}")

# Cleanup
print("\n7. Cleaning up test data...")
User.objects.filter(email__in=['referrer@test.com', 'referred1@test.com', 'referred2@test.com']).delete()
print("✓ Test data cleaned up")

print("\n" + "=" * 60)
print("Test completed!")
print("=" * 60)
