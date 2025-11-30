'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Order } from '@/types';

/**
 * Hook for real-time orders updates using Supabase Realtime
 */
export function useRealtimeOrders(initialOrders: Order[] = []) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  useEffect(() => {
    if (!supabase) return;

    // Subscribe to orders table changes
    const subscription = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order change received:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new order
            setOrders((current) => [payload.new as Order, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing order
            setOrders((current) =>
              current.map((order) =>
                order.id === payload.new.id ? (payload.new as Order) : order
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted order
            setOrders((current) =>
              current.filter((order) => order.id !== payload.old.id)
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

  return { orders, setOrders };
}
