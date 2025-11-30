'use client';

import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/RouteGuard';
import StatusBadge from '@/components/admin/StatusBadge';
import { useOrderSWR } from '@/lib/hooks/useOrderSWR';
import type { Order } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  CreditCard,
  Truck,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  // Use SWR for caching and performance
  const { order, loading, error, refresh, mutate } = useOrderSWR(orderId);

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="p-6 flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
            </div>
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  if (error || !order) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <XCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
              Order Not Found
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error || `The order ${orderId} could not be found.`}
            </p>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </div>
        </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (!confirm(`Change order status to ${newStatus}?`)) return;

    try {
      // Optimistic update: update order status in UI immediately
      await mutate(
        async () => {
          const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          });

          if (!response.ok) {
            throw new Error('Failed to update order status');
          }

          // Return updated order
          return { ...order!, status: newStatus };
        },
        {
          optimisticData: order ? { ...order, status: newStatus } : null,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        }
      );
    } catch (err) {
      console.error('Error updating order:', err);
      alert(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  const handlePrintLabel = () => {
    alert('Print shipping label feature - To be implemented');
  };

  const handleRefund = () => {
    if (confirm('Are you sure you want to refund this order?')) {
      alert('Refund feature - To be implemented');
    }
  };

  const statusTimeline = [
    {
      status: 'new',
      label: 'Order Placed',
      icon: CheckCircle,
      completed: true,
      date: order.createdAt,
    },
    {
      status: 'processing',
      label: 'Processing',
      icon: Clock,
      completed: ['processing', 'shipped', 'delivered'].includes(order.status),
      date: order.createdAt,
    },
    {
      status: 'shipped',
      label: 'Shipped',
      icon: Truck,
      completed: ['shipped', 'delivered'].includes(order.status),
      date: order.createdAt,
    },
    {
      status: 'delivered',
      label: 'Delivered',
      icon: Package,
      completed: order.status === 'delivered',
      date: order.createdAt,
    },
  ];

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Order {order.id}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Placed on {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm', { locale: th })}
            </p>
          </div>
          <StatusBadge status={order.status} size="lg" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value as MockOrder['status'])}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-medium"
          >
            <option value="new">New</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={handlePrintLabel}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Label
          </button>
          <button
            onClick={handleRefund}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Refund
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </h2>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.product}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Quantity: {item.qty}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.price * item.qty)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.price)} each
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatCurrency(order.items.reduce((sum, item) => sum + (item.price * item.qty), 0))}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            {order.status !== 'cancelled' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Order Timeline
                </h2>
                <div className="relative">
                  {statusTimeline.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.status} className="flex gap-4 pb-8 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-full ${
                              item.completed
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          {index < statusTimeline.length - 1 && (
                            <div
                              className={`w-0.5 h-full mt-2 ${
                                item.completed
                                  ? 'bg-green-500 dark:bg-green-600'
                                  : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div
                            className={`font-medium ${
                              item.completed
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {item.label}
                          </div>
                          {item.completed && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {format(new Date(item.date), 'dd MMM yyyy, HH:mm', {
                                locale: th,
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Details
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Name</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {order.customerName}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {order.customerEmail}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Phone</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {order.customerPhone}
                    </div>
                  </div>
                </div>
                {order.shippingAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Shipping Address
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {order.shippingAddress}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Payment Method
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {order.paymentMethod}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Channel</div>
                  <div className="font-medium text-gray-900 dark:text-white capitalize">
                    {order.channel}
                  </div>
                </div>
                {order.trackingNumber && (
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Tracking Number
                    </div>
                    <div className="font-medium text-blue-600 dark:text-blue-400">
                      {order.trackingNumber}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </AdminLayout>
    </AdminGuard>
  );
}
