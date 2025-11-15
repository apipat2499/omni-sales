'use client';

import { useState, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe/client';
import { PaymentForm } from './PaymentForm';

interface PaymentModalProps {
  isOpen: boolean;
  orderId: string;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
  children?: ReactNode;
}

export function PaymentModal({
  isOpen,
  orderId,
  amount,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [stripe, setStripe] = useState<any>(null);

  if (!isOpen) return null;

  // Load Stripe
  if (!stripe) {
    getStripe().then((s) => setStripe(s));
  }

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const handleError = (error: string) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Complete Payment
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {stripe ? (
          <Elements stripe={stripe}>
            <PaymentForm
              orderId={orderId}
              amount={amount}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </Elements>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Loading payment form...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
