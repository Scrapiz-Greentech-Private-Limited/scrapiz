import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RatingService, PendingOrder } from '../api/apiService';

/**
 * Storage key for the rating toast cooldown timestamp
 */
const RATING_TOAST_COOLDOWN_KEY = '@scrapiz_rating_toast_cooldown';

/**
 * Cooldown period in milliseconds (72 hours)
 * Requirements: 3.3, 3.5
 */
const COOLDOWN_PERIOD_MS = 72 * 60 * 60 * 1000; // 72 hours

/**
 * State interface for the order rating toast hook
 */
interface OrderRatingToastState {
  /** Whether the toast should be visible */
  showToast: boolean;
  /** The pending order to rate (if any) */
  pendingOrder: PendingOrder | null;
  /** Whether we're currently checking for pending ratings */
  loading: boolean;
  /** Any error that occurred during the check */
  error: string | null;
}

/**
 * Return type for the useOrderRatingToast hook
 */
interface UseOrderRatingToastReturn {
  /** Current state of the rating toast */
  state: OrderRatingToastState;
  /** Check for pending ratings and show toast if eligible */
  checkPendingRatings: () => Promise<void>;
  /** Handle "Rate Now" button press */
  handleRateNow: () => PendingOrder | null;
  /** Handle "Later" button press - stores cooldown */
  handleLater: () => Promise<void>;
  /** Dismiss the toast without storing cooldown */
  dismissToast: () => void;
}

/**
 * useOrderRatingToast Hook
 * 
 * Manages the order rating toast state, including:
 * - Checking for pending ratings on mount
 * - Managing the 72-hour cooldown period
 * - Storing/retrieving cooldown timestamp from AsyncStorage
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 * - 3.1: Display toast when user has unrated completed order and cooldown expired
 * - 3.3: Don't show toast for 72 hours after "Later" tap
 * - 3.5: Store last toast dismissal timestamp locally
 */
export function useOrderRatingToast(): UseOrderRatingToastReturn {
  const [state, setState] = useState<OrderRatingToastState>({
    showToast: false,
    pendingOrder: null,
    loading: false,
    error: null,
  });

  /**
   * Check if the cooldown period has expired
   * Requirements: 3.3
   */
  const isCooldownExpired = useCallback(async (): Promise<boolean> => {
    try {
      const cooldownTimestamp = await AsyncStorage.getItem(RATING_TOAST_COOLDOWN_KEY);
      
      if (!cooldownTimestamp) {
        // No cooldown set, so it's "expired"
        return true;
      }

      const cooldownTime = parseInt(cooldownTimestamp, 10);
      const now = Date.now();
      const elapsed = now - cooldownTime;

      return elapsed >= COOLDOWN_PERIOD_MS;
    } catch (error) {
      console.error('Error checking cooldown:', error);
      // If we can't check, assume cooldown is expired to avoid blocking the feature
      return true;
    }
  }, []);

  /**
   * Store the cooldown timestamp
   * Requirements: 3.5
   */
  const storeCooldown = useCallback(async (): Promise<void> => {
    try {
      const now = Date.now().toString();
      await AsyncStorage.setItem(RATING_TOAST_COOLDOWN_KEY, now);
    } catch (error) {
      console.error('Error storing cooldown:', error);
    }
  }, []);

  /**
   * Check for pending ratings and show toast if eligible
   * Requirements: 3.1
   */
  const checkPendingRatings = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // First check if cooldown has expired
      const cooldownExpired = await isCooldownExpired();
      
      if (!cooldownExpired) {
        // Cooldown still active, don't show toast
        setState(prev => ({
          ...prev,
          loading: false,
          showToast: false,
          pendingOrder: null,
        }));
        return;
      }

      // Fetch pending ratings from API
      const pendingOrders = await RatingService.getPendingRatings();

      if (pendingOrders && pendingOrders.length > 0) {
        // Show toast for the first pending order
        setState({
          showToast: true,
          pendingOrder: pendingOrders[0],
          loading: false,
          error: null,
        });
      } else {
        // No pending orders
        setState({
          showToast: false,
          pendingOrder: null,
          loading: false,
          error: null,
        });
      }
    } catch (error: any) {
      console.error('Error checking pending ratings:', error);
      setState({
        showToast: false,
        pendingOrder: null,
        loading: false,
        error: error.message || 'Failed to check pending ratings',
      });
    }
  }, [isCooldownExpired]);

  /**
   * Handle "Rate Now" button press
   * Returns the pending order so the caller can navigate to it
   * Requirements: 3.4
   */
  const handleRateNow = useCallback((): PendingOrder | null => {
    const order = state.pendingOrder;
    
    // Hide the toast
    setState(prev => ({
      ...prev,
      showToast: false,
    }));

    return order;
  }, [state.pendingOrder]);

  /**
   * Handle "Later" button press
   * Stores the cooldown timestamp and hides the toast
   * Requirements: 3.3, 3.5
   */
  const handleLater = useCallback(async (): Promise<void> => {
    // Store cooldown timestamp
    await storeCooldown();

    // Hide the toast
    setState(prev => ({
      ...prev,
      showToast: false,
    }));
  }, [storeCooldown]);

  /**
   * Dismiss the toast without storing cooldown
   * Used when user taps the X button
   */
  const dismissToast = useCallback((): void => {
    setState(prev => ({
      ...prev,
      showToast: false,
    }));
  }, []);

  return {
    state,
    checkPendingRatings,
    handleRateNow,
    handleLater,
    dismissToast,
  };
}

export default useOrderRatingToast;
