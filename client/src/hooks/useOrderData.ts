import { useState, useEffect, useMemo } from 'react';
import { AuthService, OrderSummary, ProductSummary } from '../api/apiService';


export interface OrderWithDetails extends OrderSummary {
  statusName: string;
  totalAmount: number;
  formattedDate: string;
}

export const useOrdersData = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const ordersData = await AuthService.getOrderNos();
      const productsData = await AuthService.getProducts();

      // const [ordersData, productsData] = await Promise.all([
      //   AuthService.getOrderNos(),
      //   AuthService.getProducts(),
      // ]);

      setOrders(ordersData);
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const refetch = () => loadOrders();

  return {
    orders,
    products,
    loading,
    error,
    refetch,
  };
};
