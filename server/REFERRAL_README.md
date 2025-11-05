# 🎁 Scrapiz Referral System

> A complete, production-ready MVP referral system built with Django best practices

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Documentation](#documentation)
- [FAQ](#faq)

## Overview

The Scrapiz Referral System enables users to refer friends and earn rewards. When a referred user completes their first order over ₹500, both the referrer and the referred user receive monetary rewards that can be redeemed on future orders.

### Key Highlights

- ✅ **Zero Dependencies**: No new packages required
- ✅ **Event-Driven**: Automatic reward processing via Django signals
- ✅ **Production Ready**: Comprehensive tests and error handling
- ✅ **Well Documented**: 6 detailed documentation files
- ✅ **Modular Design**: Clean separation of concerns
- ✅ **Secure**: Atomic transactions and validation

## Quick Start

### 1. Run Migrations

```bash
cd server
python manage.py makemigrations
python manage.py migrate
```

### 2. Generate Referral Codes for Existing Users

```bash
python manage.py makemigrations --empty authentication --name generate_referral_codes
```

Edit the migration file and add:

```python
from django.db import migrations
import string, random

def generate_referral_codes(apps, schema_editor):
    User = apps.get_model('authentication', 'User')
    for user in User.objects.filter(referral_code__isnull=True):
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            formatted_code = f"{code[:4]}-{code[4:]}"
            if not User.objects.filter(referral_code=formatted_code).exists():
                user.referral_code = formatted_code
                user.save(update_fields=['referral_code'])
                break

class Migration(migrations.Migration):
    dependencies = [('authentication', 'XXXX_add_referral_fields')]
    operations = [migrations.RunPython(generate_referral_codes)]
```

Then run:

```bash
python manage.py migrate
```

### 3. Run Tests

```bash
python manage.py test authentication.tests_referral
```

### 4. Start Using!

The system is now active. Users will automatically get referral codes, and rewards will be granted when orders are completed.

## Features

### 🎯 Core Features

1. **Automatic Referral Code Generation**
   - Every user gets a unique code (e.g., `ABCD-1234`)
   - Generated automatically on registration
   - Shareable with friends

2. **Promo Code Support**
   - New users can enter a promo code during registration
   - Links them to the referrer
   - Invalid codes are silently ignored

3. **Automatic Reward Distribution**
   - Triggered when first order is completed
   - Order must be > ₹500
   - Referrer gets ₹20, referred user gets ₹5
   - Processed automatically via Django signals

4. **Balance Management**
   - Users accumulate earnings in referral_balance
   - View balance via API
   - Track completion status

5. **Redemption System**
   - Minimum ₹120 to redeem
   - Full balance redemption only
   - Added to order payout
   - Tracked per order

### 💰 Reward Structure

| Event | Referrer Reward | Referred User Reward |
|-------|----------------|---------------------|
| First order > ₹500 | ₹20 | ₹5 |

### 📊 Business Rules

- **Eligibility**: First order only, value > ₹500
- **Redemption**: Minimum ₹120 balance required
- **Frequency**: One-time rewards per user
- **Payout**: Added to scrap order payout

## Architecture

### System Components

```
API Layer (Views)
    ↓
Serialization Layer
    ↓
Business Logic (Utils)
    ↓
Event Layer (Signals)
    ↓
Data Layer (Models)
    ↓
Database (PostgreSQL)
```

### Key Files

| File | Purpose |
|------|---------|
| `authentication/models.py` | User model with referral fields |
| `authentication/utils.py` | Referral code generation |
| `authentication/signals.py` | Automatic reward processing |
| `authentication/views/user.py` | Registration with promo codes |
| `inventory/models.py` | OrderNo with redemption field |
| `inventory/utils.py` | Order value calculation |
| `inventory/views.py` | Order creation with redemption |

### Database Schema

**User Model:**
- `referral_code` - Unique code for sharing
- `referred_by` - Link to referrer
- `referral_balance` - Accumulated earnings
- `has_completed_first_order` - Eligibility flag

**OrderNo Model:**
- `redeemed_referral_bonus` - Amount redeemed

## Installation

### Prerequisites

- Django 5.2.4+
- Django REST Framework 3.16.0+
- PostgreSQL
- Python 3.8+

### Step-by-Step Installation

1. **Verify Code Files**
   ```bash
   # All files should be in place
   ls server/authentication/utils.py
   ls server/authentication/signals.py
   ls server/inventory/utils.py
   ```

2. **Create Migrations**
   ```bash
   python manage.py makemigrations authentication
   python manage.py makemigrations inventory
   ```

3. **Apply Migrations**
   ```bash
   python manage.py migrate
   ```

4. **Generate Codes for Existing Users**
   ```bash
   # See Quick Start section for migration code
   python manage.py makemigrations --empty authentication --name generate_referral_codes
   # Edit migration file
   python manage.py migrate
   ```

5. **Verify Installation**
   ```bash
   python manage.py test authentication.tests_referral
   ```

## API Documentation

### 1. Register with Promo Code

**Endpoint:** `POST /api/authentication/register`

**Request:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "password": "password123",
  "confirm_password": "password123",
  "promo_code": "ABCD-1234"
}
```

**Response:**
```json
{
  "message": "User created successfully. OTP sent to your email."
}
```

### 2. Get User Data

**Endpoint:** `GET /api/authentication/user`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
x-auth-app: Scrapiz#0nn$(tab!z
```

**Response:**
```json
{
  "id": 1,
  "name": "User Name",
  "email": "user@example.com",
  "referral_code": "WXYZ-5678",
  "referral_balance": "125.00",
  "has_completed_first_order": true,
  "orders": [...],
  "addresses": [...]
}
```

### 3. Create Order with Redemption

**Endpoint:** `POST /api/inventory/create-order/`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
x-auth-app: Scrapiz#0nn$(tab!z
Content-Type: application/json
```

**Request:**
```json
{
  "items": [
    {"product_id": 1, "quantity": 10},
    {"product_id": 2, "quantity": 5}
  ],
  "address_id": 1,
  "redeem_referral_balance": true
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order_no": "ABC12345",
  "email": "user@example.com",
  "address": "Home, Street, Area, City",
  "redeemed_amount": "125.00",
  "orders": [...],
  "images": [...]
}
```

### Error Responses

**Insufficient Balance:**
```json
{
  "error": "Insufficient referral balance. You have ₹100. Minimum ₹120 required to redeem."
}
```

**Invalid Promo Code:**
- Silently ignored, registration proceeds normally

## Testing

### Run All Tests

```bash
python manage.py test authentication.tests_referral
```

### Run Specific Test Class

```bash
python manage.py test authentication.tests_referral.RewardDistributionTests
```

### Test Coverage

```bash
pip install coverage
coverage run --source='.' manage.py test authentication.tests_referral
coverage report
```

### Test Suite

- ✅ Referral code generation (3 tests)
- ✅ Promo code validation (3 tests)
- ✅ Order value calculation (3 tests)
- ✅ Reward eligibility (5 tests)
- ✅ Reward distribution (2 tests)
- ✅ Redemption logic (2 tests)
- ✅ Integration flows (2 tests)

**Total: 20 comprehensive tests**

### Manual Testing

1. **Test Registration Flow**
   ```bash
   # Register user without promo code
   curl -X POST http://localhost:8000/api/authentication/register \
     -H "Content-Type: application/json" \
     -d '{"email":"user1@test.com","name":"User 1","password":"test123","confirm_password":"test123"}'
   
   # Register user with promo code
   curl -X POST http://localhost:8000/api/authentication/register \
     -H "Content-Type: application/json" \
     -d '{"email":"user2@test.com","name":"User 2","password":"test123","confirm_password":"test123","promo_code":"ABCD-1234"}'
   ```

2. **Test Reward Distribution**
   - Create order for referred user
   - Update order status to "Completed"
   - Check both users' balances

3. **Test Redemption**
   - Ensure user has balance >= ₹120
   - Create order with `redeem_referral_balance: true`
   - Verify balance is ₹0 and order has redeemed amount

## Documentation

### Complete Documentation Set

1. **[REFERRAL_SYSTEM_SETUP.md](REFERRAL_SYSTEM_SETUP.md)**
   - Complete setup guide
   - Step-by-step instructions
   - Troubleshooting

2. **[REFERRAL_SYSTEM_QUICK_REFERENCE.md](REFERRAL_SYSTEM_QUICK_REFERENCE.md)**
   - Developer quick reference
   - API endpoints
   - Utility functions
   - Common queries

3. **[REFERRAL_SYSTEM_PACKAGES.md](REFERRAL_SYSTEM_PACKAGES.md)**
   - Package requirements (none!)
   - Existing packages used
   - Installation verification

4. **[REFERRAL_IMPLEMENTATION_CHECKLIST.md](REFERRAL_IMPLEMENTATION_CHECKLIST.md)**
   - Pre-deployment checklist
   - Testing checklist
   - Deployment steps
   - Rollback plan

5. **[REFERRAL_SYSTEM_DIAGRAM.md](REFERRAL_SYSTEM_DIAGRAM.md)**
   - Visual diagrams
   - Flow charts
   - Architecture diagrams

6. **[REFERRAL_SYSTEM_SUMMARY.md](REFERRAL_SYSTEM_SUMMARY.md)**
   - Executive summary
   - Implementation overview
   - Next steps

## FAQ

### General Questions

**Q: Do I need to install any new packages?**
A: No! The system uses only Django, DRF, and Python standard library.

**Q: Will this affect existing functionality?**
A: No, it's fully backward compatible. Existing code continues to work.

**Q: How are rewards processed?**
A: Automatically via Django signals when orders are marked as "Completed".

### Technical Questions

**Q: What happens if a user enters an invalid promo code?**
A: The code is silently ignored and registration proceeds normally.

**Q: Can users refer themselves?**
A: No, self-referral is prevented in the code.

**Q: What if two orders complete simultaneously?**
A: Atomic transactions prevent race conditions and ensure data integrity.

**Q: Can users redeem partial balances?**
A: No, MVP only supports full balance redemption (minimum ₹120).

### Troubleshooting

**Q: Rewards not being granted?**
A: Check:
- Order status is exactly "Completed"
- Order value > ₹500
- User has `referred_by` set
- User's `has_completed_first_order` is False
- Check Django logs for errors

**Q: Signal not firing?**
A: Ensure `authentication/apps.py` has the `ready()` method that imports signals.

**Q: Referral codes not generated?**
A: Run the data migration for existing users (see Quick Start).

## Support

### Getting Help

1. **Check Documentation**: See the 6 documentation files
2. **Run Tests**: `python manage.py test authentication.tests_referral`
3. **Check Logs**: Look for signal execution logs
4. **Django Shell**: Debug manually using `python manage.py shell`

### Debugging

```python
# Django shell
python manage.py shell

# Check user referral data
from authentication.models import User
user = User.objects.get(email='user@example.com')
print(f"Code: {user.referral_code}")
print(f"Balance: {user.referral_balance}")
print(f"Referred by: {user.referred_by}")

# Check order data
from inventory.models import OrderNo
order = OrderNo.objects.get(order_number='ABC123')
print(f"Redeemed: {order.redeemed_referral_bonus}")

# Manual reward processing
from inventory.utils import process_referral_rewards
result = process_referral_rewards(order)
print(result)
```

## Contributing

### Code Style

- Follow Django best practices
- Use type hints where appropriate
- Write comprehensive tests
- Document all functions

### Testing

- All new features must have tests
- Maintain 100% test coverage for referral system
- Run tests before committing

### Documentation

- Update relevant documentation files
- Add examples for new features
- Keep API documentation current

## License

This referral system is part of the Scrapiz application.

## Changelog

### Version 1.0.0 (MVP)

- ✅ Automatic referral code generation
- ✅ Promo code support in registration
- ✅ Event-driven reward distribution
- ✅ Balance management
- ✅ Redemption system
- ✅ Comprehensive tests
- ✅ Complete documentation

### Future Enhancements

- [ ] Admin dashboard for analytics
- [ ] Partial redemption support
- [ ] Tiered reward system
- [ ] Referral campaigns
- [ ] Social sharing integration
- [ ] Referral history tracking

---

## 🚀 Ready to Deploy?

Follow the [Implementation Checklist](REFERRAL_IMPLEMENTATION_CHECKLIST.md) for a smooth deployment.

## 📚 Learn More

- [Setup Guide](REFERRAL_SYSTEM_SETUP.md) - Detailed installation
- [Quick Reference](REFERRAL_SYSTEM_QUICK_REFERENCE.md) - Developer guide
- [Diagrams](REFERRAL_SYSTEM_DIAGRAM.md) - Visual architecture

---

**Built with ❤️ using Django best practices**
