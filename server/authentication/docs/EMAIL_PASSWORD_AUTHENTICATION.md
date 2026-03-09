# 📧 Email & Password Authentication API Documentation

> **Version:** 1.0.0  
> **Last Updated:** March 2026  
> **Base URL:** `/api/authentication/`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow Diagrams](#authentication-flow-diagrams)
3. [Common Headers](#common-headers)
4. [API Endpoints](#api-endpoints)
   - [Registration](#registration)
     - [1. Register](#1-register)
     - [2. Verify OTP](#2-verify-otp)
     - [3. Resend OTP](#3-resend-otp)
   - [Authentication](#authentication)
     - [4. Login](#4-login)
     - [5. Logout](#5-logout)
   - [Password Management](#password-management)
     - [6. Password Reset Request](#6-password-reset-request)
     - [7. Password Reset](#7-password-reset)
   - [User Management](#user-management)
     - [8. Get User Profile](#8-get-user-profile)
     - [9. Update User Profile](#9-update-user-profile)
     - [10. Delete Account](#10-delete-account)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [JWT Token Management](#jwt-token-management)
8. [Frontend Implementation Guide](#frontend-implementation-guide)

---

## Overview

Scrapiz provides traditional email/password authentication with email-based OTP verification. This method supports:

- **Email Registration** with OTP verification
- **Secure Login** with password authentication
- **Password Reset** via email OTP
- **Session Management** with JWT tokens
- **Profile Management** including avatar customization
- **Account Deletion** with feedback collection

### Key Points

- All passwords are **hashed** using Django's built-in password hashing
- OTPs are **6-digit numeric codes** valid for **5 minutes**
- JWT tokens are valid for **7 days**
- Session IDs are **rotated** on each login for security
- Referral codes can be applied during registration

---

## Authentication Flow Diagrams

### Registration Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           REGISTRATION FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐                    ┌──────────┐      ┌──────────┐
│  Client  │                    │  Server  │      │  Email   │
└────┬─────┘                    └────┬─────┘      └────┬─────┘
     │                               │                 │
     │ 1. POST /register/            │                 │
     │    (name, email, password,    │                 │
     │     confirm_password,         │                 │
     │     promo_code?)              │                 │
     │ ──────────────────────────────>                 │
     │                               │                 │
     │                               │ 2. Create User  │
     │                               │    (inactive)   │
     │                               │                 │
     │                               │ 3. Generate OTP │
     │                               │                 │
     │                               │ 4. Send OTP     │
     │                               │ ────────────────>
     │                               │                 │
     │ 5. "OTP sent to email"        │                 │
     │ <──────────────────────────────                 │
     │                               │                 │
     │ 6. User receives OTP email    │                 │
     │ <───────────────────────────────────────────────│
     │                               │                 │
     │ 7. PUT /register/             │                 │
     │    (email, otp)               │                 │
     │ ──────────────────────────────>                 │
     │                               │                 │
     │                               │ 8. Verify OTP   │
     │                               │    Activate     │
     │                               │    Account      │
     │                               │                 │
     │                               │ 9. Send Welcome │
     │                               │    Email        │
     │                               │ ────────────────>
     │                               │                 │
     │ 10. "User verified"           │                 │
     │ <──────────────────────────────                 │
     │                               │                 │
```

### Login Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LOGIN FLOW                                          │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐                    ┌──────────┐      ┌──────────┐
│  Client  │                    │  Server  │      │ Database │
└────┬─────┘                    └────┬─────┘      └────┬─────┘
     │                               │                 │
     │ 1. POST /login/               │                 │
     │    (email, password)          │                 │
     │ ──────────────────────────────>                 │
     │                               │                 │
     │                               │ 2. Find User    │
     │                               │ ────────────────>
     │                               │                 │
     │                               │ 3. Verify       │
     │                               │    Password     │
     │                               │                 │
     │                               │ 4. Check        │
     │                               │    is_active    │
     │                               │                 │
     │                               │ 5. Generate     │
     │                               │    Session ID   │
     │                               │                 │
     │                               │ 6. Update       │
     │                               │    Session      │
     │                               │ ────────────────>
     │                               │                 │
     │                               │ 7. Create       │
     │                               │    Audit Log    │
     │                               │                 │
     │                               │ 8. Generate     │
     │                               │    JWT Token    │
     │                               │                 │
     │ 9. Return JWT                 │                 │
     │ <──────────────────────────────                 │
     │                               │                 │
```

### Password Reset Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          PASSWORD RESET FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐                    ┌──────────┐      ┌──────────┐
│  Client  │                    │  Server  │      │  Email   │
└────┬─────┘                    └────┬─────┘      └────┬─────┘
     │                               │                 │
     │ 1. POST /password-reset-request/                │
     │    (email)                    │                 │
     │ ──────────────────────────────>                 │
     │                               │                 │
     │                               │ 2. Generate OTP │
     │                               │                 │
     │                               │ 3. Send OTP     │
     │                               │ ────────────────>
     │                               │                 │
     │ 4. "OTP sent"                 │                 │
     │ <──────────────────────────────                 │
     │                               │                 │
     │ 5. User receives OTP          │                 │
     │ <───────────────────────────────────────────────│
     │                               │                 │
     │ 6. POST /password-reset/      │                 │
     │    (email, otp,               │                 │
     │     new_password,             │                 │
     │     confirm_password)         │                 │
     │ ──────────────────────────────>                 │
     │                               │                 │
     │                               │ 7. Verify OTP   │
     │                               │                 │
     │                               │ 8. Update       │
     │                               │    Password     │
     │                               │                 │
     │                               │ 9. Clear        │
     │                               │    Sessions     │
     │                               │                 │
     │                               │ 10. Send        │
     │                               │     Confirmation│
     │                               │ ────────────────>
     │                               │                 │
     │ 11. "Password reset success"  │                 │
     │ <──────────────────────────────                 │
     │                               │                 │
```

---

## Common Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `x-auth-app` | string | ✅ Yes | Frontend secret key for API authentication |
| `Content-Type` | string | ✅ Yes | Must be `application/json` |
| `Authorization` | string | 🔒 Auth Required | Bearer token for authenticated endpoints |

### Header Examples

#### Public Endpoints (Registration, Login, Password Reset)

```javascript
const headers = {
  'x-auth-app': 'YOUR_FRONTEND_SECRET_KEY',
  'Content-Type': 'application/json'
};
```

#### Authenticated Endpoints (User Profile, Logout)

```javascript
const headers = {
  'x-auth-app': 'YOUR_FRONTEND_SECRET_KEY',
  'Content-Type': 'application/json',
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

---

## API Endpoints

---

## Registration

### 1. Register

**Create a new user account and send verification OTP.**

```
POST /api/authentication/register/
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | ✅ Yes | User's full name |
| `email` | string | ✅ Yes | User's email address |
| `password` | string | ✅ Yes | Password for the account |
| `confirm_password` | string | ✅ Yes | Password confirmation (must match) |
| `promo_code` | string | ❌ Optional | Referral code from another user |

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "confirm_password": "SecurePassword123!",
  "promo_code": "ABCD-1234"
}
```

#### Response Scenarios

##### ✅ Success - User Created (HTTP 201)

```json
{
  "message": "User created successfully. OTP sent to your email."
}
```

##### ❌ Error - Missing Fields (HTTP 400)

```json
{
  "message": "Email, name, password, and confirm_password are required"
}
```

##### ❌ Error - Password Mismatch (HTTP 400)

```json
{
  "message": "Passwords do not match"
}
```

##### ❌ Error - Email Exists (HTTP 400)

```json
{
  "message": "Email already exists"
}
```

#### Notes

- If email exists but user is **inactive** (not verified), the existing record is updated with new details
- A unique **referral code** is auto-generated for the user (e.g., `WXYZ-5678`)
- If valid `promo_code` is provided, the referrer is linked to the new user

---

### 2. Verify OTP

**Verify email and activate user account.**

```
PUT /api/authentication/register/
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | ✅ Yes | User's email address |
| `otp` | string | ✅ Yes | 6-digit OTP received via email |

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### Response Scenarios

##### ✅ Success - User Verified (HTTP 200)

```json
{
  "message": "User verified successfully"
}
```

##### ❌ Error - Invalid OTP (HTTP 400)

```json
{
  "error": "Invalid OTP or OTP expired"
}
```

#### Notes

- OTP is valid for **5 minutes** from generation
- After verification, user's `is_active` is set to `true`
- OTP and expiration are cleared from the database
- A **welcome email** is sent to the user

---

### 3. Resend OTP

**Resend verification OTP to user's email.**

```
POST /api/authentication/resendotp/
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | ✅ Yes | User's email address |

```json
{
  "email": "john@example.com"
}
```

#### Response Scenarios

##### ✅ Success - OTP Resent (HTTP 200)

```json
{
  "message": "OTP resent successfully."
}
```

##### ❌ Error - User Not Found (HTTP 400)

```json
{
  "error": "User with this email does not exist."
}
```

#### Rate Limiting

- **1 request per minute** per user
- Returns 429 if exceeded

---

## Authentication

### 4. Login

**Authenticate user and receive JWT token.**

```
POST /api/authentication/login/
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | ✅ Yes | User's email address |
| `password` | string | ✅ Yes | User's password |

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

#### Response Scenarios

##### ✅ Success - Login Successful (HTTP 200)

```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJzZXNzaW9uX2lkIjoiYWJjMTIzIiwiZXhwIjoxNzA5NDA4ODAwLCJpYXQiOjE3MDg4MDQwMDB9.signature"
}
```

##### ❌ Error - User Not Found (HTTP 403)

```json
{
  "detail": "User Not found!"
}
```

##### ❌ Error - Wrong Password (HTTP 403)

```json
{
  "detail": "Incorrect Password"
}
```

##### ❌ Error - Account Not Activated (HTTP 403)

```json
{
  "detail": "Account not activated. Please verify your email."
}
```

#### Rate Limiting

- **5 attempts per minute** per IP address
- Returns 429 if exceeded

#### Notes

- A new **session ID** is generated on each login
- Previous sessions on other devices are **invalidated**
- Login is recorded in **audit log** with IP address

---

### 5. Logout

**Invalidate current session.**

🔒 **Requires Authentication**

```
POST /api/authentication/logout/
```

#### Request Headers

```
Authorization: Bearer <jwt_token>
```

#### Request Body

None required.

#### Response Scenarios

##### ✅ Success - Logged Out (HTTP 200)

```json
{
  "message": "Logged out successfully"
}
```

##### ❌ Error - Unauthenticated (HTTP 403)

```json
{
  "detail": "Unauthenticated!"
}
```

#### Notes

- Session ID is cleared (set to `null`)
- JWT cookie is deleted
- Logout is recorded in **audit log**

---

## Password Management

### 6. Password Reset Request

**Request OTP for password reset.**

```
POST /api/authentication/password-reset-request/
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | ✅ Yes | User's email address |

```json
{
  "email": "john@example.com"
}
```

#### Response Scenarios

##### ✅ Success - OTP Sent (HTTP 200)

```json
{
  "message": "OTP sent to your email."
}
```

##### ❌ Error - User Not Found (HTTP 400)

```json
{
  "message": "User with this email does not exist."
}
```

#### Rate Limiting

- **6 requests per hour** per IP address
- Returns 429 if exceeded

---

### 7. Password Reset

**Reset password using OTP verification.**

```
POST /api/authentication/password-reset/
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | ✅ Yes | User's email address |
| `otp` | string | ✅ Yes | 6-digit OTP received via email |
| `new_password` | string | ✅ Yes | New password |
| `confirm_password` | string | ✅ Yes | Password confirmation (must match) |

```json
{
  "email": "john@example.com",
  "otp": "123456",
  "new_password": "NewSecurePassword456!",
  "confirm_password": "NewSecurePassword456!"
}
```

#### Response Scenarios

##### ✅ Success - Password Reset (HTTP 200)

```json
{
  "message": "Password reset successful."
}
```

##### ❌ Error - User Not Found (HTTP 400)

```json
{
  "message": "User with this email does not exist."
}
```

##### ❌ Error - Invalid OTP (HTTP 400)

```json
{
  "message": "Invalid OTP or OTP expired."
}
```

##### ❌ Error - Password Mismatch (HTTP 400)

```json
{
  "message": "Passwords do not match."
}
```

#### Rate Limiting

- **5 attempts per minute** per user
- Returns 429 if exceeded

#### Notes

- All active sessions are **invalidated** after password reset
- User must log in again with new password
- Password reset is recorded in **audit log**
- **Confirmation email** is sent to user

---

## User Management

### 8. Get User Profile

**Retrieve authenticated user's profile.**

🔒 **Requires Authentication**

```
GET /api/authentication/user/
```

#### Request Headers

```
Authorization: Bearer <jwt_token>
```

#### Response (HTTP 200)

```json
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "phone_number": "+919876543210",
  "gender": "male",
  "referral_code": "ABCD-1234",
  "referred_balance": "40.00",
  "has_completed_first_order": true,
  "profile_image": "https://s3.amazonaws.com/bucket/profiles/123/abc.jpg",
  "avatar_provider": "dicebear",
  "avatar_style": "avataaars",
  "avatar_seed": "john-doe-123",
  "is_staff": false,
  "is_superuser": false,
  "is_active": true,
  "date_joined": "2024-01-15T10:30:00Z",
  "orders": [
    {
      "id": 456,
      "order_number": "SCR-2024-000456",
      "status": "completed"
    }
  ],
  "addresses": [
    {
      "id": 789,
      "address_line_1": "123 Main Street",
      "city": "Mumbai",
      "pincode": "400001"
    }
  ]
}
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique user identifier |
| `name` | string | User's full name |
| `email` | string | User's email address |
| `phone_number` | string | Phone number in E.164 format (nullable) |
| `gender` | string | "male", "female", or "prefer_not_to_say" (nullable) |
| `referral_code` | string | User's referral code for sharing |
| `referred_balance` | decimal | Earnings from referrals (read-only) |
| `has_completed_first_order` | boolean | Whether user completed first order (read-only) |
| `profile_image` | string | URL to uploaded profile image (nullable) |
| `avatar_provider` | string | Avatar service provider (e.g., "dicebear") |
| `avatar_style` | string | DiceBear style (see valid styles below) |
| `avatar_seed` | string | Seed for deterministic avatar generation |
| `is_staff` | boolean | Staff status (read-only) |
| `is_superuser` | boolean | Superuser status (read-only) |
| `is_active` | boolean | Account active status (read-only) |
| `date_joined` | datetime | Account creation timestamp (read-only) |
| `orders` | array | User's order history |
| `addresses` | array | User's saved addresses |

#### Valid Avatar Styles

When using DiceBear avatars, `avatar_style` must be one of:
- `avataaars`
- `pixel-art`
- `bottts`
- `lorelei`
- `adventurer`
- `fun-emoji`

---

### 9. Update User Profile

**Update authenticated user's profile.**

🔒 **Requires Authentication**

```
PATCH /api/authentication/user/
```

#### Request Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

OR for file uploads:

```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

#### Updatable Fields

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | User's full name |
| `phone_number` | string | Phone number |
| `gender` | string | "male", "female", "prefer_not_to_say", or null |
| `profile_image` | file | Profile image file (max 5MB, JPEG/PNG/WebP) |
| `avatar_provider` | string | Avatar service provider |
| `avatar_style` | string | DiceBear avatar style |
| `avatar_seed` | string | Seed for avatar generation |

#### Request Examples

##### Update Name

```json
{
  "name": "John Smith"
}
```

##### Update Avatar Configuration

```json
{
  "avatar_provider": "dicebear",
  "avatar_style": "avataaars",
  "avatar_seed": "my-custom-seed"
}
```

##### Clear Profile Image

```json
{
  "profile_image": ""
}
```

##### Upload Profile Image (multipart/form-data)

```
POST /api/authentication/user/
Content-Type: multipart/form-data

profile_image: <file>
```

#### Response Scenarios

##### ✅ Success - Profile Updated (HTTP 200)

Returns updated user object (same as GET /user/).

```json
{
  "id": 123,
  "name": "John Smith",
  "email": "john@example.com",
  ...
}
```

##### ❌ Error - Invalid Avatar Style (HTTP 400)

```json
{
  "error": "Invalid avatar style. Must be one of: avataaars, pixel-art, bottts, lorelei, adventurer, fun-emoji"
}
```

##### ❌ Error - Image Too Large (HTTP 400)

```json
{
  "error": "File size exceeds maximum limit of 5MB. Your file is 7.50MB."
}
```

##### ❌ Error - Invalid Image Type (HTTP 400)

```json
{
  "error": "Invalid file type. File must be an image (JPEG, PNG, or WebP)."
}
```

##### ❌ Error - No Fields to Update (HTTP 400)

```json
{
  "error": "No valid fields to update"
}
```

#### Notes

- Only provided fields are updated (partial update)
- **Name update** triggers a confirmation email
- **Profile image** is uploaded to S3
- Previous profile image is **deleted** when uploading a new one or clearing

---

### 10. Delete Account

**Delete user account with optional feedback.**

🔒 **Requires Authentication**

```
DELETE /api/authentication/user/
```

#### Request Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reason` | string | ❌ Optional | Deletion reason (see valid reasons) |
| `comments` | string | ❌ Optional | Additional comments (max 500 chars) |

#### Valid Reasons

| Value | Display Name |
|-------|--------------|
| `better_alternative` | Found a better alternative |
| `not_using` | Not using the service anymore |
| `privacy_concerns` | Privacy concerns |
| `difficult_to_use` | Difficult to use |
| `other` | Other |

```json
{
  "reason": "not_using",
  "comments": "Moving to a different city."
}
```

#### Response Scenarios

##### ✅ Success - Account Deleted (HTTP 200)

```json
{
  "message": "Your account has been deleted successfully"
}
```

##### ❌ Error - Already Deleted (HTTP 400)

```json
{
  "error": "Account has already been deleted"
}
```

##### ❌ Error - Invalid Reason (HTTP 400)

```json
{
  "error": "Invalid reason. Must be one of: better_alternative, not_using, privacy_concerns, difficult_to_use, other"
}
```

##### ❌ Error - Comments Too Long (HTTP 400)

```json
{
  "error": "Comments must not exceed 500 characters"
}
```

#### Notes

- Account is **soft deleted** (anonymized, not hard deleted)
- User data is anonymized:
  - Email → `deleted_user_<random>@deleted.local`
  - Name → "Deleted User"
  - Password → invalidated
  - Phone → cleared
- Feedback is stored for analytics
- **Confirmation email** is sent
- Action is logged in **audit log** with preserved user info

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created (registration) |
| `400` | Bad Request | Validation errors, missing fields |
| `401` | Unauthorized | Invalid/expired JWT token |
| `403` | Forbidden | Invalid credentials, inactive account, invalid `x-auth-app` |
| `404` | Not Found | Resource not found |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Server Error | Internal server error |

### Error Response Formats

#### Standard Error

```json
{
  "error": "Descriptive error message"
}
```

#### Message Error (Registration/Password)

```json
{
  "message": "Descriptive error message"
}
```

#### Authentication Failed (DRF)

```json
{
  "detail": "Authentication error message"
}
```

#### Validation Errors

```json
{
  "field_name": ["Error message for this field"]
}
```

---

## Rate Limiting

| Endpoint | Limit | Scope |
|----------|-------|-------|
| `/register/` | No limit | - |
| `/resendotp/` | 1/minute | Per user |
| `/login/` | 5/minute | Per IP |
| `/password-reset-request/` | 6/hour | Per IP |
| `/password-reset/` | 5/minute | Per user |
| `/user/` (GET) | No limit | - |
| `/user/` (PATCH) | No limit | - |
| `/user/` (DELETE) | No limit | - |
| `/logout/` | No limit | - |

### Rate Limit Response (HTTP 429)

```json
{
  "detail": "Request was throttled. Expected available in 45 seconds."
}
```

---

## JWT Token Management

### Token Structure

```javascript
// Decoded JWT payload
{
  "id": 123,              // User ID
  "session_id": "uuid-4", // Session identifier
  "exp": 1709408800,      // Expiration timestamp
  "iat": 1708804000       // Issued at timestamp
}
```

### Token Characteristics

| Property | Value |
|----------|-------|
| Algorithm | HS256 |
| Expiration | 7 days |
| Contains | User ID, Session ID |

### Token Validation

The server validates:
1. **Signature** - Token hasn't been tampered with
2. **Expiration** - Token hasn't expired
3. **Session ID** - Matches user's current session (prevents use after logout/password reset)

### Using the Token

Include in `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Frontend Implementation Guide

### Complete Registration Flow

```javascript
import axios from 'axios';

const API_BASE = 'https://your-api-domain.com/api/authentication';
const FRONTEND_SECRET = 'YOUR_FRONTEND_SECRET_KEY';

const headers = {
  'x-auth-app': FRONTEND_SECRET,
  'Content-Type': 'application/json'
};

// Step 1: Register
async function register(name, email, password, confirmPassword, promoCode = null) {
  try {
    const response = await axios.post(
      `${API_BASE}/register/`,
      {
        name,
        email,
        password,
        confirm_password: confirmPassword,
        promo_code: promoCode
      },
      { headers }
    );
    
    // Success - navigate to OTP screen
    return { success: true, message: response.data.message };
    
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Registration failed' };
  }
}

// Step 2: Verify OTP
async function verifyOTP(email, otp) {
  try {
    const response = await axios.put(
      `${API_BASE}/register/`,
      { email, otp },
      { headers }
    );
    
    // Success - navigate to login
    return { success: true, message: response.data.message };
    
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Invalid OTP' };
  }
}

// Step 3: Resend OTP
async function resendOTP(email) {
  try {
    const response = await axios.post(
      `${API_BASE}/resendotp/`,
      { email },
      { headers }
    );
    
    return { success: true, message: response.data.message };
    
  } catch (error) {
    if (error.response?.status === 429) {
      return { success: false, error: 'Please wait before requesting another OTP' };
    }
    return { success: false, error: error.response?.data?.error || 'Failed to resend OTP' };
  }
}
```

### Login and Session Management

```javascript
// Login
async function login(email, password) {
  try {
    const response = await axios.post(
      `${API_BASE}/login/`,
      { email, password },
      { headers }
    );
    
    const { jwt } = response.data;
    
    // Store token securely
    await SecureStore.setItemAsync('jwt', jwt);
    
    return { success: true, jwt };
    
  } catch (error) {
    const message = error.response?.data?.detail || 'Login failed';
    return { success: false, error: message };
  }
}

// Logout
async function logout() {
  try {
    const jwt = await SecureStore.getItemAsync('jwt');
    
    await axios.post(
      `${API_BASE}/logout/`,
      {},
      {
        headers: {
          ...headers,
          'Authorization': `Bearer ${jwt}`
        }
      }
    );
    
    // Clear stored token
    await SecureStore.deleteItemAsync('jwt');
    
    return { success: true };
    
  } catch (error) {
    // Clear token even if logout fails
    await SecureStore.deleteItemAsync('jwt');
    return { success: true };
  }
}

// Get authenticated user
async function getCurrentUser() {
  try {
    const jwt = await SecureStore.getItemAsync('jwt');
    
    const response = await axios.get(
      `${API_BASE}/user/`,
      {
        headers: {
          ...headers,
          'Authorization': `Bearer ${jwt}`
        }
      }
    );
    
    return { success: true, user: response.data };
    
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid - clear and redirect to login
      await SecureStore.deleteItemAsync('jwt');
      return { success: false, error: 'Session expired', requiresLogin: true };
    }
    return { success: false, error: 'Failed to fetch user' };
  }
}
```

### Password Reset Flow

```javascript
// Request password reset
async function requestPasswordReset(email) {
  try {
    const response = await axios.post(
      `${API_BASE}/password-reset-request/`,
      { email },
      { headers }
    );
    
    return { success: true, message: response.data.message };
    
  } catch (error) {
    if (error.response?.status === 429) {
      return { success: false, error: 'Too many requests. Please try again later.' };
    }
    return { success: false, error: error.response?.data?.message || 'Failed to send OTP' };
  }
}

// Reset password with OTP
async function resetPassword(email, otp, newPassword, confirmPassword) {
  try {
    const response = await axios.post(
      `${API_BASE}/password-reset/`,
      {
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword
      },
      { headers }
    );
    
    return { success: true, message: response.data.message };
    
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Failed to reset password' };
  }
}
```

### Profile Management

```javascript
// Update profile
async function updateProfile(updates) {
  try {
    const jwt = await SecureStore.getItemAsync('jwt');
    
    const response = await axios.patch(
      `${API_BASE}/user/`,
      updates,
      {
        headers: {
          ...headers,
          'Authorization': `Bearer ${jwt}`
        }
      }
    );
    
    return { success: true, user: response.data };
    
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to update profile' };
  }
}

// Upload profile image
async function uploadProfileImage(imageUri) {
  try {
    const jwt = await SecureStore.getItemAsync('jwt');
    
    const formData = new FormData();
    formData.append('profile_image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg'
    });
    
    const response = await axios.patch(
      `${API_BASE}/user/`,
      formData,
      {
        headers: {
          'x-auth-app': FRONTEND_SECRET,
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return { success: true, user: response.data };
    
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to upload image' };
  }
}

// Delete account
async function deleteAccount(reason, comments) {
  try {
    const jwt = await SecureStore.getItemAsync('jwt');
    
    await axios.delete(
      `${API_BASE}/user/`,
      {
        headers: {
          ...headers,
          'Authorization': `Bearer ${jwt}`
        },
        data: { reason, comments }
      }
    );
    
    // Clear stored token
    await SecureStore.deleteItemAsync('jwt');
    
    return { success: true };
    
  } catch (error) {
    return { success: false, error: error.response?.data?.error || 'Failed to delete account' };
  }
}
```

### Axios Interceptor for Token Refresh

```javascript
// Setup axios interceptor for handling expired tokens
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const detail = error.response?.data?.detail;
      
      if (detail === 'Token expired!' || detail === 'Unauthenticated!') {
        // Clear token and redirect to login
        await SecureStore.deleteItemAsync('jwt');
        
        // Navigate to login screen
        navigationRef.navigate('Login');
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## Security Considerations

1. **Never store JWT in localStorage** (for web) - Use httpOnly cookies or secure storage
2. **Store JWT securely on mobile** - Use `expo-secure-store` or similar
3. **Never expose `x-auth-app`** - Store in environment variables
4. **Implement token refresh** - Monitor for 401/403 responses
5. **Clear tokens on logout** - Even if server request fails
6. **Password requirements** - Enforce strong passwords on frontend
7. **OTP expiration** - Show countdown timer (5 minutes)

---

## Audit Events

| Action | Description |
|--------|-------------|
| `login` | Successful login |
| `logout` | User logout |
| `password_reset` | Password successfully reset |
| `account_deleted` | Account deleted (with preserved info) |

---

**Need Help?** Contact the backend team or check the [Troubleshooting Guide](../../../admin-dashboard/docs/TROUBLESHOOTING.md).
