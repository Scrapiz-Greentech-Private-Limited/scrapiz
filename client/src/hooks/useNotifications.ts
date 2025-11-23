import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { AuthService } from '../api/apiService';

/**
 * Hook for managing push notifications
 * Handles permission requests, token registration, and notification listeners
 */
export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  /**
   * Register for push notifications
   * Requests permissions and registers the Expo push token with the backend
   * 
   * @returns The Expo push token if successful, null otherwise
   */
  const registerForPushNotifications = async (): Promise<string | null> => {
    setIsRegistering(true);
    setError(null);

    try {
      // Check if running on a physical device
      if (!Device.isDevice) {
        const errorMsg = 'Push notifications only work on physical devices';
        console.log(errorMsg);
        setError(errorMsg);
        setIsRegistering(false);
        return null;
      }

      // Get existing permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Check if permission was granted
      if (finalStatus !== 'granted') {
        const errorMsg = 'Permission to receive push notifications was denied';
        console.log(errorMsg);
        setError(errorMsg);
        setIsRegistering(false);
        return null;
      }

      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      
      console.log('Expo Push Token:', token);
      setExpoPushToken(token);

      // Register token with backend
      try {
        const deviceName = Device.deviceName || `${Platform.OS} Device`;
        await AuthService.registerPushToken(token, deviceName);
        console.log('Push token registered with backend:', token);
      } catch (backendError: any) {
        console.error('Failed to register push token with backend:', backendError);
        setError(backendError.message || 'Failed to register token with server');
        // Don't return null here - we still have the token locally
      }

      setIsRegistering(false);
      return token;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to get push notification token';
      console.error('Error registering for push notifications:', err);
      setError(errorMsg);
      setIsRegistering(false);
      return null;
    }
  };

  /**
   * Unregister push notification token
   * Removes the token from the backend
   * 
   * @param token - The Expo push token to unregister (optional, uses stored token if not provided)
   */
  const unregisterPushToken = async (token?: string): Promise<boolean> => {
    try {
      const tokenToUnregister = token || expoPushToken;
      
      if (!tokenToUnregister) {
        console.log('No push token to unregister');
        return false;
      }

      await AuthService.unregisterPushToken(tokenToUnregister);
      console.log('Push token unregistered:', tokenToUnregister);
      setExpoPushToken(null);
      return true;
    } catch (err: any) {
      console.error('Failed to unregister push token:', err);
      setError(err.message || 'Failed to unregister token');
      return false;
    }
  };

  /**
   * Set up notification listeners
   * This is called automatically when the hook is used
   */
  useEffect(() => {
    // Listener for notifications received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      setNotification(notification);
    });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    isRegistering,
    error,
    registerForPushNotifications,
    unregisterPushToken,
  };
};
