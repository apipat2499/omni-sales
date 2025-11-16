'use client';

import { useState, useEffect } from 'react';
import { X, Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock?: number;
  sku?: string;
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
  const [addError, setAddError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setError(null);
      setAddError(null);
      setSearchTerm('');
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setFetchingProducts(true);
    try {
      const response = await fetch('/api/products?limit=1000');
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      const productList = Array.isArray(data) ? data : data.data || [];

      const transformedProducts: Product[] = productList.map((p: any) => ({
        id: p.id,
        name: p.name || p.productName,
        price: parseFloat(p.price || 0),
        stock: p.stock,
        sku: p.sku,
      }));

      setProducts(transformedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('ไม่สามารถโหลดรายการสินค้า');
    } finally {
      setFetchingProducts(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setAddError(null);
  };

  const getAvailableStock = () => {
    if (!selectedProduct) return 0;
    return selectedProduct.stock ?? 999;
  };

  const isStockAvailable = () => {
    if (!selectedProduct) return false;
    if (selectedProduct.stock === undefined || selectedProduct.stock === null) return true;
    return selectedProduct.stock >= quantity;
  };

  const handleQuantityChange = (value: number) => {
    const newQty = Math.max(1, Math.min(value, getAvailableStock()));
    setQuantity(newQty);
  };

  const handleAdd = async () => {
    if (!selectedProduct || quantity <= 0) {
      setAddError('กรุณาเลือกสินค้าและจำนวน');
      return;
    }

    if (!isStockAvailable()) {
      setAddError(
        `สินค้าไม่เพียงพอ (สินค้าคงคลัง: ${getAvailableStock()} หน่วย, ต้องการ: ${quantity} หน่วย)`
      );
      return;
    }

    setIsChecking(true);
    try {
      const success = await onAdd(
        selectedProduct.id,
        selectedProduct.name,
        quantity,
        selectedProduct.price
      );

      if (success) {
        setSelectedProduct(null);
        setQuantity(1);
        setAddError(null);
        setError(null);
        onClose();
      } else {
        setAddError('ไม่สามารถเพิ่มรายการได้ โปรดลองอีกครั้ง');
      }
    } finally {
      setIsChecking(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
          disabled={loading || isChecking}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              เพิ่มรายการ
            </h2>
            <button
              onClick={onClose}
              disabled={loading || isChecking}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 flex-grow overflow-y-auto">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {addError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{addError}</p>
              </div>
            )}

            {/* Product Search/Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                ค้นหาและเลือกสินค้า
              </label>
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือ SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={fetchingProducts || loading || isChecking}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />

              {fetchingProducts ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                  <Loader className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    กำลังโหลดสินค้า...
                  </p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  {filteredProducts.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                      {products.length === 0 ? 'ไม่มีสินค้า' : 'ไม่พบสินค้าที่ค้นหา'}
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`w-full px-4 py-3 text-left border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                          selectedProduct?.id === product.id
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {product.sku && `SKU: ${product.sku}`}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-medium text-gray-900 dark:text-white">
                              ฿{product.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {product.stock !== undefined
                                ? `สต็อก: ${product.stock}`
                                : 'สต็อก: ไม่จำกัด'}
                            </p>
                          </div>
                        </div>
                        {selectedProduct?.id === product.id && (
                          <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-2" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Product Details & Quantity */}
            {selectedProduct && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        ชื่อสินค้า
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedProduct.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        ราคา
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ฿{selectedProduct.price.toFixed(2)}
                      </p>
                    </div>
                    {selectedProduct.sku && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          SKU
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {selectedProduct.sku}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        สต็อก
                      </p>
                      <p
                        className={`font-semibold ${
                          (selectedProduct.stock ?? 999) >= quantity
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {selectedProduct.stock !== undefined && selectedProduct.stock !== null
                          ? `${selectedProduct.stock} หน่วย`
                          : 'ไม่จำกัด'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quantity Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    จำนวน
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity === 1 || loading || isChecking}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={getAvailableStock()}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(Math.max(1, parseInt(e.target.value) || 1))}
                      disabled={loading || isChecking}
                      className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= getAvailableStock() || loading || isChecking}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      / {getAvailableStock()} หน่วย
                    </span>
                  </div>
                </div>

                {/* Stock Warning */}
                {selectedProduct.stock !== undefined &&
                  selectedProduct.stock !== null &&
                  selectedProduct.stock < quantity && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        สินค้าไม่เพียงพอ มีเพียง {selectedProduct.stock} หน่วย แต่ต้องการ{' '}
                        {quantity} หน่วย
                      </p>
                    </div>
                  )}

                {/* Total Price */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    รวมทั้งสิ้น
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    ฿{(selectedProduct.price * quantity).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    ({quantity} × ฿{selectedProduct.price.toFixed(2)})
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-3 justify-end flex-shrink-0 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={onClose}
              disabled={loading || isChecking}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedProduct || !isStockAvailable() || loading || isChecking}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isChecking && <Loader className="h-4 w-4 animate-spin" />}
              เพิ่มรายการ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
