# Session Expiry Implementation

## Overview
When a user's session expires (401/403 errors from the backend), a dialog automatically appears showing:
- "Session Expired" message
- A countdown timer (5s → 4s → 3s → 2s → 1s)
- An activity loader
- Automatic redirect to login screen

## How It Works

### 1. **SessionExpiredDialog Component** (`client/src/components/SessionExpiredDialog.tsx`)
- Modal dialog with countdown timer
- Shows activity indicator
- Automatically redirects after 5 seconds

### 2. **API Interceptor** (`client/src/api/apiService.ts`)
- Detects 401/403 responses from backend
- Clears auth token from AsyncStorage
- Checks current route to determine if dialog should show
- Only triggers dialog on protected routes (tabs, profile, services)
- Skips dialog on auth pages, splash screen, and initial loading

### 3. **AuthContext** (`client/src/context/AuthContext.tsx`)
- Tracks current route using expo-router segments
- Registers global session expired handler on mount
- Shows SessionExpiredDialog only when on protected routes
- Handles redirect to login screen after countdown

## Protected Routes (Dialog Shows)

The session expired dialog appears on these routes:
- `/(tabs)/*` - All tab screens (home, profile, rates, sell, services)
- `/profile/*` - Profile sub-pages (addresses, orders, settings, etc.)
- `/services/*` - Service booking pages

## Excluded Routes (Dialog Hidden)

The dialog does NOT appear on these routes:
- `/(auth)/*` - Login, register, forgot password, etc.
- `/` - Splash screen / initial loading
- `/oauthredirect` - OAuth callback page
- `/language-selection` - Language selection screen
- `/location-permission` - Location permission screen
- `/service-unavailable` - Service unavailable page

## Backend Triggers

The dialog appears when the backend returns:
- **401 Unauthorized**: Token expired, invalid token, or missing token
- **403 Forbidden**: Session invalid (logged in from another device)

Based on your backend code in `server/utils/usercheck.py`:
```python
# These errors trigger the session expired dialog:
- 'Invalid secret key!'
- 'Unauthenticated!'
- 'Token expired!'
- 'Invalid token!'
- 'User not found!'
- 'Session invalid — logged in from another device!'
```

## User Experience

### On Protected Routes (tabs, profile, services):
1. User makes an API request (e.g., fetching orders, profile data)
2. Backend returns 401/403 error
3. Session expired dialog appears immediately
4. Countdown starts: 5s → 4s → 3s → 2s → 1s
5. User is redirected to login screen
6. User can log in again

### On Auth Pages (login, register, etc.):
1. User makes an API request
2. Backend returns 401/403 error
3. Token is cleared silently
4. No dialog appears (user is already on auth pages)
5. User continues with login/register flow

## No Code Changes Needed in Screens

The implementation is **automatic** - you don't need to modify any existing screens. The API interceptor handles all authentication errors globally.

## Safeguards Against Multiple Triggers

To prevent the dialog from appearing multiple times or during app initialization:

1. **Debounce Mechanism**: 2-second debounce prevents rapid multiple triggers
2. **Initial Load Protection**: Dialog won't show during app initialization (`isLoading` state)
3. **Single Redirect**: Dialog tracks if redirect has already happened
4. **Route-Based Filtering**: Only shows on protected routes

## Testing

To test the session expiry dialog:
1. Log in to the app
2. Navigate to a protected screen (home, profile, orders)
3. Manually delete the JWT token from backend or wait for it to expire
4. Make an API call (pull to refresh, navigate to another screen)
5. The session expired dialog should appear automatically
6. After 5 seconds, you'll be redirected to login

**Note**: The dialog will NOT appear if you're on login/register pages or during initial app load.

## Customization

To change the countdown duration, edit `SessionExpiredDialog.tsx`:
```typescript
const [countdown, setCountdown] = useState(5); // Change initial value
```

To customize the dialog appearance, modify the styling in `SessionExpiredDialog.tsx`.
