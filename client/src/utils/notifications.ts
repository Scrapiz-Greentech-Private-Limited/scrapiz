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
 * @param navigation - React Navigation instance
 */
export const handleNotificationResponse = (
  response: Notifications.NotificationResponse,
  navigation: any
): void => {
  try {
    const data = response.notification.request.content.data as DeepLinkData;
    
    if (!data || !data.type) {
      // No deep link data, navigate to default screen
      console.log('No deep link data in notification');
      return;
    }
    
    console.log('Handling notification tap with data:', data);
    
    switch (data.type) {
      case 'order_detail':
        // Navigate to order detail screen with order ID
        if (data.orderId) {
          navigation.navigate('OrderDetail', { 
            orderId: data.orderId,
            orderNumber: data.orderNumber 
          });
        } else {
          console.warn('order_detail type but no orderId provided');
        }
        break;
      
      case 'screen':
        // Navigate to a specific screen in the app
        if (data.value) {
          navigation.navigate(data.value);
        } else {
          console.warn('screen type but no value provided');
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
    }
  } catch (error) {
    console.error('Error handling notification response:', error);
  }
};

/**
 * Set up notification response listener
 * Call this in your root App component
 * 
 * @param navigation - React Navigation instance
 * @returns Subscription object to clean up on unmount
 */
export const setupNotificationListener = (navigation: any) => {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotificationResponse(response, navigation);
  });
};
