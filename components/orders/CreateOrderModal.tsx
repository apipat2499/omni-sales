'use client';

import { useState, useEffect } from 'react';
import { useCustomers } from '@/lib/hooks/useCustomers';
import { useProducts } from '@/lib/hooks/useProducts';
import { useDiscounts } from '@/lib/hooks/useDiscounts';
import { useToast } from '@/lib/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import { X, Loader2, Plus, Trash2, Tag, AlertCircle } from 'lucide-react';
import type { OrderChannel } from '@/types';

interface CreateOrderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  stock: number;
}

export default function CreateOrderModal({ onClose, onSuccess }: CreateOrderModalProps) {
  const { customers } = useCustomers();
  const { products } = useProducts();
  const { validateDiscount } = useDiscounts();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [channel, setChannel] = useState<OrderChannel>('online');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', price: 0, quantity: 1, stock: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product changed, update price and stock
    if (field === 'productId') {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].price = product.price;
        newItems[index].stock = product.stock;
      }
    }

    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountAmount(0);
      setDiscountError('');
      return;
    }

    setValidatingDiscount(true);
    setDiscountError('');

    try {
      const result = await validateDiscount(discountCode, calculateSubtotal(), items);

      if (result.valid) {
        setDiscountAmount(result.discount.discountAmount);
        showToast(`ใช้โค้ด ${discountCode} สำเร็จ! ลด ${formatCurrency(result.discount.discountAmount)}`, 'success');
      } else {
        setDiscountAmount(0);
        setDiscountError(result.error || 'โค้ดส่วนลดไม่ถูกต้อง');
      }
    } catch (error) {
      setDiscountAmount(0);
      setDiscountError('ไม่สามารถตรวจสอบโค้ดส่วนลดได้');
    } finally {
      setValidatingDiscount(false);
    }
  };

  const calculateTax = () => {
    return (calculateSubtotal() - discountAmount) * 0.07;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - discountAmount + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      showToast('กรุณาเลือกลูกค้า', 'error');
      return;
    }

    if (items.length === 0 || items.some((item) => !item.productId)) {
      showToast('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ', 'error');
      return;
    }

    // Validate stock
    for (const item of items) {
      if (item.quantity > item.stock) {
        showToast(`${item.productName} มีสต็อกไม่เพียงพอ (เหลือ ${item.stock} ชิ้น)`, 'error');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          channel,
          paymentMethod,
          shippingAddress,
          notes,
          discountCode: discountCode || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      showToast('สร้างคำสั่งซื้อสำเร็จ!', 'success');
      onSuccess();
    } catch (error: any) {
      showToast(error.message || 'เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-add first item
  useEffect(() => {
    if (items.length === 0) {
      addItem();
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">สร้างคำสั่งซื้อใหม่</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ลูกค้า *
            </label>
            <select
              required
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                const customer = customers.find((c) => c.id === e.target.value);
                if (customer?.address) {
                  setShippingAddress(customer.address);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">เลือกลูกค้า</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.email}
                </option>
              ))}
            </select>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                สินค้า *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus className="h-4 w-4" />
                เพิ่มสินค้า
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <select
                      required
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">เลือกสินค้า</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.price)} (สต็อก: {product.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-32">
                    <input
                      type="number"
                      min="1"
                      max={item.stock}
                      required
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="จำนวน"
                    />
                  </div>

                  <div className="w-32 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Discount Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              โค้ดส่วนลด
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    onBlur={validateDiscountCode}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="ใส่โค้ดส่วนลด"
                  />
                </div>
                {discountError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {discountError}
                  </p>
                )}
                {discountAmount > 0 && !discountError && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                    ส่วนลด: {formatCurrency(discountAmount)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={validateDiscountCode}
                disabled={validatingDiscount || !discountCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {validatingDiscount && <Loader2 className="h-4 w-4 animate-spin" />}
                ตรวจสอบ
              </button>
            </div>
          </div>

          {/* Channel & Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ช่องทาง *
              </label>
              <select
                required
                value={channel}
                onChange={(e) => setChannel(e.target.value as OrderChannel)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="mobile">Mobile</option>
                <option value="phone">Phone</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                วิธีชำระเงิน
              </label>
              <input
                type="text"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="เช่น โอนเงิน, บัตรเครดิต"
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ที่อยู่จัดส่ง
            </label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="ที่อยู่สำหรับจัดส่งสินค้า"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              หมายเหตุ
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">สรุปคำสั่งซื้อ</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">ยอดรวม</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(calculateSubtotal())}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">ส่วนลด ({discountCode})</span>
                <span className="font-medium text-green-600 dark:text-green-400">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">ภาษี VAT 7%</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(calculateTax())}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">รวมทั้งสิ้น</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              สร้างคำสั่งซื้อ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
