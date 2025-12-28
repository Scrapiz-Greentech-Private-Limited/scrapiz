

import notifee, {
  AndroidImportance,
  AndroidStyle,
  AndroidCategory,
  EventType,
  Event,
} from '@notifee/react-native';
import { Platform, Linking } from 'react-native';

// Default app icon URL - replace with your hosted icon
const DEFAULT_LARGE_ICON = 'https://api.scrapiz.in/static/images/scrapiz-icon.png';

// Notification channel IDs
export const NOTIFICATION_CHANNELS = {
  DEFAULT: 'scrapiz_default',
  ORDER_UPDATES: 'scrapiz_orders',
  PROMOTIONS: 'scrapiz_promotions',
  ANNOUNCEMENTS: 'scrapiz_announcements',
} as const;

/**
 * Deep link data structure matching backend
 */
export interface NotificationData {
  type?: 'order_detail' | 'screen' | 'url';
  value?: string;
  orderId?: string;
  orderNumber?: string;
  category?: string;
  image?: string;
  largeIcon?: string;
}

/**
 * Initialize Notifee notification channels
 * Call this on app startup
 */
export async function initializeNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    // Create default channel
    await notifee.createChannel({
      id: NOTIFICATION_CHANNELS.DEFAULT,
      name: 'General Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    // Create order updates channel
    await notifee.createChannel({
      id: NOTIFICATION_CHANNELS.ORDER_UPDATES,
      name: 'Order Updates',
      description: 'Notifications about your order status',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    // Create promotions channel
    await notifee.createChannel({
      id: NOTIFICATION_CHANNELS.PROMOTIONS,
      name: 'Promotions & Offers',
      description: 'Special offers and discounts',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
    });

    // Create announcements channel
    await notifee.createChannel({
      id: NOTIFICATION_CHANNELS.ANNOUNCEMENTS,
      name: 'Announcements',
      description: 'App updates and announcements',
      importance: AndroidImportance.DEFAULT,
    });

    console.log('Notifee channels initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Notifee channels:', error);
  }
}

/**
 * Get the appropriate channel ID based on notification category
 */
function getChannelId(category?: string): string {
  switch (category) {
    case 'order_updates':
      return NOTIFICATION_CHANNELS.ORDER_UPDATES;
    case 'promotions':
      return NOTIFICATION_CHANNELS.PROMOTIONS;
    case 'announcements':
      return NOTIFICATION_CHANNELS.ANNOUNCEMENTS;
    default:
      return NOTIFICATION_CHANNELS.DEFAULT;
  }
}

export async function displayNotification(
  title: string,
  body: string,
  data?: NotificationData,
  imageUrl?: string,
  largeIconUrl?: string
): Promise<string | undefined> {
  try {
    const channelId = getChannelId(data?.category);
    const effectiveLargeIcon = largeIconUrl || data?.largeIcon || DEFAULT_LARGE_ICON;
    const effectiveImage = imageUrl || data?.image;

    // Build Android-specific options
    const androidOptions: any = {
      channelId,
      // Small icon for status bar
      // Uses the notification_icon created by Expo from app.json config
      smallIcon: 'notification_icon',
      // Large icon appears on the right side (like Lenskart example)
      largeIcon: effectiveLargeIcon,
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
      },
      // Show timestamp
      showTimestamp: true,
      // Category for notification behavior
      category: AndroidCategory.MESSAGE,
      // Color accent for the notification
      color: '#16a34a', // Scrapiz green
    };

    // Add big picture style if image is provided
    if (effectiveImage) {
      androidOptions.style = {
        type: AndroidStyle.BIGPICTURE,
        picture: effectiveImage,
        largeIcon: effectiveLargeIcon, // Keep large icon in expanded view
      };
    } else {
      // Use big text style for long messages
      androidOptions.style = {
        type: AndroidStyle.BIGTEXT,
        text: body,
      };
    }

    const notificationId = await notifee.displayNotification({
      title,
      body,
      data: data as Record<string, string>,
      android: androidOptions,
      ios: {
        sound: 'default',
        // iOS doesn't support largeIcon the same way, but we can use attachments
      },
    });

    console.log('Notifee notification displayed:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Failed to display Notifee notification:', error);
    return undefined;
  }
}

/**
 * Cancel a specific notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await notifee.cancelNotification(notificationId);
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
}

/**
 * Cancel all notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await notifee.cancelAllNotifications();
  } catch (error) {
    console.error('Failed to cancel all notifications:', error);
  }
}

/**
 * Get the count of displayed notifications
 */
export async function getDisplayedNotificationCount(): Promise<number> {
  try {
    const notifications = await notifee.getDisplayedNotifications();
    return notifications.length;
  } catch (error) {
    console.error('Failed to get notification count:', error);
    return 0;
  }
}

/**
 * Set up Notifee foreground event handler
 * This handles notification interactions when app is in foreground
 * 
 * @param router - Expo Router instance for navigation
 */
export function setupNotifeeEventHandler(router: any): () => void {
  const unsubscribe = notifee.onForegroundEvent(({ type, detail }: Event) => {
    const { notification, pressAction } = detail;

    switch (type) {
      case EventType.DISMISSED:
        console.log('Notification dismissed:', notification?.id);
        break;

      case EventType.PRESS:
        console.log('Notification pressed:', notification?.id);
        handleNotificationPress(notification?.data as NotificationData, router);
        break;

      case EventType.ACTION_PRESS:
        console.log('Action pressed:', pressAction?.id);
        break;
    }
  });

  return unsubscribe;
}

/**
 * Set up Notifee background event handler
 * This must be called at the app entry point (outside of React components)
 */
export function registerBackgroundHandler(): void {
  notifee.onBackgroundEvent(async ({ type, detail }: Event) => {
    const { notification, pressAction } = detail;

    if (type === EventType.PRESS) {
      console.log('Background notification pressed:', notification?.id);
      // Background navigation will be handled when app opens
    }

    if (type === EventType.ACTION_PRESS) {
      console.log('Background action pressed:', pressAction?.id);
    }
  });
}

/**
 * Handle notification press and navigate accordingly
 */
function handleNotificationPress(data: NotificationData | undefined, router: any): void {
  if (!data || !data.type) {
    console.log('No deep link data, navigating to home');
    router.push('/(tabs)/home');
    return;
  }

  console.log('Handling notification press with data:', data);

  switch (data.type) {
    case 'order_detail':
      if (data.orderId) {
        router.push({
          pathname: '/order-detail',
          params: {
            orderId: data.orderId,
            orderNumber: data.orderNumber,
          },
        });
      } else {
        router.push('/(tabs)/home');
      }
      break;

    case 'screen':
      if (data.value) {
        const screenMap: Record<string, string> = {
          home: '/(tabs)/home',
          Home: '/(tabs)/home',
          orders: '/(tabs)/orders',
          Orders: '/(tabs)/orders',
          services: '/(tabs)/services',
          Services: '/(tabs)/services',
          profile: '/(tabs)/profile',
          Profile: '/(tabs)/profile',
        };
        const route = screenMap[data.value] || `/(tabs)/${data.value.toLowerCase()}`;
        router.push(route);
      } else {
        router.push('/(tabs)/home');
      }
      break;

    case 'url':
      if (data.value) {
        Linking.openURL(data.value).catch((err) => {
          console.error('Failed to open URL:', err);
        });
      }
      break;

    default:
      router.push('/(tabs)/home');
  }
}

export default {
  initializeNotificationChannels,
  displayNotification,
  cancelNotification,
  cancelAllNotifications,
  getDisplayedNotificationCount,
  setupNotifeeEventHandler,
  registerBackgroundHandler,
};
