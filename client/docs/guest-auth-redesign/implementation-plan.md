# Guest-Accessible Authentication Redesign - Implementation Plan

## Document Information

- **Version**: 1.0.0
- **Created**: 2026-02-02
- **Estimated Effort**: 3-4 days
- **Risk Level**: Medium (core auth flow changes)

---

## 1. Implementation Overview

### 1.1 Architecture Approach

```
┌─────────────────────────────────────────────────────────────────────┐
│                          APP ENTRY                                   │
├─────────────────────────────────────────────────────────────────────┤
│  index.tsx                                                          │
│  ┌─────────────────┐                                                │
│  │ Language Check  │──No──▶ (auth)/language-selection               │
│  └────────┬────────┘                                                │
│           │ Yes                                                      │
│           ▼                                                          │
│  ┌─────────────────┐                                                │
│  │  Always go to   │──────▶ (tabs)/home                             │
│  │  Home Screen    │        (Both guests & authenticated)           │
│  └─────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        TABS NAVIGATION                               │
├───────────┬───────────┬───────────┬───────────┬─────────────────────┤
│   Home    │   Sell    │ Services  │   Rates   │      Profile        │
│  🟢 Open  │ 🟡 Partial│  🟢 Open  │  🟢 Open  │    🔴 Gated         │
│           │           │           │           │                     │
│ Full      │ Steps 1-2 │ Full      │ Full      │ Guest: Placeholder  │
│ Access    │ open      │ Access    │ Access    │ Auth: Full Profile  │
│           │ Step 3+   │           │           │                     │
│           │ auth req  │           │           │                     │
└───────────┴───────────┴───────────┴───────────┴─────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     AUTH FLOW (Contextual)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Protected Action → Auth Guard → Save Return Path → Login Screen   │
│                                           ↓                          │
│   Restore State ← Navigate Back ← Auth Success ← Authenticate       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Design Decisions

| Decision                | Choice                                        | Rationale                                          |
| ----------------------- | --------------------------------------------- | -------------------------------------------------- |
| Auth state persistence  | Use existing `AuthContext`                    | No new dependencies, proven pattern                |
| Order state persistence | Extend `orderCalculationStore` + AsyncStorage | Already manages order state, add persistence layer |
| Navigation return       | URL parameters + NavigationState              | Standard Expo Router pattern                       |
| Guest profile           | Separate `GuestProfileView` component         | Clean separation, easy to maintain                 |
| Auth prompt             | Reusable `AuthPromptModal` component          | Consistency across app                             |

---

## 2. Implementation Phases

### Phase 1: Core Infrastructure (Day 1)

### Phase 2: Navigation & Entry Point (Day 1-2)

### Phase 3: Sell Flow Auth Gate (Day 2)

### Phase 4: Guest Profile & UI Polish (Day 3)

### Phase 5: Testing & Edge Cases (Day 3-4)

---

## 3. Detailed Implementation Tasks

### Phase 1: Core Infrastructure

#### Task 1.1: Extend AuthContext with Guest State

**File**: `client/src/context/AuthContext.tsx`

**Changes**:

```typescript
// Add to AuthContextType interface
interface AuthContextType {
  // ... existing properties
  isGuest: boolean; // NEW: true if not authenticated and not loading
  pendingAuthAction: PendingAuthAction | null; // NEW: action to execute after auth
  setPendingAuthAction: (action: PendingAuthAction | null) => void;
  executePendingAction: () => void; // NEW: execute stored action after auth
}

type PendingAuthAction = {
  type: "navigate" | "callback";
  returnPath?: string;
  callback?: () => void;
  timestamp: number;
};
```

**Implementation Steps**:

1. Add `isGuest` computed property: `!isAuthenticated && !isLoading`
2. Add `pendingAuthAction` state with setter
3. Add `executePendingAction` function
4. Clean up pending actions older than 24 hours
5. Update context provider with new values

**Acceptance Test**:

- [ ] `isGuest` returns `true` when not logged in
- [ ] Pending action persists across component re-renders
- [ ] Action executes correctly after authentication

---

#### Task 1.2: Create Auth Guard Hook

**File**: `client/src/hooks/useAuthGuard.ts` (NEW)

```typescript
import { useAuth } from "../context/AuthContext";
import { useRouter } from "expo-router";

interface AuthGuardOptions {
  returnPath?: string;
  onAuthenticated?: () => void;
  requireAuth: boolean;
}

export const useAuthGuard = () => {
  const { isAuthenticated, isGuest, setPendingAuthAction } = useAuth();
  const router = useRouter();

  const guardedAction = (
    action: () => void,
    options: AuthGuardOptions = { requireAuth: true },
  ) => {
    if (!options.requireAuth || isAuthenticated) {
      action();
      return true;
    }

    // Store the action for after auth
    setPendingAuthAction({
      type: "callback",
      callback: action,
      returnPath: options.returnPath,
      timestamp: Date.now(),
    });

    // Navigate to login with return path
    const returnTo = options.returnPath || "/(tabs)/home";
    router.push(`/(auth)/login?returnTo=${encodeURIComponent(returnTo)}`);
    return false;
  };

  const requireAuth = (returnPath?: string) => {
    if (isAuthenticated) return true;

    router.push(
      `/(auth)/login?returnTo=${encodeURIComponent(returnPath || "/(tabs)/home")}`,
    );
    return false;
  };

  return {
    guardedAction,
    requireAuth,
    isAuthenticated,
    isGuest,
  };
};
```

**Acceptance Test**:

- [ ] `guardedAction` executes immediately if authenticated
- [ ] `guardedAction` redirects to login if guest
- [ ] Return path is correctly passed to login screen

---

#### Task 1.3: Create Order State Persistence Utility

**File**: `client/src/utils/guestOrderPersistence.ts` (NEW)

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

const GUEST_ORDER_KEY = "scrapiz_guest_order";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface GuestOrderState {
  items: Array<{
    id: number;
    name: string;
    rate: number;
    unit: string;
    quantity: number;
    image?: any;
  }>;
  selectedDate: string;
  selectedTime: string;
  savedAt: number;
}

export const saveGuestOrderState = async (
  state: Omit<GuestOrderState, "savedAt">,
): Promise<void> => {
  try {
    const data: GuestOrderState = {
      ...state,
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem(GUEST_ORDER_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save guest order state:", error);
  }
};

export const loadGuestOrderState =
  async (): Promise<GuestOrderState | null> => {
    try {
      const data = await AsyncStorage.getItem(GUEST_ORDER_KEY);
      if (!data) return null;

      const parsed: GuestOrderState = JSON.parse(data);

      // Check if data is expired
      if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
        await clearGuestOrderState();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("Failed to load guest order state:", error);
      return null;
    }
  };

export const clearGuestOrderState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(GUEST_ORDER_KEY);
  } catch (error) {
    console.error("Failed to clear guest order state:", error);
  }
};

export const hasGuestOrderState = async (): Promise<boolean> => {
  const state = await loadGuestOrderState();
  return state !== null && state.items.length > 0;
};
```

**Acceptance Test**:

- [ ] Order state saves correctly
- [ ] Order state loads correctly
- [ ] Expired state (>24h) returns null and is cleared
- [ ] Clear function removes state

---

### Phase 2: Navigation & Entry Point

#### Task 2.1: Update App Entry Point

**File**: `client/src/app/index.tsx`

**Current Logic** (Lines 86-100):

```typescript
// Priority 0: Check language selection first
if (!isLanguageSet) {
  routeToNavigate = "/(auth)/language-selection";
}
// Priority 1: Check authentication
else {
  if (isAuthenticated) {
    routeToNavigate = "/(tabs)/home";
  } else {
    routeToNavigate = "/(auth)/login"; // ← CHANGE THIS
  }
}
```

**New Logic**:

```typescript
// Priority 0: Check language selection first
if (!isLanguageSet) {
  routeToNavigate = "/(auth)/language-selection";
}
// Priority 1: Always go to home (guests welcome!)
else {
  routeToNavigate = "/(tabs)/home";
  // Note: Auth status tracked in context, but doesn't block entry
}
```

**Acceptance Test**:

- [ ] App opens to home screen without login
- [ ] Language selection still works for first-time users
- [ ] Authenticated users still see home (no regression)

---

#### Task 2.2: Update Login Screen to Handle Return URL

**File**: `client/src/app/(auth)/login.tsx`

**Changes**:

1. Accept `returnTo` query parameter
2. After successful login, navigate to `returnTo` instead of always going to home
3. Check for and restore pending order state

**Implementation** (add around line 125-180):

```typescript
import { useLocalSearchParams } from "expo-router";
import {
  loadGuestOrderState,
  clearGuestOrderState,
} from "../../utils/guestOrderPersistence";
import { useOrderCalculationStore } from "../../store/orderCalculationStore";

// Inside LoginScreen component:
const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
const { setItems } = useOrderCalculationStore();

// Modify the auth success handler (around line 145-148):
const handleAuthSuccess = async () => {
  if (authSuccess) {
    Toast.show({
      /* ... */
    });

    // Check for pending order state
    const pendingOrder = await loadGuestOrderState();
    if (pendingOrder && pendingOrder.items.length > 0) {
      // Restore order state to store
      setItems(pendingOrder.items);
      // Store is hydrated, clear persistence
      await clearGuestOrderState();
    }

    // Navigate to return path or home
    const destination = returnTo || "/(tabs)/home";

    // Small delay for auth state propagation
    await new Promise((resolve) => setTimeout(resolve, 100));

    router.replace(destination as any);
  }
};
```

**Acceptance Test**:

- [ ] Login with `?returnTo=/sell` navigates to sell screen after auth
- [ ] Login without returnTo goes to home
- [ ] Pending order state is restored from AsyncStorage
- [ ] Works for both email login and OAuth (Google/Apple)

---

#### Task 2.3: Update Register Screen Similarly

**File**: `client/src/app/(auth)/register.tsx`

Apply same changes as Task 2.2:

- Accept `returnTo` parameter
- Navigate to returnTo after successful registration + OTP verification
- Restore pending order state

---

### Phase 3: Sell Flow Auth Gate

#### Task 3.1: Add Auth Gate to Sell Screen Step Transition

**File**: `client/src/app/(tabs)/sell.tsx`

**Target Location**: `handleNext()` function (around line 705-719)

**Current Logic**:

```typescript
const handleNext = () => {
  setErrors({});
  setTimeout(() => {
    if (!validateForm()) return;
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleOrderSubmission();
    }
  }, 0);
};
```

**New Logic**:

```typescript
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { saveGuestOrderState } from "../../utils/guestOrderPersistence";

// Inside SellScreenContent:
const { isAuthenticated, isGuest } = useAuthGuard();
const router = useRouter();

const handleNext = async () => {
  setErrors({});

  setTimeout(async () => {
    if (!validateForm()) return;

    // Auth gate at transition from Step 2 to Step 3
    if (currentStep === 2 && isGuest) {
      // Save current order state before redirecting to login
      await saveGuestOrderState({
        items: selectedItems,
        selectedDate,
        selectedTime,
      });

      // Redirect to login with return path
      router.push("/(auth)/login?returnTo=/(tabs)/sell?step=3");
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleOrderSubmission();
    }
  }, 0);
};
```

---

#### Task 3.2: Handle Step Query Parameter on Sell Screen Mount

**File**: `client/src/app/(tabs)/sell.tsx`

**Add to SellScreenContent component**:

```typescript
import { useLocalSearchParams } from "expo-router";
import {
  loadGuestOrderState,
  clearGuestOrderState,
} from "../../utils/guestOrderPersistence";

// Inside SellScreenContent:
const { step } = useLocalSearchParams<{ step?: string }>();

// Add useEffect to handle returning from auth:
useEffect(() => {
  const restoreOrderState = async () => {
    // Only restore if we have a step param and user is now authenticated
    if (step && isAuthenticated) {
      const savedState = await loadGuestOrderState();

      if (savedState) {
        // Restore items to store
        setItems(savedState.items);
        // Restore date/time selections
        setSelectedDate(savedState.selectedDate);
        setSelectedTime(savedState.selectedTime);
        // Clear saved state
        await clearGuestOrderState();
        // Navigate to the correct step
        setCurrentStep(parseInt(step, 10) || 3);
      }
    }
  };

  restoreOrderState();
}, [step, isAuthenticated]);
```

**Acceptance Test**:

- [ ] Guest can complete Steps 1 and 2
- [ ] Clicking "Next" on Step 2 triggers auth redirect
- [ ] Order data preserved during auth flow
- [ ] After login, user lands on Step 3 with data restored
- [ ] Date and time selections are preserved

---

### Phase 4: Guest Profile & UI Polish

#### Task 4.1: Create Guest Profile Component

**File**: `client/src/components/GuestProfileView.tsx` (NEW)

```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, LogIn, UserPlus, Package, Gift, MapPin, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useLocalization } from '../context/LocalizationContext';
import { fs, spacing, hp, wp } from '../utils/responsive';

interface GuestProfileViewProps {
  returnPath?: string;
}

export default function GuestProfileView({ returnPath = '/(tabs)/profile' }: GuestProfileViewProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLocalization();

  const handleSignIn = () => {
    router.push(`/(auth)/login?returnTo=${encodeURIComponent(returnPath)}`);
  };

  const handleRegister = () => {
    router.push(`/(auth)/register?returnTo=${encodeURIComponent(returnPath)}`);
  };

  const benefits = [
    { icon: Package, title: t('guestProfile.benefit1Title') || 'Track Your Orders', subtitle: t('guestProfile.benefit1Subtitle') || 'View order history and status' },
    { icon: Gift, title: t('guestProfile.benefit2Title') || 'Earn Rewards', subtitle: t('guestProfile.benefit2Subtitle') || 'Get referral bonuses' },
    { icon: MapPin, title: t('guestProfile.benefit3Title') || 'Save Addresses', subtitle: t('guestProfile.benefit3Subtitle') || 'Quick checkout experience' },
    { icon: Bell, title: t('guestProfile.benefit4Title') || 'Get Notifications', subtitle: t('guestProfile.benefit4Subtitle') || 'Stay updated on pickups' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#22c55e', '#16a34a'] : ['#16a34a', '#15803d']}
        style={styles.header}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.guestAvatar}>
            <User size={fs(48)} color="#ffffff" strokeWidth={1.5} />
          </View>
        </View>
        <Text style={styles.guestTitle}>{t('guestProfile.title') || 'Welcome, Guest!'}</Text>
        <Text style={styles.guestSubtitle}>
          {t('guestProfile.subtitle') || 'Sign in to access your personalized experience'}
        </Text>
      </LinearGradient>

      {/* Auth Buttons */}
      <View style={styles.authSection}>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={handleSignIn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#16a34a', '#15803d', '#14532d']}
            style={styles.signInGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <LogIn size={fs(20)} color="#ffffff" />
            <Text style={styles.signInText}>{t('guestProfile.signIn') || 'Sign In'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.registerButton, { borderColor: colors.primary }]}
          onPress={handleRegister}
          activeOpacity={0.8}
        >
          <UserPlus size={fs(20)} color={colors.primary} />
          <Text style={[styles.registerText, { color: colors.primary }]}>
            {t('guestProfile.createAccount') || 'Create Account'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Benefits Section */}
      <View style={styles.benefitsSection}>
        <Text style={[styles.benefitsTitle, { color: colors.text }]}>
          {t('guestProfile.whySignIn') || 'Why Sign In?'}
        </Text>

        {benefits.map((benefit, index) => (
          <View
            key={index}
            style={[styles.benefitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.benefitIcon, { backgroundColor: isDark ? '#064e3b' : '#dcfce7' }]}>
              <benefit.icon size={fs(24)} color={colors.primary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={[styles.benefitTitle, { color: colors.text }]}>{benefit.title}</Text>
              <Text style={[styles.benefitSubtitle, { color: colors.textSecondary }]}>{benefit.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          {t('guestProfile.browseFreely') || 'Feel free to browse rates and services without signing in'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: hp(10),
    paddingBottom: spacing(32),
    paddingHorizontal: spacing(24),
    borderBottomLeftRadius: spacing(24),
    borderBottomRightRadius: spacing(24),
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: spacing(16),
  },
  guestAvatar: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  guestTitle: {
    fontSize: fs(24),
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing(8),
  },
  guestSubtitle: {
    fontSize: fs(14),
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    maxWidth: wp(70),
  },
  authSection: {
    padding: spacing(24),
    gap: spacing(12),
  },
  signInButton: {
    borderRadius: spacing(14),
    overflow: 'hidden',
  },
  signInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(16),
    gap: spacing(10),
  },
  signInText: {
    fontSize: fs(16),
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter-SemiBold',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(16),
    borderRadius: spacing(14),
    borderWidth: 2,
    gap: spacing(10),
  },
  registerText: {
    fontSize: fs(16),
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  benefitsSection: {
    paddingHorizontal: spacing(24),
    paddingBottom: spacing(24),
  },
  benefitsTitle: {
    fontSize: fs(18),
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing(16),
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing(16),
    borderRadius: spacing(12),
    borderWidth: 1,
    marginBottom: spacing(12),
  },
  benefitIcon: {
    width: spacing(48),
    height: spacing(48),
    borderRadius: spacing(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing(16),
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: fs(15),
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: spacing(4),
  },
  benefitSubtitle: {
    fontSize: fs(13),
    fontFamily: 'Inter-Regular',
  },
  footer: {
    padding: spacing(24),
    alignItems: 'center',
  },
  footerText: {
    fontSize: fs(13),
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});
```

---

#### Task 4.2: Update Profile Screen to Show Guest View

**File**: `client/src/app/(tabs)/profile.tsx`

**Modify the component to conditionally render**:

```typescript
import GuestProfileView from '../../components/GuestProfileView';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  // Show guest view if not authenticated
  if (!isAuthenticated) {
    return <GuestProfileView returnPath="/(tabs)/profile" />;
  }

  // Continue with existing authenticated profile view
  // ... rest of current code
}
```

**Note**: Remove the existing auth check and redirect logic in `loadUserProfile` since we're now handling it at the component level.

---

#### Task 4.3: Add Localization Strings

**Files**:

- `client/src/localization/en.json`
- `client/src/localization/hi.json`
- `client/src/localization/mr.json`

**Add new keys**:

```json
{
  "guestProfile": {
    "title": "Welcome, Guest!",
    "subtitle": "Sign in to access your personalized experience",
    "signIn": "Sign In",
    "createAccount": "Create Account",
    "whySignIn": "Why Sign In?",
    "benefit1Title": "Track Your Orders",
    "benefit1Subtitle": "View order history and status",
    "benefit2Title": "Earn Rewards",
    "benefit2Subtitle": "Get referral bonuses",
    "benefit3Title": "Save Addresses",
    "benefit3Subtitle": "Quick checkout experience",
    "benefit4Title": "Get Notifications",
    "benefit4Subtitle": "Stay updated on pickups",
    "browseFreely": "Feel free to browse rates and services without signing in"
  }
}
```

---

### Phase 5: Testing & Edge Cases

#### Task 5.1: Test Scenarios Checklist

**Guest Flow Tests**:

- [ ] Fresh app install → Opens to home screen
- [ ] Guest can view all home screen content
- [ ] Guest can navigate to Rates tab and see data
- [ ] Guest can navigate to Services tab
- [ ] Guest can start Sell flow and complete Steps 1-2
- [ ] Step 2 → Step 3 triggers auth redirect
- [ ] After login, guest returns to Step 3 with data

**Auth Flow Tests**:

- [ ] Login with returnTo parameter works
- [ ] Register with returnTo parameter works
- [ ] OAuth (Google/Apple) with returnTo works
- [ ] Missing returnTo defaults to home

**Data Persistence Tests**:

- [ ] Order state saves correctly before auth redirect
- [ ] Order state restores after auth
- [ ] Expired order state (>24h) is cleared
- [ ] Multiple save/load cycles work correctly

**Edge Cases**:

- [ ] User clears app data mid-flow
- [ ] Network error during auth flow
- [ ] User cancels login and returns to sell
- [ ] Multiple tabs opened (if applicable)
- [ ] App backgrounded during auth flow
- [ ] Push notification received during flow

---

#### Task 5.2: Regression Tests for Existing Flows

Ensure these existing flows still work:

- [ ] Existing authenticated user login flow
- [ ] Session expiry handling
- [ ] Profile edit and save
- [ ] Order creation for authenticated users
- [ ] Logout and re-login
- [ ] Password reset flow
- [ ] OTP verification flow

---

## 4. File Change Summary

### New Files

| File                                  | Purpose                       |
| ------------------------------------- | ----------------------------- |
| `src/hooks/useAuthGuard.ts`           | Reusable auth guard hook      |
| `src/utils/guestOrderPersistence.ts`  | Guest order state persistence |
| `src/components/GuestProfileView.tsx` | Guest mode profile screen     |

### Modified Files

| File                          | Changes                                      |
| ----------------------------- | -------------------------------------------- |
| `src/context/AuthContext.tsx` | Add `isGuest`, pending action management     |
| `src/app/index.tsx`           | Remove auth gate, always go to home          |
| `src/app/(auth)/login.tsx`    | Handle returnTo, restore order state         |
| `src/app/(auth)/register.tsx` | Handle returnTo, restore order state         |
| `src/app/(tabs)/sell.tsx`     | Add auth gate at Step 2→3, handle step param |
| `src/app/(tabs)/profile.tsx`  | Conditionally show GuestProfileView          |
| `src/localization/*.json`     | Add guest profile strings                    |

---

## 5. Rollout Strategy

### 5.1 Feature Flag (Optional)

Consider adding a feature flag to gradually roll out:

```typescript
// src/config/featureFlags.ts
export const FEATURE_FLAGS = {
  GUEST_BROWSING_ENABLED: true, // Toggle for A/B testing
};
```

### 5.2 Rollout Phases

1. **Internal Testing**: Team tests all flows
2. **Beta Testing**: 10% of new installs
3. **Gradual Rollout**: 25% → 50% → 100%
4. **Monitor**: Track conversion metrics

---

## 6. Risk Mitigation

| Risk                             | Mitigation                             |
| -------------------------------- | -------------------------------------- |
| Breaking existing auth flow      | Comprehensive regression testing       |
| Data loss during auth transition | AsyncStorage persistence with 24h TTL  |
| Security vulnerabilities         | No sensitive data exposed to guests    |
| Poor UX at auth gate             | Clear messaging and smooth transitions |
| Performance impact               | Lazy load GuestProfileView component   |

---

## 7. Future Considerations

### 7.1 Potential Enhancements (Not in Scope)

- Guest cart syncing across devices
- Anonymous analytics tracking
- Pre-fill form data from social login
- Guest wishlist feature

### 7.2 Technical Debt to Address

- Consolidate auth redirect logic
- Create centralized navigation helper
- Add comprehensive auth flow tests

---

## 8. Appendix

### 8.1 Reference Implementation: Similar Apps

- **Swiggy**: Browse menu without login, auth at checkout
- **Zepto**: Browse products freely, auth at cart
- **Urban Company**: Browse services, auth at booking

### 8.2 Useful Resources

- [Expo Router Auth Pattern](https://docs.expo.dev/router/reference/authentication/)
- [AsyncStorage Best Practices](https://react-native-async-storage.github.io/async-storage/)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
