import { useMemo } from 'react';
import { OrderSummary } from '../api/apiService';

export const useEnvironmentalImpact = (orders: OrderSummary[]) => {
  const impact = useMemo(() => {
    const safeOrders = orders || [];
    const totalWeight = safeOrders.reduce((sum, order) => {
      const items = Array.isArray(order?.orders) ? order.orders : [];
      const orderWeight = items.reduce((orderSum, item) => {
        return orderSum + (parseFloat(item.quantity) || 0);
      }, 0);
      return sum + orderWeight;
    }, 0);

    const treesSaved = Math.round(totalWeight * 0.12); // Rough estimate
    const co2Reduced = Math.round(totalWeight * 2.3); // Rough estimate

    return { treesSaved, co2Reduced, totalWeight };
  }, [orders]);

  return impact;
};
