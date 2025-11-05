# Google OAuth Authentication Fix

## Problem
After Google sign-in completed successfully, users were redirected to home but showed as "unauthenticated". The issue was that the backend wasn't returning the JWT token in the response.

## Root Cause
The `GoogleOAuthLoginView` in `server/authentication/views/oauth.py` was creating a JWT token but **not including it in the response**. It only returned user data without the `jwt` field.

## Fixes Applied

### 1. Backend Fix (`server/authentication/views/oauth.py`)

**Before:**
```python
return Response({
    'user': {
        'id': user.id,
        'email': user.email,
        'name': user.name
    }
}, status=status.HTTP_200_OK)
```

**After:**
```python
return Response({
    'jwt': jwt_token,  # ✅ Added JWT token
    'message': 'Login successful',
    'user': {
        'id': user.id,
        'email': user.email,
        'name': user.name
    }
}, status=status.HTTP_200_OK)
```

### 2. Frontend Auth Context (`client/src/context/AuthContext.tsx`)

Added two new methods to help manage authentication state:

```typescript
interface AuthContextType {
  // ... existing methods
  setAuthenticatedState: (authenticated: boolean) => void;  // ✅ New
  refreshAuthStatus: () => Promise<void>;  // ✅ New
}
```

These methods allow external components (like the Google auth hook) to update the authentication state.

### 3. Google Auth Hook (`client/src/hooks/useGoogleAuth.ts`)

**Enhanced to:**
- Use AuthContext to update authentication state
- Add `authSuccess` flag to track when authentication completes
- Properly refresh auth status after successful login

```typescript
const { setAuthenticatedState, refreshAuthStatus } = useAuth();

// After successful login:
setAuthenticatedState(true);
await refreshAuthStatus();
setAuthSuccess(true);
```

### 4. Login & Register Screens

**Updated to use `authSuccess` flag:**
- Removed immediate navigation after `signInWithGoogle()`
- Added `useEffect` to watch `authSuccess` and navigate when true
- Added `useEffect` to show error toasts from Google auth

```typescript
// Handle Google auth success
useEffect(() => {
  if (authSuccess) {
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Login successful!',
    });
    router.replace('/(tabs)/home');
  }
}, [authSuccess]);
```

## Email Mapping Feature

The backend already handles email mapping correctly:

**In `UserService.get_or_create_oauth_user()`:**
```python
# Check if user exists with this email
user = User.objects.filter(email=email).first()

if user:
    # Return existing user (maps to registered account)
    return user

# Create new OAuth user if no account exists
user = User.objects.create(
    email=email,
    name=name,
    password=make_password(None),  # Unusable password for OAuth
    is_active=True
)
```

**How it works:**
1. User signs in with Google
2. Backend checks if email exists in database
3. If email exists → Returns that user (with all their data, orders, etc.)
4. If email doesn't exist → Creates new user account
5. JWT token is generated for the user
6. Frontend stores JWT and updates auth state

## Testing

### Test Case 1: New Google User
1. Sign in with Google account (email not in database)
2. ✅ New user account created
3. ✅ JWT token returned and stored
4. ✅ Redirected to home as authenticated user

### Test Case 2: Existing User (Email Match)
1. Register normally with email: `user@example.com`
2. Later, sign in with Google using same email
3. ✅ Existing user account retrieved
4. ✅ All user data (orders, addresses, etc.) accessible
5. ✅ JWT token returned and stored
6. ✅ Redirected to home as authenticated user

### Test Case 3: Authentication Persistence
1. Sign in with Google
2. Close app
3. Reopen app
4. ✅ User remains authenticated (JWT stored in AsyncStorage)
5. ✅ Directly navigated to home screen

## Flow Diagram

```
User clicks "Sign in with Google"
         ↓
Google OAuth prompt opens
         ↓
User selects Google account
         ↓
Google returns ID token
         ↓
Frontend sends ID token to backend
         ↓
Backend verifies token with Google
         ↓
Backend checks if email exists
         ├─ YES → Get existing user
         └─ NO  → Create new user
         ↓
Backend generates JWT token
         ↓
Backend returns: { jwt, user }
         ↓
Frontend stores JWT in AsyncStorage
         ↓
Frontend updates AuthContext state
         ↓
Frontend navigates to home
         ↓
✅ User is authenticated
```

## Files Modified

### Backend
- `server/authentication/views/oauth.py` - Added JWT to response

### Frontend
- `client/src/context/AuthContext.tsx` - Added state management methods
- `client/src/hooks/useGoogleAuth.ts` - Enhanced auth flow
- `client/src/app/(auth)/login.tsx` - Updated navigation logic
- `client/src/app/(auth)/register.tsx` - Updated navigation logic

## Security Notes

1. **JWT Storage**: Token stored securely in AsyncStorage
2. **Email Verification**: Google OAuth users are automatically verified (is_active=True)
3. **Password Security**: OAuth users get unusable password (can't login with password)
4. **Session Management**: Each login generates new session_id
5. **Audit Logging**: All OAuth logins are logged with IP address

## Future Enhancements

1. **Link Accounts**: Allow users to link Google account to existing password-based account
2. **Multiple OAuth Providers**: Add Facebook, Apple sign-in
3. **Profile Sync**: Sync profile picture from Google
4. **Email Preferences**: Let users choose which email to use if Google provides multiple
