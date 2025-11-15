'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { formatCurrency, getStatusColor, getChannelColor } from '@/lib/utils';
import { Search, Eye, Download, ShoppingCart, RefreshCw, Edit, CreditCard, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { OrderStatus, OrderChannel, Order } from '@/types';
import { useOrders } from '@/lib/hooks/useOrders';
import OrderDetailsModal from '@/components/orders/OrderDetailsModal';
import UpdateOrderStatusModal from '@/components/orders/UpdateOrderStatusModal';
import { PaymentModal } from '@/components/payments/PaymentModal';
import { InvoiceModal } from '@/components/invoices/InvoiceModal';

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<OrderChannel | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const { orders, loading, error, refresh } = useOrders({
    search: searchTerm,
    status: statusFilter,
    channel: channelFilter,
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setIsUpdateStatusModalOpen(true);
  };

  const handleStatusUpdateSuccess = () => {
    refresh();
  };

  const handlePaymentClick = (order: Order) => {
    setSelectedOrder(order);
    setIsPaymentModalOpen(true);
  };

  const handleInvoiceClick = (order: Order) => {
    setSelectedOrder(order);
    setIsInvoiceModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    refresh();
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">คำสั่งซื้อ</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">จัดการคำสั่งซื้อทั้งหมดในระบบ</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <StatCard
            label="ทั้งหมด"
            value={statusCounts.all}
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
          <StatCard
            label="รอดำเนินการ"
            value={statusCounts.pending}
            color="yellow"
            active={statusFilter === 'pending'}
            onClick={() => setStatusFilter('pending')}
          />
          <StatCard
            label="กำลังดำเนินการ"
            value={statusCounts.processing}
            color="blue"
            active={statusFilter === 'processing'}
            onClick={() => setStatusFilter('processing')}
          />
          <StatCard
            label="จัดส่งแล้ว"
            value={statusCounts.shipped}
            color="purple"
            active={statusFilter === 'shipped'}
            onClick={() => setStatusFilter('shipped')}
          />
          <StatCard
            label="สำเร็จ"
            value={statusCounts.delivered}
            color="green"
            active={statusFilter === 'delivered'}
            onClick={() => setStatusFilter('delivered')}
          />
          <StatCard
            label="ยกเลิก"
            value={statusCounts.cancelled}
            color="red"
            active={statusFilter === 'cancelled'}
            onClick={() => setStatusFilter('cancelled')}
          />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="ค้นหาออเดอร์ (รหัส, ชื่อลูกค้า)..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as OrderChannel | 'all')}
            >
              <option value="all">ทุกช่องทาง</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="mobile">Mobile</option>
              <option value="phone">Phone</option>
            </select>
            <button
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
              <Download className="h-5 w-5" />
              ส่งออก
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              เกิดข้อผิดพลาด: {error}
            </p>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    รหัสออเดอร์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    สินค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ช่องทาง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ยอดรวม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    วันที่สั่ง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="h-8 w-8 text-gray-400 dark:text-gray-500 animate-spin" />
                        <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <ShoppingCart className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">ไม่พบคำสั่งซื้อที่ค้นหา</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          #{order.id.toUpperCase().slice(0, 8)}
                        </div>
                        {order.paymentMethod && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {order.paymentMethod}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {order.items.length} รายการ
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {order.items.map((item) => item.productName).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-md border ${getChannelColor(
                            order.channel
                          )}`}
                        >
                          {order.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(order.total)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          สุทธิ: {formatCurrency(order.subtotal)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {format(order.createdAt, 'dd MMM yyyy', { locale: th })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="p-1 text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order)}
                            className="p-1 text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                            title="อัปเดตสถานะ"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePaymentClick(order)}
                            className="p-1 text-purple-600 dark:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded"
                            title="ชำระเงิน"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleInvoiceClick(order)}
                            className="p-1 text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded"
                            title="ออกใบเสร็จ"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        <OrderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          order={selectedOrder}
        />
        <UpdateOrderStatusModal
          isOpen={isUpdateStatusModalOpen}
          onClose={() => setIsUpdateStatusModalOpen(false)}
          order={selectedOrder}
          onSuccess={handleStatusUpdateSuccess}
        />
        {selectedOrder && (
          <>
            <PaymentModal
              isOpen={isPaymentModalOpen}
              orderId={selectedOrder.id}
              amount={Math.round(selectedOrder.total * 100)}
              onClose={() => setIsPaymentModalOpen(false)}
              onSuccess={handlePaymentSuccess}
            />
            <InvoiceModal
              isOpen={isInvoiceModalOpen}
              orderId={selectedOrder.id}
              customerId={selectedOrder.customerId}
              items={selectedOrder.items.map((item) => ({
                description: item.productName,
                quantity: item.quantity,
                price: item.price,
              }))}
              totalAmount={selectedOrder.total}
              onClose={() => setIsInvoiceModalOpen(false)}
              onSuccess={handlePaymentSuccess}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  label,
  value,
  color = 'gray',
  active,
  onClick,
}: {
  label: string;
  value: number;
  color?: 'gray' | 'yellow' | 'blue' | 'purple' | 'green' | 'red';
  active: boolean;
  onClick: () => void;
}) {
  const colors = {
    gray: 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800',
    yellow: 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20',
    blue: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20',
    purple: 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20',
    green: 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20',
    red: 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20',
  };

  const activeColors = {
    gray: 'border-gray-500 dark:border-gray-400 bg-gray-100 dark:bg-gray-700',
    yellow: 'border-yellow-500 dark:border-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    blue: 'border-blue-500 dark:border-blue-600 bg-blue-100 dark:bg-blue-900/30',
    purple: 'border-purple-500 dark:border-purple-600 bg-purple-100 dark:bg-purple-900/30',
    green: 'border-green-500 dark:border-green-600 bg-green-100 dark:bg-green-900/30',
    red: 'border-red-500 dark:border-red-600 bg-red-100 dark:bg-red-900/30',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
        active ? activeColors[color] : colors[color]
      }`}
    >
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </button>
  );
}
