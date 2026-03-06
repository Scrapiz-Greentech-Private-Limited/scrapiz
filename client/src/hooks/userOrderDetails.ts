
import { useState, useEffect, useMemo } from 'react';
import { AuthService, OrderSummary, ProductSummary } from '../api/apiService';

export interface OrderWithDetails extends OrderSummary {
  statusName: string;
  totalAmount: number;
  formattedDate: string;
}

export const useOrderDetails = (orders: OrderSummary[], products: ProductSummary[]) => {
  const ordersWithDetails = useMemo(() => {
    return orders.map(order => {
      const statusName = (typeof order.status === 'string' ? order.status : order.status?.name || 'pending').toLowerCase().replace(' ', '_');

      // Total Amount
      const totalAmount = order.orders.reduce((sum, item) => {
        const product = products.find(p => p.id === item.product.id);
        const rate = product ? (product.max_rate + product.min_rate) / 2 : 0;
        const quantity = parseFloat(item.quantity) || 0;
        return sum + (rate * quantity);
      }, 0);

      // Date formatted 
      const formattedDate = new Date(order.created_at).toLocaleString();
      return {
        ...order,
        statusName,
        totalAmount,
        formattedDate,
      };
    });
  }, [orders, products]);

  return ordersWithDetails;
};

export const useFilteredOrders = (orders: OrderWithDetails[], selectedTab: string) => {
  const filteredOrders = useMemo(() => {
    if (selectedTab === 'all') return orders;
    return orders.filter(order => order.statusName === selectedTab);
  }, [orders, selectedTab]);

  return filteredOrders;
};

export const useOrderTabs = (orders: OrderWithDetails[]) => {
  const tabs = useMemo(() => [
    {
      id: 'all',
      label: 'All',
      count: orders.length
    },
    {
      id: 'scheduled',
      label: 'Scheduled',
      count: orders.filter(o => o.statusName === 'scheduled').length
    },
    {
      id: 'transit',
      label: 'In Transit',
      count: orders.filter(o => o.statusName === 'transit').length
    },
    {
      id: 'completed',
      label: 'Completed',
      count: orders.filter(o => o.statusName === 'completed').length
    }, {
      id: 'cancelled',
      label: 'Cancelled',
      count: orders.filter(o => o.statusName === 'cancelled').length
    },
  ], [orders]);

  return tabs;
};