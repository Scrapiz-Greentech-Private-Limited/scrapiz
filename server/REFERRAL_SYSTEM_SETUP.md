# Referral System Setup Guide

## Overview

This guide walks you through setting up the MVP Referral System for Scrapiz. The system is fully integrated into the existing Django application and requires no additional packages.

## Prerequisites

- Django project is set up and running
- PostgreSQL database is configured
- All existing packages from `requirements.txt` are installed

## Installation Steps

### Step 1: Verify Code Files

Ensure all the following files have been created/updated:

**New Files:**
- ✅ `server/authentication/utils.py` - Referral code generation utilities
- ✅ `server/authentication/signals.py` - Signal handlers for automatic rewards
- ✅ `server/inventory/utils.py` - Order value calculation utilities
- ✅ `server/authentication/tests_referral.py` - Comprehensive test suite

**Updated Files:**
- ✅ `server/authentication/models.py` - Added referral fields to User model
- ✅ `server/inventory/models.py` - Added redeemed_referral_bonus to OrderNo
- ✅ `server/authentication/apps.py` - Registered signals
- ✅ `server/authentication/serializers.py` - Added referral fields
- ✅ `server/inventory/serializers.py` - Added redeemed_referral_bonus field
- ✅ `server/authentication/views/user.py` - Handle promo_code in registration
- ✅ `server/inventory/views.py` - Handle referral balance redemption

### Step 2: Create Database Migrations

```bash
cd server
python manage.py makemigrations authentication
python manage.py makemigrations inventory
```

Expected output:
```
Migrations for 'authentication':
  authentication/migrations/0XXX_add_referral_fields.py
    - Add field referral_code to user
    - Add field referred_by to user
    - Add field referral_balance to user
    - Add field has_completed_first_order to user

Migrations for 'inventory':
  inventory/migrations/0XXX_add_redeemed_referral_bonus.py
    - Add field redeemed_referral_bonus to orderno
```

### Step 3: Run Migrations

```bash
python manage.py migrate
```

### Step 4: Generate Referral Codes for Existing Users

Create a data migration to generate referral codes for existing users:

```bash
python manage.py makemigrations --empty authentication --name generate_referral_codes
```

Edit the generated migration file (`server/authentication/migrations/0XXX_generate_referral_codes.py`):

```python
from django.db import migrations
import string
import random


def generate_referral_codes(apps, schema_editor):
    """Generate referral codes for existing users"""
    User = apps.get_model('authentication', 'User')
    
    for user in User.objects.filter(referral_code__isnull=True):
        # Generate unique code
        while True:
            code = ''.join(random.choices(
                string.ascii_uppercase + string.digits, 
                k=8
            ))
            formatted_code = f"{code[:4]}-{code[4:]}"
            
            if not User.objects.filter(referral_code=formatted_code).exists():
                user.referral_code = formatted_code
                user.save(update_fields=['referral_code'])
                break


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0XXX_add_referral_fields'),  # Update with actual migration number
    ]

    operations = [
        migrations.RunPython(generate_referral_codes, migrations.RunPython.noop),
    ]
```

Run the data migration:

```bash
python manage.py migrate authentication
```

### Step 5: Verify Installation

#### Check Database Schema

```bash
python manage.py dbshell
```

```sql
-- Check User table has new fields
\d authentication_user;

-- Check OrderNo table has new field
\d inventory_orderno;

-- Exit
\q
```

#### Run Tests

```bash
python manage.py test authentication.tests_referral
```

Expected output:
```
Creating test database...
....................
----------------------------------------------------------------------
Ran 20 tests in X.XXs

OK
```

### Step 6: Test the System Manually

#### 1. Test User Registration with Promo Code

```bash
curl -X POST http://localhost:8000/api/authentication/register \
  -H "Content-Type: application/json" \
  -H "x-auth-app: Scrapiz#0nn$(tab!z" \
  -d '{
    "email": "newuser@test.com",
    "name": "New User",
    "password": "test123",
    "confirm_password": "test123",
    "promo_code": "ABCD-1234"
  }'
```

#### 2. Check User Data (After Login)

```bash
curl -X GET http://localhost:8000/api/authentication/user \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -H "x-auth-app: Scrapiz#0nn$(tab!z"
```

Expected response includes:
```json
{
  "id": 1,
  "name": "New User",
  "email": "newuser@test.com",
  "referral_code": "WXYZ-5678",
  "referral_balance": "0.00",
  "has_completed_first_order": false,
  ...
}
```

#### 3. Test Order Creation with Redemption

```bash
curl -X POST http://localhost:8000/api/inventory/create-order/ \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -H "x-auth-app: Scrapiz#0nn$(tab!z" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 10}
    ],
    "address_id": 1,
    "redeem_referral_balance": true
  }'
```

#### 4. Test Reward Distribution

1. Create a user with a referral code
2. Register a new user with that promo code
3. Create an order for the new user with value > ₹500
4. Update order status to "Completed" (via admin or API)
5. Check both users' referral balances - should see ₹20 and ₹5

### Step 7: Monitor Logs

Check Django logs for referral system activity:

```bash
# In your Django logs, you should see:
✅ Referral rewards granted for order TEST1234: Referrer user1@test.com +₹20 (total: ₹20.00), User user2@test.com +₹5 (total: ₹5.00)
```

## API Documentation Updates

### Registration Endpoint

**POST** `/api/authentication/register`

**New Request Field:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "password": "password123",
  "confirm_password": "password123",
  "promo_code": "ABCD-1234"  // Optional
}
```

### User Data Endpoint

**GET** `/api/authentication/user`

**New Response Fields:**
```json
{
  "id": 1,
  "name": "User Name",
  "email": "user@example.com",
  "referral_code": "WXYZ-5678",  // New
  "referral_balance": "125.00",  // New
  "has_completed_first_order": true,  // New
  ...
}
```

### Order Creation Endpoint

**POST** `/api/inventory/create-order/`

**New Request Field:**
```json
{
  "items": [...],
  "address_id": 1,
  "redeem_referral_balance": true  // Optional, default: false
}
```

**New Response Field:**
```json
{
  "message": "Order created successfully",
  "order_no": "ABC123",
  "redeemed_amount": "125.00",  // New (only if redeemed)
  ...
}
```

## Business Rules Summary

1. **Referral Code Generation**: Every user gets a unique code automatically
2. **Referral Link**: New users can provide a promo_code during registration
3. **Reward Eligibility**: First order > ₹500 and status = "Completed"
4. **Reward Amounts**: Referrer gets ₹20, Referred user gets ₹5
5. **Redemption Threshold**: Minimum ₹120 to cash out
6. **Redemption Process**: Full balance is redeemed and added to order payout
7. **One-Time Rewards**: Only the first eligible order triggers rewards

## Troubleshooting

### Issue: Referral codes not generated for existing users

**Solution:** Run the data migration:
```bash
python manage.py migrate authentication 0XXX_generate_referral_codes
```

### Issue: Rewards not being granted

**Check:**
1. Order status is exactly "Completed" (case-insensitive)
2. Order value is > ₹500
3. User has `referred_by` set
4. User's `has_completed_first_order` is False
5. Check Django logs for error messages

### Issue: Signal not firing

**Solution:** Ensure `authentication/apps.py` has the `ready()` method:
```python
def ready(self):
    import authentication.signals
```

### Issue: Redemption not working

**Check:**
1. User's referral_balance >= ₹120
2. `redeem_referral_balance` parameter is True
3. Check for transaction errors in logs

## Testing Checklist

- [ ] User registration generates referral code
- [ ] User registration with promo_code links to referrer
- [ ] User registration with invalid promo_code completes successfully
- [ ] First order > ₹500 grants rewards (₹20 + ₹5)
- [ ] First order < ₹500 does not grant rewards
- [ ] Second order does not grant rewards
- [ ] User without referrer completes order successfully
- [ ] Redemption with balance >= ₹120 works
- [ ] Redemption with balance < ₹120 returns error
- [ ] Redeemed amount appears in order response
- [ ] Order payout includes redeemed bonus

## Production Deployment

1. **Backup Database**: Always backup before running migrations
2. **Run Migrations**: Apply all migrations in staging first
3. **Generate Codes**: Run data migration for existing users
4. **Monitor Logs**: Watch for any signal errors
5. **Test End-to-End**: Complete full referral flow in staging
6. **Deploy**: Roll out to production with monitoring

## Support

For issues or questions:
1. Check Django logs: `tail -f logs/django.log`
2. Check database: `python manage.py dbshell`
3. Run tests: `python manage.py test authentication.tests_referral`
4. Review signal logs for reward processing

## Next Steps (Future Enhancements)

- [ ] Admin dashboard for referral analytics
- [ ] Referral history tracking
- [ ] Tiered reward system
- [ ] Referral campaign management
- [ ] Social sharing integration
- [ ] Partial redemption support
