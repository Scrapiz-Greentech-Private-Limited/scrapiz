# 🔐 OAuth Authentication API Documentation

> **Version:** 1.0.0  
> **Last Updated:** March 2026  
> **Base URL:** `/api/authentication/`

---

## Table of Contents

1. [Overview](#overview)
2. [Supported Providers](#supported-providers)
3. [Authentication Flow Diagrams](#authentication-flow-diagrams)
4. [Prerequisites](#prerequisites)
5. [Common Headers](#common-headers)
6. [API Endpoints](#api-endpoints)
   - [Google OAuth](#google-oauth)
     - [1. Google Login](#1-google-login)
   - [Apple OAuth](#apple-oauth)
     - [2. Apple Login](#2-apple-login)
     - [3. Apple Confirm Link](#3-apple-confirm-link)
7. [Error Handling](#error-handling)
8. [Frontend Implementation Guide](#frontend-implementation-guide)

---

## Overview

Scrapiz supports social authentication through **Google Sign-In** and **Apple Sign-In**. Both methods allow users to authenticate using their existing social accounts without creating a separate password.

### Key Points

- OAuth tokens are verified **server-side** using the provider's public keys
- Google OAuth supports iOS, Android, and Web client IDs
- Apple OAuth includes **nonce verification** for replay attack protection
- Both methods support **account linking** to existing email accounts
- Users authenticated via OAuth have an **unusable password** (can't use password reset)

---

## Supported Providers

| Provider | Endpoint | Account Linking | Nonce Required |
|----------|----------|-----------------|----------------|
| Google | `/google-login/` | Auto (by email) | ❌ No |
| Apple | `/apple-login/` | Manual confirmation | ✅ Yes |

---

## Authentication Flow Diagrams

### Google OAuth Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           GOOGLE OAUTH FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │  Google  │      │  Server  │      │ Database │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                  │                 │                 │
     │ 1. Google Sign-In│                 │                 │
     │ ─────────────────>                 │                 │
     │                  │                 │                 │
     │ 2. User Consents │                 │                 │
     │ <─────────────────                 │                 │
     │                  │                 │                 │
     │ 3. ID Token      │                 │                 │
     │ <─────────────────                 │                 │
     │                  │                 │                 │
     │ 4. POST /google-login/ (id_token)                    │
     │ ───────────────────────────────────>                 │
     │                  │                 │                 │
     │                  │ 5. Verify Token │                 │
     │                  │ <───────────────                  │
     │                  │                 │                 │
     │                  │ 6. Token Valid  │                 │
     │                  │ ────────────────>                 │
     │                  │                 │                 │
     │                  │                 │ 7. Find/Create  │
     │                  │                 │    User         │
     │                  │                 │ ────────────────>
     │                  │                 │                 │
     │                  │                 │ 8. User Record  │
     │                  │                 │ <────────────────
     │                  │                 │                 │
     │ 9. Return JWT + User Info          │                 │
     │ <───────────────────────────────────                 │
     │                  │                 │                 │
```

### Apple OAuth Flow (with Account Linking)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           APPLE OAUTH FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │  Apple   │      │  Server  │      │ Database │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                  │                 │                 │
     │ 1. Generate Nonce│                 │                 │
     │ (client-side)    │                 │                 │
     │                  │                 │                 │
     │ 2. Apple Sign-In │                 │                 │
     │    (with SHA256  │                 │                 │
     │     hash of nonce)                 │                 │
     │ ─────────────────>                 │                 │
     │                  │                 │                 │
     │ 3. User Consents │                 │                 │
     │ <─────────────────                 │                 │
     │                  │                 │                 │
     │ 4. Identity Token│                 │                 │
     │    + User Info   │                 │                 │
     │    (first time)  │                 │                 │
     │ <─────────────────                 │                 │
     │                  │                 │                 │
     │ 5. POST /apple-login/                                │
     │    (identity_token, nonce, user, email)              │
     │ ───────────────────────────────────>                 │
     │                  │                 │                 │
     │                  │ 6. Verify Token │                 │
     │                  │    + Nonce      │                 │
     │                  │ <───────────────                  │
     │                  │                 │                 │
     │                  │                 │ 7. Check Apple  │
     │                  │                 │    User ID      │
     │                  │                 │ ────────────────>
     │                  │                 │                 │
     ├─────────────────────────────────────────────────────────┐
     │     IF APPLE USER EXISTS (apple_user_id found)          │
     ├─────────────────────────────────────────────────────────┤
     │ 8a. Return JWT + User Info                              │
     │ <───────────────────────────────────                    │
     └─────────────────────────────────────────────────────────┘
     │                  │                 │                 │
     ├─────────────────────────────────────────────────────────┐
     │     IF NEW APPLE USER + EMAIL MATCHES EXISTING ACCOUNT  │
     ├─────────────────────────────────────────────────────────┤
     │ 8b. Return {requires_link_confirmation: true}           │
     │ <───────────────────────────────────                    │
     │                  │                 │                 │
     │ 9. User Confirms │                 │                 │
     │    Linking       │                 │                 │
     │                  │                 │                 │
     │ 10. POST /apple-login/confirm-link/                     │
     │     (identity_token, nonce, confirmed: true)            │
     │ ───────────────────────────────────>                    │
     │                  │                 │                 │
     │ 11. Link Apple ID + Return JWT                          │
     │ <───────────────────────────────────                    │
     └─────────────────────────────────────────────────────────┘
     │                  │                 │                 │
     ├─────────────────────────────────────────────────────────┐
     │     IF NEW APPLE USER + NEW EMAIL                       │
     ├─────────────────────────────────────────────────────────┤
     │ 8c. Create User + Return JWT                            │
     │ <───────────────────────────────────                    │
     └─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Google OAuth Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Sign-In API
3. Create OAuth 2.0 Client IDs for:
   - iOS application
   - Android application
   - Web application (for Expo Go)
4. Configure backend environment variables:
   ```env
   GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
   GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   ```

### Apple OAuth Setup

1. Enable "Sign in with Apple" capability in Apple Developer Portal
2. Create an App ID with Sign in with Apple enabled
3. Configure backend environment variable:
   ```env
   APPLE_BUNDLE_ID=com.yourcompany.yourapp
   ```

---

## Common Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `x-auth-app` | string | ✅ Yes | Frontend secret key for API authentication |
| `Content-Type` | string | ✅ Yes | Must be `application/json` |

```javascript
// Example Headers
const headers = {
  'x-auth-app': 'YOUR_FRONTEND_SECRET_KEY',
  'Content-Type': 'application/json'
};
```

---

## API Endpoints

---

## Google OAuth

### 1. Google Login

**Authenticate user with Google Sign-In.**

```
POST /api/authentication/google-login/
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id_token` | string | ✅ Yes | Google ID token from Google Sign-In |

```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

#### Response Scenarios

##### ✅ Success - Login/Registration (HTTP 200)

Returns JWT for both new and existing users. New users are automatically created.

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful",
  "user": {
    "id": 123,
    "email": "user@gmail.com",
    "name": "John Doe"
  }
}
```

##### ❌ Error - Missing Token (HTTP 400)

```json
{
  "error": "ID token is required"
}
```

##### ❌ Error - Invalid Token (HTTP 401)

```json
{
  "error": "Invalid token: Token verification failed with all client IDs"
}
```

##### ❌ Error - Internal Error (HTTP 500)

```json
{
  "error": "Failed to create user account"
}
```

#### Token Verification Details

The server verifies the Google ID token against:
1. **iOS Client ID** (`GOOGLE_IOS_CLIENT_ID`)
2. **Android Client ID** (`GOOGLE_ANDROID_CLIENT_ID`)
3. **Web Client ID** (`GOOGLE_CLIENT_ID`)

Token must have issuer: `accounts.google.com` or `https://accounts.google.com`

---

## Apple OAuth

### 2. Apple Login

**Authenticate user with Apple Sign-In.**

```
POST /api/authentication/apple-login/
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `identity_token` | string | ✅ Yes | Apple identity JWT from Sign in with Apple |
| `nonce` | string | ✅ Yes | Raw (unhashed) nonce generated by frontend |
| `user` | object | ❌ Optional | User info from first sign-in (Apple only sends this once) |
| `email` | string | ❌ Optional | Email from first sign-in (fallback if not in token) |

##### User Object Structure

| Field | Type | Description |
|-------|------|-------------|
| `firstName` | string | User's first name |
| `lastName` | string | User's last name |

```json
{
  "identity_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "nonce": "random-nonce-string-generated-by-client",
  "user": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "email": "user@icloud.com"
}
```

#### Response Scenarios

##### ✅ Success - Existing Apple User (HTTP 200)

User already has Apple ID linked. Direct authentication.

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful",
  "user": {
    "id": 123,
    "email": "user@icloud.com",
    "name": "John Doe"
  }
}
```

##### ✅ Success - New User Created (HTTP 200)

New user with new email. Account created automatically.

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful",
  "user": {
    "id": 456,
    "email": "user@privaterelay.appleid.com",
    "name": "John Doe"
  }
}
```

##### ⚠️ Account Linking Required (HTTP 200)

Email matches an existing account that doesn't have Apple ID linked.

```json
{
  "requires_link_confirmation": true,
  "existing_email": "user@icloud.com",
  "message": "An account with this email already exists. Would you like to link your Apple ID to this account?"
}
```

##### ❌ Error - Missing Token (HTTP 400)

```json
{
  "error": "Identity token is required"
}
```

##### ❌ Error - Missing Nonce (HTTP 400)

```json
{
  "error": "Nonce is required"
}
```

##### ❌ Error - Invalid Token (HTTP 401)

```json
{
  "error": "Invalid token: Invalid nonce - possible replay attack"
}
```

```json
{
  "error": "Invalid token: Token has expired"
}
```

```json
{
  "error": "Invalid token: Invalid token signature"
}
```

---

### 3. Apple Confirm Link

**Confirm or cancel linking Apple ID to an existing account.**

```
POST /api/authentication/apple-login/confirm-link/
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `identity_token` | string | ✅ Yes | Apple identity JWT (must be fresh) |
| `nonce` | string | ✅ Yes | Raw nonce for re-verification |
| `confirmed` | boolean | ✅ Yes | `true` to link account, `false` to cancel |

##### Request - Confirm Linking

```json
{
  "identity_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "nonce": "random-nonce-string",
  "confirmed": true
}
```

##### Request - Cancel Linking

```json
{
  "identity_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "nonce": "random-nonce-string",
  "confirmed": false
}
```

#### Response Scenarios

##### ✅ Success - Account Linked (HTTP 200)

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Account linked successfully",
  "user": {
    "id": 123,
    "email": "user@icloud.com",
    "name": "John Doe"
  }
}
```

##### ✅ Cancelled (HTTP 200)

```json
{
  "message": "Account linking cancelled. You can create a new account instead."
}
```

##### ❌ Error - Email Not Found (HTTP 400)

```json
{
  "error": "Email not found in token"
}
```

##### ❌ Error - Account Not Found (HTTP 404)

```json
{
  "error": "Account not found"
}
```

##### ❌ Error - Invalid Token (HTTP 401)

```json
{
  "error": "Invalid token: Token has expired"
}
```

---

## Error Handling

### Common Error Responses

| HTTP Code | Error Type | Description |
|-----------|------------|-------------|
| `400` | Bad Request | Missing required fields |
| `401` | Unauthorized | Invalid or expired token |
| `403` | Forbidden | Invalid `x-auth-app` header |
| `404` | Not Found | Account not found for linking |
| `500` | Server Error | Internal server error |

### Error Response Format

```json
{
  "error": "Descriptive error message"
}
```

### Token Validation Errors

| Provider | Error Message | Cause |
|----------|---------------|-------|
| Google | "Invalid token issuer" | Token not from Google |
| Google | "Token verification failed with all client IDs" | Client ID mismatch |
| Apple | "Invalid nonce - possible replay attack" | Nonce hash mismatch |
| Apple | "Token has expired" | JWT expired |
| Apple | "Invalid token signature" | Signature verification failed |
| Apple | "Invalid token audience" | Bundle ID mismatch |

---

## Frontend Implementation Guide

### Nonce Generation for Apple Sign-In

**Important:** Apple requires a nonce for security. You must:
1. Generate a random nonce string
2. Hash it with SHA256
3. Pass the **hash** to Apple Sign-In
4. Send the **raw nonce** to the backend

```javascript
import * as Crypto from 'expo-crypto';

// Generate nonce
function generateNonce(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < length; i++) {
    nonce += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return nonce;
}

// Hash nonce for Apple
async function hashNonce(nonce) {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce
  );
  return digest;
}
```

### Complete Implementation Examples

#### Google Sign-In (React Native / Expo)

```javascript
import * as Google from 'expo-auth-session/providers/google';
import axios from 'axios';

const API_BASE = 'https://your-api-domain.com/api/authentication';
const FRONTEND_SECRET = 'YOUR_FRONTEND_SECRET_KEY';

const headers = {
  'x-auth-app': FRONTEND_SECRET,
  'Content-Type': 'application/json'
};

// Configure Google Auth
const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
  iosClientId: 'YOUR_IOS_CLIENT_ID',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  webClientId: 'YOUR_WEB_CLIENT_ID',
});

// Handle Google Sign-In
async function handleGoogleSignIn() {
  try {
    // 1. Trigger Google Sign-In
    const result = await promptAsync();
    
    if (result.type !== 'success') {
      throw new Error('Google Sign-In cancelled');
    }
    
    const { id_token } = result.params;
    
    // 2. Send token to backend
    const response = await axios.post(
      `${API_BASE}/google-login/`,
      { id_token },
      { headers }
    );
    
    // 3. Store JWT and navigate
    const { jwt, user } = response.data;
    await storeJWT(jwt);
    navigateToHome(user);
    
  } catch (error) {
    console.error('Google Sign-In error:', error.response?.data?.error || error.message);
    showError(error.response?.data?.error || 'Google Sign-In failed');
  }
}
```

#### Apple Sign-In (React Native / Expo)

```javascript
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import axios from 'axios';

const API_BASE = 'https://your-api-domain.com/api/authentication';
const FRONTEND_SECRET = 'YOUR_FRONTEND_SECRET_KEY';

const headers = {
  'x-auth-app': FRONTEND_SECRET,
  'Content-Type': 'application/json'
};

// Generate random nonce
function generateNonce(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < length; i++) {
    nonce += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return nonce;
}

// Handle Apple Sign-In
async function handleAppleSignIn() {
  try {
    // 1. Generate nonce
    const rawNonce = generateNonce();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );
    
    // 2. Trigger Apple Sign-In
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce, // Pass HASHED nonce to Apple
    });
    
    // 3. Send to backend with RAW nonce
    const response = await axios.post(
      `${API_BASE}/apple-login/`,
      {
        identity_token: credential.identityToken,
        nonce: rawNonce, // Send RAW nonce to backend
        user: credential.fullName ? {
          firstName: credential.fullName.givenName,
          lastName: credential.fullName.familyName,
        } : undefined,
        email: credential.email,
      },
      { headers }
    );
    
    const result = response.data;
    
    // 4. Handle response
    if (result.jwt) {
      await storeJWT(result.jwt);
      navigateToHome(result.user);
      return;
    }
    
    // 5. Handle account linking if required
    if (result.requires_link_confirmation) {
      const userConfirmed = await showLinkConfirmationDialog(result.existing_email);
      
      if (userConfirmed) {
        // User needs to re-authenticate to get fresh token
        // (tokens are short-lived for security)
        const newCredential = await AppleAuthentication.signInAsync({
          requestedScopes: [],
          nonce: hashedNonce,
        });
        
        const linkResponse = await axios.post(
          `${API_BASE}/apple-login/confirm-link/`,
          {
            identity_token: newCredential.identityToken,
            nonce: rawNonce,
            confirmed: true,
          },
          { headers }
        );
        
        await storeJWT(linkResponse.data.jwt);
        navigateToHome(linkResponse.data.user);
      } else {
        showMessage('Account linking cancelled. Please try with a different account.');
      }
    }
    
  } catch (error) {
    if (error.code === 'ERR_CANCELED') {
      // User cancelled - do nothing
      return;
    }
    console.error('Apple Sign-In error:', error.response?.data?.error || error.message);
    showError(error.response?.data?.error || 'Apple Sign-In failed');
  }
}
```

### State Machine for OAuth UI

```
┌─────────────────┐
│    IDLE         │
│  Show Options   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌────────┐
│ Google │  │ Apple  │
│ Button │  │ Button │
└───┬────┘  └───┬────┘
    │           │
    ▼           ▼
┌────────────────────┐
│   AUTHENTICATING   │
│   Show Loader      │
└─────────┬──────────┘
          │
    ┌─────┴─────┬──────────────────┐
    │           │                  │
    ▼           ▼                  ▼
┌────────┐  ┌─────────────┐  ┌───────────┐
│ Success│  │ Link Needed │  │  Error    │
│  JWT   │  │ (Apple only)│  │           │
└───┬────┘  └──────┬──────┘  └─────┬─────┘
    │              │               │
    ▼              ▼               ▼
┌────────┐  ┌─────────────┐  ┌───────────┐
│LOGGED  │  │  CONFIRM    │  │ Show      │
│  IN    │  │  DIALOG     │  │ Error     │
└────────┘  └──────┬──────┘  └───────────┘
                   │
              ┌────┴────┐
              │         │
              ▼         ▼
          Confirm    Cancel
              │         │
              ▼         ▼
          ┌───────┐ ┌───────────┐
          │LOGGED │ │ Cancelled │
          │  IN   │ │  Message  │
          └───────┘ └───────────┘
```

---

## Security Considerations

### Google OAuth

1. **Multiple Client IDs** - Server accepts iOS, Android, and Web tokens
2. **Token Verification** - Uses Google's public keys via `google.oauth2.id_token`
3. **Issuer Validation** - Must be from `accounts.google.com`

### Apple OAuth

1. **Nonce Verification** - Prevents replay attacks
   - Client generates random nonce
   - SHA256 hash passed to Apple
   - Raw nonce sent to backend
   - Backend verifies: `SHA256(raw_nonce) == token.nonce`
   
2. **Private Relay Email** - Apple may provide a relay email (e.g., `abc123@privaterelay.appleid.com`)

3. **User Info Availability** - Apple only sends `firstName`, `lastName`, `email` on **first sign-in**
   - Store this data immediately
   - Subsequent sign-ins only provide `identity_token`

4. **Short Token Lifetime** - Apple tokens expire quickly
   - Verify immediately after sign-in
   - For account linking, user may need to re-authenticate

### General Best Practices

1. **Never expose `x-auth-app`** - Store securely, not in version control
2. **Validate on server** - Never trust client-side token validation
3. **Session rotation** - New session ID generated on each authentication
4. **Audit logging** - All OAuth logins are logged with IP address

---

## Audit Events

| Action | Description |
|--------|-------------|
| `oauth_login` | Google OAuth authentication |
| `apple_oauth_login` | Apple OAuth authentication or account linking |

---

## Comparison: Google vs Apple OAuth

| Feature | Google | Apple |
|---------|--------|-------|
| Setup Complexity | Medium | Higher |
| Nonce Required | No | Yes |
| Account Linking | Automatic | Manual confirmation |
| Email Always Available | Yes | May be relay email |
| User Info | Always available | First sign-in only |
| Token Refresh | Not needed | Short-lived |

---

**Need Help?** Contact the backend team or check the [Troubleshooting Guide](../../../admin-dashboard/docs/TROUBLESHOOTING.md).
