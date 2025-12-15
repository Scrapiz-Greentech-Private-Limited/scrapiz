import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SELL_SERVICEABILITY_CHECKED: '@scrapiz_sell_serviceability_checked',
  SELL_SERVICE_AVAILABLE: '@scrapiz_sell_service_available',
};

/**
 * Check if user has already been shown the serviceability check for sell screen
 */
export const hasSellServiceabilityBeenChecked = async (): Promise<boolean> => {
  try {
    const checked = await AsyncStorage.getItem(STORAGE_KEYS.SELL_SERVICEABILITY_CHECKED);
    return checked === 'true';
  } catch (error) {
    console.error('Error checking sell serviceability status:', error);
    return false;
  }
};

/**
 * Get the stored sell service availability status
 */
export const getSellServiceAvailability = async (): Promise<boolean> => {
  try {
    const available = await AsyncStorage.getItem(STORAGE_KEYS.SELL_SERVICE_AVAILABLE);
    return available === 'true';
  } catch (error) {
    console.error('Error getting sell service availability:', error);
    return false;
  }
};

/**
 * Mark that serviceability has been checked and store the result
 */
export const setSellServiceability = async (isAvailable: boolean): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.SELL_SERVICEABILITY_CHECKED, 'true'),
      AsyncStorage.setItem(STORAGE_KEYS.SELL_SERVICE_AVAILABLE, isAvailable.toString()),
    ]);
    console.log('✅ Sell serviceability stored:', isAvailable);
  } catch (error) {
    console.error('Error storing sell serviceability:', error);
  }
};

/**
 * Reset sell serviceability check (useful when location changes)
 */
export const resetSellServiceability = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.SELL_SERVICEABILITY_CHECKED),
      AsyncStorage.removeItem(STORAGE_KEYS.SELL_SERVICE_AVAILABLE),
    ]);
    console.log('✅ Sell serviceability reset');
  } catch (error) {
    console.error('Error resetting sell serviceability:', error);
  }
};
