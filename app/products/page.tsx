'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProductModal from '@/components/products/ProductModal';
import DeleteProductModal from '@/components/products/DeleteProductModal';
import StockAdjustmentModal from '@/components/products/StockAdjustmentModal';
import { useProducts } from '@/lib/hooks/useProducts';
import { formatCurrency, isLowStock, cn } from '@/lib/utils';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Package,
  Loader2,
  BarChart3,
  Filter,
  Download,
  Upload,
  TrendingUp,
  PackageCheck,
  DollarSign,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Product, ProductCategory } from '@/types';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, error } = useProductsQuery({
    search: searchTerm,
    category: selectedCategory,
    page,
    limit: 20,
    sortBy,
    sortOrder,
  });

  const products = data?.data || [];
  const pagination = data?.pagination;
  const lowStockCount = products.filter((p) => isLowStock(p.stock)).length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
  const totalPotentialProfit = products.reduce((sum, p) => sum + (p.price - p.cost) * p.stock, 0);

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

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setIsStockModalOpen(true);
  };

  const handleProductSuccess = () => {
    refresh();
  };

  const handleDeleteSuccess = () => {
    refresh();
  };

  const handleStockSuccess = () => {
    refresh();
  };

  const handleExport = () => {
    // Prepare data for export
    const exportData = products.map((product) => ({
      'SKU': product.sku,
      'ชื่อสินค้า': product.name,
      'หมวดหมู่': product.category,
      'ราคาขาย': product.price,
      'ราคาทุน': product.cost,
      'สต็อก': product.stock,
      'มูลค่าสต็อก': product.cost * product.stock,
      'กำไรต่อชิ้น': product.price - product.cost,
      'กำไร %': (((product.price - product.cost) / product.price) * 100).toFixed(2),
      'รายละเอียด': product.description || '',
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // SKU
      { wch: 30 }, // ชื่อสินค้า
      { wch: 20 }, // หมวดหมู่
      { wch: 12 }, // ราคาขาย
      { wch: 12 }, // ราคาทุน
      { wch: 10 }, // สต็อก
      { wch: 15 }, // มูลค่าสต็อก
      { wch: 15 }, // กำไรต่อชิ้น
      { wch: 10 }, // กำไร %
      { wch: 40 }, // รายละเอียด
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'สินค้า');

    // Generate filename with timestamp
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `products_${timestamp}.xlsx`;

    // Export file
    XLSX.writeFile(workbook, filename);
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

  const summaryCards = [
    {
      title: 'มูลค่าสต็อก',
      value: formatCurrency(totalValue),
      change: `${products.length} รายการ`,
      icon: Package,
      color: 'blue' as const,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'สินค้าทั้งหมด',
      value: totalStock.toLocaleString(),
      change: 'ชิ้นในคลัง',
      icon: PackageCheck,
      color: 'green' as const,
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: 'สต็อกเหลือน้อย',
      value: lowStockCount.toString(),
      change: 'ต้องเติมสินค้า',
      icon: AlertCircle,
      color: 'yellow' as const,
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      title: 'กำไรคาดการณ์',
      value: formatCurrency(totalPotentialProfit),
      change: 'หากขายหมด',
      icon: TrendingUp,
      color: 'purple' as const,
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">สินค้า & คลังสินค้า</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              จัดการสินค้าและติดตามสต็อกคงคลัง
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="นำเข้าข้อมูล (เร็วๆ นี้)"
              disabled
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              onClick={handleExport}
              disabled={products.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="ส่งออกเป็น Excel"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={handleAddProduct}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/30"
            >
              <Plus className="h-5 w-5" />
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
                className="relative bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-xl transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-${card.color}-100 dark:bg-${card.color}-900/30 rounded-xl`}>
                      <Icon className={`h-6 w-6 text-${card.color}-600 dark:text-${card.color}-400`} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {card.value}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">{card.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{card.change}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                ⚠️ แจ้งเตือนสต็อกสินค้า
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                มีสินค้า {lowStockCount} รายการที่สต็อกเหลือน้อย (น้อยกว่า 10 ชิ้น) กรุณาเติมสินค้าด่วน!
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า (ชื่อ, SKU)..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white transition-all"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value as ProductCategory | 'all');
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'ทุกหมวดหมู่' : category}
                </option>
              ))}
            </select>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-all">
              <Filter className="h-4 w-4" />
              ตัวกรอง
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    สินค้า
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    หมวดหมู่
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    ราคาขาย
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    ราคาทุน
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    สต็อก
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    มูลค่า
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    กำไร
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-12 w-12 text-blue-500 dark:text-blue-400 animate-spin" />
                        <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                      <p className="text-red-600 dark:text-red-400">{error}</p>
                      <button
                        onClick={refresh}
                        className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                      >
                        ลองอีกครั้ง
                      </button>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">ไม่พบสินค้าที่ค้นหา</p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const profit = product.price - product.cost;
                    const profitMargin = ((profit / product.price) * 100).toFixed(1);
                    const lowStock = isLowStock(product.stock);
                    const stockValue = product.cost * product.stock;

                    return (
                      <tr
                        key={product.id}
                        className={cn(
                          'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                          lowStock && 'bg-yellow-50/50 dark:bg-yellow-900/10'
                        )}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            {lowStock && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-500" />
                                <span className="text-xs text-yellow-600 dark:text-yellow-500 font-medium">
                                  สต็อกเหลือน้อย
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {product.sku}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 dark:text-white">{product.category}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(product.cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                              lowStock
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700'
                            )}
                          >
                            {product.stock} ชิ้น
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(stockValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(profit)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {profitMargin}%
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAdjustStock(product)}
                              className="p-2 text-purple-600 dark:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                              title="ปรับสต็อก"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-2 text-blue-600 dark:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="แก้ไขสินค้า"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-2 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="ลบสินค้า"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StockAdjustmentModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={selectedProduct}
        onSuccess={handleStockSuccess}
      />
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
