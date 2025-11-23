'use client';

import Link from 'next/link';
import { CartProvider, useCart } from '@/lib/contexts/CartContext';
import { ShoppingCart, Home, Package } from 'lucide-react';

function ShopNav() {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Package className="h-8 w-8" />
            <span className="text-xl font-bold">OmniShop</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="flex items-center space-x-1 hover:text-blue-200 transition"
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>

            <Link
              href="/products"
              className="flex items-center space-x-1 hover:text-blue-200 transition"
            >
              <Package className="h-5 w-5" />
              <span>Products</span>
            </Link>

            <Link
              href="/cart"
              className="flex items-center space-x-1 hover:text-blue-200 transition relative"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function ShopFooter() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">About OmniShop</h3>
            <p className="text-gray-300 text-sm">
              Your one-stop shop for quality clothing, shoes, and accessories.
              Shop with confidence!
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-gray-300 hover:text-white transition">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Email: support@omnishop.com</li>
              <li>Phone: 02-123-4567</li>
              <li>Hours: Mon-Sat 9:00-18:00</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} OmniShop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <ShopNav />
        <main className="flex-grow">
          {children}
        </main>
        <ShopFooter />
      </div>
    </CartProvider>
  );
}
