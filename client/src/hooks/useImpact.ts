import { useMemo } from 'react';
import { OrderSummary } from '../api/apiService';

export const useEnvironmentalImpact = (orders: OrderSummary[]) => {
  const impact = useMemo(() => {
    const safeOrders = orders || [];
    
    let totalWeight = 0;
    let treesSaved = 0;
    let co2Reduced = 0;

    safeOrders.forEach((order) => {
      const items = Array.isArray(order?.orders) ? order.orders : [];
      items.forEach((item) => {
        const quantity = parseFloat(item.quantity) || 0;
        totalWeight += quantity;
        
        // Use product-specific impact values if available
        const product = item.product;
        if (product) {
          const treesPerUnit = product.trees_saved_per_unit ?? 0.12;
          const co2PerUnit = product.co2_reduced_per_unit ?? 2.3;
          treesSaved += quantity * treesPerUnit;
          co2Reduced += quantity * co2PerUnit;
        } else {
          // Fallback to default estimates
          treesSaved += quantity * 0.12;
          co2Reduced += quantity * 2.3;
        }
      });
    });

    return {
      treesSaved: Math.round(treesSaved * 100) / 100,
      co2Reduced: Math.round(co2Reduced * 100) / 100,
      totalWeight: Math.round(totalWeight * 100) / 100,
    };
  }, [orders]);

  return impact;
};
