import { useState, useEffect, useRef } from 'react';

import { 
  AuthService, 
  ProductSummary, 
  CategorySummary,
  OrderSummary 
} from '../api/apiService';

export const useHomeData = () => {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Small delay to ensure auth token is fully persisted after login
      // This prevents race conditions on iOS where AsyncStorage might not be ready
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check if component is still mounted before proceeding
      if (!isMountedRef.current) return;

      // Verify we have an auth token before making API calls
      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isAuthenticated) {
        console.log('useHomeData: No auth token found, skipping data load');
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
    } catch (err: any) {
      console.error('useHomeData error:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refetch = () => loadData();

  return {
    user,
    products,
    categories,
    orders,
    loading,
    error,
    refetch,
  };
};