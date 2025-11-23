'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, CreditCard, MapPin, Clock, Home } from 'lucide-react';

interface OrderDetails {
  orderId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: string;
  createdAt: string;
  status: string;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/shop/orders/${params.orderId}`);
        if (!response.ok) {
          throw new Error('Order not found');
        }
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [params.orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Order Not Found</h2>
          <p className="text-gray-600 mb-8">{error || 'The order you\'re looking for doesn\'t exist.'}</p>
          <Link
            href="/"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Home className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt);
  const expectedDeliveryDate = new Date(orderDate);
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 5); // 5 days delivery

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Order Confirmed!
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Thank you for your order, <strong>{order.customer.name}</strong>!
          </p>
          <p className="text-gray-600 mb-6">
            Your order has been successfully placed and is being processed.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-600 mb-1">Order Number</p>
            <p className="text-2xl font-bold text-blue-600">#{order.orderId}</p>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <MapPin className="h-6 w-6 mr-2 text-blue-600" />
              Delivery Address
            </h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Name:</strong> {order.customer.name}</p>
              <p><strong>Email:</strong> {order.customer.email}</p>
              <p><strong>Phone:</strong> {order.customer.phone}</p>
              <p><strong>Address:</strong> {order.customer.address}</p>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Clock className="h-6 w-6 mr-2 text-blue-600" />
              Delivery Information
            </h2>
            <div className="space-y-2 text-gray-700">
              <p><strong>Order Date:</strong> {orderDate.toLocaleDateString('th-TH')}</p>
              <p><strong>Expected Delivery:</strong> {expectedDeliveryDate.toLocaleDateString('th-TH')}</p>
              <p><strong>Status:</strong> <span className="text-green-600 font-semibold">{order.status || 'Processing'}</span></p>
              <p><strong>Shipping:</strong> Free Shipping</p>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <CreditCard className="h-6 w-6 mr-2 text-blue-600" />
            Payment Information
          </h2>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">
              Please complete your payment
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              Transfer the total amount to the following bank account:
            </p>
            <div className="bg-white rounded p-3 space-y-1 text-gray-700">
              <p><strong>Bank:</strong> Bangkok Bank</p>
              <p><strong>Account Number:</strong> 1234567890</p>
              <p><strong>Account Name:</strong> Your Name Here</p>
              <p className="text-lg font-bold text-blue-600 mt-2">
                Amount: ฿{order.total.toLocaleString()}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            After transferring, please send the payment slip to our email or WhatsApp.
            We will process your order once payment is confirmed.
          </p>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Package className="h-6 w-6 mr-2 text-blue-600" />
            Order Items
          </h2>

          <div className="divide-y divide-gray-200">
            {order.items.map((item, index) => (
              <div key={index} className="py-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{item.productName}</p>
                    <p className="text-sm text-gray-600">
                      ฿{item.price.toLocaleString()} x {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-gray-800">
                  ฿{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Order Total */}
          <div className="border-t pt-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold">฿{order.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-semibold text-green-600">FREE</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span className="font-semibold">฿0</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                <span>Total</span>
                <span className="text-blue-600">฿{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Home className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center space-x-2 bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition"
          >
            <Package className="h-5 w-5" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-700">
            A confirmation email has been sent to <strong>{order.customer.email}</strong>
          </p>
          <p className="text-xs text-gray-600 mt-2">
            If you have any questions about your order, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
}
