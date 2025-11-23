import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

/**
 * Configure notification handler for how notifications are displayed
 * when the app is in the foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Deep link data structure from backend
 */
export interface DeepLinkData {
  type: 'order_detail' | 'screen' | 'url';
  value: string;
  orderId?: string;
  orderNumber?: string;
  category?: string;
}

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
        // Navigate to order detail screen with order ID
        if (data.orderId) {
          router.push({
            pathname: '/order-detail',
            params: { 
              orderId: data.orderId,
              orderNumber: data.orderNumber 
            }
          });
        } else {
          console.warn('order_detail type but no orderId provided');
          router.push('/(tabs)/home');
        }
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
