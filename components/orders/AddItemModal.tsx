'use client';

import { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock?: number;
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (productId: string, productName: string, quantity: number, price: number) => Promise<boolean>;
  loading: boolean;
}

export default function AddItemModal({
  isOpen,
  onClose,
  onAdd,
  loading,
}: AddItemModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setError(null);
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setFetchingProducts(true);
    try {
      // Fetch products from the products API
      const response = await fetch('/api/products?limit=1000');
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      const productList = Array.isArray(data) ? data : data.data || [];

      // Transform to match our Product interface
      const transformedProducts: Product[] = productList.map((p: any) => ({
        id: p.id,
        name: p.name || p.productName,
        price: parseFloat(p.price || 0),
        stock: p.stock,
      }));

      setProducts(transformedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('ไม่สามารถโหลดรายการสินค้า');
    } finally {
      setFetchingProducts(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedProduct || quantity <= 0) {
      setError('กรุณาเลือกสินค้าและจำนวน');
      return;
    }

    const success = await onAdd(
      selectedProduct.id,
      selectedProduct.name,
      quantity,
      selectedProduct.price
    );

    if (success) {
      // Reset form
      setSelectedProduct(null);
      setQuantity(1);
      setError(null);
      onClose();
    } else {
      setError('ไม่สามารถเพิ่มรายการได้');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              เพิ่มรายการ
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                เลือกสินค้า
              </label>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const product = products.find((p) => p.id === e.target.value);
                  setSelectedProduct(product || null);
                }}
                disabled={fetchingProducts || loading}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">เลือกสินค้า...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (฿{product.price.toFixed(2)})
                  </option>
                ))}
              </select>
              {fetchingProducts && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  กำลังโหลด...
                </p>
              )}
            </div>

            {/* Product Details */}
            {selectedProduct && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  ชื่อสินค้า
                </p>
                <p className="font-medium text-gray-900 dark:text-white mb-3">
                  {selectedProduct.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  ราคา
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  ฿{selectedProduct.price.toFixed(2)}
                </p>
                {selectedProduct.stock !== undefined && (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 mt-3">
                      คลังสินค้า
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedProduct.stock} หน่วย
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                จำนวน
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Total */}
            {selectedProduct && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  รวมทั้งสิ้น
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ฿{(selectedProduct.price * quantity).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedProduct || loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && <Loader className="h-4 w-4 animate-spin" />}
              เพิ่มรายการ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
