import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AuthService } from '../api/apiService';
import { 
  initializeNotificationChannels, 
  setupNotifeeEventHandler,
  registerBackgroundHandler 
} from '../services/notifeeService';

// Register background handler at module level (required by Notifee)
if (Platform.OS === 'android') {
  registerBackgroundHandler();
}

const STORAGE_KEYS = {
  EXPO_PUSH_TOKEN: '@scrapiz_expo_push_token',
};

/**
 * Hook for managing push notifications
 * Handles permission requests, token registration, notification listeners,
 * and Notifee integration for rich notifications
 */
export const useNotifications = (router?: any) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const notifeeUnsubscribe = useRef<(() => void) | null>(null);

  /**
   * Initialize Notifee channels and event handlers
   */
  useEffect(() => {
    const initNotifee = async () => {
      if (Platform.OS === 'android') {
        await initializeNotificationChannels();
        
        // Set up Notifee foreground event handler if router is provided
        if (router) {
          notifeeUnsubscribe.current = setupNotifeeEventHandler(router);
        }
      }
      setIsInitialized(true);
    };

    initNotifee();

    return () => {
      if (notifeeUnsubscribe.current) {
        notifeeUnsubscribe.current();
      }
    };
  }, [router]);

  useEffect(() => {
    const hydrateStoredToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.EXPO_PUSH_TOKEN);
        if (storedToken) {
          setExpoPushToken(storedToken);
        }
      } catch (storageError) {
        console.error('Failed to hydrate stored Expo push token:', storageError);
      }
    };

    hydrateStoredToken();
  }, []);

  const persistToken = useCallback(async (token: string | null) => {
    try {
      if (token) {
        await AsyncStorage.setItem(STORAGE_KEYS.EXPO_PUSH_TOKEN, token);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.EXPO_PUSH_TOKEN);
      }
    } catch (storageError) {
      console.error('Failed to persist Expo push token:', storageError);
    }
  }, []);

  const getExistingToken = useCallback(async (): Promise<string | null> => {
    if (expoPushToken) {
      return expoPushToken;
    }

    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.EXPO_PUSH_TOKEN);
      if (storedToken) {
        setExpoPushToken(storedToken);
        return storedToken;
      }
    } catch (storageError) {
      console.error('Failed to read stored Expo push token:', storageError);
    }

    return null;
  }, [expoPushToken]);

  /**
   * Register for push notifications
   * Requests permissions and registers the Expo push token with the backend
   * 
   * @returns The Expo push token if successful, null otherwise
   */
  const registerForPushNotifications = useCallback(async (
    options: { skipPermissionPrompt?: boolean; forceTokenRefresh?: boolean } = {}
  ): Promise<string | null> => {
    const { skipPermissionPrompt = false, forceTokenRefresh = false } = options;
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
      if (existingStatus !== 'granted' && !skipPermissionPrompt) {
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

      let token = forceTokenRefresh ? null : await getExistingToken();
      if (!token) {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;
      }
      
      console.log('Expo Push Token:', token);
      setExpoPushToken(token);
      await persistToken(token);

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
  }, [getExistingToken, persistToken]);

  /**
   * Unregister push notification token
   * Removes the token from the backend
   * 
   * @param token - The Expo push token to unregister (optional, uses stored token if not provided)
   */
  const unregisterPushToken = useCallback(async (token?: string): Promise<boolean> => {
    try {
      const tokenToUnregister = token || expoPushToken || await getExistingToken();
      
      if (!tokenToUnregister) {
        console.log('No push token to unregister');
        return false;
      }

      await AuthService.unregisterPushToken(tokenToUnregister);
      console.log('Push token unregistered:', tokenToUnregister);
      setExpoPushToken(null);
      await persistToken(null);
      return true;
    } catch (err: any) {
      console.error('Failed to unregister push token:', err);
      setError(err.message || 'Failed to unregister token');
      return false;
    }
  }, [expoPushToken, getExistingToken, persistToken]);

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
    isInitialized,
    registerForPushNotifications,
    unregisterPushToken,
  };
};
