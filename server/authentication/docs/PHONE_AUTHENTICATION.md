# 📱 Phone Authentication API Documentation

> **Version:** 1.0.0  
> **Last Updated:** March 2026  
> **Base URL:** `/api/authentication/`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow Diagram](#authentication-flow-diagram)
3. [Prerequisites](#prerequisites)
4. [Common Headers](#common-headers)
5. [API Endpoints](#api-endpoints)
   - [1. Phone Verify](#1-phone-verify)
   - [2. Complete Profile](#2-complete-profile)
   - [3. Confirm Account Link](#3-confirm-account-link)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Frontend Implementation Guide](#frontend-implementation-guide)

---

## Overview

Scrapiz uses **Firebase Phone Authentication** for OTP-based phone verification. The client-side handles OTP request and verification through Firebase SDK, then sends the Firebase ID token to our backend for user authentication.

### Key Points
- OTP is generated and sent by **Firebase** (not our backend)
- Backend only verifies the **Firebase ID token** after successful OTP verification
- Phone numbers must be in **E.164 format** (e.g., `+919876543210`)
- Supports account creation and linking to existing accounts

---

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PHONE AUTHENTICATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client  │      │ Firebase │      │  Server  │      │ Database │
└────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘
     │                  │                 │                 │
     │ 1. Request OTP   │                 │                 │
     │ ─────────────────>                 │                 │
     │                  │                 │                 │
     │ 2. SMS with OTP  │                 │                 │
     │ <─────────────────                 │                 │
     │                  │                 │                 │
     │ 3. Submit OTP    │                 │                 │
     │ ─────────────────>                 │                 │
     │                  │                 │                 │
     │ 4. Firebase Token│                 │                 │
     │ <─────────────────                 │                 │
     │                  │                 │                 │
     │ 5. POST /phone/verify/ (firebase_token)             │
     │ ───────────────────────────────────>                 │
     │                  │                 │                 │
     │                  │                 │ 6. Lookup User  │
     │                  │                 │ ────────────────>
     │                  │                 │                 │
     ├─────────────────────────────────────────────────────────┐
     │           IF USER EXISTS (phone_number found)           │
     ├─────────────────────────────────────────────────────────┤
     │ 7a. Return JWT + User Info                              │
     │ <───────────────────────────────────                    │
     └─────────────────────────────────────────────────────────┘
     │                  │                 │                 │
     ├─────────────────────────────────────────────────────────┐
     │           IF NEW USER (phone_number not found)          │
     ├─────────────────────────────────────────────────────────┤
     │ 7b. Return {profile_required: true}                     │
     │ <───────────────────────────────────                    │
     │                  │                 │                 │
     │ 8. POST /phone/complete-profile/                        │
     │    (name, email, phone_number, firebase_uid)            │
     │ ───────────────────────────────────>                    │
     │                  │                 │                 │
     ├─────────────────────────────────────────────────────────┐
     │           IF EMAIL IS NEW (no collision)                │
     ├─────────────────────────────────────────────────────────┤
     │ 9a. Create User & Return JWT                            │
     │ <───────────────────────────────────                    │
     └─────────────────────────────────────────────────────────┘
     │                  │                 │                 │
     ├─────────────────────────────────────────────────────────┐
     │           IF EMAIL EXISTS (collision)                   │
     ├─────────────────────────────────────────────────────────┤
     │ 9b. Return {requires_link_confirmation: true}           │
     │ <───────────────────────────────────                    │
     │                  │                 │                 │
     │ 10. User Confirms Linking                               │
     │                  │                 │                 │
     │ 11. POST /phone/confirm-link/                           │
     │     (confirmed: true, email, phone_number, firebase_uid)│
     │ ───────────────────────────────────>                    │
     │                  │                 │                 │
     │ 12. Link Phone to Account & Return JWT                  │
     │ <───────────────────────────────────                    │
     └─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Client-Side Setup (Firebase)

Before calling backend endpoints, complete these steps using **Firebase SDK**:

1. Initialize Firebase with your project configuration
2. Request OTP: `firebase.auth().signInWithPhoneNumber(phoneNumber, recaptchaVerifier)`
3. Verify OTP: `confirmationResult.confirm(otpCode)`
4. Get Firebase ID Token: `firebase.auth().currentUser.getIdToken()`
5. Send token to backend for authentication

---

## Common Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `x-auth-app` | string | ✅ Yes | Frontend secret key for API authentication |
| `Content-Type` | string | ✅ Yes | Must be `application/json` |
| `Authorization` | string | ❌ No | Not required for phone auth endpoints |

```javascript
// Example Headers
const headers = {
  'x-auth-app': 'YOUR_FRONTEND_SECRET_KEY',
  'Content-Type': 'application/json'
};
```

---

## API Endpoints

### 1. Phone Verify

**Verify Firebase ID token and authenticate existing user or request profile completion.**

```
POST /api/authentication/phone/verify/
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `firebase_token` | string | ✅ Yes | Firebase ID token obtained after OTP verification |

```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

#### Response Scenarios

##### ✅ Success - Existing User (HTTP 200)

User already exists with this phone number. Returns JWT for immediate authentication.

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

##### ✅ Profile Required - New User (HTTP 200)

Phone number not found. Client must collect profile info and call `/phone/complete-profile/`.

```json
{
  "profile_required": true,
  "phone_number": "+919876543210",
  "firebase_uid": "Firebase123ABC",
  "message": "Please complete your profile"
}
```

##### ❌ Error - Invalid Token (HTTP 401)

```json
{
  "error": "Invalid or expired verification token"
}
```

##### ❌ Error - Missing Token (HTTP 400)

```json
{
  "error": "Firebase token is required"
}
```

---

### 2. Complete Profile

**Complete registration for new phone auth users.**

```
POST /api/authentication/phone/complete-profile/
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | ✅ Yes | User's full name (max 50 characters) |
| `email` | string | ✅ Yes | User's email address |
| `phone_number` | string | ✅ Yes | Verified phone number in E.164 format |
| `firebase_uid` | string | ✅ Yes | Firebase unique user identifier from verify response |

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+919876543210",
  "firebase_uid": "Firebase123ABC"
}
```

#### Response Scenarios

##### ✅ Success - Account Created (HTTP 201)

New account created successfully with the provided details.

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Account created successfully",
  "user": {
    "id": 456,
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

##### ⚠️ Email Collision - Link Confirmation Required (HTTP 200)

An account with this email already exists. User must confirm whether to link phone to existing account.

```json
{
  "requires_link_confirmation": true,
  "existing_email": "john@example.com",
  "auth_provider": "email",
  "message": "An account with this email already exists. Would you like to link your phone number?"
}
```

**`auth_provider` values:**
| Value | Description |
|-------|-------------|
| `email` | Account created with email/password |
| `google` | Account created via Google OAuth |
| `apple` | Account created via Apple OAuth |

##### ❌ Error - Validation Failed (HTTP 400)

```json
{
  "error": "Name is required"
}
```

```json
{
  "error": "Invalid email format"
}
```

```json
{
  "error": "Phone number must be in E.164 format (e.g., +919876543210)"
}
```

```json
{
  "error": "Phone number already linked to another account"
}
```

---

### 3. Confirm Account Link

**Confirm or cancel linking phone number to an existing account.**

```
POST /api/authentication/phone/confirm-link/
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `confirmed` | boolean | ✅ Yes | `true` to link account, `false` to cancel |
| `email` | string | ✅ Yes | Email of the existing account to link |
| `phone_number` | string | ✅ Yes | Verified phone number in E.164 format |
| `firebase_uid` | string | ✅ Yes | Firebase unique user identifier |

##### Request - Confirm Linking

```json
{
  "confirmed": true,
  "email": "john@example.com",
  "phone_number": "+919876543210",
  "firebase_uid": "Firebase123ABC"
}
```

##### Request - Cancel Linking

```json
{
  "confirmed": false,
  "email": "john@example.com",
  "phone_number": "+919876543210",
  "firebase_uid": "Firebase123ABC"
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
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

##### ✅ Cancelled (HTTP 200)

```json
{
  "message": "Account linking cancelled. You can create a new account with a different email."
}
```

##### ❌ Error - Phone Already Linked (HTTP 400)

```json
{
  "error": "Phone number already linked to another account"
}
```

##### ❌ Error - Account Already Has Phone (HTTP 400)

```json
{
  "error": "This account already has a different phone number linked"
}
```

##### ❌ Error - Account Not Found (HTTP 404)

```json
{
  "error": "Account not found"
}
```

---

## Error Handling

### Common Error Responses

| HTTP Code | Error Type | Description |
|-----------|------------|-------------|
| `400` | Bad Request | Missing required fields or validation errors |
| `401` | Unauthorized | Invalid or expired Firebase token |
| `403` | Forbidden | Invalid `x-auth-app` header |
| `404` | Not Found | Account not found for linking |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Server Error | Internal server error |

### Error Response Format

```json
{
  "error": "Descriptive error message"
}
```

---

## Rate Limiting

| Endpoint | Limit | Scope |
|----------|-------|-------|
| `/phone/verify/` | 10 requests/minute | Per IP address |
| `/phone/complete-profile/` | 5 requests/minute | Per IP address |
| `/phone/confirm-link/` | 5 requests/minute | Per IP address |

### Rate Limit Exceeded Response (HTTP 429)

```json
{
  "detail": "Request was throttled. Expected available in X seconds."
}
```

---

## Frontend Implementation Guide

### Complete Flow Example (React Native / Expo)

```javascript
import auth from '@react-native-firebase/auth';
import axios from 'axios';

const API_BASE = 'https://your-api-domain.com/api/authentication';
const FRONTEND_SECRET = 'YOUR_FRONTEND_SECRET_KEY';

const headers = {
  'x-auth-app': FRONTEND_SECRET,
  'Content-Type': 'application/json'
};

// Step 1: Send OTP using Firebase
async function sendOTP(phoneNumber) {
  try {
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    return confirmation;
  } catch (error) {
    throw new Error('Failed to send OTP: ' + error.message);
  }
}

// Step 2: Verify OTP and get Firebase Token
async function verifyOTP(confirmation, otpCode) {
  try {
    await confirmation.confirm(otpCode);
    const user = auth().currentUser;
    const firebaseToken = await user.getIdToken();
    return firebaseToken;
  } catch (error) {
    throw new Error('Invalid OTP');
  }
}

// Step 3: Authenticate with Backend
async function authenticateWithBackend(firebaseToken) {
  try {
    const response = await axios.post(
      `${API_BASE}/phone/verify/`,
      { firebase_token: firebaseToken },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Authentication failed');
  }
}

// Step 4: Complete Profile (if needed)
async function completeProfile(profileData) {
  try {
    const response = await axios.post(
      `${API_BASE}/phone/complete-profile/`,
      profileData,
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Profile completion failed');
  }
}

// Step 5: Confirm Account Linking (if needed)
async function confirmAccountLink(linkData) {
  try {
    const response = await axios.post(
      `${API_BASE}/phone/confirm-link/`,
      linkData,
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Account linking failed');
  }
}

// Main Authentication Flow
async function phoneAuthFlow(phoneNumber) {
  // 1. Send OTP
  const confirmation = await sendOTP(phoneNumber);
  
  // 2. User enters OTP - verify it
  const firebaseToken = await verifyOTP(confirmation, userEnteredOTP);
  
  // 3. Authenticate with backend
  const result = await authenticateWithBackend(firebaseToken);
  
  // 4. Handle different scenarios
  if (result.jwt) {
    // Existing user - login successful
    storeJWT(result.jwt);
    navigateToHome();
    return;
  }
  
  if (result.profile_required) {
    // New user - show profile form
    const profileData = await showProfileForm();
    
    const profileResult = await completeProfile({
      name: profileData.name,
      email: profileData.email,
      phone_number: result.phone_number,
      firebase_uid: result.firebase_uid
    });
    
    if (profileResult.jwt) {
      storeJWT(profileResult.jwt);
      navigateToHome();
      return;
    }
    
    if (profileResult.requires_link_confirmation) {
      // Email collision - ask user to confirm linking
      const userConfirmed = await showLinkConfirmation(
        profileResult.existing_email,
        profileResult.auth_provider
      );
      
      const linkResult = await confirmAccountLink({
        confirmed: userConfirmed,
        email: profileResult.existing_email,
        phone_number: result.phone_number,
        firebase_uid: result.firebase_uid
      });
      
      if (linkResult.jwt) {
        storeJWT(linkResult.jwt);
        navigateToHome();
      } else {
        // User cancelled - show message and let them try different email
        showMessage(linkResult.message);
      }
    }
  }
}
```

### State Machine for Phone Auth UI

```
┌─────────────────┐
│  PHONE_INPUT    │ ←───────────────────────────────────────┐
│  Enter phone #  │                                         │
└────────┬────────┘                                         │
         │ Submit                                           │
         ▼                                                  │
┌─────────────────┐                                         │
│   OTP_SENT      │                                         │
│   Waiting OTP   │                                         │
└────────┬────────┘                                         │
         │ Enter OTP                                        │
         ▼                                                  │
┌─────────────────┐        ┌─────────────────┐             │
│  VERIFYING      │───────>│   LOGGED_IN     │             │
│  POST /verify/  │ jwt    │   ✓ Success     │             │
└────────┬────────┘        └─────────────────┘             │
         │ profile_required                                 │
         ▼                                                  │
┌─────────────────┐                                         │
│ PROFILE_FORM    │                                         │
│ Enter name+email│                                         │
└────────┬────────┘                                         │
         │ Submit                                           │
         ▼                                                  │
┌─────────────────┐        ┌─────────────────┐             │
│  COMPLETING     │───────>│   LOGGED_IN     │             │
│  POST /complete │ jwt    │   ✓ Created     │             │
└────────┬────────┘        └─────────────────┘             │
         │ requires_link_confirmation                       │
         ▼                                                  │
┌─────────────────┐                                         │
│  LINK_CONFIRM   │                                         │
│  Confirm link?  │                                         │
└────────┬────────┘                                         │
         │                                                  │
    ┌────┴────┐                                             │
    │         │                                             │
    ▼         ▼                                             │
 Confirm   Cancel ──────────────────────────────────────────┘
    │
    ▼
┌─────────────────┐        ┌─────────────────┐
│   LINKING       │───────>│   LOGGED_IN     │
│  POST /confirm  │ jwt    │   ✓ Linked      │
└─────────────────┘        └─────────────────┘
```

---

## Security Considerations

1. **Never expose the `x-auth-app` secret** - Store it securely and never commit to version control
2. **Firebase tokens are short-lived** - Verify immediately after OTP confirmation
3. **Phone numbers are validated** - Must be in E.164 format with country code
4. **Rate limiting is enforced** - Implement appropriate retry logic with backoff
5. **Session IDs are rotated** - New session generated on each successful authentication

---

## Audit Events

The following actions are logged for security auditing:

| Action | Description |
|--------|-------------|
| `phone_login` | Successful login with existing phone number |
| `phone_registration` | New account created via phone auth |
| `phone_account_linked` | Phone linked to existing account |
| `phone_auth_failed` | Failed authentication attempt |

---

**Need Help?** Contact the backend team or check the [Troubleshooting Guide](../../../admin-dashboard/docs/TROUBLESHOOTING.md).
