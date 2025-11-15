'use client';

import { useEffect, useState } from 'react';
import { Subscription, Invoice } from '@/types';
import { AlertCircle } from 'lucide-react';

export default function BillingPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      window.location.href = '/login';
      return;
    }

    fetchSubscriptions(userId);
  }, []);

  const fetchSubscriptions = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/billing/user-subscriptions?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/billing/subscriptions/${subscriptionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cancel' }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Refresh subscriptions
      const userId = localStorage.getItem('userId');
      if (userId) {
        fetchSubscriptions(userId);
      }
    } catch (err) {
      alert(
        'Failed to cancel subscription: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200">
          <AlertCircle className="h-5 w-5" />
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold dark:text-white">Billing</h1>

        {subscriptions.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              No active subscriptions. Choose a plan to get started.
            </p>
            <a
              href="/billing/plans"
              className="mt-4 inline-block rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
            >
              View Plans
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold dark:text-white">
                        {subscription.plan?.name || 'Plan'}
                      </h2>
                      <p className="mt-1 text-gray-600 dark:text-gray-400">
                        Status: <span className="font-semibold capitalize">{subscription.status}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold dark:text-white">
                        $
                        {(
                          (subscription.plan?.amountCents || 0) / 100
                        ).toFixed(2)}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        /{subscription.plan?.billingInterval || 'month'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                        Billing Period
                      </h3>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                        Product Limit
                      </h3>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {subscription.plan?.productLimit || 'Unlimited'} products
                      </p>
                    </div>
                  </div>

                  {subscription.plan?.features && subscription.plan.features.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                        Features
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {subscription.plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    {!subscription.cancelAtPeriodEnd && subscription.status === 'active' && (
                      <button
                        onClick={() => handleCancelSubscription(subscription.id)}
                        className="rounded-lg bg-red-500 px-6 py-2 text-white hover:bg-red-600"
                      >
                        Cancel Subscription
                      </button>
                    )}
                    <a
                      href="/billing/plans"
                      className="rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
                    >
                      Change Plan
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {subscriptions.some((sub) => sub.cancelAtPeriodEnd) && (
          <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
            <p className="text-orange-800 dark:text-orange-200">
              Your subscription is scheduled to be canceled at the end of the current billing period.
              You can reactivate it at any time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
