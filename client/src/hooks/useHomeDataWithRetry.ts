import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AuthService, 
  ProductSummary, 
  CategorySummary,
  OrderSummary 
} from '../api/apiService';
import { useNetworkRetry } from './useNetworkRetry';

interface UseHomeDataWithRetryReturn {
  user: any;
  products: ProductSummary[];
  categories: CategorySummary[];
  orders: OrderSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Network retry state
  showRetryOverlay: boolean;
  countdown: number;
  isRetrying: boolean;
  hasFailedPermanently: boolean;
  errorMessage: string | null;
  retryNow: () => void;
}

/**
 * useHomeDataWithRetry - Enhanced version of useHomeData with network retry support
 * 
 * Features:
 * - All original useHomeData functionality
 * - Automatic network retry with countdown
 * - Professional retry overlay integration
 * - Seamless error recovery
 */
export const useHomeDataWithRetry = (): UseHomeDataWithRetryReturn => {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Small delay to ensure auth token is fully persisted after login
      await new Promise(resolve => setTimeout(resolve, 50));

      if (!isMountedRef.current) return;

      // Verify we have an auth token before making API calls
      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isAuthenticated) {
        console.log('useHomeDataWithRetry: No auth token found, skipping data load');
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }

      // Load data sequentially with mount checks
      const userData = await AuthService.getUser();
      if (!isMountedRef.current) return;
      setUser(userData);

      const productsData = await AuthService.getProducts();
      if (!isMountedRef.current) return;
      setProducts(productsData);

      const categoriesData = await AuthService.getCategories();
      if (!isMountedRef.current) return;
      setCategories(categoriesData);

      const ordersData = await AuthService.getOrderNos();
      if (!isMountedRef.current) return;
      setOrders(ordersData);

      // Reset retry state on success
      resetRetryState();
    } catch (err: any) {
      console.error('useHomeDataWithRetry error:', err);
      if (isMountedRef.current) {
        const errorMsg = err.message || 'Failed to load data';
        setError(errorMsg);
        
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
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

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
    countdownSeconds: 5,
    maxRetries: 3,
  });

  useEffect(() => {
    isMountedRef.current = true;
    
    const initLoad = async () => {
      const isConnected = await checkNetworkAndLoad();
      if (isConnected) {
        loadData();
      }
    };
    
    initLoad();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refetch = async () => {
    const isConnected = await checkNetworkAndLoad();
    if (isConnected) {
      await loadData();
    }
  };

  return {
    user,
    products,
    categories,
    orders,
    loading,
    error,
    refetch,
    // Network retry state
    showRetryOverlay,
    countdown,
    isRetrying,
    hasFailedPermanently,
    errorMessage,
    retryNow,
  };
};

export default useHomeDataWithRetry;
