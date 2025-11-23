'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { shopProducts } from '@/lib/data/products';
import { ShoppingCart, Package, ArrowLeft, Plus, Minus } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, updateQuantity, cart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const productId = parseInt(params.id as string);
  const product = shopProducts.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link
            href="/products"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    // Add items based on selected quantity
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
      });
    }
    setQuantity(1);
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const relatedProducts = shopProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/products"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Products</span>
        </Link>

        {/* Product Detail */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 h-96 md:h-full flex items-center justify-center">
              <Package className="h-48 w-48 text-blue-600" />
            </div>

            {/* Product Info */}
            <div className="p-8">
              <div className="mb-4">
                <p className="text-sm text-blue-600 font-medium uppercase tracking-wide mb-2">
                  {product.category}
                </p>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  {product.name}
                </h1>
              </div>

              <div className="mb-6">
                <p className="text-4xl font-bold text-blue-600 mb-2">
                  ฿{product.price.toLocaleString()}
                </p>
                <p className={`text-lg ${product.stock > 20 ? 'text-green-600' : product.stock > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {product.stock > 0 ? `In Stock: ${product.stock} items` : 'Out of Stock'}
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Description</h2>
                <p className="text-gray-600 leading-relaxed">
                  {product.description || 'No description available for this product.'}
                </p>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="px-6 py-2 font-semibold text-lg border-x border-gray-300">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Max: {product.stock}
                  </p>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg font-semibold"
              >
                <ShoppingCart className="h-6 w-6" />
                <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>

              {/* Product Details */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Product ID:</dt>
                    <dd className="font-medium">#{product.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Category:</dt>
                    <dd className="font-medium capitalize">{product.category}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Availability:</dt>
                    <dd className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/products/${relatedProduct.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <Package className="h-16 w-16 text-blue-600" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-xl font-bold text-blue-600">
                      ฿{relatedProduct.price}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
