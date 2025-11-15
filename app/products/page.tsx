'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProductModal from '@/components/products/ProductModal';
import DeleteProductModal from '@/components/products/DeleteProductModal';
import { useProducts } from '@/lib/hooks/useProducts';
import { formatCurrency, isLowStock, cn } from '@/lib/utils';
import { exportProducts } from '@/lib/utils/export';
import { Search, Plus, Edit, Trash2, AlertCircle, Package, Loader2, Download } from 'lucide-react';
import type { Product, ProductCategory } from '@/types';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { products, loading, error, refresh } = useProducts({
    search: searchTerm,
    category: selectedCategory,
  });

  const lowStockCount = products.filter((p) => isLowStock(p.stock)).length;

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleProductSuccess = () => {
    refresh();
  };

  const handleDeleteSuccess = () => {
    refresh();
  };

  const categories: (ProductCategory | 'all')[] = [
    'all',
    'Electronics',
    'Clothing',
    'Food & Beverage',
    'Home & Garden',
    'Sports',
    'Books',
    'Other',
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">สินค้า</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">จัดการสินค้าในระบบ</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportProducts(products)}
              disabled={products.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
              Export CSV
            </button>
            <button
              onClick={handleAddProduct}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              เพิ่มสินค้า
            </button>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                แจ้งเตือนสต็อกสินค้า
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                มีสินค้า {lowStockCount} รายการที่สต็อกเหลือน้อย (น้อยกว่า 10 ชิ้น)
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">สินค้าทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {products.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">มูลค่าสต็อก</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(
                    products.reduce((sum, p) => sum + p.cost * p.stock, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">สต็อกเหลือน้อย</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {lowStockCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="ค้นหาสินค้า (ชื่อ, SKU)..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | 'all')}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'ทุกหมวดหมู่' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ชื่อสินค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    หมวดหมู่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ราคาขาย
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ราคาทุน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    สต็อก
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    กำไร
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product) => {
                  const profit = product.price - product.cost;
                  const profitMargin = ((profit / product.price) * 100).toFixed(1);
                  const lowStock = isLowStock(product.stock);

                  return (
                    <tr key={product.id} className={cn(
                      'hover:bg-gray-50 dark:hover:bg-gray-700',
                      lowStock && 'bg-yellow-50 dark:bg-yellow-900/20'
                    )}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                        {lowStock && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-500" />
                            <span className="text-xs text-yellow-600 dark:text-yellow-500">
                              สต็อกเหลือน้อย
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {product.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(product.cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          'px-2 py-1 text-xs font-medium rounded-md',
                          lowStock
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        )}>
                          {product.stock} ชิ้น
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600 dark:text-green-500">
                          {formatCurrency(profit)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {profitMargin}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-1 text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                            title="แก้ไขสินค้า"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-1 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                            title="ลบสินค้า"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 text-blue-500 dark:text-blue-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={refresh}
                className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                ลองอีกครั้ง
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">ไม่พบสินค้าที่ค้นหา</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        onSuccess={handleProductSuccess}
      />
      <DeleteProductModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        product={selectedProduct}
        onSuccess={handleDeleteSuccess}
      />
    </DashboardLayout>
  );
}
