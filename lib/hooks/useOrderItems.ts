import { useState, useCallback } from 'react';
import type { OrderItem } from '@/types';

interface UseOrderItemsReturn {
  items: OrderItem[];
  loading: boolean;
  error: string | null;
  addItem: (productId: string, productName: string, quantity: number, price: number) => Promise<boolean>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  updateItem: (itemId: string, updates: { quantity?: number; price?: number; discount?: number; notes?: string }) => Promise<boolean>;
  deleteItem: (itemId: string) => Promise<boolean>;
  fetchItems: (orderId: string) => Promise<void>;
  refresh: (orderId: string) => Promise<void>;
}

export function useOrderItems(initialOrderId?: string): UseOrderItemsReturn {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState(initialOrderId);

  const fetchItems = useCallback(async (oId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${oId}/items`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch items');
      }

      const data = await response.json();
      const itemsWithTotals: OrderItem[] = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.quantity * item.price,
      }));

      setItems(itemsWithTotals);
      setOrderId(oId);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(
    async (productId: string, productName: string, quantity: number, price: number): Promise<boolean> => {
      if (!orderId) {
        setError('Order ID is not set');
        return false;
      }

      try {
        setError(null);
        const response = await fetch(`/api/orders/${orderId}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            productName,
            quantity,
            price,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();

          // Handle specific error types
          if (errorData.error === 'Insufficient stock') {
            setError(
              `สินค้าไม่เพียงพอ (มี: ${errorData.available} หน่วย, ต้องการ: ${errorData.requested} หน่วย)`
            );
          } else if (errorData.error === 'Product not found') {
            setError('ไม่พบสินค้า');
          } else {
            setError(errorData.error || 'ไม่สามารถเพิ่มรายการได้');
          }
          return false;
        }

        const newItem = await response.json();
        const itemWithTotal: OrderItem = {
          id: newItem.id,
          productId: newItem.productId,
          productName: newItem.productName,
          quantity: newItem.quantity,
          price: newItem.price,
          totalPrice: newItem.quantity * newItem.price,
        };

        setItems((prev) => [...prev, itemWithTotal]);
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMsg);
        console.error('Error adding item:', err);
        return false;
      }
    },
    [orderId]
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantity: number): Promise<boolean> => {
      if (!orderId) {
        setError('Order ID is not set');
        return false;
      }

      if (quantity <= 0) {
        setError('Quantity must be greater than 0');
        return false;
      }

      try {
        setError(null);
        const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity }),
        });

        if (!response.ok) {
          const errorData = await response.json();

          if (errorData.error === 'Item not found in this order') {
            setError('ไม่พบรายการ');
          } else if (errorData.details?.length > 0) {
            setError(errorData.details[0].message);
          } else {
            setError(errorData.error || 'ไม่สามารถอัพเดตรายการได้');
          }
          return false;
        }

        const updatedItem = await response.json();
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity: updatedItem.quantity,
                  totalPrice: updatedItem.quantity * updatedItem.price,
                }
              : item
          )
        );
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMsg);
        console.error('Error updating item quantity:', err);
        return false;
      }
    },
    [orderId]
  );

  const updateItem = useCallback(
    async (itemId: string, updates: { quantity?: number; price?: number; discount?: number; notes?: string }): Promise<boolean> => {
      if (!orderId) {
        setError('Order ID is not set');
        return false;
      }

      try {
        setError(null);
        const body: any = {};
        if (updates.quantity !== undefined) body.quantity = updates.quantity;
        if (updates.price !== undefined) body.price = updates.price;
        if (updates.discount !== undefined) body.discount = updates.discount;
        if (updates.notes !== undefined) body.notes = updates.notes;

        const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update item');
        }

        const updatedItem = await response.json();
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity: updatedItem.quantity ?? item.quantity,
                  price: updatedItem.price ?? item.price,
                  discount: updatedItem.discount ?? item.discount,
                  notes: updatedItem.notes ?? item.notes,
                  totalPrice: (updatedItem.quantity ?? item.quantity) * (updatedItem.price ?? item.price),
                }
              : item
          )
        );
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMsg);
        console.error('Error updating item:', err);
        return false;
      }
    },
    [orderId]
  );

  const deleteItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!orderId) {
        setError('Order ID is not set');
        return false;
      }

      try {
        setError(null);
        const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete item');
        }

        setItems((prev) => prev.filter((item) => item.id !== itemId));
        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMsg);
        console.error('Error deleting item:', err);
        return false;
      }
    },
    [orderId]
  );

  const refresh = useCallback(
    async (oId: string = orderId || '') => {
      if (!oId) {
        setError('Order ID is not provided');
        return;
      }
      await fetchItems(oId);
    },
    [orderId, fetchItems]
  );

  return {
    items,
    loading,
    error,
    addItem,
    updateItemQuantity,
    updateItem,
    deleteItem,
    fetchItems,
    refresh,
  };
}
