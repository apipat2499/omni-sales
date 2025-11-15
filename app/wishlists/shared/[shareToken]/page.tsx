'use client';

import { useEffect, useState } from 'react';
import {
  Heart,
  ShoppingCart,
  Package,
  DollarSign,
  AlertCircle,
  ArrowLeft,
  TrendingDown,
} from 'lucide-react';
import { WishlistWithItems } from '@/types';

export default function SharedWishlistPage({
  params,
}: {
  params: { shareToken: string };
}) {
  const [wishlist, setWishlist] = useState<WishlistWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<any>({});

  useEffect(() => {
    fetchSharedWishlist();
  }, [params.shareToken]);

  const fetchSharedWishlist = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/wishlists/share/${params.shareToken}`
      );

      if (!response.ok) {
        setError('Wishlist not found or share has expired');
        return;
      }

      const data = await response.json();
      setWishlist(data);

      // Fetch price history for each item
      if (data.items) {
        for (const item of data.items) {
          try {
            const historyRes = await fetch(
              `/api/wishlists/${data.id}/prices?itemId=${item.id}`
            );
            if (historyRes.ok) {
              const historyData = await historyRes.json();
              setPriceHistory((prev: any) => ({
                ...prev,
                [item.id]: historyData.data,
              }));
            }
          } catch (err) {
            console.error('Error fetching price history:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching shared wishlist:', error);
      setError('Failed to load wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceChange = (itemId: string) => {
    const history = priceHistory[itemId];
    if (!history || history.length === 0) return null;
    const latest = history[0];
    return {
      oldPrice: latest.old_price,
      newPrice: latest.new_price,
      change: latest.price_drop_amount,
      percent: latest.price_drop_percent,
    };
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">
          Loading wishlist...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl">
          <a
            href="/"
            className="mb-8 flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </a>
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">
          No wishlist data available
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <a
          href="/"
          className="mb-8 flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Home
        </a>

        <div className="mb-8 flex items-center gap-3">
          <Heart className="h-8 w-8 text-red-500" />
          <div>
            <h1 className="text-4xl font-bold dark:text-white">
              {wishlist.wishlist_name}
            </h1>
            {wishlist.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {wishlist.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Items
                </p>
                <p className="mt-2 text-3xl font-bold dark:text-white">
                  {wishlist.itemCount || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Value
                </p>
                <p className="mt-2 text-3xl font-bold dark:text-white">
                  ${(wishlist.totalValue || 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Price
                </p>
                <p className="mt-2 text-3xl font-bold dark:text-white">
                  $
                  {wishlist.itemCount && wishlist.itemCount > 0
                    ? ((wishlist.totalValue || 0) / (wishlist.itemCount || 1)).toFixed(
                        2
                      )
                    : '0.00'}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Wishlist Items */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <h2 className="text-2xl font-bold dark:text-white">Items</h2>
          </div>

          {wishlist.items && wishlist.items.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {wishlist.items.map((item) => {
                const priceChange = getPriceChange(item.id);
                return (
                  <div
                    key={item.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold dark:text-white">
                          {item.product_name}
                        </h3>

                        {item.notes && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {item.notes}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              Current Price
                            </p>
                            <p className="mt-1 text-lg font-bold dark:text-white">
                              ${item.current_price.toFixed(2)}
                            </p>
                          </div>

                          {item.price_at_added !== item.current_price && (
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Price at Added
                              </p>
                              <p className="mt-1 text-lg font-bold text-gray-500 line-through dark:text-gray-400">
                                ${item.price_at_added.toFixed(2)}
                              </p>
                            </div>
                          )}

                          {priceChange && (
                            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900">
                              <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-green-700 dark:text-green-300">
                                <TrendingDown className="h-4 w-4" />
                                Price Drop
                              </p>
                              <p className="mt-1 text-lg font-bold text-green-700 dark:text-green-300">
                                -${priceChange.change.toFixed(2)}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400">
                                {priceChange.percent.toFixed(1)}% off
                              </p>
                            </div>
                          )}

                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              Quantity Desired
                            </p>
                            <p className="mt-1 text-lg font-bold dark:text-white">
                              {item.quantity_desired}
                            </p>
                          </div>
                        </div>

                        {priceHistory[item.id] &&
                          priceHistory[item.id].length > 0 && (
                            <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                              <p className="text-xs font-medium uppercase tracking-wide text-gray-700 dark:text-gray-300">
                                Price History (Last 30 days)
                              </p>
                              <div className="mt-2 space-y-1">
                                {priceHistory[item.id]
                                  .slice(0, 5)
                                  .map((entry: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
                                    >
                                      <span>
                                        {new Date(
                                          entry.price_checked_at
                                        ).toLocaleDateString()}
                                      </span>
                                      <span className="font-medium">
                                        ${entry.new_price.toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>

                      {item.product_image && (
                        <div className="flex-shrink-0">
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="h-32 w-32 rounded-lg object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6">
              <p className="text-center text-gray-600 dark:text-gray-400">
                This wishlist is empty
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
