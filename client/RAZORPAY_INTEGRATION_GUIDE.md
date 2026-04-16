# Razorpay React Native Integration Guide

## Overview
This guide covers the Razorpay payment gateway integration for the Scrapiz Expo client app, enabling card and UPI payments for booking quotes.

## Installation

### Step 1: Install Razorpay SDK

```bash
cd client
npx expo install react-native-razorpay
```

### Step 2: For Bare Workflow (if applicable)
If you're using a bare React Native workflow:

```bash
cd ios && pod install && cd ..
```

## Implementation Summary

### ✅ Completed Changes

#### 1. API Types (`client/src/api/apiService.ts`)
Added Razorpay-specific TypeScript interfaces:
- `RazorpayOrderResponse` - Response from order creation endpoint
- `RazorpayVerifyPayload` - Payment verification request payload
- `WalletRazorpayOrderResponse` - Wallet topup order response

#### 2. API Methods (`client/src/api/apiService.ts`)
Added 4 new static methods to `AuthService` class:

**Quote Payment:**
- `createQuoteRazorpayOrder(orderId)` - Creates Razorpay order for quote payment
- `verifyQuoteRazorpayPayment(orderId, payload)` - Verifies payment and completes booking

**Wallet Topup:**
- `createWalletRazorpayOrder(amountInr)` - Creates Razorpay order for wallet topup
- `verifyWalletRazorpayPayment(payload)` - Verifies wallet payment and credits balance

#### 3. API Endpoints (`client/src/api/config.ts`)
Added new endpoints to `API_CONFIG.ENDPOINTS`:
```typescript
BOOKING_ORDER_QUOTE_RAZORPAY_ORDER: (orderId: number) =>
  `/booking/order/${orderId}/quote/razorpay-order/`,
BOOKING_ORDER_QUOTE_RAZORPAY_VERIFY: (orderId: number) =>
  `/booking/order/${orderId}/quote/razorpay-verify/`,
VENDOR_WALLET_RAZORPAY_ORDER: '/vendor/wallet/razorpay-order/',
VENDOR_WALLET_RAZORPAY_VERIFY: '/vendor/wallet/razorpay-verify/',
```

#### 4. Quote Decision Screen (`client/src/app/tracking/[orderId]/quote.tsx`)
Completely rewrote `handleAccept` function to:
- Support cash payments (existing flow)
- Integrate Razorpay for card and UPI payments
- Handle payment success/failure/cancellation
- Display appropriate transaction IDs

## Payment Flow

### Cash Payment
1. User selects "Cash" payment method
2. Clicks "Accept & Continue"
3. Backend processes immediately
4. Success screen shows cash transaction

### Card/UPI Payment (Razorpay)
1. User selects "Card" or "UPI" payment method
2. For UPI: User enters UPI ID
3. Clicks "Accept & Continue"
4. App calls `createQuoteRazorpayOrder()` to get order details
5. Razorpay SDK opens with payment options
6. User completes payment in Razorpay UI
7. App receives payment response with signature
8. App calls `verifyQuoteRazorpayPayment()` to verify and complete booking
9. Success screen shows Razorpay payment ID

## Razorpay SDK Options

The integration uses the following Razorpay options:

```typescript
{
  description: `Scrapiz Quote #${orderId}`,
  image: 'https://scrapiz.in/logo.png',
  currency: 'INR',
  key: orderData.key_id,              // From backend
  amount: String(orderData.amount),    // In paise
  order_id: orderData.razorpay_order_id,
  name: 'Scrapiz',
  prefill: {
    name: orderData.prefill.name,
    email: orderData.prefill.email ?? '',
    contact: orderData.prefill.contact ?? '',
  },
  method: {
    // For card: only card enabled
    // For UPI: only UPI enabled
  },
  theme: { color: '#ff5b14' },
}
```

## Error Handling

The implementation handles three types of errors:

1. **Payment Cancelled** (code === 0)
   - User cancelled the payment in Razorpay UI
   - Shows: "Payment cancelled" alert

2. **Payment Failed** (Razorpay error)
   - Payment processing failed
   - Shows: Error description from Razorpay

3. **Verification Failed** (Backend error)
   - Payment succeeded but verification failed
   - Shows: Error message from backend

## Testing

### Test Mode
Razorpay SDK automatically uses test mode when test keys are configured on backend.

### Test Cards
**Success:**
- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

**Failure:**
- Card: 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date

### Test UPI
- UPI ID: success@razorpay
- For failure: failure@razorpay

## UI Changes

### Success Screen
Updated to show payment type correctly:
- Cash → "Cash"
- Card → "Credit/Debit Card"
- UPI → "UPI"

### Removed Blocking Alert
Removed the old alert that blocked card payments with message about gateway integration.

## Security Features

1. **Order ID Verification**: Backend validates order_id matches quote
2. **Signature Verification**: HMAC-SHA256 signature verification on backend
3. **Idempotency**: Duplicate payments are prevented
4. **Secure Token**: JWT authentication for all API calls

## Dependencies

```json
{
  "react-native-razorpay": "latest"
}
```

## Backend Requirements

Ensure backend has:
- ✅ Razorpay keys configured (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
- ✅ Webhook secret configured (RAZORPAY_WEBHOOK_SECRET)
- ✅ All 4 endpoints implemented and tested
- ✅ Database migration run for razorpay_order_id field

## Troubleshooting

### Issue: "react-native-razorpay not found"
**Solution:** Run `npx expo install react-native-razorpay`

### Issue: Payment succeeds but verification fails
**Solution:** Check backend logs for signature verification errors

### Issue: Razorpay UI doesn't open
**Solution:** Ensure Razorpay SDK is properly installed and linked

### Issue: "Invalid key_id"
**Solution:** Verify RAZORPAY_KEY_ID is correctly set in backend environment

## Next Steps

1. ✅ Install react-native-razorpay package
2. ✅ Test cash payment flow (should work as before)
3. ✅ Test card payment with test cards
4. ✅ Test UPI payment with test UPI IDs
5. ✅ Test payment cancellation
6. ✅ Test payment failure scenarios
7. ✅ Verify transaction IDs are displayed correctly
8. ✅ Test on both iOS and Android devices

## Production Checklist

Before going live:
- [ ] Replace test Razorpay keys with live keys on backend
- [ ] Configure Razorpay webhook in dashboard
- [ ] Test with real cards in production environment
- [ ] Verify webhook events are being received
- [ ] Monitor payment success/failure rates
- [ ] Set up Razorpay dashboard alerts
- [ ] Document refund process for support team

## Support

For Razorpay-specific issues:
- Documentation: https://razorpay.com/docs/
- React Native SDK: https://razorpay.com/docs/payment-gateway/react-native-integration/
- Support: https://razorpay.com/support/

For implementation issues:
- Check backend logs for API errors
- Check mobile app logs for SDK errors
- Verify all environment variables are set correctly
