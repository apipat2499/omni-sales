'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { mockOrders } from '@/lib/data/mock-data';
import { formatCurrency, getStatusColor, getChannelColor } from '@/lib/utils';
import { Search, Filter, Eye, Download, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { OrderStatus, OrderChannel } from '@/types';

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<OrderChannel | 'all'>('all');

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter;
    const matchesChannel =
      channelFilter === 'all' || order.channel === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const statusCounts = {
    all: mockOrders.length,
    pending: mockOrders.filter((o) => o.status === 'pending').length,
    processing: mockOrders.filter((o) => o.status === 'processing').length,
    shipped: mockOrders.filter((o) => o.status === 'shipped').length,
    delivered: mockOrders.filter((o) => o.status === 'delivered').length,
    cancelled: mockOrders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">คำสั่งซื้อ</h1>
          <p className="text-gray-600 mt-1">จัดการคำสั่งซื้อทั้งหมดในระบบ</p>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาออเดอร์ (รหัส, ชื่อลูกค้า)..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as OrderChannel | 'all')}
            >
              <option value="all">ทุกช่องทาง</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="mobile">Mobile</option>
              <option value="phone">Phone</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="h-5 w-5" />
              ส่งออก
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รหัสออเดอร์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สินค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ช่องทาง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ยอดรวม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่สั่ง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order.id.toUpperCase()}
                      </div>
                      {order.paymentMethod && (
                        <div className="text-xs text-gray-500">
                          {order.paymentMethod}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.length} รายการ
                      </div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">
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
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </div>
                      <div className="text-xs text-gray-500">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(order.createdAt, 'dd MMM yyyy', { locale: th })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">ไม่พบคำสั่งซื้อที่ค้นหา</p>
            </div>
          )}
        </div>
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
    gray: 'border-gray-300 bg-gray-50',
    yellow: 'border-yellow-300 bg-yellow-50',
    blue: 'border-blue-300 bg-blue-50',
    purple: 'border-purple-300 bg-purple-50',
    green: 'border-green-300 bg-green-50',
    red: 'border-red-300 bg-red-50',
  };

  const activeColors = {
    gray: 'border-gray-500 bg-gray-100',
    yellow: 'border-yellow-500 bg-yellow-100',
    blue: 'border-blue-500 bg-blue-100',
    purple: 'border-purple-500 bg-purple-100',
    green: 'border-green-500 bg-green-100',
    red: 'border-red-500 bg-red-100',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
        active ? activeColors[color] : colors[color]
      }`}
    >
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </button>
  );
}
