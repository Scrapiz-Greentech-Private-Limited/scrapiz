import { useState, useEffect, useMemo } from 'react';

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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // const [userData, productsData, categoriesData, ordersData] = await Promise.all([
      //   AuthService.getUser(),
      //   AuthService.getProducts(),
      //   AuthService.getCategories(),
      //   AuthService.getOrderNos(),
      // ]);
      const userData = await AuthService.getUser();
      setUser(userData);
      const productsData = await AuthService.getProducts();
      setProducts(productsData);
      const categoriesData = await AuthService.getCategories();
      setCategories(categoriesData);
      const ordersData = await AuthService.getOrderNos();
      setOrders(ordersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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