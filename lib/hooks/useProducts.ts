'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Product, ProductCategory, ProductFilters } from '@/types';
import { useAuth } from '@/lib/auth/AuthContext';

// Demo products for when API is not available
const getDemoProducts = (): Product[] => [
  {
    id: 'demo-prod-1',
    name: 'iPhone 15 Pro Max',
    description: 'สมาร์ทโฟนรุ่นล่าสุดจาก Apple พร้อม A17 Pro chip',
    price: 50000,
    cost: 40000,
    stock: 25,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1592286927505-b0ce2563d64c?w=400',
    sku: 'IPH-15PM-256',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-prod-2',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'สมาร์ทโฟนแฟล็กชิปจาก Samsung',
    price: 42000,
    cost: 33000,
    stock: 30,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
    sku: 'SGS-24U-512',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-prod-3',
    name: 'MacBook Air M3',
    description: 'โน้ตบุ๊กน้ำหนักเบาพร้อม M3 chip',
    price: 38900,
    cost: 30000,
    stock: 15,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    sku: 'MBA-M3-13',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-prod-4',
    name: 'AirPods Pro 2',
    description: 'หูฟังไร้สายพร้อม Active Noise Cancellation',
    price: 8900,
    cost: 6500,
    stock: 50,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400',
    sku: 'APP-2-WHT',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-prod-5',
    name: 'Sony WH-1000XM5',
    description: 'หูฟังป้องกันเสียงรบกวนชั้นเลิศ',
    price: 13000,
    cost: 9500,
    stock: 20,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400',
    sku: 'SNY-WH1000XM5',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'demo-prod-6',
    name: 'iPad Air M2',
    description: 'แท็บเล็ตสำหรับการทำงานและความบันเทิง',
    price: 24900,
    cost: 19000,
    stock: 18,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
    sku: 'IPAD-AIR-M2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

interface UseProductsOptions extends ProductFilters {
  category?: ProductCategory | 'all';
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabaseReady } = useAuth();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Return demo data if Supabase is not ready
      if (!supabaseReady) {
        setProducts(getDemoProducts());
        setLoading(false);
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();

      if (options.search) {
        params.append('search', options.search);
      }

      if (options.category && options.category !== 'all') {
        params.append('category', options.category);
      }

      if (options.minPrice !== undefined) {
        params.append('minPrice', options.minPrice.toString());
      }

      if (options.maxPrice !== undefined) {
        params.append('maxPrice', options.maxPrice.toString());
      }

      if (options.minRating !== undefined) {
        params.append('minRating', options.minRating.toString());
      }

      if (options.inStock) {
        params.append('inStock', 'true');
      }

      if (options.isFeatured) {
        params.append('isFeatured', 'true');
      }

      if (options.sortBy) {
        params.append('sortBy', options.sortBy);
      }

      if (options.sortOrder) {
        params.append('sortOrder', options.sortOrder);
      }

      const queryString = params.toString();
      const url = `/api/products${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch products');
      }

      const result = await response.json();
      const data = result.data || result;

      // Transform date strings to Date objects
      const productsWithDates = (Array.isArray(data) ? data : []).map((product: any) => ({
        ...product,
        createdAt: new Date(product.createdAt || product.created_at),
        updatedAt: new Date(product.updatedAt || product.updated_at),
      }));

      setProducts(productsWithDates);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching products');
      // Set demo data on error
      setProducts(getDemoProducts());
    } finally {
      setLoading(false);
    }
  }, [
    supabaseReady,
    options.search,
    options.category,
    options.minPrice,
    options.maxPrice,
    options.minRating,
    options.inStock,
    options.isFeatured,
    options.sortBy,
    options.sortOrder,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refresh = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refresh,
  };
}
