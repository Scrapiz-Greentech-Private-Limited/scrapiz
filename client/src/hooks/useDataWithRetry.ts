import { useState, useEffect, useRef, useCallback } from 'react';
import { useNetworkRetry } from './useNetworkRetry';

interface UseDataWithRetryOptions<T> {
  /** The async function that fetches data */
  fetchFn: () => Promise<T>;
  /** Initial countdown seconds before auto-retry (default: 5) */
  countdownSeconds?: number;
  /** Maximum number of auto-retries before showing permanent failure (default: 3) */
  maxRetries?: number;
  /** Whether to fetch data on mount (default: true) */
  fetchOnMount?: boolean;
  /** Callback when data is successfully loaded */
  onSuccess?: (data: T) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

interface UseDataWithRetryReturn<T> {
  /** The fetched data */
  data: T | null;
  /** Whether data is currently loading */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch the data */
  refetch: () => Promise<void>;
  /** Set data manually (for optimistic updates) */
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  // Network retry state
  showRetryOverlay: boolean;
  countdown: number;
  isRetrying: boolean;
  hasFailedPermanently: boolean;
  errorMessage: string | null;
  retryNow: () => void;
}

/**
 * useDataWithRetry - A generic hook for data fetching with network retry support
 * 
 * Features:
 * - Generic data fetching with type safety
 * - Automatic network retry with countdown
 * - Professional retry overlay integration
 * - Seamless error recovery
 * - Manual refetch capability
 * - Optimistic update support via setData
 * 
 * Usage:
 * ```tsx
 * const {
 *   data: user,
 *   loading,
 *   error,
 *   refetch,
 *   showRetryOverlay,
 *   countdown,
 *   isRetrying,
 *   hasFailedPermanently,
 *   errorMessage,
 *   retryNow,
 * } = useDataWithRetry({
 *   fetchFn: () => AuthService.getUser(),
 *   onSuccess: (user) => console.log('User loaded:', user),
 * });
 * ```
 */
export function useDataWithRetry<T>({
  fetchFn,
  countdownSeconds = 5,
  maxRetries = 3,
  fetchOnMount = true,
  onSuccess,
  onError,
}: UseDataWithRetryOptions<T>): UseDataWithRetryReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(fetchOnMount);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isMountedRef.current) return;

      const result = await fetchFn();
      
      if (!isMountedRef.current) return;
      
      setData(result);
      onSuccess?.(result);
      
      // Reset retry state on success
      resetRetryState();
    } catch (err: any) {
      console.error('useDataWithRetry error:', err);
      
      if (!isMountedRef.current) return;
      
      const errorMsg = err.message || 'Failed to load data';
      setError(errorMsg);
      onError?.(err);
      
      // Check if it's a network-related error
      const isNetworkError = 
        errorMsg.toLowerCase().includes('network') ||
        errorMsg.toLowerCase().includes('internet') ||
        errorMsg.toLowerCase().includes('connection') ||
        errorMsg.toLowerCase().includes('timeout') ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ERR_NETWORK';
      
      if (isNetworkError) {
        startRetryFlow(errorMsg);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, onSuccess, onError]);

  const {
    showRetryOverlay,
    countdown,
    isRetrying,
    hasFailedPermanently,
    errorMessage,
    retryNow,
    startRetryFlow,
    resetRetryState,
    checkNetworkAndLoad,
  } = useNetworkRetry({
    fetchFn: loadData,
    countdownSeconds,
    maxRetries,
  });

  useEffect(() => {
    isMountedRef.current = true;
    
    if (fetchOnMount) {
      const initLoad = async () => {
        const isConnected = await checkNetworkAndLoad();
        if (isConnected) {
          loadData();
        }
      };
      
      initLoad();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    const isConnected = await checkNetworkAndLoad();
    if (isConnected) {
      await loadData();
    }
  }, [checkNetworkAndLoad, loadData]);

  return {
    data,
    loading,
    error,
    refetch,
    setData,
    // Network retry state
    showRetryOverlay,
    countdown,
    isRetrying,
    hasFailedPermanently,
    errorMessage,
    retryNow,
  };
}

export default useDataWithRetry;
