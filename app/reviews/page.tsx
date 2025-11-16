'use client';

import { useEffect, useState } from 'react';
import {
  Star,
  MessageSquare,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Flag,
  TrendingUp,
} from 'lucide-react';
import { ProductReview } from '@/types';

interface ReviewWithProduct extends ProductReview {
  productName?: string;
  rating: number;
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'analytics'>('pending');
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<ReviewWithProduct | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      window.location.href = '/login';
      return;
    }
    fetchPendingReviews(userId);
  }, []);

  const fetchPendingReviews = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reviews/moderate?userId=${userId}&limit=50`);
      const data = await response.json();
      setReviews(data.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      const response = await fetch('/api/reviews/moderate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          action: 'moderate',
          status: 'approved',
        }),
      });

      if (response.ok) {
        setReviews(reviews.filter((r) => r.id !== reviewId));
        setSelectedReview(null);
        fetchPendingReviews(userId);
      }
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleReject = async (reviewId: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      const response = await fetch('/api/reviews/moderate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          action: 'moderate',
          status: 'rejected',
        }),
      });

      if (response.ok) {
        setReviews(reviews.filter((r) => r.id !== reviewId));
        setSelectedReview(null);
        fetchPendingReviews(userId);
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
    }
  };

  const handleRespond = async (reviewId: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId || !responseText.trim()) return;

    try {
      const response = await fetch('/api/reviews/moderate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          action: 'respond',
          responseText,
          respondedBy: userId,
        }),
      });

      if (response.ok) {
        setResponseText('');
        setSelectedReview(null);
        fetchPendingReviews(userId);
      }
    } catch (error) {
      console.error('Error responding to review:', error);
    }
  };

  const stats = {
    pending: reviews.filter((r) => r.status === 'pending').length,
    avgRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0,
    totalReviews: reviews.length,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold dark:text-white">Reviews</h1>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.totalReviews}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.pending}</p>
              </div>
              <Flag className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.avgRating}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approval Rate</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">-</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'approved'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Approved
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
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {reviews.filter((r) => r.status === 'pending').length > 0 ? (
                  reviews
                    .filter((r) => r.status === 'pending')
                    .map((review) => (
                      <div
                        key={review.id}
                        className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold dark:text-white">{review.title}</h3>
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              by {review.customerName} ({review.customerEmail})
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedReview(review)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                        <p className="mb-4 text-gray-700 dark:text-gray-300">{review.content}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="flex items-center gap-1 rounded bg-green-100 px-3 py-1 text-sm text-green-700 hover:bg-green-200 dark:bg-green-900"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(review.id)}
                            className="flex items-center gap-1 rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200 dark:bg-red-900"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    No pending reviews
                  </p>
                )}
              </div>
            )}

            {activeTab === 'approved' && (
              <div>
                <p className="text-gray-600 dark:text-gray-400">Approved reviews coming soon</p>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Review analytics and reports coming soon
                </p>
              </div>
            )}
          </div>
        </div>

        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="max-h-96 w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold dark:text-white">{selectedReview.title}</h2>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < selectedReview.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedReview.customerName} • {selectedReview.customerEmail}
                  </p>
                </div>

                <div>
                  <p className="text-gray-700 dark:text-gray-300">{selectedReview.content}</p>
                </div>

                <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                  <h3 className="mb-2 font-semibold dark:text-white">Your Response</h3>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response to the customer..."
                    className="w-full rounded-lg border border-gray-300 p-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(selectedReview.id)}
                    className="flex items-center gap-1 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedReview.id)}
                    className="flex items-center gap-1 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleRespond(selectedReview.id)}
                    disabled={!responseText.trim()}
                    className="flex items-center gap-1 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Respond
                  </button>
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="ml-auto rounded border border-gray-300 px-4 py-2 dark:border-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
