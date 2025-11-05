# ReferralContext - Usage Guide

## Quick Reference

### Import
```typescript
import { useReferral } from '../../context/ReferralContext';
```

### Available Properties

```typescript
const {
  // Balance & Stats
  referralCode,           // User's unique code (e.g., "ABCD-1234")
  referralBalance,        // Current balance (number)
  walletBalance,          // Alias for referralBalance
  pendingBalance,         // Pending rewards (number)
  totalReferrals,         // Total referred users
  successfulReferrals,    // Completed referrals
  
  // Data
  referredUsers,          // Array of ReferredUser[]
  transactions,           // Array of ReferralTransaction[]
  
  // Loading States
  isLoading,              // Initial load
  isRefreshing,           // Pull-to-refresh
  error,                  // Error message
  
  // Methods
  fetchReferralData,      // Fetch from backend
  refreshReferralData,    // Refresh (for pull-to-refresh)
  clearError,             // Clear error state
  setWalletBalance,       // Update balance locally
  applyReferralDiscount,  // Calculate discount (min of balance or amount)
  
  // Computed
  canRedeem,              // true if balance >= 120
  shareMessage,           // Pre-formatted share message
} = useReferral();
```

## Common Use Cases

### 1. Display Balance
```typescript
const { walletBalance } = useReferral();

<Text>₹{walletBalance.toFixed(2)}</Text>
```

### 2. Check if Can Redeem
```typescript
const { canRedeem, walletBalance } = useReferral();

{canRedeem ? (
  <Text>You can redeem!</Text>
) : (
  <Text>Earn ₹{(120 - walletBalance).toFixed(2)} more</Text>
)}
```

### 3. Apply Discount
```typescript
const { applyReferralDiscount, walletBalance } = useReferral();

const orderAmount = 150;
const discount = applyReferralDiscount(orderAmount);
// If wallet = 140, discount = 140 (capped at order amount)
// If wallet = 200, discount = 150 (capped at order amount)
```

### 4. Update Balance After Order
```typescript
const { walletBalance, setWalletBalance } = useReferral();

// After order submitted
const usedAmount = 120;
setWalletBalance(Math.max(0, walletBalance - usedAmount));
```

### 5. Share Referral Code
```typescript
const { shareMessage } = useReferral();

await Share.share({
  message: shareMessage,
  title: 'Earn with Scrapiz',
});
```

### 6. Pull to Refresh
```typescript
const { isRefreshing, refreshReferralData } = useReferral();

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={refreshReferralData}
    />
  }
>
```

### 7. Show Loading State
```typescript
const { isLoading, referralCode } = useReferral();

if (isLoading && !referralCode) {
  return <ActivityIndicator />;
}
```

### 8. Handle Errors
```typescript
const { error, refreshReferralData } = useReferral();

{error && (
  <View>
    <Text>{error}</Text>
    <Button onPress={refreshReferralData}>Retry</Button>
  </View>
)}
```

## Data Structures

### ReferredUser
```typescript
{
  id: number;
  name: string;
  email: string;
  created_at: string;
  has_completed_first_order: boolean;
  earned_amount: number;
}
```

### ReferralTransaction
```typescript
{
  id: string;
  type: 'earned' | 'redeemed' | 'pending';
  amount: number;
  description: string;
  date: string;
  related_user?: string;
  order_id?: string;
}
```

## Backend APIs Used

The context automatically calls these APIs:

1. **`AuthService.getUser()`**
   - Returns user profile with `referral_code` and `referred_balance`
   - Called on app launch and refresh

2. **`AuthService.getReferredUsers()`**
   - Returns list of users who used your code
   - Used to calculate stats

3. **`AuthService.getReferralTransactions()`**
   - Returns transaction history
   - Shows earnings and redemptions

## Caching

The context automatically caches data to AsyncStorage:

- **Cache Key**: `referral_cache_{userId}`
- **Cached Data**: All balance, stats, and transactions
- **Cache Invalidation**: On app launch (fetches fresh data)
- **Offline Support**: Shows cached data while loading

## Best Practices

### ✅ DO:
- Use `walletBalance` for displaying balance
- Use `applyReferralDiscount()` for calculations
- Update balance with `setWalletBalance()` after orders
- Show loading states with `isLoading`
- Handle errors with `error` property

### ❌ DON'T:
- Don't fetch user profile separately (context does it)
- Don't store balance in local state (use context)
- Don't call `fetchReferralData()` manually (auto-loads)
- Don't modify balance without `setWalletBalance()`

## Example: Complete Integration

```typescript
import { useReferral } from '../../context/ReferralContext';

function MyComponent() {
  const { 
    walletBalance, 
    setWalletBalance, 
    applyReferralDiscount,
    isLoading,
    error 
  } = useReferral();
  
  const [useBonus, setUseBonus] = useState(false);
  const orderAmount = 150;
  
  // Calculate bonus
  const bonus = useBonus ? applyReferralDiscount(orderAmount) : 0;
  const total = orderAmount + bonus;
  
  // Submit order
  const handleSubmit = async () => {
    // ... create order ...
    
    if (useBonus && bonus > 0) {
      // Update balance
      setWalletBalance(Math.max(0, walletBalance - bonus));
    }
  };
  
  if (isLoading) return <Loading />;
  if (error) return <Error message={error} />;
  
  return (
    <View>
      {walletBalance > 0 && (
        <View>
          <Text>Wallet: ₹{walletBalance}</Text>
          <Switch value={useBonus} onValueChange={setUseBonus} />
          {useBonus && <Text>Bonus: +₹{bonus}</Text>}
        </View>
      )}
      <Text>Total: ₹{total}</Text>
      <Button onPress={handleSubmit}>Submit</Button>
    </View>
  );
}
```

## Summary

The `ReferralContext` provides:
- ✅ Automatic balance loading
- ✅ Caching for offline access
- ✅ Shared state across screens
- ✅ Simple API for calculations
- ✅ Built-in error handling
- ✅ Loading states
- ✅ Pull-to-refresh support

Just import, use, and enjoy! 🎉
