export interface Product {
  id: number;
  name: string;
  max_rate: number;
  min_rate: number;
  unit: string;
  description: string;
  category: number;
  image_url?: string | null;
}

export interface Category {
  id: number;
  name: string;
  products?: Product[];
  image_url?: string | null;
}
