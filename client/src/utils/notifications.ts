import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';
import { displayNotification, NotificationData } from '../services/notifeeService';

/**
 * Configure notification handler for how notifications are displayed
 * when the app is in the foreground.
 * 
 * On Android, we use Notifee to display notifications with rich features
 * (large icon, big picture, etc.) instead of the default Expo display.
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // On Android, use Notifee for rich notification display
    if (Platform.OS === 'android') {
      const { title, body, data } = notification.request.content;
      
      try {
        // Display using Notifee for rich features (large icon, etc.)
        await displayNotification(
          title || 'Scrapiz',
          body || '',
          data as NotificationData,
          (data as NotificationData)?.image,
          (data as NotificationData)?.largeIcon
        );
        
        // Don't show Expo's default notification since Notifee handled it
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldShowBanner: false,
          shouldShowList: false,
          shouldSetBadge: true,
        };
      } catch (error) {
        console.error('Notifee display failed, falling back to Expo:', error);
      }
    }
    
    // iOS or fallback: use default Expo notification display
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldSetBadge: true,
    };
  },
});

/**
 * Deep link data structure from backend
 */
export interface DeepLinkData {
  type: 'order_detail' | 'order_quote' | 'order_update' | 'screen' | 'url';
  value: string;
  orderId?: string;
  orderNumber?: string;
  category?: string;
}

const navigateToOrder = (router: any, orderId?: string, orderNumber?: string) => {
  if (!orderId) {
    router.push('/(tabs)/home');
    return;
  }

  router.push({
    pathname: '/profile/orders/[id]',
    params: {
      id: orderId,
      orderNumber,
    },
  });
};

/**
 * Handle notification response when user taps on a notification
 * 
 * @param response - The notification response from Expo
 * @param router - Expo Router instance
 */
export const handleNotificationResponse = (
  response: Notifications.NotificationResponse,
  router: any
): void => {
  try {
    const data = response.notification.request.content.data as DeepLinkData;
    
    if (!data || !data.type) {
      // No deep link data, navigate to home
      console.log('No deep link data in notification, navigating to home');
      router.push('/(tabs)/home');
      return;
    }
    
    console.log('Handling notification tap with data:', data);
    
    switch (data.type) {
      case 'order_detail':
        navigateToOrder(router, data.orderId, data.orderNumber);
        break;

      case 'order_quote':
        if (!data.orderId) {
          console.warn('order_quote type but no orderId provided');
          router.push('/(tabs)/home');
          break;
        }

        router.push({
          pathname: '/tracking/[orderId]/quote',
          params: { orderId: data.orderId },
        });
        break;

      case 'order_update':
        navigateToOrder(router, data.orderId, data.orderNumber);
        break;
      
      case 'screen':
        // Navigate to a specific screen in the app
        if (data.value) {
          // Map screen names to Expo Router paths
          const screenMap: Record<string, string> = {
            'home': '/(tabs)/home',
            'Home': '/(tabs)/home',
            'orders': '/(tabs)/orders',
            'Orders': '/(tabs)/orders',
            'services': '/(tabs)/services',
            'Services': '/(tabs)/services',
            'profile': '/(tabs)/profile',
            'Profile': '/(tabs)/profile',
          };
          
          const route = screenMap[data.value] || `/(tabs)/${data.value.toLowerCase()}`;
          console.log(`Navigating to screen: ${route}`);
          router.push(route);
        } else {
          console.warn('screen type but no value provided');
          router.push('/(tabs)/home');
        }
        break;
      
      case 'url':
        // Open external URL
        if (data.value) {
          Linking.openURL(data.value).catch((err) => {
            console.error('Failed to open URL:', err);
          });
        } else {
          console.warn('url type but no value provided');
        }
        break;
      
      default:
        console.warn('Unknown deep link type:', data.type);
        router.push('/(tabs)/home');
    }
  } catch (error) {
    console.error('Error handling notification response:', error);
    // Fallback to home on error
    router.push('/(tabs)/home');
  }
};

/**
 * Set up notification response listener
 * Call this in your root App component
 * 
 * @param router - Expo Router instance
 * @returns Subscription object to clean up on unmount
 */
export const setupNotificationListener = (router: any) => {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotificationResponse(response, router);
  });
};
