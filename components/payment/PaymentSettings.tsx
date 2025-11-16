/**
 * PaymentSettings Component
 *
 * Manages payment methods, displays stored cards, sets default payment methods,
 * and handles payment preferences.
 */

'use client';

import React, { useState } from 'react';
import { usePaymentMethods } from '@/lib/hooks/usePaymentMethods';
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle,
  Star,
  AlertCircle,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getPublishableKey } from '@/lib/utils/payment-stripe';

const stripePromise = loadStripe(getPublishableKey());

// ============================================================================
// Type Definitions
// ============================================================================

export interface PaymentSettingsProps {
  customerId: string;
  onMethodAdded?: () => void;
  onMethodRemoved?: () => void;
}

// ============================================================================
// Add Card Form (Inner - with Stripe context)
// ============================================================================

function AddCardFormInner({
  customerId,
  onSuccess,
  onCancel,
}: {
  customerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const { addPaymentMethod } = usePaymentMethods(customerId, false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      const result = await addPaymentMethod(paymentMethod.id, setAsDefault);

      if (!result.success) {
        throw new Error(result.error || 'Failed to add payment method');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add card');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-lg p-3 bg-white">
          <CardElement
            onChange={(e) => {
              setCardComplete(e.complete);
              setError(e.error ? e.error.message : null);
            }}
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#32325d',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#fa755a',
                },
              },
            }}
          />
        </div>
      </div>

      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={setAsDefault}
          onChange={(e) => setSetAsDefault(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Set as default payment method</span>
      </label>

      <div className="flex space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || !cardComplete || isProcessing}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Adding...</span>
            </>
          ) : (
            <span>Add Card</span>
          )}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Add Card Form (Outer - with Elements Provider)
// ============================================================================

function AddCardForm(props: {
  customerId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  return (
    <Elements stripe={stripePromise}>
      <AddCardFormInner {...props} />
    </Elements>
  );
}

// ============================================================================
// PaymentSettings Component
// ============================================================================

export default function PaymentSettings({
  customerId,
  onMethodAdded,
  onMethodRemoved,
}: PaymentSettingsProps) {
  const {
    paymentMethods,
    defaultMethod,
    isLoading,
    error,
    removePaymentMethod,
    setDefaultPaymentMethod,
    refresh,
    getPaymentMethodDisplay,
  } = usePaymentMethods(customerId, true);

  const [showAddCard, setShowAddCard] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  /**
   * Handle card addition success
   */
  const handleCardAdded = () => {
    setShowAddCard(false);
    refresh();
    onMethodAdded?.();
  };

  /**
   * Handle set default
   */
  const handleSetDefault = async (methodId: string) => {
    setProcessingId(methodId);
    await setDefaultPaymentMethod(methodId);
    setProcessingId(null);
  };

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setProcessingId(deleteConfirm);
    const result = await removePaymentMethod(deleteConfirm);

    if (result.success) {
      setDeleteConfirm(null);
      onMethodRemoved?.();
    }
    setProcessingId(null);
  };

  /**
   * Get card brand icon color
   */
  const getBrandColor = (brand?: string) => {
    const colors = {
      visa: 'text-blue-600',
      mastercard: 'text-red-600',
      amex: 'text-green-600',
      discover: 'text-orange-600',
    };
    return colors[brand?.toLowerCase() as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your saved payment methods and preferences
          </p>
        </div>

        {!showAddCard && (
          <button
            onClick={() => setShowAddCard(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Card</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Add Card Form */}
      {showAddCard && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Card</h3>
          <AddCardForm
            customerId={customerId}
            onSuccess={handleCardAdded}
            onCancel={() => setShowAddCard(false)}
          />
        </div>
      )}

      {/* Payment Methods List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading payment methods...</span>
            </div>
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="text-center text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No payment methods saved</p>
              <p className="text-xs mt-1">Add a card to get started</p>
            </div>
          </div>
        ) : (
          paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`bg-white rounded-lg border-2 p-4 transition-all ${
                method.isDefault
                  ? 'border-blue-500 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Card Icon */}
                  <div
                    className={`p-3 rounded-lg ${
                      method.isDefault ? 'bg-blue-100' : 'bg-gray-100'
                    }`}
                  >
                    {method.type === 'card' ? (
                      <CreditCard
                        className={`w-6 h-6 ${
                          method.isDefault
                            ? 'text-blue-600'
                            : getBrandColor(method.brand)
                        }`}
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-gray-600" />
                    )}
                  </div>

                  {/* Card Details */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {getPaymentMethodDisplay(method)}
                      </span>
                      {method.isDefault && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Star className="w-3 h-3 fill-current" />
                          <span>Default</span>
                        </span>
                      )}
                    </div>
                    {method.type === 'card' && method.expiryMonth && method.expiryYear && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        Expires {method.expiryMonth.toString().padStart(2, '0')}/
                        {method.expiryYear}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      disabled={processingId === method.id}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      title="Set as default"
                    >
                      {processingId === method.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        'Set Default'
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteConfirm(method.id)}
                    disabled={processingId === method.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">Secure Payment Processing</h4>
            <p className="text-sm text-gray-600 mt-1">
              Your payment information is encrypted and securely stored. We never store your
              full card number. All transactions are processed through Stripe's PCI DSS
              Level 1 compliant infrastructure.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Remove Payment Method?
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Are you sure you want to remove this payment method? This action
                      cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    disabled={processingId === deleteConfirm}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={processingId === deleteConfirm}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {processingId === deleteConfirm ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Removing...</span>
                      </>
                    ) : (
                      <span>Remove</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
