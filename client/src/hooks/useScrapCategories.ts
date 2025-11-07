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
        const getIcon = (name:string):string =>{
            const lowerName = name.toLowerCase();
            if (lowerName.includes('paper') || lowerName.includes('cardboard')) 
              return require('../../assets/images/Scrap_Rates_Photos/Book.jpg');
            if (lowerName.includes('plastic')) return require('../../assets/images/Scrap_Rates_Photos/Plastics.jpg');
            if (lowerName.includes('metal') || lowerName.includes('iron') || lowerName.includes('steel')) 
              return require('../../assets/images/Scrap_Rates_Photos/Aluminium.jpg');
            if (lowerName.includes('electricals') || lowerName.includes('e-waste')) 
              return require('../../assets/images/Scrap_Rates_Photos/FrontLoadMachine.jpg');
            if (lowerName.includes('glass')) return require('../../assets/images/Scrap_Rates_Photos/glass.jpg');
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
      const avgRate = categoryProducts.length > 0
        ? categoryProducts.reduce((sum, p) => sum + ((p.max_rate + p.min_rate) / 2), 0) / categoryProducts.length
        : 0;

      return {
        id: category.id,
        name: category.name,
        rate: avgRate > 0 ? `₹${Math.round(avgRate)}/${categoryProducts[0]?.unit || 'kg'}` : 'N/A',
        icon: getIcon(category.name),
        color: getColor(category.name),
        products: categoryProducts,
      };
    });
    },[products, categories])
    return scrapCategories
}

