# Push Notification System - Complete Documentation

## Overview

This is the complete documentation for the Admin Push Notification Service. This system enables administrators to send visible push notifications to mobile app users through the Expo Push Service, with support for deep linking, user preferences, and rich media.

## Documentation Index

### 1. [Admin User Guide](./PUSH_NOTIFICATION_ADMIN_GUIDE.md)
**For**: Administrators who send push notifications

**Contents**:
- How to access the push notification interface
- Composing notifications (title, message, category)
- Using deep links to direct users to specific content
- Adding images to notifications
- Understanding recipient counts
- Best practices and troubleshooting

**Start here if**: You need to send push notifications from the Django admin interface.

---

### 2. [Deep Linking Documentation](./PUSH_NOTIFICATION_DEEP_LINKING.md)
**For**: Mobile developers implementing notification handling

**Contents**:
- Deep link data structure and format
- Supported deep link types (order_detail, screen, url)
- Frontend implementation guide (React Native)
- Navigation setup requirements
- Testing deep links
- Error handling and troubleshooting

**Start here if**: You're implementing notification tap handling in the mobile app.

---

### 3. [API Documentation](./PUSH_NOTIFICATION_API_DOCUMENTATION.md)
**For**: Mobile developers integrating token management and preferences

**Contents**:
- Token registration endpoint
- Token unregistration endpoint
- Notification preferences endpoints (GET/PUT)
- Request/response formats
- Authentication requirements
- Integration examples and code samples

**Start here if**: You're implementing push notification registration or user preference management.

---

### 4. [Image Requirements](./PUSH_NOTIFICATION_IMAGE_REQUIREMENTS.md)
**For**: Administrators and designers creating notification images

**Contents**:
- Image format and size requirements
- Storage options (CDN, cloud storage, self-hosted)
- Image optimization techniques
- Platform-specific behavior (iOS, Android)
- Best practices and troubleshooting

**Start here if**: You're creating or hosting images for push notifications.

---

## Quick Start Guide

### For Administrators

1. **Get Permission**: Request `can_send_push_notifications` permission from a superuser
2. **Access Interface**: Navigate to Django Admin → Notifications → Send Push Notification
3. **Compose Notification**:
   - Enter title (max 50 characters)
   - Enter message (max 200 characters)
   - Select category (order_updates, promotions, announcements, general)
   - Optionally add deep link and image
4. **Send**: Click "Send Notification" button
5. **Verify**: Check recipient count and confirmation message

**See**: [Admin User Guide](./PUSH_NOTIFICATION_ADMIN_GUIDE.md) for detailed instructions.

---

### For Mobile Developers

#### 1. Setup Push Notifications

```typescript
import * as Notifications from 'expo-notifications';
import { AuthService } from './api/apiService';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permissions and register token
const setupPushNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await AuthService.registerPushToken(token, Device.deviceName);
};
```

#### 2. Handle Notification Taps

```typescript
import { handleNotificationResponse } from './utils/notifications';

useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    response => handleNotificationResponse(response, navigation)
  );
  return () => subscription.remove();
}, []);
```

#### 3. Implement Notification Settings

```typescript
const NotificationSettingsScreen = () => {
  const [preferences, setPreferences] = useState({});
  
  useEffect(() => {
    loadPreferences();
  }, []);
  
  const loadPreferences = async () => {
    const response = await AuthService.getPushNotificationPreferences();
    setPreferences(response.preferences);
  };
  
  const updatePreference = async (key, value) => {
    await AuthService.updatePushNotificationPreferences({ [key]: value });
  };
  
  // Render switches for each preference
};
```

**See**: 
- [Deep Linking Documentation](./PUSH_NOTIFICATION_DEEP_LINKING.md) for notification handling
- [API Documentation](./PUSH_NOTIFICATION_API_DOCUMENTATION.md) for API integration

---

## System Architecture

```
┌─────────────────────┐
│  Django Admin UI    │  ← Administrators compose notifications
└──────────┬──────────┘
           │
           ├─ Validate & Queue
           │
┌──────────┴──────────┐
│   Celery Worker     │  ← Async processing
└──────────┬──────────┘
           │
           ├─ Filter by Preferences
           ├─ Get Active Tokens
           │
┌──────────┴──────────┐
│  Expo Push Service  │  ← External API
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌────────┐   ┌────────┐
│  iOS   │   │Android │  ← User devices
└────────┘   └────────┘
```

## Key Features

### 1. Admin Dashboard
- Custom Django admin interface for composing notifications
- Permission-based access control
- Real-time recipient count
- Support for deep links and images

### 2. User Preferences
- Category-based notification preferences
- Master toggle for all notifications
- Per-category opt-in/opt-out
- API endpoints for mobile app integration

### 3. Deep Linking
- Navigate to specific screens or content
- Support for order details, app screens, and external URLs
- Automatic navigation on notification tap

### 4. Rich Media
- Optional image support
- Multiple format support (PNG, JPEG)
- CDN and cloud storage integration
- Automatic validation and fallback

### 5. Reliability
- Asynchronous processing via Celery
- Automatic retry on failures
- Token validation and cleanup
- Comprehensive error logging

## Notification Categories

| Category | Purpose | Default Enabled | Use Cases |
|----------|---------|-----------------|-----------|
| **Order Updates** | Order status, delivery | Yes | Order confirmations, shipping updates, delivery notifications |
| **Promotions** | Marketing, sales | Yes | Discount offers, flash sales, special promotions |
| **Announcements** | System updates | Yes | New features, app updates, important notices |
| **General** | Miscellaneous | Yes | Reminders, tips, general information |

Users can disable any category in their app settings.

## Technical Requirements

### Backend Requirements

- Django 3.2+
- Python 3.8+
- Celery 5.0+
- Redis (for Celery broker)
- Expo Push Service account
- Environment variables configured

### Frontend Requirements

- React Native
- Expo SDK 48+
- expo-notifications package
- Navigation library (React Navigation)
- API service for backend communication

### Infrastructure Requirements

- HTTPS-enabled server
- Celery workers running
- Redis server accessible
- Image hosting (CDN or cloud storage)
- Expo access token configured

## Environment Configuration

### Required Environment Variables

```bash
# Push Notification Configuration
PUSH_NOTIFICATION_ENABLED=true
EXPO_ACCESS_TOKEN=your-expo-access-token-here
PUSH_NOTIFICATION_BATCH_SIZE=100
PUSH_NOTIFICATION_MAX_RETRIES=3

# Notification Channels (include 'push')
NOTIFICATION_CHANNELS=email,whatsapp,dashboard,push
```

### Obtaining Expo Access Token

1. Create account at https://expo.dev
2. Navigate to Access Tokens in account settings
3. Create new token with push notification permissions
4. Add token to environment variables

## Database Models

### User Model Extensions

```python
# New fields on User model
push_notification_enabled = BooleanField(default=True)
notify_order_updates = BooleanField(default=True)
notify_promotions = BooleanField(default=True)
notify_announcements = BooleanField(default=True)
notify_general = BooleanField(default=True)
```

### PushToken Model

```python
# New model for storing device tokens
class PushToken(models.Model):
    user = ForeignKey(User)
    token = CharField(max_length=255, unique=True)
    device_name = CharField(max_length=100)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
    last_used_at = DateTimeField(null=True)
```

## API Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/user/register-push-token/` | POST | Register device token | Yes |
| `/api/user/unregister-push-token/` | POST | Remove device token | Yes |
| `/api/user/notification-preferences/` | GET | Get user preferences | Yes |
| `/api/user/notification-preferences/` | PUT | Update preferences | Yes |

**See**: [API Documentation](./PUSH_NOTIFICATION_API_DOCUMENTATION.md) for detailed endpoint information.

## Permissions

### Django Permission

**Permission Name**: `can_send_push_notifications`

**Granting Permission**:
1. Django Admin → Users
2. Select user
3. User permissions → Add "Can send push notifications"
4. Save

**Note**: Only users with this permission can access the push notification interface.

## Monitoring and Logging

### What Gets Logged

- Notification send attempts
- Delivery success/failure
- Token validation failures
- API errors and retries
- Admin actions (who sent what)

### Log Locations

- **Django logs**: `logs/django.log`
- **Celery logs**: `logs/celery.log`
- **Notification records**: Supabase `order_notifications` table

### Monitoring Metrics

- Total notifications sent
- Delivery success rate
- Invalid token rate
- Average delivery time
- Category-wise distribution

## Troubleshooting

### Common Issues

#### 1. Notifications Not Received

**Check**:
- User has registered push token
- User has enabled notification category
- Device is online and app is installed
- Expo access token is valid

**See**: [Admin User Guide - Troubleshooting](./PUSH_NOTIFICATION_ADMIN_GUIDE.md#troubleshooting)

#### 2. Deep Links Not Working

**Check**:
- Deep link data format is correct
- Target screen exists in navigation stack
- Navigation is properly initialized
- App is handling notification responses

**See**: [Deep Linking Documentation - Troubleshooting](./PUSH_NOTIFICATION_DEEP_LINKING.md#troubleshooting)

#### 3. Images Not Displaying

**Check**:
- Image URL is HTTPS
- Image format is PNG or JPEG
- File size is under 1 MB
- URL is publicly accessible

**See**: [Image Requirements - Troubleshooting](./PUSH_NOTIFICATION_IMAGE_REQUIREMENTS.md#troubleshooting)

## Testing

### Testing Checklist

- [ ] Admin can access push notification interface
- [ ] Notifications are received on test devices
- [ ] Deep links navigate correctly
- [ ] Images display properly
- [ ] User preferences are respected
- [ ] Token registration works
- [ ] Token unregistration works
- [ ] Invalid tokens are handled gracefully
- [ ] Retry logic works on failures
- [ ] Logging captures all events

### Test Scenarios

1. **Send simple notification** (text only, no deep link)
2. **Send notification with deep link** (order detail, screen, URL)
3. **Send notification with image**
4. **Test user preferences** (disable category, verify not received)
5. **Test token management** (register, unregister, re-register)
6. **Test error handling** (invalid token, network failure)

## Best Practices

### For Administrators

1. **Be concise**: Keep titles under 50 characters, messages under 200
2. **Be relevant**: Only send notifications that provide value
3. **Respect preferences**: Don't misuse categories
4. **Test first**: Send to test device before broadcasting
5. **Time appropriately**: Avoid late night/early morning
6. **Use images wisely**: Only when they add value

### For Developers

1. **Register early**: Register token on app launch after authentication
2. **Handle errors**: Gracefully handle token registration failures
3. **Validate navigation**: Ensure all deep link targets exist
4. **Test thoroughly**: Test on both iOS and Android
5. **Log appropriately**: Log errors but not sensitive data
6. **Update preferences**: Sync preferences with backend

### For Designers

1. **Optimize images**: Keep under 300 KB
2. **Use correct dimensions**: 1024x512 pixels (2:1 ratio)
3. **Test on devices**: Verify appearance on iOS and Android
4. **Use HTTPS**: Always use secure URLs
5. **Maintain branding**: Consistent visual style
6. **Consider accessibility**: Don't rely solely on images

## Security Considerations

1. **HTTPS only**: All image URLs must use HTTPS
2. **Public images**: Don't include sensitive information in images
3. **Validate input**: Backend validates all notification data
4. **Permission control**: Only authorized admins can send notifications
5. **Token security**: Tokens are stored securely and validated
6. **Audit trail**: All actions are logged with timestamps

## Performance

### Expected Performance

- **Queue time**: <1 second
- **Processing time**: 1-2 seconds
- **Expo API response**: 1-2 seconds
- **Total delivery time**: 3-5 seconds
- **Batch size**: 100 tokens per batch

### Optimization Tips

1. Use CDN for images
2. Compress images before uploading
3. Monitor Celery worker performance
4. Scale workers for high volume
5. Use Redis for fast task queuing

## Support and Maintenance

### Regular Maintenance

- Monitor invalid token rate
- Review delivery success rate
- Clean up inactive tokens
- Update Expo SDK as needed
- Review and optimize images

### Getting Help

1. **Check documentation**: Review relevant guide
2. **Check logs**: Look for error messages
3. **Test in isolation**: Isolate the issue
4. **Contact team**: Provide specific error details

### Reporting Issues

When reporting issues, include:
- Error message (if any)
- Timestamp
- User/device information
- Steps to reproduce
- Expected vs actual behavior

## Changelog

### Version 1.0.0 (Current)

**Features**:
- Admin interface for sending push notifications
- User preference management
- Deep linking support
- Image support
- Token management
- Celery async processing
- Comprehensive logging

**Requirements Implemented**:
- All 12 requirements from requirements.md
- Permission-based access control
- Category-based filtering
- Retry logic and error handling
- Integration with existing infrastructure

## Additional Resources

### External Documentation

- **Expo Push Notifications**: https://docs.expo.dev/push-notifications/overview/
- **React Navigation**: https://reactnavigation.org/
- **Django Admin**: https://docs.djangoproject.com/en/stable/ref/contrib/admin/
- **Celery**: https://docs.celeryproject.org/

### Related Documentation

- `server/notifications/services/push.py` - Push service implementation
- `server/notifications/admin.py` - Admin interface
- `server/user/views.py` - API endpoints
- `client/src/utils/notifications.ts` - Frontend notification handling

## License

[Your License Here]

## Contributors

[Your Team/Contributors Here]

---

**Last Updated**: [Current Date]

**Version**: 1.0.0

**Maintained By**: [Your Team Name]
