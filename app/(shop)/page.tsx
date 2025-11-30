'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { ShoppingCart, Package, ArrowRight, Loader2 } from 'lucide-react';
import type { Product } from '@/types';

export default function HomePage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?limit=8');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Featured products (first 4)
  const featuredProducts = products.slice(0, 4);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
    });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to OmniShop
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Discover quality clothing, shoes, and accessories at unbeatable prices.
              Shop the latest trends and timeless classics.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition transform hover:scale-105"
            >
              <span>Shop Now</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600 text-lg">
              Check out our most popular items
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loading ? (
              <div className="col-span-full flex justify-center py-12">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600">No products available</p>
              </div>
            ) : (
              featuredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
              >
                <Link href={`/products/${product.id}`}>
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <Package className="h-20 w-20 text-blue-600" />
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-semibold text-lg mb-2 text-gray-800 hover:text-blue-600 transition">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between mb-3">
                    <p className="text-2xl font-bold text-blue-600">
                      ฿{product.price}
                    </p>
                    <p className="text-sm text-gray-600">
                      Stock: {product.stock}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                  </button>
                </div>
              </div>
            ))
            )}
          </div>

          <div className="text-center">
            <Link
              href="/products"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              <span>View All Products</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
              <p className="text-gray-600">
                All products are carefully selected for quality and durability
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Shopping</h3>
              <p className="text-gray-600">
                Simple and secure checkout process for your convenience
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
              <p className="text-gray-600">
                Competitive pricing and regular promotions on all items
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
