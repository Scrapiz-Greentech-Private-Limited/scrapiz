import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_PERMISSION_SHOWN = '@notification_permission_shown';

/**
 * Check if the notification permission screen has been shown to the user
 * @returns true if already shown, false if needs to be shown
 */
export const hasShownNotificationPermission = async (): Promise<boolean> => {
  try {
    const shown = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_SHOWN);
    return shown === 'true';
  } catch (error) {
    console.error('Error checking notification permission status:', error);
    return false;
  }
};

/**
 * Mark that the notification permission screen has been shown
 */
export const markNotificationPermissionShown = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_SHOWN, 'true');
  } catch (error) {
    console.error('Error marking notification permission as shown:', error);
  }
};

/**
 * Reset the notification permission flag (for testing)
 */
export const resetNotificationPermissionFlag = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(NOTIFICATION_PERMISSION_SHOWN);
  } catch (error) {
    console.error('Error resetting notification permission flag:', error);
  }
};
