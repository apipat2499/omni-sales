'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { getStripe } from '@/lib/stripe/client';

interface PricingCardProps {
  name: string;
  description: string;
  price: number;
  currency: string;
  billingInterval: string;
  features: string[];
  planId: string;
  isPopular?: boolean;
  onSelect?: (planId: string) => void;
}

export function PricingCard({
  name,
  description,
  price,
  currency,
  billingInterval,
  features,
  planId,
  isPopular = false,
  onSelect,
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (onSelect) {
      onSelect(planId);
      return;
    }

    setIsLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const email = localStorage.getItem('userEmail');

      if (!userId || !email) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout');
      }

      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (result?.error) {
        throw result.error;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const displayPrice = (price / 100).toFixed(2);

  return (
    <div
      className={`rounded-lg border-2 p-8 transition-all ${
        isPopular
          ? 'border-blue-500 bg-blue-50 shadow-xl dark:bg-blue-950'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {isPopular && (
        <div className="mb-4 inline-block rounded-full bg-blue-500 px-3 py-1 text-sm font-semibold text-white">
          Popular
        </div>
      )}

      <h3 className="text-2xl font-bold">{name}</h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold">{currency}</span>
        <span className="text-5xl font-bold">{displayPrice}</span>
        <span className="text-gray-600 dark:text-gray-400">
          /{billingInterval}
        </span>
      </div>

      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className={`mt-8 w-full rounded-lg px-6 py-3 font-semibold text-white transition-all disabled:opacity-50 ${
          isPopular
            ? 'bg-blue-500 hover:bg-blue-600'
            : 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600'
        }`}
      >
        {isLoading ? 'Processing...' : 'Get Started'}
      </button>

      <div className="mt-8 space-y-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          Features:
        </p>
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {feature}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
