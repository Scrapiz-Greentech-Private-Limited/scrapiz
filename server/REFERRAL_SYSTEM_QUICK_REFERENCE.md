# Referral System - Quick Reference

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     REFERRAL SYSTEM FLOW                     │
└─────────────────────────────────────────────────────────────┘

1. USER REGISTRATION
   ├─ User signs up (optional promo_code)
   ├─ System generates unique referral_code
   └─ If promo_code valid → link to referrer

2. ORDER COMPLETION
   ├─ User completes first order
   ├─ Django signal fires on status = "Completed"
   ├─ Check: value > ₹500 & has referrer
   └─ Grant rewards: Referrer +₹20, User +₹5

3. BALANCE REDEMPTION
   ├─ User creates order with redeem_referral_balance=true
   ├─ Check: balance >= ₹120
   ├─ Deduct full balance → set to ₹0
   └─ Add to order.redeemed_referral_bonus
```

## Key Files

### Models
- `authentication/models.py` - User with referral fields
- `inventory/models.py` - OrderNo with redeemed_referral_bonus

### Business Logic
- `authentication/utils.py` - Referral code generation
- `inventory/utils.py` - Order value calculation, reward processing
- `authentication/signals.py` - Automatic reward distribution

### API Layer
- `authentication/views/user.py` - Registration with promo_code
- `inventory/views.py` - Order creation with redemption

### Tests
- `authentication/tests_referral.py` - Comprehensive test suite

## Database Schema

### User Model (authentication_user)
```sql
referral_code              VARCHAR(10) UNIQUE  -- e.g., "ABCD-1234"
referred_by_id             INTEGER             -- FK to User
referral_balance           DECIMAL(10,2)       -- e.g., 125.00
has_completed_first_order  BOOLEAN             -- Default: False
```

### OrderNo Model (inventory_orderno)
```sql
redeemed_referral_bonus    DECIMAL(10,2)       -- Default: 0.00
```

## API Endpoints

### 1. Register with Promo Code
```http
POST /api/authentication/register
Content-Type: application/json
x-auth-app: Scrapiz#0nn$(tab!z

{
  "email": "user@example.com",
  "name": "User Name",
  "password": "pass123",
  "confirm_password": "pass123",
  "promo_code": "ABCD-1234"  // Optional
}
```

### 2. Get User Data (includes referral info)
```http
GET /api/authentication/user
Authorization: Bearer <JWT_TOKEN>
x-auth-app: Scrapiz#0nn$(tab!z

Response:
{
  "id": 1,
  "referral_code": "WXYZ-5678",
  "referral_balance": "125.00",
  "has_completed_first_order": true,
  ...
}
```

### 3. Create Order with Redemption
```http
POST /api/inventory/create-order/
Authorization: Bearer <JWT_TOKEN>
x-auth-app: Scrapiz#0nn$(tab!z
Content-Type: application/json

{
  "items": [{"product_id": 1, "quantity": 10}],
  "address_id": 1,
  "redeem_referral_balance": true  // Optional
}

Response:
{
  "message": "Order created successfully",
  "order_no": "ABC123",
  "redeemed_amount": "125.00",  // If redeemed
  ...
}
```

## Utility Functions

### Generate Referral Code
```python
from authentication.utils import generate_referral_code

code = generate_referral_code()  # Returns: "ABCD-1234"
```

### Validate Promo Code
```python
from authentication.utils import validate_promo_code

referrer = validate_promo_code("ABCD-1234")  # Returns User or None
```

### Calculate Order Value
```python
from inventory.utils import calculate_order_value

value = calculate_order_value(order_no)  # Returns Decimal
```

### Check Reward Eligibility
```python
from inventory.utils import is_order_eligible_for_rewards

eligible = is_order_eligible_for_rewards(order_no)  # Returns bool
```

### Process Rewards Manually
```python
from inventory.utils import process_referral_rewards

result = process_referral_rewards(order_no)
# Returns: {'success': True/False, 'message': '...'}
```

## Business Rules

| Rule | Value |
|------|-------|
| Referrer Reward | ₹20 |
| Referred User Reward | ₹5 |
| Minimum Order Value | ₹500 |
| Minimum Redemption | ₹120 |
| Redemption Type | Full balance only |
| Reward Trigger | First order completion |

## Signal Flow

```python
# When OrderNo.status changes to "Completed"
OrderNo.save() 
  → post_save signal fires
  → process_referral_rewards_signal()
  → Check eligibility
  → Update balances atomically
  → Log result
```

## Common Queries

### Get all referrals for a user
```python
referrer = User.objects.get(email='user@example.com')
referrals = referrer.referrals.all()  # All users referred by this user
```

### Get user's referrer
```python
user = User.objects.get(email='user@example.com')
referrer = user.referred_by  # User who referred this user (or None)
```

### Get orders with redeemed bonuses
```python
orders = OrderNo.objects.filter(redeemed_referral_bonus__gt=0)
```

### Calculate total rewards earned
```python
user = User.objects.get(email='user@example.com')
total_earned = user.referral_balance + \
               user.orders.aggregate(
                   total=Sum('redeemed_referral_bonus')
               )['total']
```

## Testing Commands

```bash
# Run all referral tests
python manage.py test authentication.tests_referral

# Run specific test class
python manage.py test authentication.tests_referral.RewardDistributionTests

# Run with verbose output
python manage.py test authentication.tests_referral --verbosity=2

# Run with coverage
coverage run --source='.' manage.py test authentication.tests_referral
coverage report
```

## Debugging

### Enable detailed logging
```python
# In settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'authentication.signals': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

### Check signal registration
```python
# In Django shell
python manage.py shell

from django.db.models.signals import post_save
from inventory.models import OrderNo

# List all receivers for OrderNo post_save
print(post_save.receivers)
```

### Manually trigger reward processing
```python
# In Django shell
from inventory.models import OrderNo
from inventory.utils import process_referral_rewards

order = OrderNo.objects.get(order_number='ABC123')
result = process_referral_rewards(order)
print(result)
```

## Error Handling

### Common Errors

**Error:** "Insufficient referral balance"
```python
# Check user balance
user.referral_balance >= Decimal('120.00')
```

**Error:** Rewards not granted
```python
# Debug checklist
order.status.name.lower() == 'completed'  # Must be True
user.referred_by is not None              # Must be True
user.has_completed_first_order == False   # Must be True
calculate_order_value(order) > 500        # Must be True
```

**Error:** Signal not firing
```python
# Check apps.py
class AuthenticationConfig(AppConfig):
    def ready(self):
        import authentication.signals  # Must be present
```

## Performance Considerations

### Database Indexes
```python
# Already indexed in models:
User.referral_code  # db_index=True
User.referred_by    # FK automatically indexed
```

### Query Optimization
```python
# Use select_related for referrer
users = User.objects.select_related('referred_by').all()

# Use prefetch_related for referrals
users = User.objects.prefetch_related('referrals').all()

# Efficient order value calculation
orders = OrderNo.objects.prefetch_related('orders__product').all()
```

### Atomic Transactions
```python
# All balance updates use atomic transactions
with transaction.atomic():
    referrer.referral_balance += Decimal('20.00')
    referrer.save(update_fields=['referral_balance'])
    
    user.referral_balance += Decimal('5.00')
    user.save(update_fields=['referral_balance'])
```

## Security Considerations

1. **Prevent Self-Referral**: Check `referrer.id != user.id`
2. **Validate Promo Codes**: Always check existence before linking
3. **Atomic Balance Updates**: Use transactions to prevent race conditions
4. **One-Time Rewards**: Check `has_completed_first_order` flag
5. **Authorization**: Verify user can only redeem their own balance

## Monitoring

### Key Metrics to Track
- Total referrals created
- Conversion rate (referrals → first order)
- Average order value for referred users
- Total rewards distributed
- Redemption rate

### Database Queries for Metrics
```python
# Total active referrals
User.objects.filter(referred_by__isnull=False).count()

# Users who completed first order
User.objects.filter(has_completed_first_order=True).count()

# Total rewards distributed
User.objects.aggregate(total=Sum('referral_balance'))

# Total redeemed
OrderNo.objects.aggregate(total=Sum('redeemed_referral_bonus'))
```

## Quick Setup (TL;DR)

```bash
# 1. Run migrations
python manage.py makemigrations
python manage.py migrate

# 2. Generate codes for existing users
python manage.py makemigrations --empty authentication --name generate_referral_codes
# Edit migration file (see SETUP.md)
python manage.py migrate

# 3. Run tests
python manage.py test authentication.tests_referral

# 4. Done! System is ready to use
```
