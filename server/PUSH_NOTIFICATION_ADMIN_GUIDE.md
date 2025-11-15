# Push Notification Admin User Guide

## Overview

This guide explains how to send push notifications to mobile app users from the Django admin interface. Push notifications are visible alerts that appear on users' devices with sound and visual indicators.

## Prerequisites

- Admin account with `can_send_push_notifications` permission
- Access to Django admin interface
- Understanding of notification categories and user preferences

## Accessing the Push Notification Interface

1. Log in to the Django admin interface
2. Navigate to **Notifications** section in the sidebar
3. Click on **Send Push Notification**

If you don't see this option, contact a superuser to grant you the `can_send_push_notifications` permission.

## Composing a Push Notification

### Required Fields

#### 1. Title (Required)
- **Maximum length**: 50 characters
- **Purpose**: The bold headline shown in the notification
- **Example**: "Your Order is Confirmed!"
- **Best practices**:
  - Keep it short and action-oriented
  - Use title case
  - Avoid special characters that may not render properly

#### 2. Message (Required)
- **Maximum length**: 200 characters
- **Purpose**: The main body text of the notification
- **Example**: "Order #ABC123 has been confirmed and is being processed."
- **Best practices**:
  - Be clear and concise
  - Include relevant details (order numbers, dates, etc.)
  - Use a friendly, conversational tone
  - Avoid technical jargon

#### 3. Category (Required)
- **Purpose**: Determines which users receive the notification based on their preferences
- **Options**:
  - **Order Updates**: Notifications about order status, delivery, etc.
  - **Promotions**: Marketing messages, discounts, special offers
  - **Announcements**: Important system updates, new features
  - **General**: Miscellaneous notifications

**Important**: Users can opt out of specific categories in their app settings. Only users who have enabled the selected category will receive the notification.

### Optional Fields

#### 4. Deep Link Type
- **Purpose**: Directs users to specific content when they tap the notification
- **Options**:
  - **None**: No navigation (notification only)
  - **App Screen**: Navigate to a specific screen in the app
  - **Order Detail**: Navigate to a specific order page
  - **External URL**: Open a web page in the browser

#### 5. Deep Link Value
- **Purpose**: The destination for the deep link
- **Examples**:
  - Screen: `Profile`, `Orders`, `Cart`
  - Order Detail: `123` (order ID)
  - URL: `https://example.com/promo`

#### 6. Image URL (Optional)
- **Purpose**: Display a rich image in the notification
- **Format**: Direct URL to an image file
- **Supported formats**: PNG, JPG, JPEG
- **Requirements**:
  - Image must be publicly accessible (no authentication required)
  - Recommended dimensions: 1024x512 pixels (2:1 aspect ratio)
  - Maximum file size: 1 MB
  - HTTPS URLs recommended for security
- **Example**: `https://cdn.example.com/images/promo-banner.png`

**Note**: If the image URL is invalid or inaccessible, the notification will be sent without the image.

## Sending the Notification

### Step-by-Step Process

1. **Fill in all required fields** (Title, Message, Category)
2. **Review the recipient count** displayed at the top of the form
   - This shows how many users will receive the notification
   - Count is based on active push tokens and user preferences
3. **Add optional fields** if needed (deep link, image)
4. **Click "Send Notification"** button
5. **Confirmation**: You'll see a success message indicating the notification has been queued

### What Happens Next

1. **Immediate**: Notification is queued in the Celery task system
2. **Within 1-2 seconds**: Celery worker processes the notification
3. **Within 2-3 seconds**: Notification is sent to Expo Push Service
4. **Within 3-5 seconds**: Users receive the notification on their devices

## Understanding Recipient Count

The recipient count shows how many users will receive your notification. This number is calculated based on:

1. **Active Push Tokens**: Users who have registered their device for notifications
2. **User Preferences**: Users who have enabled the selected category
3. **Global Setting**: Users who have push notifications enabled overall

### Zero Recipients Warning

If the recipient count is zero, it means:
- No users have registered push tokens, OR
- All users have disabled the selected notification category, OR
- All users have disabled push notifications entirely

**Action**: Consider choosing a different category or verifying that users have registered their devices.

## Deep Linking Examples

### Example 1: Order Confirmation
```
Title: Your Order is Confirmed!
Message: Order #ABC123 has been confirmed and is being processed.
Category: Order Updates
Deep Link Type: Order Detail
Deep Link Value: 123
```
**Result**: When tapped, opens the order detail page for order ID 123.

### Example 2: Promotional Campaign
```
Title: 50% Off Sale Today!
Message: Get 50% off all items. Limited time offer!
Category: Promotions
Deep Link Type: External URL
Deep Link Value: https://example.com/sale
```
**Result**: When tapped, opens the sale page in the device browser.

### Example 3: Feature Announcement
```
Title: New Feature Available!
Message: Check out our new loyalty rewards program.
Category: Announcements
Deep Link Type: App Screen
Deep Link Value: Rewards
```
**Result**: When tapped, navigates to the Rewards screen in the app.

### Example 4: Simple Notification
```
Title: Welcome Back!
Message: We've missed you. Check out what's new.
Category: General
Deep Link Type: None
Deep Link Value: (empty)
```
**Result**: When tapped, opens the app to the home screen.

## Image Guidelines

### When to Use Images

- **Promotional campaigns**: Show product images or sale banners
- **Event announcements**: Display event posters or graphics
- **Feature highlights**: Illustrate new features with screenshots

### When NOT to Use Images

- **Urgent notifications**: Images may delay rendering
- **Simple updates**: Text-only is faster and clearer
- **Sensitive information**: Avoid displaying private data in images

### Image Best Practices

1. **Dimensions**: Use 1024x512 pixels (2:1 ratio) for best results
2. **File size**: Keep under 1 MB for fast loading
3. **Format**: PNG for graphics with transparency, JPG for photos
4. **Content**: Ensure images are relevant and professional
5. **Accessibility**: Don't rely solely on images to convey critical information
6. **Testing**: Test on both iOS and Android devices before sending to all users

### Image Storage Options

- **CDN**: Use a content delivery network for fast, reliable access
- **Cloud storage**: AWS S3, Google Cloud Storage, Azure Blob Storage
- **Your server**: Ensure high availability and fast response times
- **Third-party**: Imgur, Cloudinary (ensure terms of service allow commercial use)

**Important**: Never use temporary or expiring URLs. Images should remain accessible indefinitely.

## Troubleshooting

### Notification Not Received

**Possible causes**:
1. User has disabled the notification category in app settings
2. User has disabled push notifications entirely
3. User's device token is invalid or expired
4. User's device is offline
5. App is not installed or has been uninstalled

**Solution**: Check the notification delivery logs in the admin interface.

### Image Not Displaying

**Possible causes**:
1. Image URL is not publicly accessible
2. Image format is not supported
3. Image file is too large
4. URL requires authentication
5. Device doesn't support rich notifications (older devices)

**Solution**: Verify the image URL in a browser. The notification will still be sent without the image.

### Low Recipient Count

**Possible causes**:
1. Few users have registered for push notifications
2. Many users have opted out of the selected category
3. Users haven't launched the app recently (tokens not registered)

**Solution**: Consider using a different category or encouraging users to enable notifications.

## Best Practices

### Timing
- **Avoid late night/early morning**: Respect user sleep schedules
- **Consider time zones**: If your user base is global, schedule carefully
- **Frequency**: Don't send too many notifications (max 2-3 per day)

### Content
- **Be concise**: Users scan notifications quickly
- **Be relevant**: Only send notifications that provide value
- **Be clear**: Avoid ambiguity or confusion
- **Be actionable**: Include a clear call-to-action

### Categories
- **Use appropriately**: Don't misuse categories to bypass user preferences
- **Be consistent**: Always use the same category for similar notifications
- **Respect preferences**: Users opted out for a reason

### Testing
- **Test first**: Send to a test device before broadcasting to all users
- **Verify deep links**: Ensure navigation works correctly
- **Check images**: Verify images display properly on different devices
- **Review content**: Check for typos and formatting issues

## Permissions and Security

### Who Can Send Notifications

Only admin users with the `can_send_push_notifications` permission can access the push notification interface.

### Granting Permission

Superusers can grant this permission:
1. Go to Django admin → Users
2. Select the user
3. Scroll to "User permissions"
4. Add "Can send push notifications"
5. Save

### Audit Trail

All push notifications are logged with:
- Admin user who sent the notification
- Timestamp
- Notification content
- Recipient count
- Delivery status

## Support

If you encounter issues or have questions:
1. Check the notification delivery logs
2. Review this guide for troubleshooting tips
3. Contact the development team with specific error messages
4. Include the notification ID and timestamp for faster resolution

## Appendix: Notification Categories

| Category | Purpose | User Expectation | Frequency |
|----------|---------|------------------|-----------|
| Order Updates | Order status, delivery, confirmations | High priority, time-sensitive | As needed |
| Promotions | Sales, discounts, marketing | Optional, can be frequent | 1-2 per week |
| Announcements | System updates, new features | Important but not urgent | 1-2 per month |
| General | Miscellaneous, reminders | Low priority | Occasional |
