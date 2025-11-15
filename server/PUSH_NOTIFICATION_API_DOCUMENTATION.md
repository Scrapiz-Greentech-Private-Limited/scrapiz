# Push Notification API Documentation

## Overview

This document describes the REST API endpoints for push notification token management and user notification preferences. These endpoints are used by the mobile app to register devices and manage notification settings.

## Base URL

```
https://your-api-domain.com/api
```

## Authentication

All endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Register Push Token

Register an Expo Push Token for the authenticated user's device.

**Endpoint**: `POST /user/register-push-token/`

**Authentication**: Required

**Request Body**:

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_name": "iPhone 13 Pro"
}
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | Expo Push Token in format `ExponentPushToken[...]` |
| `device_name` | string | No | Human-readable device identifier (e.g., "iPhone 13", "Samsung Galaxy") |

**Success Response** (201 Created or 200 OK):

```json
{
  "success": true,
  "message": "Token registered successfully",
  "created": true
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation was successful |
| `message` | string | Human-readable success message |
| `created` | boolean | `true` if new token was created, `false` if existing token was updated |

**Error Responses**:

**400 Bad Request** - Missing or invalid token:
```json
{
  "error": "Token is required"
}
```

**400 Bad Request** - Invalid token format:
```json
{
  "error": "Invalid token format"
}
```

**401 Unauthorized** - Missing or invalid authentication:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Example Request** (cURL):

```bash
curl -X POST https://your-api-domain.com/api/user/register-push-token/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "device_name": "iPhone 13 Pro"
  }'
```

**Example Request** (JavaScript/Fetch):

```javascript
const response = await fetch('https://your-api-domain.com/api/user/register-push-token/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    device_name: 'iPhone 13 Pro',
  }),
});

const data = await response.json();
console.log(data);
```

**Example Request** (React Native):

```typescript
import { AuthService } from './api/apiService';

const registerToken = async (expoPushToken: string) => {
  try {
    const response = await AuthService.registerPushToken(
      expoPushToken,
      Device.deviceName || 'Unknown Device'
    );
    console.log('Token registered:', response);
  } catch (error) {
    console.error('Failed to register token:', error);
  }
};
```

**Notes**:
- Users can register multiple tokens for different devices
- If the same token is registered again, it will be updated (not duplicated)
- Tokens are automatically marked as active upon registration
- Invalid tokens will be rejected before being stored

---

### 2. Unregister Push Token

Remove an Expo Push Token for the authenticated user's device.

**Endpoint**: `POST /user/unregister-push-token/`

**Authentication**: Required

**Request Body**:

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `token` | string | Yes | Expo Push Token to unregister |

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "Token unregistered successfully",
  "deleted": true
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation was successful |
| `message` | string | Human-readable success message |
| `deleted` | boolean | `true` if token was found and deleted, `false` if token didn't exist |

**Error Responses**:

**400 Bad Request** - Missing token:
```json
{
  "error": "Token is required"
}
```

**401 Unauthorized** - Missing or invalid authentication:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Example Request** (cURL):

```bash
curl -X POST https://your-api-domain.com/api/user/unregister-push-token/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  }'
```

**Example Request** (React Native):

```typescript
import { AuthService } from './api/apiService';

const unregisterToken = async (expoPushToken: string) => {
  try {
    const response = await AuthService.unregisterPushToken(expoPushToken);
    console.log('Token unregistered:', response);
  } catch (error) {
    console.error('Failed to unregister token:', error);
  }
};
```

**When to Call**:
- User logs out
- User disables push notifications in app settings
- App is uninstalled (if possible to detect)

---

### 3. Get Notification Preferences

Retrieve the authenticated user's notification preferences.

**Endpoint**: `GET /user/notification-preferences/`

**Authentication**: Required

**Request Body**: None

**Success Response** (200 OK):

```json
{
  "success": true,
  "preferences": {
    "push_notification_enabled": true,
    "order_updates": true,
    "promotions": false,
    "announcements": true,
    "general": true
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation was successful |
| `preferences` | object | User's notification preferences |
| `preferences.push_notification_enabled` | boolean | Master toggle for all push notifications |
| `preferences.order_updates` | boolean | Receive order status and delivery notifications |
| `preferences.promotions` | boolean | Receive promotional and marketing notifications |
| `preferences.announcements` | boolean | Receive system announcements and feature updates |
| `preferences.general` | boolean | Receive general notifications |

**Error Responses**:

**401 Unauthorized** - Missing or invalid authentication:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Example Request** (cURL):

```bash
curl -X GET https://your-api-domain.com/api/user/notification-preferences/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Request** (React Native):

```typescript
import { AuthService } from './api/apiService';

const loadPreferences = async () => {
  try {
    const response = await AuthService.getPushNotificationPreferences();
    console.log('Preferences:', response.preferences);
    return response.preferences;
  } catch (error) {
    console.error('Failed to load preferences:', error);
  }
};
```

---

### 4. Update Notification Preferences

Update the authenticated user's notification preferences.

**Endpoint**: `PUT /user/notification-preferences/`

**Authentication**: Required

**Request Body**:

```json
{
  "push_notification_enabled": true,
  "order_updates": true,
  "promotions": false,
  "announcements": true,
  "general": true
}
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `push_notification_enabled` | boolean | No | Master toggle for all push notifications |
| `order_updates` | boolean | No | Receive order-related notifications |
| `promotions` | boolean | No | Receive promotional notifications |
| `announcements` | boolean | No | Receive announcement notifications |
| `general` | boolean | No | Receive general notifications |

**Notes**:
- All parameters are optional
- Only include parameters you want to update
- Omitted parameters will retain their current values

**Success Response** (200 OK):

```json
{
  "success": true,
  "message": "Preferences updated successfully"
}
```

**Error Responses**:

**401 Unauthorized** - Missing or invalid authentication:
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Example Request** (cURL):

```bash
curl -X PUT https://your-api-domain.com/api/user/notification-preferences/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "promotions": false,
    "announcements": true
  }'
```

**Example Request** (React Native):

```typescript
import { AuthService } from './api/apiService';

const updatePreferences = async (preferences: any) => {
  try {
    const response = await AuthService.updatePushNotificationPreferences(preferences);
    console.log('Preferences updated:', response);
  } catch (error) {
    console.error('Failed to update preferences:', error);
  }
};

// Example: Disable promotions
await updatePreferences({ promotions: false });
```

---

## Integration Guide

### Initial Setup (App Launch)

When the app launches and the user is authenticated:

1. **Request notification permissions**
2. **Get Expo Push Token**
3. **Register token with backend**

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { AuthService } from './api/apiService';

const setupPushNotifications = async () => {
  // Only on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return;
  }

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return;
  }

  // Get Expo Push Token
  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Register with backend
  try {
    await AuthService.registerPushToken(token, Device.deviceName);
    console.log('Push notifications enabled');
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
};
```

### Logout Flow

When the user logs out:

1. **Unregister push token**
2. **Clear local authentication**

```typescript
const logout = async () => {
  try {
    // Get current token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    
    // Unregister from backend
    await AuthService.unregisterPushToken(token);
    
    // Clear local auth
    await AsyncStorage.removeItem('authToken');
    
    // Navigate to login
    navigation.navigate('Login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
```

### Notification Settings Screen

Display and update user preferences:

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Switch } from 'react-native';
import { AuthService } from '../api/apiService';

export const NotificationSettingsScreen = () => {
  const [preferences, setPreferences] = useState({
    push_notification_enabled: true,
    order_updates: true,
    promotions: true,
    announcements: true,
    general: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await AuthService.getPushNotificationPreferences();
      setPreferences(response.preferences);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const updatePreference = async (key: string, value: boolean) => {
    try {
      const updated = { ...preferences, [key]: value };
      setPreferences(updated);
      await AuthService.updatePushNotificationPreferences({ [key]: value });
    } catch (error) {
      console.error('Failed to update preference:', error);
      // Revert on error
      loadPreferences();
    }
  };

  return (
    <View>
      <Text>Notification Settings</Text>
      
      <View>
        <Text>Enable Push Notifications</Text>
        <Switch
          value={preferences.push_notification_enabled}
          onValueChange={(value) => updatePreference('push_notification_enabled', value)}
        />
      </View>

      <View>
        <Text>Order Updates</Text>
        <Switch
          value={preferences.order_updates}
          onValueChange={(value) => updatePreference('order_updates', value)}
        />
      </View>

      <View>
        <Text>Promotions</Text>
        <Switch
          value={preferences.promotions}
          onValueChange={(value) => updatePreference('promotions', value)}
        />
      </View>

      <View>
        <Text>Announcements</Text>
        <Switch
          value={preferences.announcements}
          onValueChange={(value) => updatePreference('announcements', value)}
        />
      </View>

      <View>
        <Text>General</Text>
        <Switch
          value={preferences.general}
          onValueChange={(value) => updatePreference('general', value)}
        />
      </View>
    </View>
  );
};
```

## API Service Implementation

### TypeScript API Service

```typescript
// api/apiService.ts
import axios from 'axios';

const API_BASE_URL = 'https://your-api-domain.com/api';

export class AuthService {
  static async registerPushToken(token: string, deviceName?: string) {
    const response = await axios.post(
      `${API_BASE_URL}/user/register-push-token/`,
      {
        token,
        device_name: deviceName,
      },
      {
        headers: {
          Authorization: `Bearer ${await this.getAuthToken()}`,
        },
      }
    );
    return response.data;
  }

  static async unregisterPushToken(token: string) {
    const response = await axios.post(
      `${API_BASE_URL}/user/unregister-push-token/`,
      { token },
      {
        headers: {
          Authorization: `Bearer ${await this.getAuthToken()}`,
        },
      }
    );
    return response.data;
  }

  static async getPushNotificationPreferences() {
    const response = await axios.get(
      `${API_BASE_URL}/user/notification-preferences/`,
      {
        headers: {
          Authorization: `Bearer ${await this.getAuthToken()}`,
        },
      }
    );
    return response.data;
  }

  static async updatePushNotificationPreferences(preferences: any) {
    const response = await axios.put(
      `${API_BASE_URL}/user/notification-preferences/`,
      preferences,
      {
        headers: {
          Authorization: `Bearer ${await this.getAuthToken()}`,
        },
      }
    );
    return response.data;
  }

  private static async getAuthToken(): Promise<string> {
    // Implement your token retrieval logic
    // e.g., from AsyncStorage, Redux, Context, etc.
    return 'your-jwt-token';
  }
}
```

## Error Handling

### Common Error Scenarios

1. **Network Errors**
```typescript
try {
  await AuthService.registerPushToken(token);
} catch (error) {
  if (error.message === 'Network Error') {
    Alert.alert('Connection Error', 'Please check your internet connection');
  }
}
```

2. **Authentication Errors**
```typescript
try {
  await AuthService.getPushNotificationPreferences();
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired - redirect to login
    navigation.navigate('Login');
  }
}
```

3. **Validation Errors**
```typescript
try {
  await AuthService.registerPushToken(invalidToken);
} catch (error) {
  if (error.response?.status === 400) {
    console.error('Invalid token format:', error.response.data.error);
  }
}
```

## Rate Limiting

Currently, there are no rate limits on these endpoints. However, best practices:

- Register token only once per app launch
- Update preferences only when user changes settings
- Don't poll the preferences endpoint repeatedly

## Testing

### Testing with Postman

1. **Get JWT Token**: Authenticate and obtain JWT token
2. **Set Authorization Header**: Add `Bearer <token>` to Authorization header
3. **Test Each Endpoint**: Send requests with valid/invalid data
4. **Verify Responses**: Check status codes and response bodies

### Testing in Development

```typescript
// Test token registration
const testTokenRegistration = async () => {
  const testToken = 'ExponentPushToken[test-token-12345]';
  
  try {
    const response = await AuthService.registerPushToken(testToken, 'Test Device');
    console.log('Registration successful:', response);
  } catch (error) {
    console.error('Registration failed:', error);
  }
};

// Test preference updates
const testPreferenceUpdate = async () => {
  try {
    await AuthService.updatePushNotificationPreferences({
      promotions: false,
    });
    
    const prefs = await AuthService.getPushNotificationPreferences();
    console.log('Updated preferences:', prefs);
  } catch (error) {
    console.error('Preference update failed:', error);
  }
};
```

## Security Considerations

1. **Always use HTTPS** in production
2. **Validate JWT tokens** on every request
3. **Don't expose tokens** in logs or error messages
4. **Implement rate limiting** if abuse is detected
5. **Sanitize input** to prevent injection attacks

## Support

For API issues or questions:
- Check response status codes and error messages
- Verify authentication token is valid
- Ensure request format matches documentation
- Contact backend team with specific error details

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Token registration and unregistration
- Notification preference management
- Support for multiple devices per user
