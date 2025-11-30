'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/RouteGuard';
import { useProductsSWR } from '@/lib/hooks/useProductsSWR';
import { useRealtimeProducts } from '@/lib/hooks/useRealtimeProducts';
import { useAdvancedSearch } from '@/lib/hooks/useAdvancedSearch';
import { useBulkSelect } from '@/lib/hooks/useBulkSelect';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import {
  Search,
  Edit,
  Plus,
  AlertTriangle,
  Package,
  DollarSign,
  TrendingDown,
  Loader2,
  Trash2,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import StatCard from '@/components/admin/StatCard';
import Pagination from '@/components/Pagination';
import SearchInput from '@/components/SearchInput';
import AdvancedFilter, { FilterField, FilterValues } from '@/components/AdvancedFilter';
import ExportButton from '@/components/ExportButton';
import Checkbox from '@/components/Checkbox';
import BulkActionBar, { BulkAction } from '@/components/BulkActionBar';
import { bulkDeleteProducts, bulkExportToCSV } from '@/lib/utils/bulk-operations';

export default function AdminProductsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Use SWR for caching and performance
  const { products: swrProducts, loading, error, refresh, mutate } = useProductsSWR();

  // Use Realtime for live updates
  const { products: realtimeProducts, setProducts } = useRealtimeProducts(swrProducts);

  // Sync realtime products back to SWR cache
  useEffect(() => {
    if (realtimeProducts.length > 0 && realtimeProducts !== swrProducts) {
      mutate(realtimeProducts, false); // Update cache without revalidation
    }
  }, [realtimeProducts, swrProducts, mutate]);

  // Use realtime products for display
  const allProducts = realtimeProducts.length > 0 ? realtimeProducts : swrProducts;

  // Advanced Search & Filter
  const {
    searchTerm,
    setSearchTerm,
    filterValues,
    setFilterValues,
    clearFilters,
    results: filteredProductsList,
    totalCount,
    filteredCount,
    hasActiveFilters,
    hasActiveSearch,
  } = useAdvancedSearch<Product>({
    data: allProducts,
    searchFields: ['name', 'sku', 'category'],
    fuzzy: true,
    fuzzyThreshold: 0.6,
    filters: {
      category: (product, value) => product.category === value,
      priceRange: (product, value) => {
        if (!value.min && !value.max) return true;
        const min = value.min ? parseFloat(value.min) : 0;
        const max = value.max ? parseFloat(value.max) : Infinity;
        return product.price >= min && product.price <= max;
      },
      stockRange: (product, value) => {
        if (!value.min && !value.max) return true;
        const min = value.min ? parseInt(value.min) : 0;
        const max = value.max ? parseInt(value.max) : Infinity;
        return product.stock >= min && product.stock <= max;
      },
      inStockOnly: (product, value) => (value === 'true' ? product.stock > 0 : true),
    },
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for add product modal
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCost, setNewProductCost] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductSKU, setNewProductSKU] = useState('');

  const handleAddProduct = async () => {
    if (!newProductName || !newProductPrice || !newProductCost || !newProductStock || !newProductCategory || !newProductSKU) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);

    const newProduct = {
      name: newProductName,
      price: parseFloat(newProductPrice),
      cost: parseFloat(newProductCost),
      stock: parseInt(newProductStock),
      category: newProductCategory,
      sku: newProductSKU,
    };

    try {
      // Optimistic update: add product to UI immediately
      await mutate(
        async () => {
          const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'ไม่สามารถเพิ่มสินค้าได้');
          }

          const addedProduct = await response.json();

          // Return updated products list
          return [...allProducts, addedProduct];
        },
        {
          optimisticData: [
            ...allProducts,
            {
              ...newProduct,
              id: `temp-${Date.now()}`,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as Product,
          ],
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        }
      );

      // Reset form
      setNewProductName('');
      setNewProductPrice('');
      setNewProductCost('');
      setNewProductStock('');
      setNewProductCategory('');
      setNewProductSKU('');
      setIsAddModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate stats from ALL products
  const stats = {
    total: allProducts.length,
    lowStock: allProducts.filter(p => p.stock < 10).length,
    outOfStock: allProducts.filter(p => p.stock === 0).length,
    totalValue: allProducts.reduce((sum, p) => sum + (p.price * p.stock), 0),
  };

  // Get unique categories
  const categories = [...new Set(allProducts.map((p) => p.category))];

  // Filter fields for advanced filter component
  const filterFields: FilterField[] = [
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      options: categories.map((cat) => ({ value: cat, label: cat })),
    },
    {
      id: 'priceRange',
      label: 'Price Range (฿)',
      type: 'numberRange',
    },
    {
      id: 'stockRange',
      label: 'Stock Range',
      type: 'numberRange',
    },
    {
      id: 'inStockOnly',
      label: 'Availability',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'true', label: 'In Stock Only' },
      ],
    },
  ];

  // Pagination
  const totalPages = Math.ceil(filteredProductsList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const filteredProducts = filteredProductsList.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterValues]);

  // Bulk selection
  const bulk = useBulkSelect<Product>({
    items: filteredProducts,
    getItemId: (product) => product.id,
  });

  // Bulk actions handlers
  const handleBulkAction = async (actionId: string) => {
    if (bulk.selectedCount === 0) return;

    try {
      if (actionId === 'delete') {
        await bulkDeleteProducts(bulk.selectedIds);
        // Refresh data after deletion
        await refresh();
        bulk.clearSelection();
      } else if (actionId === 'export') {
        bulkExportToCSV(
          bulk.selectedItems,
          'selected-products',
          [
            { key: 'name', label: 'Product Name' },
            { key: 'sku', label: 'SKU' },
            { key: 'category', label: 'Category' },
            { key: 'price', label: 'Price' },
            { key: 'cost', label: 'Cost' },
            { key: 'stock', label: 'Stock' },
          ]
        );
        bulk.clearSelection();
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const bulkActions: BulkAction[] = [
    {
      id: 'export',
      label: 'ส่งออก CSV',
      icon: <Download className="h-4 w-4" />,
      variant: 'default',
    },
    {
      id: 'delete',
      label: 'ลบรายการ',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      requiresConfirmation: true,
      confirmationMessage: 'คลิกอีกครั้งเพื่อยืนยันการลบ',
    },
  ];

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600" />
            <div>
              <p className="text-red-600 font-semibold">เกิดข้อผิดพลาด</p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{error}</p>
            </div>
            <button
              onClick={() => refresh()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              ลองอีกครั้ง
            </button>
          </div>
        </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Products Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              จัดการสินค้าและสต็อกสินค้า
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add New Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Products"
            value={stats.total}
            icon={Package}
            color="blue"
          />
          <StatCard
            title="Total Value"
            value={formatCurrency(stats.totalValue)}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Low Stock"
            value={stats.lowStock}
            icon={AlertTriangle}
            color="yellow"
          />
          <StatCard
            title="Out of Stock"
            value={stats.outOfStock}
            icon={TrendingDown}
            color="red"
          />
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input with Fuzzy Search */}
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by product name, SKU, or category..."
                fuzzy={true}
                resultsCount={filteredCount}
                totalCount={totalCount}
              />
            </div>

            {/* Advanced Filters */}
            <div className="flex gap-2">
              <AdvancedFilter
                fields={filterFields}
                values={filterValues}
                onChange={setFilterValues}
                onReset={clearFilters}
              />

              {/* Export Button */}
              <ExportButton
                data={filteredProductsList}
                filename="products-export"
                columns={[
                  { key: 'name', label: 'Product Name' },
                  { key: 'sku', label: 'SKU' },
                  { key: 'category', label: 'Category' },
                  { key: 'price', label: 'Price' },
                  { key: 'stock', label: 'Stock' },
                ]}
                onExport={(format) => {
                  console.log(`Exporting ${filteredProductsList.length} products as ${format}`);
                }}
              />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={bulk.isAllSelected}
                      onChange={bulk.toggleAll}
                      indeterminate={bulk.isIndeterminate}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <p className="text-gray-600 dark:text-gray-400">
                          No products found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isLowStock = product.stock < 10;
                    const isOutOfStock = product.stock === 0;

                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          bulk.isSelected(product.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Checkbox
                            checked={bulk.isSelected(product.id)}
                            onChange={() => bulk.toggleItem(product.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {product.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-300">
                            {product.sku}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(product.price)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                isOutOfStock
                                  ? 'text-red-600 dark:text-red-400'
                                  : isLowStock
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {product.stock}
                            </span>
                            {isLowStock && !isOutOfStock && (
                              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredProductsList.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProductsList.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => {
                setItemsPerPage(newSize);
                setCurrentPage(1);
              }}
              showItemsPerPage={true}
            />
          )}
        </div>

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedCount={bulk.selectedCount}
          totalCount={filteredProducts.length}
          actions={bulkActions}
          onAction={handleBulkAction}
          onClear={bulk.clearSelection}
        />

        {/* Add Product Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  เพิ่มสินค้าใหม่
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ชื่อสินค้า *
                    </label>
                    <input
                      type="text"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="เช่น เสื้อยืดสีขาว"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      รหัสสินค้า (SKU) *
                    </label>
                    <input
                      type="text"
                      value={newProductSKU}
                      onChange={(e) => setNewProductSKU(e.target.value)}
                      placeholder="เช่น TEE-WHT-001"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      หมวดหมู่ *
                    </label>
                    <input
                      type="text"
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      placeholder="เช่น เสื้อผ้า"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ราคาขาย (฿) *
                    </label>
                    <input
                      type="number"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="299"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ราคาทุน (฿) *
                    </label>
                    <input
                      type="number"
                      value={newProductCost}
                      onChange={(e) => setNewProductCost(e.target.value)}
                      placeholder="200"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      จำนวนสต็อก *
                    </label>
                    <input
                      type="number"
                      value={newProductStock}
                      onChange={(e) => setNewProductStock(e.target.value)}
                      placeholder="100"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {newProductPrice && newProductStock && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>มูลค่ารวม:</strong> ฿{(parseFloat(newProductPrice) * parseInt(newProductStock || '0')).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'กำลังเพิ่ม...' : 'เพิ่มสินค้า'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </AdminLayout>
    </AdminGuard>
  );
}
