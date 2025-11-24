'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AdminGuard } from '@/components/RouteGuard';
import {
  Package,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  ShoppingCart,
  Percent,
} from 'lucide-react';

interface BundleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface ProductBundle {
  id: string;
  name: string;
  description: string;
  items: BundleItem[];
  originalPrice: number;
  bundlePrice: number;
  discount: number;
  status: 'active' | 'inactive' | 'archived';
  image?: string;
  soldCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<ProductBundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedBundle, setSelectedBundle] = useState<ProductBundle | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for create modal
  const [newBundleName, setNewBundleName] = useState('');
  const [newBundleDesc, setNewBundleDesc] = useState('');
  const [newBundlePrice, setNewBundlePrice] = useState('');
  const [newBundleDiscount, setNewBundleDiscount] = useState('10');
  const [newBundleStatus, setNewBundleStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    fetchBundles();
  }, []);

  const handleCreateBundle = () => {
    if (!newBundleName || !newBundleDesc || !newBundlePrice) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const bundlePrice = parseFloat(newBundlePrice);
    const discount = parseFloat(newBundleDiscount);
    const originalPrice = bundlePrice / (1 - discount / 100);

    const newBundle: ProductBundle = {
      id: `bundle-${Date.now()}`,
      name: newBundleName,
      description: newBundleDesc,
      items: [
        { productId: 'prod-demo', productName: 'Sample Product', quantity: 1, price: bundlePrice }
      ],
      originalPrice: Math.round(originalPrice),
      bundlePrice: Math.round(bundlePrice),
      discount: discount,
      status: newBundleStatus,
      soldCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setBundles([newBundle, ...bundles]);

    // Reset form
    setNewBundleName('');
    setNewBundleDesc('');
    setNewBundlePrice('');
    setNewBundleDiscount('10');
    setNewBundleStatus('active');
    setIsCreateModalOpen(false);
  };

  const fetchBundles = async () => {
    try {
      setIsLoading(true);
      // Demo data for now
      const demoBundles: ProductBundle[] = [
        {
          id: 'bundle-001',
          name: 'Starter Package',
          description: 'Perfect for beginners - includes everything you need to get started',
          items: [
            { productId: 'prod-001', productName: 'MacBook Pro 16"', quantity: 1, price: 2500 },
            { productId: 'prod-002', productName: 'Magic Mouse', quantity: 1, price: 100 },
            { productId: 'prod-003', productName: 'USB-C Cable', quantity: 2, price: 20 },
          ],
          originalPrice: 2640,
          bundlePrice: 2400,
          discount: 9,
          status: 'active',
          soldCount: 45,
          createdAt: new Date(Date.now() - 86400000 * 30),
          updatedAt: new Date(Date.now() - 86400000 * 5),
        },
        {
          id: 'bundle-002',
          name: 'Office Bundle',
          description: 'Complete office setup for productivity',
          items: [
            { productId: 'prod-004', productName: 'iPad Air', quantity: 1, price: 600 },
            { productId: 'prod-005', productName: 'Apple Pencil', quantity: 1, price: 120 },
            { productId: 'prod-006', productName: 'Smart Keyboard', quantity: 1, price: 180 },
          ],
          originalPrice: 900,
          bundlePrice: 800,
          discount: 11,
          status: 'active',
          soldCount: 32,
          createdAt: new Date(Date.now() - 86400000 * 20),
          updatedAt: new Date(Date.now() - 86400000 * 2),
        },
        {
          id: 'bundle-003',
          name: 'Gaming Setup',
          description: 'Ultimate gaming experience package',
          items: [
            { productId: 'prod-007', productName: 'Gaming Monitor', quantity: 1, price: 450 },
            { productId: 'prod-008', productName: 'Gaming Keyboard', quantity: 1, price: 150 },
            { productId: 'prod-009', productName: 'Gaming Mouse', quantity: 1, price: 80 },
            { productId: 'prod-010', productName: 'Headset', quantity: 1, price: 120 },
          ],
          originalPrice: 800,
          bundlePrice: 700,
          discount: 13,
          status: 'active',
          soldCount: 28,
          createdAt: new Date(Date.now() - 86400000 * 15),
          updatedAt: new Date(Date.now() - 86400000 * 1),
        },
        {
          id: 'bundle-004',
          name: 'Student Pack',
          description: 'Essential tools for students',
          items: [
            { productId: 'prod-011', productName: 'Laptop', quantity: 1, price: 800 },
            { productId: 'prod-012', productName: 'Backpack', quantity: 1, price: 50 },
            { productId: 'prod-013', productName: 'Notebook Set', quantity: 1, price: 20 },
          ],
          originalPrice: 870,
          bundlePrice: 750,
          discount: 14,
          status: 'inactive',
          soldCount: 15,
          createdAt: new Date(Date.now() - 86400000 * 10),
          updatedAt: new Date(Date.now() - 86400000 * 3),
        },
      ];
      setBundles(demoBundles);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBundles = bundles.filter((bundle) => {
    const matchesSearch =
      bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bundle.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bundle.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalBundles: bundles.length,
    activeBundles: bundles.filter((b) => b.status === 'active').length,
    totalSold: bundles.reduce((sum, b) => sum + b.soldCount, 0),
    totalRevenue: bundles.reduce((sum, b) => sum + b.bundlePrice * b.soldCount, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
      case 'archived':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">Loading bundles...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <AdminGuard>
      <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Bundles</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create and manage product package deals
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Bundle
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Bundles</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.totalBundles}
                </p>
              </div>
              <Package className="h-10 w-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {stats.activeBundles}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sold</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {stats.totalSold}
                </p>
              </div>
              <ShoppingCart className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  ฿{(stats.totalRevenue / 1000).toFixed(1)}k
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bundles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBundles.length > 0 ? (
            filteredBundles.map((bundle) => (
              <div
                key={bundle.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Bundle Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {bundle.name}
                      </h3>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          bundle.status
                        )}`}
                      >
                        {bundle.status}
                      </span>
                    </div>
                    <Package className="h-8 w-8 text-purple-500" />
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {bundle.description}
                  </p>

                  {/* Items Count */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {bundle.items.length} items included:
                    </p>
                    <div className="space-y-1">
                      {bundle.items.slice(0, 3).map((item, idx) => (
                        <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                          • {item.quantity}x {item.productName}
                        </p>
                      ))}
                      {bundle.items.length > 3 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          + {bundle.items.length - 3} more items
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-through">
                          ฿{bundle.originalPrice.toLocaleString()}
                        </p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          ฿{bundle.bundlePrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full">
                        <Percent className="h-4 w-4" />
                        <span className="text-sm font-semibold">{bundle.discount}% OFF</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {bundle.soldCount} bundles sold
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedBundle(bundle)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => alert('Edit bundle feature coming soon!')}
                    className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded transition-colors"
                    title="Edit Bundle"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => alert('Delete bundle feature coming soon!')}
                    className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Delete Bundle"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Package className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                No bundles found
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Create your first product bundle to start selling package deals
              </p>
            </div>
          )}
        </div>

        {/* Bundle Details Modal */}
        {selectedBundle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedBundle.name}
                </h2>
                <button
                  onClick={() => setSelectedBundle(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Description</p>
                    <p className="text-gray-900 dark:text-white">{selectedBundle.description}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Bundle Items</p>
                    <div className="space-y-2">
                      {selectedBundle.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {item.productName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ฿{item.price.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Original Price</p>
                      <p className="text-lg font-semibold text-gray-500 dark:text-gray-400 line-through">
                        ฿{selectedBundle.originalPrice.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bundle Price</p>
                      <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                        ฿{selectedBundle.bundlePrice.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Discount</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {selectedBundle.discount}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sold Count</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedBundle.soldCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedBundle(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Bundle Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  สร้าง Bundle ใหม่
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ชื่อ Bundle *
                  </label>
                  <input
                    type="text"
                    value={newBundleName}
                    onChange={(e) => setNewBundleName(e.target.value)}
                    placeholder="เช่น Starter Package"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    คำอธิบาย *
                  </label>
                  <textarea
                    value={newBundleDesc}
                    onChange={(e) => setNewBundleDesc(e.target.value)}
                    placeholder="อธิบายรายละเอียด bundle"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ราคา Bundle (฿) *
                    </label>
                    <input
                      type="number"
                      value={newBundlePrice}
                      onChange={(e) => setNewBundlePrice(e.target.value)}
                      placeholder="2400"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ส่วนลด (%)
                    </label>
                    <input
                      type="number"
                      value={newBundleDiscount}
                      onChange={(e) => setNewBundleDiscount(e.target.value)}
                      placeholder="10"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    สถานะ
                  </label>
                  <select
                    value={newBundleStatus}
                    onChange={(e) => setNewBundleStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>ราคาเต็ม:</strong> ฿{newBundlePrice ? Math.round(parseFloat(newBundlePrice) / (1 - parseFloat(newBundleDiscount || '0') / 100)).toLocaleString() : '0'}
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>ราคา Bundle:</strong> ฿{newBundlePrice ? parseFloat(newBundlePrice).toLocaleString() : '0'}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    <strong>ประหยัด:</strong> {newBundleDiscount}%
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleCreateBundle}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  สร้าง Bundle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
    </AdminGuard>
  );
}
