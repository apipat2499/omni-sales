'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingCart } from 'lucide-react';
import type { Customer, Product, OrderChannel } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export default function CreateOrderModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateOrderModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [channel, setChannel] = useState<OrderChannel>('online');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState('');

  // Load customers and products
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Auto-fill shipping address when customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      if (customer && customer.address) {
        setShippingAddress(customer.address);
      }
    }
  }, [selectedCustomerId, customers]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersRes, productsRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/products'),
      ]);

      if (customersRes.ok && productsRes.ok) {
        const customersData = await customersRes.json();
        const productsData = await productsRes.json();
        setCustomers(customersData);
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        productName: '',
        price: 0,
        quantity: 1,
        subtotal: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If product changed, update price and name
    if (field === 'productId') {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].price = product.price;
        newItems[index].subtotal = product.price * newItems[index].quantity;
      }
    }

    // If quantity changed, recalculate subtotal
    if (field === 'quantity') {
      newItems[index].subtotal = newItems[index].price * value;
    }

    setItems(newItems);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.07; // 7% VAT
  const total = subtotal + tax + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      alert('กรุณาเลือกลูกค้า');
      return;
    }

    if (items.length === 0 || items.some((item) => !item.productId)) {
      alert('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          items: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          channel,
          subtotal,
          tax,
          shipping: shippingCost,
          total,
          shipping_address: shippingAddress || undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      // Reset form
      setSelectedCustomerId('');
      setItems([]);
      setChannel('online');
      setShippingAddress('');
      setShippingCost(0);
      setNotes('');

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                สร้างคำสั่งซื้อใหม่
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                เพิ่มคำสั่งซื้อเข้าสู่ระบบ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ลูกค้า *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">-- เลือกลูกค้า --</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Channel Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ช่องทางการขาย *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['online', 'offline', 'mobile', 'phone'] as OrderChannel[]).map(
                    (ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setChannel(ch)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          channel === ch
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {ch}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    รายการสินค้า *
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    เพิ่มสินค้า
                  </button>
                </div>

                <div className="space-y-3">
                  {items.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">
                        ยังไม่มีสินค้าในคำสั่งซื้อ
                      </p>
                    </div>
                  ) : (
                    items.map((item, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <select
                          value={item.productId}
                          onChange={(e) =>
                            updateItem(index, 'productId', e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          required
                        >
                          <option value="">-- เลือกสินค้า --</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({formatCurrency(product.price)})
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, 'quantity', parseInt(e.target.value))
                          }
                          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          placeholder="จำนวน"
                          required
                        />

                        <div className="w-32 flex items-center justify-end px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))
                  )}
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="กรอกที่อยู่จัดส่ง..."
                />
              </div>

              {/* Shipping Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ค่าจัดส่ง (฿)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="เพิ่มหมายเหตุเพิ่มเติม..."
                />
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  สรุปคำสั่งซื้อ
                </h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">ยอดรวมสินค้า:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">ภาษี VAT 7%:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(tax)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">ค่าจัดส่ง:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(shippingCost)}
                  </span>
                </div>
                <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ยอดรวมทั้งหมด:
                    </span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading || items.length === 0}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                กำลังสร้าง...
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5" />
                สร้างคำสั่งซื้อ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
