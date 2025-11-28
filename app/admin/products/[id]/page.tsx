'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/RouteGuard';
import {
  getProductById,
  updateProduct,
  type MockProduct,
} from '@/lib/admin/mockData';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  Trash2,
  Package,
  DollarSign,
  Hash,
  Tag,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<MockProduct | undefined>(
    getProductById(productId)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    stock: 0,
    category: '',
    sku: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        sku: product.sku,
        status: product.status,
      });
    }
  }, [product]);

  if (!product) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
              Product Not Found
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              The product {productId} could not be found.
            </p>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
          </div>
        </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = updateProduct(productId, formData);

    if (success) {
      alert('Product updated successfully!');
      router.push('/admin/products');
    } else {
      alert('Failed to update product');
    }

    setIsSaving(false);
  };

  const handleDelete = () => {
    if (
      confirm(
        'Are you sure you want to delete this product? This action cannot be undone.'
      )
    ) {
      alert('Delete feature - To be implemented');
      router.push('/admin/products');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? parseFloat(value) || 0 : value,
    }));
  };

  const isLowStock = formData.stock < 10;

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Product
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Update product information and inventory
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          {/* Product Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Information
            </h2>

            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter product name"
                />
              </div>

              {/* SKU */}
              <div>
                <label
                  htmlFor="sku"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2"
                >
                  <Hash className="h-4 w-4" />
                  SKU *
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter SKU"
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2"
                >
                  <Tag className="h-4 w-4" />
                  Category *
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter category"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Price (THB) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Current: {formatCurrency(formData.price)}
                  </p>
                </div>

                {/* Stock */}
                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0"
                  />
                  {isLowStock && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Low stock warning
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Value Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3">
              Inventory Value
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Total Value
                </div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                  {formatCurrency(formData.price * formData.stock)}
                </div>
              </div>
              <div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  Stock Level
                </div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                  {formData.stock} units
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Product
            </button>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/products"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      </AdminLayout>
    </AdminGuard>
  );
}
