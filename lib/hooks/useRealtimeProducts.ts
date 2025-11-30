'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Product } from '@/types';

/**
 * Hook for real-time products updates using Supabase Realtime
 */
export function useRealtimeProducts(initialProducts: Product[] = []) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    if (!supabase) return;

    // Subscribe to products table changes
    const subscription = supabase
      .channel('products-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('Product change received:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new product
            setProducts((current) => [payload.new as Product, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing product
            setProducts((current) =>
              current.map((product) =>
                product.id === payload.new.id ? (payload.new as Product) : product
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted product
            setProducts((current) =>
              current.filter((product) => product.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { products, setProducts };
}
