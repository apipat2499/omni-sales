'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { formatCurrency, getStatusColor, getChannelColor } from '@/lib/utils';
import { Search, Eye, Download, ShoppingCart, RefreshCw, Edit, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { OrderStatus, OrderChannel } from '@/types';
import { useOrdersQuery } from '@/lib/hooks/useOrdersQuery';
import OrderDetailsModal from '@/components/orders/OrderDetailsModal';
import UpdateOrderStatusModal from '@/components/orders/UpdateOrderStatusModal';
import CreateOrderModal from '@/components/orders/CreateOrderModal';

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<OrderChannel | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading, error } = useOrdersQuery({
    search: searchTerm,
    status: statusFilter,
    channel: channelFilter,
    page,
    limit: 20,
    sortBy,
    sortOrder,
  });

  const orders = data?.data || [];
  const pagination = data?.pagination;

  const statusCounts = {
    all: pagination?.total || 0,
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateStatus = (order: any) => {
    setSelectedOrder(order);
    setIsUpdateStatusModalOpen(true);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">คำสั่งซื้อ</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">จัดการคำสั่งซื้อทั้งหมดในระบบ</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            สร้างคำสั่งซื้อใหม่
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { label: 'ทั้งหมด', value: statusCounts.all, color: 'blue' },
            { label: 'รอดำเนินการ', value: statusCounts.pending, color: 'yellow' },
            { label: 'กำลังดำเนินการ', value: statusCounts.processing, color: 'blue' },
            { label: 'จัดส่งแล้ว', value: statusCounts.shipped, color: 'purple' },
            { label: 'สำเร็จ', value: statusCounts.delivered, color: 'green' },
            { label: 'ยกเลิก', value: statusCounts.cancelled, color: 'red' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              <p className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาคำสั่งซื้อ (Order ID, ชื่อลูกค้า)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as OrderStatus | 'all');
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="processing">กำลังดำเนินการ</option>
              <option value="shipped">จัดส่งแล้ว</option>
              <option value="delivered">สำเร็จ</option>
              <option value="cancelled">ยกเลิก</option>
            </select>

            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value as OrderChannel | 'all');
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">ทุกช่องทาง</option>
              <option value="online">ออนไลน์</option>
              <option value="pos">หน้าร้าน (POS)</option>
              <option value="phone">โทรศัพท์</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
        </div>

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
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">ไม่พบคำสั่งซื้อ</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('id')}
                      >
                        <div className="flex items-center gap-2">
                          Order ID
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ลูกค้า
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        รายการ
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('total')}
                      >
                        <div className="flex items-center gap-2">
                          ยอดรวม
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ช่องทาง
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center gap-2">
                          วันที่
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {order.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {order.items.length} รายการ
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status === 'pending' && 'รอดำเนินการ'}
                            {order.status === 'processing' && 'กำลังดำเนินการ'}
                            {order.status === 'shipped' && 'จัดส่งแล้ว'}
                            {order.status === 'delivered' && 'สำเร็จ'}
                            {order.status === 'cancelled' && 'ยกเลิก'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChannelColor(order.channel)}`}>
                            {order.channel === 'online' && 'ออนไลน์'}
                            {order.channel === 'pos' && 'หน้าร้าน'}
                            {order.channel === 'phone' && 'โทรศัพท์'}
                            {order.channel === 'other' && 'อื่นๆ'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(order.createdAt), 'd MMM yyyy', { locale: th })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewOrder(order)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="ดูรายละเอียด"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="อัพเดทสถานะ"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                total={pagination.total}
                limit={pagination.limit}
              />
            )}
          </>
        )}

        {/* Modals */}
        <CreateOrderModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleStatusUpdateSuccess}
        />
        <OrderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          order={selectedOrder}
        />
        <UpdateOrderStatusModal
          isOpen={isUpdateStatusModalOpen}
          onClose={() => setIsUpdateStatusModalOpen(false)}
          order={selectedOrder}
        />
        <CreateOrderModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => setIsCreateModalOpen(false)}
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
