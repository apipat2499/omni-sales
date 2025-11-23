'use client';

import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { ShoppingCart, Plus, Minus, Trash2, Package, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();

  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Start shopping to add items to your cart
          </p>
          <Link
            href="/products"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
          >
            <Package className="h-5 w-5" />
            <span>Browse Products</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Shopping Cart
          </h1>
          <p className="text-gray-600">
            You have {cart.length} item(s) in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Desktop Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-50 px-6 py-4 font-semibold text-gray-700 border-b">
                <div className="col-span-5">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Cart Items List */}
              <div className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* Product Info */}
                      <div className="md:col-span-5 flex items-center space-x-4">
                        <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <Package className="h-10 w-10 text-blue-600" />
                        </div>
                        <div className="flex-grow">
                          <Link
                            href={`/products/${item.id}`}
                            className="font-semibold text-gray-800 hover:text-blue-600 transition"
                          >
                            {item.name}
                          </Link>
                          <p className="text-sm text-gray-600 capitalize mt-1">
                            {item.category}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Stock: {item.stock}
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="md:col-span-2 md:text-center">
                        <p className="text-lg font-semibold text-gray-800">
                          ฿{item.price.toLocaleString()}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="md:col-span-3 flex items-center justify-center space-x-4">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 transition"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-2 font-semibold border-x border-gray-300 min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="p-2 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="md:col-span-2 md:text-right">
                        <p className="text-xl font-bold text-blue-600">
                          ฿{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear Cart Button */}
              <div className="px-6 py-4 bg-gray-50 border-t">
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear Cart</span>
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">
                    ฿{getCartTotal().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span className="font-semibold">฿0</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total</span>
                    <span className="text-blue-600">
                      ฿{getCartTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 font-semibold"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/products"
                className="block w-full text-center text-blue-600 hover:text-blue-700 mt-4 font-medium"
              >
                Continue Shopping
              </Link>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Free Shipping</strong> on all orders!
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Delivery within 3-5 business days
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
