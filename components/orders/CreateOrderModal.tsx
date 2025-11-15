'use client';

import { useState, useEffect } from 'react';
import { X, Tag, Percent, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Product, Customer, Promotion } from '@/types';

interface CartItem extends Product {
  cartQuantity: number;
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cartItems: CartItem[];
}

export default function CreateOrderModal({
  isOpen,
  onClose,
  onSuccess,
  cartItems,
}: CreateOrderModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [channel, setChannel] = useState<'online' | 'offline' | 'mobile' | 'phone'>('offline');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shipping, setShipping] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [error, setError] = useState('');
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      // Reset form
      setSelectedCustomerId('');
      setCouponCode('');
      setAppliedPromotion(null);
      setDiscountAmount(0);
      setChannel('offline');
      setPaymentMethod('cash');
      setShippingAddress('');
      setShipping(0);
      setNotes('');
      setError('');
      setCouponError('');
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data.data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  const tax = (subtotal - discountAmount) * 0.07; // 7% VAT on discounted subtotal
  const total = subtotal - discountAmount + tax + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('กรุณาใส่รหัสคูปอง');
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError('');

    try {
      const response = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          customerId: selectedCustomerId || undefined,
          subtotal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ไม่สามารถใช้คูปองนี้ได้');
      }

      if (data.valid) {
        setAppliedPromotion(data.promotion);
        setDiscountAmount(data.discountAmount);
        setCouponError('');
      } else {
        throw new Error(data.message || 'คูปองไม่ถูกต้อง');
      }
    } catch (err) {
      console.error('Coupon validation error:', err);
      setCouponError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบคูปอง');
      setAppliedPromotion(null);
      setDiscountAmount(0);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedPromotion(null);
    setDiscountAmount(0);
    setCouponError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('กรุณาเลือกลูกค้า');
      return;
    }

    if (cartItems.length === 0) {
      setError('ไม่มีสินค้าในตะกร้า');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customerId: selectedCustomerId,
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: item.cartQuantity,
          price: item.price,
        })),
        channel,
        paymentMethod,
        shippingAddress: shippingAddress || undefined,
        shipping,
        notes: notes || undefined,
        promotionId: appliedPromotion?.id || undefined,
        couponCode: appliedPromotion ? couponCode : undefined,
        discount: discountAmount > 0 ? discountAmount : undefined,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create order');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Order creation error:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างออเดอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">สร้างออเดอร์</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ลูกค้า *
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">เลือกลูกค้า</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.email}
                </option>
              ))}
            </select>
          </div>

          {/* Order Items Summary */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">สินค้า ({cartItems.length} รายการ)</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {item.name} x {item.cartQuantity}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.price * item.cartQuantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              รหัสคูปอง
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="ใส่รหัสคูปอง"
                  disabled={!!appliedPromotion}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>
              {appliedPromotion ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  ลบ
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon || !couponCode.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isValidatingCoupon ? 'กำลังตรวจสอบ...' : 'ใช้'}
                </button>
              )}
            </div>
            {couponError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{couponError}</p>
            )}
            {appliedPromotion && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Percent className="w-4 h-4" />
                <span>ใช้คูปอง: {appliedPromotion.name} - ลด {formatCurrency(discountAmount)}</span>
              </div>
            )}
          </div>

          {/* Channel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ช่องทาง *
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="mobile">Mobile</option>
              <option value="phone">Phone</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              วิธีการชำระเงิน *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="cash">เงินสด</option>
              <option value="credit_card">บัตรเครดิต</option>
              <option value="bank_transfer">โอนเงิน</option>
              <option value="qr_payment">QR Payment</option>
            </select>
          </div>

          {/* Shipping */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ค่าจัดส่ง
            </label>
            <input
              type="number"
              value={shipping}
              onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="ใส่ที่อยู่จัดส่ง"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="หมายเหตุเพิ่มเติม"
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">สรุปออเดอร์</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">ยอดรวมสินค้า</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">ส่วนลด</span>
                <span className="text-green-600 dark:text-green-400">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">ภาษี (7%)</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(tax)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">ค่าจัดส่ง</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(shipping)}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">ยอดรวมทั้งหมด</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังสร้างออเดอร์...' : 'สร้างออเดอร์'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
