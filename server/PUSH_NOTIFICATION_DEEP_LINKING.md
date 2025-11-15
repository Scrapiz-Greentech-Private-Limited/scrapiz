# Push Notification Deep Linking Documentation

## Overview

Deep linking allows push notifications to navigate users directly to specific content or screens within the mobile app when they tap the notification. This document describes the deep linking structure and implementation for mobile developers.

## Deep Link Data Structure

### Backend Payload Format

When a push notification is sent from the Django admin, the deep link data is included in the `data` field of the Expo Push API request:

```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title": "Your Order is Confirmed!",
  "body": "Order #ABC123 has been confirmed and is being processed.",
  "data": {
    "type": "order_detail",
    "value": "123",
    "orderId": "123",
    "orderNumber": "ABC123",
    "category": "order_updates"
  },
  "sound": "default",
  "badge": 1,
  "priority": "high",
  "channelId": "default"
}
```

### Data Field Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | The type of deep link (see types below) |
| `value` | string | Yes | The destination value (screen name, URL, ID) |
| `orderId` | string | No | Specific order ID (for order-related notifications) |
| `orderNumber` | string | No | Human-readable order number for display |
| `category` | string | Yes | Notification category (order_updates, promotions, etc.) |

## Deep Link Types

### 1. Order Detail (`order_detail`)

Navigate to a specific order detail page.

**Backend Configuration**:
```python
deep_link_data = {
    "type": "order_detail",
    "value": "123",           # Order ID
    "orderId": "123",
    "orderNumber": "ABC123",
    "category": "order_updates"
}
```

**Frontend Handling**:
```typescript
case 'order_detail':
  if (data.orderId) {
    navigation.navigate('OrderDetail', { 
      orderId: data.orderId,
      orderNumber: data.orderNumber 
    });
  }
  break;
```

**Use Cases**:
- Order confirmation notifications
- Delivery status updates
- Order issue alerts

### 2. App Screen (`screen`)

Navigate to a specific screen within the app.

**Backend Configuration**:
```python
deep_link_data = {
    "type": "screen",
    "value": "Profile",       # Screen name
    "category": "general"
}
```

**Frontend Handling**:
```typescript
case 'screen':
  if (data.value) {
    navigation.navigate(data.value);
  }
  break;
```

**Valid Screen Names**:
- `Home`
- `Profile`
- `Orders`
- `Cart`
- `Rewards`
- `Settings`
- `NotificationSettings`
- `Support`

**Use Cases**:
- Feature announcements (navigate to new feature screen)
- Profile completion reminders
- Settings updates

### 3. External URL (`url`)

Open an external URL in the device browser.

**Backend Configuration**:
```python
deep_link_data = {
    "type": "url",
    "value": "https://example.com/promo",
    "category": "promotions"
}
```

**Frontend Handling**:
```typescript
case 'url':
  if (data.value) {
    Linking.openURL(data.value);
  }
  break;
```

**Use Cases**:
- Promotional campaigns with landing pages
- Blog post announcements
- External content links

### 4. No Deep Link (None)

No navigation action; notification only.

**Backend Configuration**:
```python
deep_link_data = None  # or omit the field
```

**Frontend Handling**:
```typescript
default:
  // Navigate to notifications screen or home
  navigation.navigate('Notifications');
  break;
```

**Use Cases**:
- General announcements
- Informational messages
- Reminders without specific action

## Frontend Implementation

### 1. Notification Handler Setup

Configure the notification handler in your root App component:

```typescript
// App.tsx or similar root component
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { handleNotificationResponse } from './utils/notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const navigation = useNavigation();
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
      }
    );

    // Listen for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        handleNotificationResponse(response, navigation);
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [navigation]);

  return (
    // Your app components
  );
}
```

### 2. Notification Response Handler

Create a utility function to handle notification responses:

```typescript
// utils/notifications.ts
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

export const handleNotificationResponse = (
  response: Notifications.NotificationResponse,
  navigation: any
) => {
  const data = response.notification.request.content.data;
  
  // Log for debugging
  console.log('Notification tapped:', data);
  
  // No data or no type - navigate to default screen
  if (!data || !data.type) {
    navigation.navigate('Notifications');
    return;
  }
  
  // Handle based on type
  switch (data.type) {
    case 'order_detail':
      if (data.orderId) {
        navigation.navigate('OrderDetail', { 
          orderId: data.orderId,
          orderNumber: data.orderNumber 
        });
      } else {
        navigation.navigate('Orders');
      }
      break;
    
    case 'screen':
      if (data.value) {
        try {
          navigation.navigate(data.value);
        } catch (error) {
          console.error('Invalid screen name:', data.value);
          navigation.navigate('Home');
        }
      }
      break;
    
    case 'url':
      if (data.value) {
        Linking.canOpenURL(data.value)
          .then(supported => {
            if (supported) {
              Linking.openURL(data.value);
            } else {
              console.error('Cannot open URL:', data.value);
            }
          })
          .catch(err => console.error('Error opening URL:', err));
      }
      break;
    
    default:
      console.warn('Unknown notification type:', data.type);
      navigation.navigate('Notifications');
  }
};
```

### 3. Handling App Launch from Notification

Handle the case where the app is launched by tapping a notification:

```typescript
// In your root component or navigation setup
useEffect(() => {
  // Check if app was opened from a notification
  Notifications.getLastNotificationResponseAsync()
    .then(response => {
      if (response) {
        handleNotificationResponse(response, navigation);
      }
    });
}, []);
```

## Navigation Setup Requirements

### React Navigation Configuration

Ensure your navigation stack includes all screens referenced in deep links:

```typescript
// navigation/AppNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Rewards" component={RewardsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
    </Stack.Navigator>
  );
}
```

### TypeScript Type Definitions

Define types for your navigation parameters:

```typescript
// types/navigation.ts
export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Orders: undefined;
  OrderDetail: { orderId: string; orderNumber?: string };
  Cart: undefined;
  Rewards: undefined;
  Settings: undefined;
  NotificationSettings: undefined;
  Notifications: undefined;
  Support: undefined;
};
```

## Testing Deep Links

### Manual Testing

1. **Send test notification** from Django admin with deep link
2. **Receive notification** on test device
3. **Tap notification** and verify navigation
4. **Test all scenarios**:
   - App in foreground
   - App in background
   - App completely closed

### Automated Testing

```typescript
// __tests__/notifications.test.ts
import { handleNotificationResponse } from '../utils/notifications';

describe('Notification Deep Linking', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should navigate to order detail', () => {
    const response = {
      notification: {
        request: {
          content: {
            data: {
              type: 'order_detail',
              orderId: '123',
              orderNumber: 'ABC123',
            },
          },
        },
      },
    };

    handleNotificationResponse(response as any, mockNavigation);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('OrderDetail', {
      orderId: '123',
      orderNumber: 'ABC123',
    });
  });

  it('should navigate to app screen', () => {
    const response = {
      notification: {
        request: {
          content: {
            data: {
              type: 'screen',
              value: 'Profile',
            },
          },
        },
      },
    };

    handleNotificationResponse(response as any, mockNavigation);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Profile');
  });

  it('should open external URL', () => {
    const response = {
      notification: {
        request: {
          content: {
            data: {
              type: 'url',
              value: 'https://example.com',
            },
          },
        },
      },
    };

    handleNotificationResponse(response as any, mockNavigation);

    // Verify Linking.openURL was called
    // (requires mocking Linking module)
  });
});
```

## Error Handling

### Invalid Screen Names

```typescript
case 'screen':
  if (data.value) {
    try {
      navigation.navigate(data.value);
    } catch (error) {
      console.error('Invalid screen name:', data.value);
      // Fallback to home screen
      navigation.navigate('Home');
    }
  }
  break;
```

### Invalid URLs

```typescript
case 'url':
  if (data.value) {
    Linking.canOpenURL(data.value)
      .then(supported => {
        if (supported) {
          Linking.openURL(data.value);
        } else {
          console.error('Cannot open URL:', data.value);
          Alert.alert('Error', 'Cannot open this link');
        }
      })
      .catch(err => {
        console.error('Error opening URL:', err);
        Alert.alert('Error', 'Failed to open link');
      });
  }
  break;
```

### Missing Data

```typescript
export const handleNotificationResponse = (
  response: Notifications.NotificationResponse,
  navigation: any
) => {
  const data = response.notification.request.content.data;
  
  if (!data || !data.type) {
    // Default behavior - navigate to notifications list
    navigation.navigate('Notifications');
    return;
  }
  
  // ... rest of handling
};
```

## Best Practices

### 1. Always Validate Data

```typescript
if (data && data.type && data.value) {
  // Process deep link
} else {
  // Fallback behavior
}
```

### 2. Log for Debugging

```typescript
console.log('Notification data:', JSON.stringify(data, null, 2));
```

### 3. Provide Fallbacks

Always have a default navigation target if deep link fails.

### 4. Test Edge Cases

- Missing data fields
- Invalid screen names
- Malformed URLs
- App state variations (foreground, background, closed)

### 5. Handle Authentication

```typescript
case 'order_detail':
  // Check if user is authenticated
  if (!isAuthenticated) {
    navigation.navigate('Login', {
      returnTo: 'OrderDetail',
      returnParams: { orderId: data.orderId }
    });
  } else {
    navigation.navigate('OrderDetail', { orderId: data.orderId });
  }
  break;
```

## Adding New Deep Link Types

To add a new deep link type:

1. **Backend**: Update admin form to include new type option
2. **Backend**: Update deep link data construction in `PushNotificationService`
3. **Frontend**: Add new case in `handleNotificationResponse`
4. **Frontend**: Ensure target screen exists in navigation stack
5. **Documentation**: Update this document with new type details
6. **Testing**: Add test cases for new type

### Example: Adding "Product Detail" Type

**Backend** (`server/notifications/admin.py`):
```python
'link_types': [
    ('', 'None'),
    ('screen', 'App Screen'),
    ('order_detail', 'Order Detail'),
    ('product_detail', 'Product Detail'),  # New type
    ('url', 'External URL'),
],
```

**Frontend** (`utils/notifications.ts`):
```typescript
case 'product_detail':
  if (data.value) {
    navigation.navigate('ProductDetail', { 
      productId: data.value 
    });
  }
  break;
```

## Troubleshooting

### Deep Link Not Working

1. **Check notification data**: Log the data object to verify structure
2. **Verify screen name**: Ensure screen exists in navigation stack
3. **Check navigation state**: Verify navigation is properly initialized
4. **Test app state**: Try with app in different states (foreground, background, closed)

### Navigation Error

```
Error: The action 'NAVIGATE' with payload {"name":"InvalidScreen"} was not handled by any navigator.
```

**Solution**: Add the screen to your navigation stack or use a valid screen name.

### URL Not Opening

```
Error: Cannot open URL: invalid-url
```

**Solution**: Validate URL format on backend before sending notification.

## Support

For questions or issues with deep linking:
1. Check console logs for error messages
2. Verify notification data structure
3. Test with different app states
4. Contact the development team with specific error details
