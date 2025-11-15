'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import BarcodeScanner from '@/components/BarcodeScanner';
import CreateOrderModal from '@/components/orders/CreateOrderModal';
import { useToast } from '@/lib/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import { Package, ShoppingCart, Plus, Minus, X } from 'lucide-react';
import type { Product } from '@/types';

interface CartItem extends Product {
  cartQuantity: number;
}

export default function ScannerPage() {
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const { success, error: showError } = useToast();

  const handleScanSuccess = async (code: string, type: 'barcode' | 'qr') => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/lookup?code=${encodeURIComponent(code)}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ไม่พบสินค้า');
      }

      const product = await response.json();
      setScannedProduct(product);
      success(`พบสินค้า: ${product.name}`);
    } catch (err) {
      console.error('Lookup error:', err);
      showError(err instanceof Error ? err.message : 'ไม่พบสินค้าจากรหัสนี้');
      setScannedProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!scannedProduct) return;

    const existingItem = cart.find((item) => item.id === scannedProduct.id);

    if (existingItem) {
      // Update quantity
      setCart(
        cart.map((item) =>
          item.id === scannedProduct.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        )
      );
    } else {
      // Add new item
      setCart([...cart, { ...scannedProduct, cartQuantity: 1 }]);
    }

    success(`เพิ่ม ${scannedProduct.name} ลงตะกร้า`);
    setScannedProduct(null);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.id === productId
            ? { ...item, cartQuantity: Math.max(0, item.cartQuantity + delta) }
            : item
        )
        .filter((item) => item.cartQuantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setScannedProduct(null);
    success('ล้างตะกร้าสินค้าแล้ว');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      showError('ไม่มีสินค้าในตะกร้า');
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  const handleOrderSuccess = () => {
    success('สร้างออเดอร์สำเร็จ');
    setCart([]);
    setScannedProduct(null);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.cartQuantity, 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">สแกนบาร์โค้ด</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            สแกนบาร์โค้ดหรือ QR Code เพื่อค้นหาสินค้าและเพิ่มเข้าตะกร้า
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <div>
            <BarcodeScanner onScanSuccess={handleScanSuccess} />

            {/* Scanned Product Display */}
            {isLoading && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-lg bg-gray-300 dark:bg-gray-700 h-20 w-20" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            )}

            {scannedProduct && !isLoading && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  สินค้าที่สแกนได้
                </h3>
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {scannedProduct.image ? (
                      <img
                        src={scannedProduct.image}
                        alt={scannedProduct.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {scannedProduct.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      SKU: {scannedProduct.sku}
                      {scannedProduct.barcode && ` | บาร์โค้ด: ${scannedProduct.barcode}`}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      หมวดหมู่: {scannedProduct.category}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(scannedProduct.price)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        คงเหลือ: {scannedProduct.stock} ชิ้น
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={scannedProduct.stock === 0}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {scannedProduct.stock === 0 ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
                </button>
              </div>
            )}
          </div>

          {/* Cart Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                ตะกร้าสินค้า ({cartItemCount})
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  ล้างตะกร้า
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">ตะกร้าสินค้าว่างเปล่า</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  สแกนบาร์โค้ดเพื่อเพิ่มสินค้า
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatCurrency(item.price)} x {item.cartQuantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                          {item.cartQuantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          disabled={item.cartQuantity >= item.stock}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded ml-2"
                        >
                          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(item.price * item.cartQuantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cart Total */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      ยอดรวม
                    </span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    ดำเนินการชำระเงิน
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Order Modal */}
        <CreateOrderModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          onSuccess={handleOrderSuccess}
          cartItems={cart}
        />
      </div>
    </DashboardLayout>
  );
}
