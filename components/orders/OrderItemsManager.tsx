'use client';

import { useState, useEffect } from 'react';
import { useOrderItems } from '@/lib/hooks/useOrderItems';
import { useToast } from '@/lib/hooks/useToast';
import OrderItemsTable from './OrderItemsTable';
import AddItemModal from './AddItemModal';
import EditItemModal from './EditItemModal';
import CartSummary from './CartSummary';
import { Loader } from 'lucide-react';
import type { OrderItem } from '@/types';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [itemLoading, setItemLoading] = useState(false);
  const { success, error: showError } = useToast();

  const {
    items,
    loading,
    error,
    addItem,
    updateItemQuantity,
    updateItem,
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
      const isSuccess = await addItem(productId, productName, quantity, price);
      if (isSuccess) {
        success(`เพิ่มรายการ ${productName} เสร็จสิ้น`);
      } else {
        showError('ไม่สามารถเพิ่มรายการได้');
      }
      return isSuccess;
    } finally {
      setItemLoading(false);
    }
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    setItemLoading(true);
    try {
      const isSuccess = await updateItemQuantity(itemId, newQuantity);
      if (isSuccess) {
        success('อัพเดตจำนวนเสร็จสิ้น');
      } else {
        showError('ไม่สามารถอัพเดตจำนวนได้');
      }
    } finally {
      setItemLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('คุณแน่ใจหรือว่าต้องการลบรายการนี้?')) {
      setItemLoading(true);
      try {
        const isSuccess = await deleteItem(itemId);
        if (isSuccess) {
          success('ลบรายการเสร็จสิ้น');
        } else {
          showError('ไม่สามารถลบรายการได้');
        }
      } finally {
        setItemLoading(false);
      }
    }
  };

  const handleEditItem = (item: OrderItem) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleUpdateItem = async (itemId: string, updates: { quantity?: number; price?: number; discount?: number; notes?: string }) => {
    setItemLoading(true);
    try {
      const isSuccess = await updateItem(itemId, updates);
      if (isSuccess) {
        success('อัพเดตรายการเสร็จสิ้น');
      } else {
        showError('ไม่สามารถอัพเดตรายการได้');
      }
      return isSuccess;
    } finally {
      setItemLoading(false);
    }
  };

  const handleDeleteFromEdit = async (itemId: string) => {
    setItemLoading(true);
    try {
      const isSuccess = await deleteItem(itemId);
      if (isSuccess) {
        success('ลบรายการเสร็จสิ้น');
      } else {
        showError('ไม่สามารถลบรายการได้');
      }
      return isSuccess;
    } finally {
      setItemLoading(false);
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
        onEdit={handleEditItem}
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

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={isEditModalOpen}
        item={editingItem}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        onUpdate={handleUpdateItem}
        onDelete={handleDeleteFromEdit}
        loading={itemLoading}
      />
    </div>
  );
}
