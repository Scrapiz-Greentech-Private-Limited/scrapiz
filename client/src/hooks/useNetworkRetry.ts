import { useState, useRef, useCallback, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface UseNetworkRetryOptions {
  /** Initial countdown seconds before auto-retry (default: 5) */
  countdownSeconds?: number;
  /** Maximum number of auto-retries before showing permanent failure (default: 3) */
  maxRetries?: number;
  /** Callback function to execute the actual data fetch */
  fetchFn: () => Promise<void>;
  /** Optional callback when network status changes */
  onNetworkChange?: (isConnected: boolean) => void;
}

interface UseNetworkRetryReturn {
  /** Whether the retry overlay should be visible */
  showRetryOverlay: boolean;
  /** Current countdown value */
  countdown: number;
  /** Whether currently retrying */
  isRetrying: boolean;
  /** Whether all retries have been exhausted */
  hasFailedPermanently: boolean;
  /** Error message to display */
  errorMessage: string | null;
  /** Trigger an immediate retry */
  retryNow: () => void;
  /** Start the retry flow (call this when a network error occurs) */
  startRetryFlow: (error?: string) => void;
  /** Reset the retry state (call this on successful fetch) */
  resetRetryState: () => void;
  /** Check network and start loading */
  checkNetworkAndLoad: () => Promise<boolean>;
  /** Whether device is offline */
  isOffline: boolean;
}

/**
 * useNetworkRetry - A hook for managing network retry logic with countdown
 * 
 * Features:
 * - Automatic countdown (5, 4, 3, 2, 1) before retry
 * - Configurable max retries before permanent failure
 * - Network connectivity detection
 * - Manual retry option
 * - Clean state management
 * 
 * Usage:
 * ```tsx
 * const {
 *   showRetryOverlay,
 *   countdown,
 *   isRetrying,
 *   hasFailedPermanently,
 *   errorMessage,
 *   retryNow,
 *   startRetryFlow,
 *   resetRetryState,
 *   checkNetworkAndLoad,
 * } = useNetworkRetry({
 *   fetchFn: loadData,
 *   countdownSeconds: 5,
 *   maxRetries: 3,
 * });
 * ```
 */
export function useNetworkRetry({
  countdownSeconds = 5,
  maxRetries = 3,
  fetchFn,
  onNetworkChange,
}: UseNetworkRetryOptions): UseNetworkRetryReturn {
  const [showRetryOverlay, setShowRetryOverlay] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasFailedPermanently, setHasFailedPermanently] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  
  const retryCountRef = useRef(0);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup timers on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      clearAllTimers();
    };
  }, []);

  // Subscribe to network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? false;
      setIsOffline(!connected);
      onNetworkChange?.(connected);
      
      // If we regain connection and overlay is showing, trigger retry
      if (connected && showRetryOverlay && !isRetrying) {
        retryNow();
      }
    });

    return () => unsubscribe();
  }, [showRetryOverlay, isRetrying, onNetworkChange]);

  const clearAllTimers = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    clearAllTimers();
    
    if (!isMountedRef.current) return;
    
    setCountdown(countdownSeconds);
    
    countdownTimerRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        clearAllTimers();
        return;
      }
      
      setCountdown((prev) => {
        if (prev <= 1) {
          clearAllTimers();
          // Trigger retry when countdown reaches 0
          executeRetry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [countdownSeconds]);

  const executeRetry = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    clearAllTimers();
    setIsRetrying(true);
    setCountdown(0);
    
    try {
      // Check network first
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        throw new Error('No internet connection');
      }
      
      await fetchFn();
      
      // Success - reset everything
      if (isMountedRef.current) {
        resetRetryState();
      }
    } catch (error: any) {
      if (!isMountedRef.current) return;
      
      retryCountRef.current += 1;
      setIsRetrying(false);
      
      const errorMsg = error?.message || 'Failed to connect';
      setErrorMessage(errorMsg);
      
      // Check if we've exceeded max retries
      if (retryCountRef.current >= maxRetries) {
        setHasFailedPermanently(true);
      } else {
        // Start another countdown
        startCountdown();
      }
    }
  }, [fetchFn, maxRetries, startCountdown]);

  const retryNow = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Reset permanent failure state if user manually retries
    if (hasFailedPermanently) {
      retryCountRef.current = 0;
      setHasFailedPermanently(false);
    }
    
    executeRetry();
  }, [executeRetry, hasFailedPermanently]);

  const startRetryFlow = useCallback((error?: string) => {
    if (!isMountedRef.current) return;
    
    setShowRetryOverlay(true);
    setErrorMessage(error || null);
    setHasFailedPermanently(false);
    retryCountRef.current = 0;
    startCountdown();
  }, [startCountdown]);

  const resetRetryState = useCallback(() => {
    if (!isMountedRef.current) return;
    
    clearAllTimers();
    setShowRetryOverlay(false);
    setCountdown(0);
    setIsRetrying(false);
    setHasFailedPermanently(false);
    setErrorMessage(null);
    setIsOffline(false);
    retryCountRef.current = 0;
  }, [clearAllTimers]);

  const checkNetworkAndLoad = useCallback(async (): Promise<boolean> => {
    const netState = await NetInfo.fetch();
    
    if (!netState.isConnected) {
      setIsOffline(true);
      startRetryFlow('No internet connection');
      return false;
    }
    
    setIsOffline(false);
    return true;
  }, [startRetryFlow]);

  return {
    showRetryOverlay,
    countdown,
    isRetrying,
    hasFailedPermanently,
    errorMessage,
    retryNow,
    startRetryFlow,
    resetRetryState,
    checkNetworkAndLoad,
    isOffline,
  };
}

export default useNetworkRetry;
