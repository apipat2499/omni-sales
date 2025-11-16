'use client';

import { useState, useEffect } from 'react';
import { useOrderItems } from '@/lib/hooks/useOrderItems';
import OrderItemsTable from './OrderItemsTable';
import AddItemModal from './AddItemModal';
import CartSummary from './CartSummary';
import { Loader } from 'lucide-react';

interface OrderItemsManagerProps {
  orderId: string;
  tax?: number;
  shipping?: number;
  discount?: number;
}

export default function OrderItemsManager({
  orderId,
  tax = 0,
  shipping = 0,
  discount = 0,
}: OrderItemsManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);

  const {
    items,
    loading,
    error,
    addItem,
    updateItemQuantity,
    deleteItem,
    fetchItems,
  } = useOrderItems(orderId);

  useEffect(() => {
    fetchItems(orderId);
  }, [orderId, fetchItems]);

  const handleAddItem = async (
    productId: string,
    productName: string,
    quantity: number,
    price: number
  ) => {
    setItemLoading(true);
    try {
      const success = await addItem(productId, productName, quantity, price);
      return success;
    } finally {
      setItemLoading(false);
    }
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    setItemLoading(true);
    try {
      await updateItemQuantity(itemId, newQuantity);
    } finally {
      setItemLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('คุณแน่ใจหรือว่าต้องการลบรายการนี้?')) {
      setItemLoading(true);
      try {
        await deleteItem(itemId);
      } finally {
        setItemLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Items Table */}
      <OrderItemsTable
        items={items}
        loading={itemLoading}
        onAddClick={() => setIsAddModalOpen(true)}
        onQuantityChange={handleQuantityChange}
        onDelete={handleDeleteItem}
      />

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2" />
        <CartSummary
          items={items}
          tax={tax}
          shipping={shipping}
          discount={discount}
        />
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddItem}
        loading={itemLoading}
      />
    </div>
  );
}
