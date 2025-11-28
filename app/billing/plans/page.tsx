'use client';

import { useEffect, useState } from 'react';
import { SubscriptionPlan } from '@/types';
import { PricingCard } from '@/components/billing/PricingCard';
import { AdminGuard } from '@/components/RouteGuard';

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/billing/plans');

      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      const data = await response.json();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold dark:text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Choose the perfect plan for your business
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              No plans available. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                planId={plan.id}
                name={plan.name}
                description={plan.description || ''}
                price={plan.amountCents}
                currency={plan.currency}
                billingInterval={plan.billingInterval}
                features={plan.features}
                isPopular={plan.name === 'Pro'}
              />
            ))}
          </div>
        )}

        <div className="mt-16 rounded-lg border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-2xl font-bold dark:text-white">FAQ</h2>

          <div className="mt-8 space-y-6">
            <div>
              <h3 className="font-semibold dark:text-white">
                Can I change my plan anytime?
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>

            <div>
              <h3 className="font-semibold dark:text-white">
                What payment methods do you accept?
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                We accept all major credit and debit cards through Stripe.
              </p>
            </div>

            <div>
              <h3 className="font-semibold dark:text-white">
                Is there a free trial?
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                We offer a 14-day free trial for all plans. No credit card required.
              </p>
            </div>

            <div>
              <h3 className="font-semibold dark:text-white">
                Can I cancel my subscription anytime?
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Yes, you can cancel at any time. Your access will continue until the end of the current billing period.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
      </AdminGuard>
  );
}
