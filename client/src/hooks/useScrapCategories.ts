import { useState, useEffect, useMemo } from 'react';
import { 
  AuthService, 
  ProductSummary, 
  CategorySummary,
  OrderSummary 
} from '../api/apiService';

export interface ScrapCategory {
  id: number;
  name: string;
  rate: string;
  icon: number;
  color: string;
  products: ProductSummary[];
}

export const useScrapCategories = (products: ProductSummary[], categories: CategorySummary[]) =>{
    const scrapCategories = useMemo(() =>{
        const categoryMap = new Map<number, ProductSummary[]>();
        products.forEach((product)=>{
                if(!categoryMap.has(product.category)){
                     categoryMap.set(product.category, []);
                }
                categoryMap.get(product.category)?.push(product);
        })
        const getCategoryImage = (category: CategorySummary): any => {
            // Priority 1: Use S3 image if available
            if (category.image_url) {
                return { uri: category.image_url };
            }
            
            // Priority 2: Fallback to local assets based on name
            const lowerName = category.name.toLowerCase();
            if (lowerName.includes('paper') || lowerName.includes('cardboard')) 
              return require('../../assets/images/Scrap_Rates_Photos/Book.jpg');
            if (lowerName.includes('plastic')) 
              return require('../../assets/images/Scrap_Rates_Photos/Plastics.jpg');
            if (lowerName.includes('metal') || lowerName.includes('iron') || lowerName.includes('steel')) 
              return require('../../assets/images/Scrap_Rates_Photos/Aluminium.jpg');
            if (lowerName.includes('electricals') || lowerName.includes('e-waste')) 
              return require('../../assets/images/Scrap_Rates_Photos/FrontLoadMachine.jpg');
            if (lowerName.includes('glass')) 
              return require('../../assets/images/Scrap_Rates_Photos/glass.jpg');
            
            // Default fallback
            return require('../../assets/images/Scrap_Rates_Photos/TV.jpg');
        }
        const getColor  = (name: string): string => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('paper')) return '#166534';
        if (lowerName.includes('plastic')) return '#166534';
        if (lowerName.includes('metal')) return '#166534';
        if (lowerName.includes('electricals')) return '#166534';
        if(lowerName.includes('glass')) return '#166534';
        return '#166534';
    };
    return categories.map(category => {
      const categoryProducts = categoryMap.get(category.id) || [];
      
      // Calculate min and max rates across all products in the category
      let minRate = Infinity;
      let maxRate = -Infinity;
      let unit = 'kg';
      
      categoryProducts.forEach(product => {
        if (product.min_rate < minRate) minRate = product.min_rate;
        if (product.max_rate > maxRate) maxRate = product.max_rate;
        unit = product.unit; // Use the unit from products
      });
      
      // Format the rate as a range
      const rateDisplay = categoryProducts.length > 0 && minRate !== Infinity
        ? `₹${minRate}-${maxRate}/${unit}`
        : 'N/A';

      return {
        id: category.id,
        name: category.name,
        rate: rateDisplay,
        icon: getCategoryImage(category),
        color: getColor(category.name),
        products: categoryProducts,
      };
    });
    },[products, categories])
    return scrapCategories
}

