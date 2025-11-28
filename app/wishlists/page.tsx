'use client';

import { useEffect, useState } from 'react';
import {
  Heart,
  Share2,
  Eye,
  Trash2,
  Plus,
  TrendingUp,
  Package,
  DollarSign,
  Lock,
  Unlock,
  Copy,
  Calendar,
} from 'lucide-react';
import { WishlistWithItems } from '@/types';
import { AuthGuard } from '@/components/RouteGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

interface KPIStats {
  totalWishlists: number;
  totalItems: number;
  totalValue: number;
  avgItemPrice: number;
}

export default function WishlistsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-wishlists' | 'shared' | 'analytics'>('my-wishlists');
  const [wishlists, setWishlists] = useState<WishlistWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWishlist, setSelectedWishlist] = useState<WishlistWithItems | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWishlistName, setNewWishlistName] = useState('');
  const [newWishlistDesc, setNewWishlistDesc] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareName, setShareName] = useState('');
  const [shareType, setShareType] = useState<'email' | 'link'>('email');
  const [sharedLink, setSharedLink] = useState('');

  useEffect(() => {
    if (user?.id && user?.email) {
      fetchWishlists(user.id, user.email);
    }
  }, [user]);

  const fetchWishlists = async (userId: string, email: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/wishlists?userId=${userId}&customerEmail=${email}`
      );
      const data = await response.json();
      setWishlists(data.data || []);
    } catch (error) {
      console.error('Error fetching wishlists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWishlist = async () => {
    if (!userId || !customerEmail || !newWishlistName.trim()) return;

    try {
      const response = await fetch('/api/wishlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          customerEmail,
          wishlistName: newWishlistName,
          description: newWishlistDesc,
          isPublic: false,
        }),
      });

      if (response.ok) {
        setNewWishlistName('');
        setNewWishlistDesc('');
        setIsCreating(false);
        fetchWishlists(userId, customerEmail);
      }
    } catch (error) {
      console.error('Error creating wishlist:', error);
    }
  };

  const handleDeleteWishlist = async (wishlistId: string) => {
    if (!confirm('Are you sure you want to delete this wishlist?')) return;

    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (userId && customerEmail) {
          fetchWishlists(userId, customerEmail);
        }
      }
    } catch (error) {
      console.error('Error deleting wishlist:', error);
    }
  };

  const handleShareWishlist = async (wishlistId: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/wishlists/${wishlistId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          shareEmail: shareEmail || undefined,
          shareName: shareName || undefined,
          shareType,
          canEdit: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSharedLink(
          `${window.location.origin}/wishlists/shared/${data.share_token}`
        );
        setShareEmail('');
        setShareName('');
      }
    } catch (error) {
      console.error('Error sharing wishlist:', error);
    }
  };

  const handleToggleVisibility = async (wishlistId: string, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !isPublic }),
      });

      if (response.ok && userId && customerEmail) {
        fetchWishlists(userId, customerEmail);
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const stats: KPIStats = {
    totalWishlists: wishlists.length,
    totalItems: wishlists.reduce((sum, w) => sum + (w.itemCount || 0), 0),
    totalValue: wishlists.reduce((sum, w) => sum + (w.totalValue || 0), 0),
    avgItemPrice: wishlists.length > 0
      ? wishlists.reduce((sum, w) => sum + (w.totalValue || 0), 0) /
        wishlists.reduce((sum, w) => sum + (w.itemCount || 0), 0)
      : 0,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading wishlists...</div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="h-8 w-8 text-red-500" />
                <h1 className="text-4xl font-bold dark:text-white">Wishlists</h1>
              </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            <Plus className="h-5 w-5" />
            New Wishlist
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Wishlists</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.totalWishlists}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">
                  ${stats.totalValue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Item Price</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">
                  ${stats.avgItemPrice.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('my-wishlists')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'my-wishlists'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                My Wishlists ({stats.totalWishlists})
              </button>
              <button
                onClick={() => setActiveTab('shared')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'shared'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Shared with Me
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'my-wishlists' && (
              <div className="space-y-4">
                {wishlists.length > 0 ? (
                  wishlists.map((wishlist) => (
                    <div
                      key={wishlist.id}
                      className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold dark:text-white">
                              {wishlist.wishlist_name}
                            </h3>
                            {wishlist.is_public ? (
                              <Unlock className="h-4 w-4 text-green-500" />
                            ) : (
                              <Lock className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          {wishlist.description && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {wishlist.description}
                            </p>
                          )}
                          <div className="mt-2 flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              {wishlist.itemCount || 0} items
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              ${(wishlist.totalValue || 0).toFixed(2)}
                            </span>
                            {wishlist.created_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(wishlist.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedWishlist(wishlist)}
                            className="rounded bg-blue-100 p-2 text-blue-600 hover:bg-blue-200 dark:bg-blue-900"
                            title="View details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWishlist(wishlist);
                              setShareModalOpen(true);
                            }}
                            className="rounded bg-green-100 p-2 text-green-600 hover:bg-green-200 dark:bg-green-900"
                            title="Share wishlist"
                          >
                            <Share2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleToggleVisibility(
                                wishlist.id,
                                wishlist.is_public || false
                              )
                            }
                            className="rounded bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-700"
                            title="Toggle visibility"
                          >
                            {wishlist.is_public ? (
                              <Unlock className="h-5 w-5" />
                            ) : (
                              <Lock className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteWishlist(wishlist.id)}
                            className="rounded bg-red-100 p-2 text-red-600 hover:bg-red-200 dark:bg-red-900"
                            title="Delete wishlist"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    No wishlists yet. Create one to get started!
                  </p>
                )}
              </div>
            )}

            {activeTab === 'shared' && (
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Shared wishlists coming soon
                </p>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Wishlist analytics and insights coming soon
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create Wishlist Modal */}
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-bold dark:text-white">
                Create New Wishlist
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">
                    Wishlist Name
                  </label>
                  <input
                    type="text"
                    value={newWishlistName}
                    onChange={(e) => setNewWishlistName(e.target.value)}
                    placeholder="e.g., Birthday Gifts"
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">
                    Description (optional)
                  </label>
                  <textarea
                    value={newWishlistDesc}
                    onChange={(e) => setNewWishlistDesc(e.target.value)}
                    placeholder="What's this wishlist for?"
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateWishlist}
                    className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {shareModalOpen && selectedWishlist && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-bold dark:text-white">
                Share Wishlist: {selectedWishlist.wishlist_name}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">
                    Share Type
                  </label>
                  <select
                    value={shareType}
                    onChange={(e) => setShareType(e.target.value as 'email' | 'link')}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="email">Share via Email</option>
                    <option value="link">Generate Link</option>
                  </select>
                </div>

                {shareType === 'email' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium dark:text-gray-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        placeholder="recipient@example.com"
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium dark:text-gray-300">
                        Name (optional)
                      </label>
                      <input
                        type="text"
                        value={shareName}
                        onChange={(e) => setShareName(e.target.value)}
                        placeholder="John Doe"
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </>
                )}

                {sharedLink && (
                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900">
                    <p className="mb-2 text-sm font-medium dark:text-blue-200">
                      Shareable Link:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sharedLink}
                        readOnly
                        className="flex-1 rounded bg-white p-2 text-sm dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(sharedLink);
                          alert('Link copied!');
                        }}
                        className="rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (selectedWishlist) {
                        handleShareWishlist(selectedWishlist.id);
                      }
                    }}
                    className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                  >
                    {shareType === 'email' ? 'Send' : 'Generate Link'}
                  </button>
                  <button
                    onClick={() => {
                      setShareModalOpen(false);
                      setSharedLink('');
                      setShareEmail('');
                      setShareName('');
                    }}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Details Modal */}
        {selectedWishlist && !shareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="max-h-96 w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold dark:text-white">
                  {selectedWishlist.wishlist_name}
                </h2>
                <button
                  onClick={() => setSelectedWishlist(null)}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400"
                >
                  ✕
                </button>
              </div>

              {selectedWishlist.description && (
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  {selectedWishlist.description}
                </p>
              )}

              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Items</p>
                  <p className="mt-1 text-2xl font-bold dark:text-white">
                    {selectedWishlist.itemCount || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                  <p className="mt-1 text-2xl font-bold dark:text-white">
                    ${(selectedWishlist.totalValue || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {selectedWishlist.items && selectedWishlist.items.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold dark:text-white">Items</h3>
                  <div className="space-y-2">
                    {selectedWishlist.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
                      >
                        <div className="flex-1">
                          <p className="font-medium dark:text-white">{item.product_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ${item.current_price.toFixed(2)}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          Qty: {item.quantity_desired}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedWishlist(null)}
                className="mt-6 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
