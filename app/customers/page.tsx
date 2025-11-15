'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { mockCustomers } from '@/lib/data/mock-data';
import { formatCurrency, getTagColor } from '@/lib/utils';
import { Search, Plus, Mail, Phone, MapPin, ShoppingBag, DollarSign, Users, Star } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { CustomerTag } from '@/types';

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState<CustomerTag | 'all'>('all');

  const filteredCustomers = mockCustomers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    const matchesTag =
      tagFilter === 'all' || customer.tags.includes(tagFilter);
    return matchesSearch && matchesTag;
  });

  const totalSpent = mockCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrders = mockCustomers.reduce((sum, c) => sum + c.totalOrders, 0);
  const vipCount = mockCustomers.filter((c) => c.tags.includes('vip')).length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ลูกค้า</h1>
            <p className="text-gray-600 mt-1">จัดการข้อมูลลูกค้าในระบบ</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-5 w-5" />
            เพิ่มลูกค้า
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ลูกค้าทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockCustomers.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ลูกค้า VIP</p>
                <p className="text-2xl font-bold text-gray-900">{vipCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">มูลค่ารวม</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ออเดอร์รวม</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalOrders}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาลูกค้า (ชื่อ, อีเมล, เบอร์โทร)..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value as CustomerTag | 'all')}
            >
              <option value="all">ทุกกลุ่ม</option>
              <option value="vip">VIP</option>
              <option value="regular">Regular</option>
              <option value="new">New</option>
              <option value="wholesale">Wholesale</option>
            </select>
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              {/* Customer Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-lg font-semibold text-blue-700">
                      {customer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {customer.name}
                    </h3>
                    <div className="flex gap-1 mt-1">
                      {customer.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 text-xs font-medium rounded border ${getTagColor(
                            tag
                          )}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{customer.phone}</span>
                </div>
                {customer.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{customer.address}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-600">ยอดรวม</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">จำนวนออเดอร์</p>
                  <p className="text-lg font-bold text-gray-900">
                    {customer.totalOrders}
                  </p>
                </div>
              </div>

              {/* Last Order */}
              {customer.lastOrderDate && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    ซื้อล่าสุด:{' '}
                    {format(customer.lastOrderDate, 'dd MMM yyyy', {
                      locale: th,
                    })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">ไม่พบลูกค้าที่ค้นหา</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
