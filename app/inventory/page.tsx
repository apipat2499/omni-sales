'use client';

import DashboardLayout from '@/components/DashboardLayout';
import {
  Warehouse,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  PackageCheck,
  PackageX,
  Clock,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  inStock: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  reorderQty: number;
  lastRestocked: string;
  supplier: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock' | 'overstock';
  value: number;
}

const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    sku: 'IPH-15PM-256',
    category: 'อิเล็กทรอนิกส์',
    inStock: 45,
    reserved: 12,
    available: 33,
    reorderPoint: 20,
    reorderQty: 50,
    lastRestocked: '2024-11-10',
    supplier: 'Apple Thailand',
    status: 'in-stock',
    value: 2250000,
  },
  {
    id: '2',
    name: 'MacBook Air M3',
    sku: 'MBA-M3-13',
    category: 'คอมพิวเตอร์',
    inStock: 8,
    reserved: 3,
    available: 5,
    reorderPoint: 10,
    reorderQty: 20,
    lastRestocked: '2024-11-05',
    supplier: 'Apple Thailand',
    status: 'low-stock',
    value: 480000,
  },
  {
    id: '3',
    name: 'AirPods Pro 2',
    sku: 'APP-2-WHT',
    category: 'อุปกรณ์เสริม',
    inStock: 0,
    reserved: 0,
    available: 0,
    reorderPoint: 15,
    reorderQty: 30,
    lastRestocked: '2024-10-28',
    supplier: 'Apple Thailand',
    status: 'out-of-stock',
    value: 0,
  },
  {
    id: '4',
    name: 'Samsung Galaxy S24 Ultra',
    sku: 'SGS-24U-512',
    category: 'อิเล็กทรอนิกส์',
    inStock: 125,
    reserved: 8,
    available: 117,
    reorderPoint: 30,
    reorderQty: 50,
    lastRestocked: '2024-11-12',
    supplier: 'Samsung Thailand',
    status: 'overstock',
    value: 5000000,
  },
  {
    id: '5',
    name: 'Sony WH-1000XM5',
    sku: 'SNY-WH1000XM5',
    category: 'อุปกรณ์เสริม',
    inStock: 12,
    reserved: 2,
    available: 10,
    reorderPoint: 8,
    reorderQty: 15,
    lastRestocked: '2024-11-08',
    supplier: 'Sony Thailand',
    status: 'in-stock',
    value: 156000,
  },
];

const summaryCards = [
  {
    title: 'มูลค่าสินค้าคงคลัง',
    value: '฿7,886,000',
    change: '+5.2%',
    icon: Package,
    color: 'blue',
    trend: 'up',
  },
  {
    title: 'สินค้าใกล้หมด',
    value: '23',
    change: '+3 รายการ',
    icon: AlertTriangle,
    color: 'yellow',
    trend: 'warning',
  },
  {
    title: 'สินค้าหมดสต็อก',
    value: '5',
    change: 'ต้องสั่งซื้อ',
    icon: PackageX,
    color: 'red',
    trend: 'danger',
  },
  {
    title: 'การหมุนเวียนสินค้า',
    value: '12.5x',
    change: '+1.2x',
    icon: TrendingUp,
    color: 'green',
    trend: 'up',
  },
];

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInventory = mockInventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      'in-stock': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
      'low-stock': 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
      'out-of-stock': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
      'overstock': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
    };

    const labels = {
      'in-stock': 'มีสินค้า',
      'low-stock': 'ใกล้หมด',
      'out-of-stock': 'หมดสต็อก',
      'overstock': 'สินค้าล้น',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              จัดการคลังสินค้าและติดตามสต็อก
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              เพิ่มสินค้า
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-${card.color}-100 dark:bg-${card.color}-900/30 rounded-lg`}>
                    <Icon className={`h-6 w-6 text-${card.color}-600 dark:text-${card.color}-400`} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {card.value}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{card.change}</p>
              </div>
            );
          })}
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="in-stock">มีสินค้า</option>
              <option value="low-stock">ใกล้หมด</option>
              <option value="out-of-stock">หมดสต็อก</option>
              <option value="overstock">สินค้าล้น</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
              <Filter className="h-4 w-4" />
              ตัวกรอง
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    สินค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    หมวดหมู่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ในคลัง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    จอง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    พร้อมขาย
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    มูลค่า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    การกระทำ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.supplier}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                        {item.sku}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 dark:text-white">{item.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.inStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.reserved}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {item.available}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ฿{item.value.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                        แก้ไข
                      </button>
                      <button className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                        สั่งซื้อ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-12">
              <Warehouse className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">ไม่พบข้อมูลสินค้า</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
