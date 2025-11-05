# Referral System - Visual Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      REFERRAL SYSTEM LAYERS                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  API LAYER (Views)                                               │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ RegisterView     │  │ CreateOrderAPI   │                    │
│  │ - Handle promo   │  │ - Handle redeem  │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  SERIALIZATION LAYER                                             │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ UserSerializer   │  │ OrderNoSerializer│                    │
│  │ + promo_code     │  │ + redeemed_bonus │                    │
│  │ + referral_code  │  │                  │                    │
│  │ + balance        │  │                  │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  BUSINESS LOGIC LAYER (Utils)                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ authentication/utils.py                                   │  │
│  │ - generate_referral_code()                               │  │
│  │ - validate_promo_code()                                  │  │
│  │ - link_referral()                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ inventory/utils.py                                        │  │
│  │ - calculate_order_value()                                │  │
│  │ - is_order_eligible_for_rewards()                        │  │
│  │ - process_referral_rewards()                             │  │
│  │ - calculate_total_payout()                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  EVENT LAYER (Signals)                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ authentication/signals.py                                 │  │
│  │ - process_referral_rewards_signal()                      │  │
│  │ - generate_referral_code_on_user_creation()              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  DATA LAYER (Models)                                             │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ User             │  │ OrderNo          │                    │
│  │ + referral_code  │  │ + redeemed_bonus │                    │
│  │ + referred_by    │  │                  │                    │
│  │ + balance        │  │                  │                    │
│  │ + first_order    │  │                  │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  DATABASE (PostgreSQL)                                           │
│  authentication_user  |  inventory_orderno                      │
└─────────────────────────────────────────────────────────────────┘
```

## User Registration Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    REGISTRATION WITH PROMO CODE                   │
└──────────────────────────────────────────────────────────────────┘

User submits registration
    email: "user@example.com"
    name: "User Name"
    password: "pass123"
    promo_code: "ABCD-1234" (optional)
            ↓
┌───────────────────────────────┐
│ RegisterView.post()           │
│ - Validate input              │
│ - Check existing user         │
└───────────────────────────────┘
            ↓
┌───────────────────────────────┐
│ Create User                   │
│ - Set email, name, password   │
│ - Generate OTP                │
└───────────────────────────────┘
            ↓
┌───────────────────────────────┐
│ generate_referral_code()      │
│ - Generate unique code        │
│ - Format: WXYZ-5678           │
│ - Save to user.referral_code  │
└───────────────────────────────┘
            ↓
┌───────────────────────────────┐
│ validate_promo_code()         │
│ - Check if code exists        │
│ - Return referrer or None     │
└───────────────────────────────┘
            ↓
        ┌───────┐
        │ Valid?│
        └───┬───┘
    Yes ↓   ↓ No
┌───────────────────────────────┐
│ Link to Referrer              │
│ - Set user.referred_by        │
│ - Prevent self-referral       │
└───────────────────────────────┘
            ↓
┌───────────────────────────────┐
│ Save User                     │
│ - referral_code: "WXYZ-5678"  │
│ - referred_by: User(id=1)     │
│ - referral_balance: 0.00      │
│ - has_completed_first: False  │
└───────────────────────────────┘
            ↓
┌───────────────────────────────┐
│ Send OTP Email                │
└───────────────────────────────┘
            ↓
    Return Success Response
```

## Order Completion & Reward Flow

```
┌──────────────────────────────────────────────────────────────────┐
│              ORDER COMPLETION & AUTOMATIC REWARDS                 │
└──────────────────────────────────────────────────────────────────┘

Admin updates order status to "Completed"
            ↓
┌───────────────────────────────┐
│ OrderNo.save()                │
│ - status = "Completed"        │
└───────────────────────────────┘
            ↓
┌───────────────────────────────┐
│ Django Signal Fires           │
│ post_save(OrderNo)            │
└───────────────────────────────┘
            ↓
┌───────────────────────────────┐
│ process_referral_rewards_     │
│ signal()                      │
│ - Check status = "Completed"  │
└───────────────────────────────┘
            ↓
        ┌───────────┐
        │ Completed?│
        └─────┬─────┘
          Yes ↓
┌───────────────────────────────┐
│ Check User Eligibility        │
│ - has_completed_first_order?  │
│ - has referred_by?            │
└───────────────────────────────┘
            ↓
        ┌───────────┐
        │ Eligible? │
        └─────┬─────┘
          Yes ↓
┌───────────────────────────────┐
│ calculate_order_value()       │
│ - Sum all products            │
│ - qty × avg_rate              │
└───────────────────────────────┘
            ↓
        ┌───────────┐
        │ > ₹500?   │
        └─────┬─────┘
          Yes ↓
┌───────────────────────────────┐
│ Atomic Transaction            │
│ ┌─────────────────────────┐   │
│ │ Referrer.balance += 20  │   │
│ │ Referrer.save()         │   │
│ └─────────────────────────┘   │
│ ┌─────────────────────────┐   │
│ │ User.balance += 5       │   │
│ │ User.first_order = True │   │
│ │ User.save()             │   │
│ └─────────────────────────┘   │
└───────────────────────────────┘
            ↓
┌───────────────────────────────┐
│ Log Success                   │
│ "✅ Rewards granted"          │
└───────────────────────────────┘
            ↓
    Rewards Distributed!
    Referrer: ₹20
    User: ₹5
```

## Order Creation with Redemption Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                ORDER CREATION WITH BALANCE REDEMPTION             │
└──────────────────────────────────────────────────────────────────┘

User creates order
    items: [{product_id: 1, quantity: 10}]
    address_id: 1
    redeem_referral_balance: true
            ↓
┌───────────────────────────────┐
│ CreateOrderAPIView.post()     │
│ - Parse request data          │
└───────────────────────────────┘
            ↓
┌───────────────────────────────┐
│ Check Redemption Flag         │
│ redeem_referral_balance?      │
└───────────────────────────────┘
            ↓
        ┌───────────┐
        │ Redeem?   │
        └─────┬─────┘
          Yes ↓
┌───────────────────────────────┐
│ Validate Balance              │
│ user.referral_balance >= 120? │
└───────────────────────────────┘
            ↓
    ┌───────────────┐
    │ Sufficient?   │
    └───┬───────┬───┘
    Yes ↓       ↓ No
┌───────────────────────────────┐  ┌───────────────────────────────┐
│ Store Redeemed Amount         │  │ Return Error                  │
│ redeemed = user.balance       │  │ "Insufficient balance"        │
└───────────────────────────────┘  └───────────────────────────────┘
            ↓
┌───────────────────────────────┐
│ Atomic Transaction            │
│ ┌─────────────────────────┐   │
│ │ user.balance = 0.00     │   │
│ │ user.save()             │   │
│ └─────────────────────────┘   │
│ ┌─────────────────────────┐   │
│ │ OrderNo.create()        │   │
│ │ - redeemed_bonus = amt  │   │
│ └─────────────────────────┘   │
└───────────────────────────────┘
            ↓
┌───────────────────────────────┐
│ Create Order Items            │
│ - Link products to order      │
└───────────────────────────────┘
            ↓
┌───────────────────────────────┐
│ Return Response               │
│ - order_no                    │
│ - redeemed_amount (if any)    │
└───────────────────────────────┘
            ↓
    Order Created Successfully!
```

## Data Model Relationships

```
┌──────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA                            │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ User (authentication_user)                                       │
├─────────────────────────────────────────────────────────────────┤
│ id                          INTEGER PRIMARY KEY                  │
│ email                       VARCHAR(254) UNIQUE                  │
│ name                        VARCHAR(50)                          │
│ password                    VARCHAR(500)                         │
│ referral_code               VARCHAR(10) UNIQUE INDEX ◄───┐      │
│ referred_by_id              INTEGER FK ──────────────────┘      │
│ referral_balance            DECIMAL(10,2) DEFAULT 0.00          │
│ has_completed_first_order   BOOLEAN DEFAULT FALSE               │
│ ...                         (other fields)                       │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ OrderNo (inventory_orderno)                                      │
├─────────────────────────────────────────────────────────────────┤
│ id                          INTEGER PRIMARY KEY                  │
│ user_id                     INTEGER FK → User                    │
│ order_number                VARCHAR(20) UNIQUE                   │
│ status_id                   INTEGER FK → Status                  │
│ address_id                  INTEGER FK → AddressModel            │
│ redeemed_referral_bonus     DECIMAL(10,2) DEFAULT 0.00          │
│ images                      JSONB                                │
│ created_at                  TIMESTAMP                            │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ Order (inventory_order)                                          │
├─────────────────────────────────────────────────────────────────┤
│ id                          INTEGER PRIMARY KEY                  │
│ order_no_id                 INTEGER FK → OrderNo                 │
│ product_id                  INTEGER FK → Product                 │
│ quantity                    DECIMAL(10,2)                        │
└─────────────────────────────────────────────────────────────────┘
```

## Referral Relationship Example

```
┌──────────────────────────────────────────────────────────────────┐
│                    REFERRAL CHAIN EXAMPLE                         │
└──────────────────────────────────────────────────────────────────┘

User A (Referrer)
├─ email: "usera@example.com"
├─ referral_code: "ABCD-1234"
├─ referred_by: NULL
├─ referral_balance: ₹40.00
└─ has_completed_first_order: True
        │
        │ referred
        ↓
User B (Referred)
├─ email: "userb@example.com"
├─ referral_code: "EFGH-5678"
├─ referred_by: User A
├─ referral_balance: ₹5.00
└─ has_completed_first_order: True
        │
        │ referred
        ↓
User C (Referred by B)
├─ email: "userc@example.com"
├─ referral_code: "IJKL-9012"
├─ referred_by: User B
├─ referral_balance: ₹0.00
└─ has_completed_first_order: False

Timeline:
1. User A registers → gets code "ABCD-1234"
2. User B registers with promo "ABCD-1234" → linked to User A
3. User B completes order > ₹500 → User A gets ₹20, User B gets ₹5
4. User B shares code "EFGH-5678"
5. User C registers with promo "EFGH-5678" → linked to User B
6. User C hasn't completed first order yet → no rewards yet
```

## State Transitions

```
┌──────────────────────────────────────────────────────────────────┐
│                    USER STATE TRANSITIONS                         │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│ New User        │
│ balance: ₹0     │
│ first_order: ❌ │
└────────┬────────┘
         │ registers
         ↓
┌─────────────────┐
│ Registered      │
│ balance: ₹0     │
│ first_order: ❌ │
│ referral_code: ✓│
└────────┬────────┘
         │ creates order
         ↓
┌─────────────────┐
│ Order Pending   │
│ balance: ₹0     │
│ first_order: ❌ │
└────────┬────────┘
         │ order completed (value > ₹500)
         ↓
┌─────────────────┐
│ Rewarded        │
│ balance: ₹5     │  ← If referred
│ first_order: ✓  │
└────────┬────────┘
         │ accumulates more rewards
         ↓
┌─────────────────┐
│ Balance >= ₹120 │
│ balance: ₹125   │
│ first_order: ✓  │
└────────┬────────┘
         │ redeems on new order
         ↓
┌─────────────────┐
│ Redeemed        │
│ balance: ₹0     │
│ first_order: ✓  │
└─────────────────┘
```

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING                               │
└──────────────────────────────────────────────────────────────────┘

Registration with Invalid Promo Code
    ↓
validate_promo_code("INVALID")
    ↓
Returns None
    ↓
Silently ignore, continue registration
    ↓
User created without referrer ✓


Redemption with Insufficient Balance
    ↓
Check: user.balance >= 120?
    ↓
False (balance = ₹100)
    ↓
Return 400 Error
    ↓
{
  "error": "Insufficient referral balance. 
            You have ₹100. Minimum ₹120 required."
}


Order Completion for Ineligible User
    ↓
Check: has_completed_first_order?
    ↓
True (already completed)
    ↓
Skip reward processing
    ↓
Log: "User already completed first order"
    ↓
No error, just skip ✓


Signal Processing Error
    ↓
Exception in reward processing
    ↓
Catch exception
    ↓
Log error with details
    ↓
Don't fail order completion ✓
```

## Performance Optimization

```
┌──────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE OPTIMIZATIONS                      │
└──────────────────────────────────────────────────────────────────┘

Database Indexes
├─ User.referral_code (UNIQUE INDEX)
│  └─ Fast promo code lookups during registration
├─ User.referred_by_id (FK INDEX)
│  └─ Fast referrer lookups
└─ OrderNo.user_id (FK INDEX)
   └─ Fast user order queries

Query Optimization
├─ select_related('referred_by')
│  └─ Fetch referrer in single query
├─ prefetch_related('referrals')
│  └─ Fetch all referrals efficiently
└─ update_fields=['referral_balance']
   └─ Update only changed fields

Atomic Transactions
└─ with transaction.atomic():
   ├─ Prevent race conditions
   ├─ Ensure data consistency
   └─ Rollback on error

Signal Optimization
├─ Check status first (fast)
├─ Check flags before calculations
└─ Only process eligible orders
```

---

## Legend

```
→   Data flow / Relationship
↓   Process flow
├─  Tree structure
└─  End of branch
┌─┐ Box / Container
│   Vertical line
─   Horizontal line
✓   Success / Enabled
❌  Disabled / Not set
FK  Foreign Key
```
