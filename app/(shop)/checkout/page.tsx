'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { Package, CreditCard, MapPin, User, Mail, Phone, ShoppingCart } from 'lucide-react';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getCartTotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  // Redirect if cart is empty
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8">
            Please add items to your cart before checking out
          </p>
          <Link
            href="/products"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Package className="h-5 w-5" />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof CustomerInfo]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerInfo> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9-]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order
      const orderData = {
        customer: formData,
        items: cart.map((item) => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: getCartTotal(),
        paymentMethod: 'bank_transfer',
        createdAt: new Date().toISOString(),
      };

      const response = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const result = await response.json();

      // Clear cart
      clearCart();

      // Redirect to order confirmation
      router.push(`/orders/${result.orderId}`);
    } catch (error) {
      console.error('Order submission error:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Checkout
          </h1>
          <p className="text-gray-600">Complete your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Information Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Details */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <User className="h-6 w-6 mr-2 text-blue-600" />
                  Customer Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="08X-XXX-XXXX"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shipping Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your complete shipping address"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any special instructions for your order"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <CreditCard className="h-6 w-6 mr-2 text-blue-600" />
                  Payment Method
                </h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Bank Transfer (โอนเงินผ่านธนาคาร)
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Bank:</strong> Bangkok Bank</p>
                    <p><strong>Account Number:</strong> 1234567890</p>
                    <p><strong>Account Name:</strong> Your Name Here</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    Please transfer the total amount after placing your order.
                    You will receive payment instructions via email.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 pb-3 border-b"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-sm text-gray-800">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        ฿{item.price} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      ฿{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">
                    ฿{getCartTotal().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span className="font-semibold">฿0</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total</span>
                    <span className="text-blue-600 text-2xl">
                      ฿{getCartTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/cart"
                className="block w-full text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
