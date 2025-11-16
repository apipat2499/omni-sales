/**
 * PaymentForm Component
 *
 * Integrated payment form with Stripe Elements for secure card input,
 * billing information collection, and payment processing.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getPublishableKey } from '@/lib/utils/payment-stripe';
import { usePaymentProcessing } from '@/lib/hooks/usePaymentProcessing';
import { Loader2, CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(getPublishableKey());

// ============================================================================
// Type Definitions
// ============================================================================

export interface PaymentFormProps {
  orderId?: string;
  amount: number;
  currency?: string;
  customerId?: string;
  customerEmail?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  savePaymentMethod?: boolean;
  showBillingAddress?: boolean;
}

interface BillingInfo {
  name: string;
  email: string;
  phone?: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

// ============================================================================
// Stripe Card Element Styling
// ============================================================================

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
  hidePostalCode: false,
};

// ============================================================================
// Payment Form Component (Inner - with Stripe context)
// ============================================================================

function PaymentFormInner({
  orderId,
  amount,
  currency = 'USD',
  customerId,
  customerEmail,
  onSuccess,
  onError,
  onCancel,
  savePaymentMethod = false,
  showBillingAddress = true,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const {
    paymentIntent,
    isProcessing,
    error: processingError,
    success,
    paymentId,
    createPaymentIntent,
    processPayment,
    clearError,
  } = usePaymentProcessing();

  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    name: '',
    email: customerEmail || '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
  });
  const [formValid, setFormValid] = useState(false);

  // Create payment intent on mount
  useEffect(() => {
    if (orderId && amount > 0) {
      createPaymentIntent(orderId, amount, currency, customerId);
    }
  }, [orderId, amount, currency, customerId, createPaymentIntent]);

  // Validate form
  useEffect(() => {
    const isValid =
      cardComplete &&
      billingInfo.name.trim() !== '' &&
      billingInfo.email.trim() !== '' &&
      (!showBillingAddress ||
        (billingInfo.address.line1.trim() !== '' &&
          billingInfo.address.city.trim() !== '' &&
          billingInfo.address.state.trim() !== '' &&
          billingInfo.address.postalCode.trim() !== ''));

    setFormValid(isValid);
  }, [cardComplete, billingInfo, showBillingAddress]);

  // Handle success
  useEffect(() => {
    if (success && paymentId) {
      onSuccess?.(paymentId);
    }
  }, [success, paymentId, onSuccess]);

  // Handle error
  useEffect(() => {
    if (processingError) {
      onError?.(processingError);
    }
  }, [processingError, onError]);

  /**
   * Handle card element change
   */
  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      return;
    }

    clearError();
    setCardError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setCardError('Card element not found');
      return;
    }

    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: billingInfo.name,
          email: billingInfo.email,
          phone: billingInfo.phone || undefined,
          address: showBillingAddress
            ? {
                line1: billingInfo.address.line1,
                line2: billingInfo.address.line2 || undefined,
                city: billingInfo.address.city,
                state: billingInfo.address.state,
                postal_code: billingInfo.address.postalCode,
                country: billingInfo.address.country,
              }
            : undefined,
        },
      });

      if (pmError) {
        setCardError(pmError.message || 'Failed to create payment method');
        return;
      }

      if (!paymentMethod) {
        setCardError('Failed to create payment method');
        return;
      }

      // Process payment
      const result = await processPayment(paymentMethod.id, billingInfo);

      if (!result.success) {
        // May require additional authentication
        if (paymentIntent.clientSecret) {
          const { error: confirmError } = await stripe.confirmCardPayment(
            paymentIntent.clientSecret,
            {
              payment_method: paymentMethod.id,
            }
          );

          if (confirmError) {
            setCardError(confirmError.message || 'Payment failed');
          }
        }
      }
    } catch (error: any) {
      console.error('Payment submission error:', error);
      setCardError(error.message || 'Payment failed');
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setBillingInfo((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setBillingInfo((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-800">Payment Successful!</h3>
            <p className="text-sm text-green-600 mt-1">
              Your payment has been processed successfully.
            </p>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {(processingError || cardError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
            <p className="text-sm text-red-600 mt-1">
              {processingError || cardError}
            </p>
          </div>
        </div>
      )}

      {/* Payment Amount */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Amount</span>
          <span className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
            }).format(amount)}
          </span>
        </div>
      </div>

      {/* Billing Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Billing Information</h3>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            value={billingInfo.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="John Doe"
            required
            disabled={isProcessing || success}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={billingInfo.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="john@example.com"
            required
            disabled={isProcessing || success}
          />
        </div>

        {/* Phone (optional) */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={billingInfo.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+1 (555) 123-4567"
            disabled={isProcessing || success}
          />
        </div>
      </div>

      {/* Billing Address */}
      {showBillingAddress && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Billing Address</h3>

          {/* Address Line 1 */}
          <div>
            <label htmlFor="line1" className="block text-sm font-medium text-gray-700 mb-1">
              Street Address *
            </label>
            <input
              type="text"
              id="line1"
              value={billingInfo.address.line1}
              onChange={(e) => handleInputChange('address.line1', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123 Main St"
              required
              disabled={isProcessing || success}
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label htmlFor="line2" className="block text-sm font-medium text-gray-700 mb-1">
              Apartment, suite, etc. (optional)
            </label>
            <input
              type="text"
              id="line2"
              value={billingInfo.address.line2}
              onChange={(e) => handleInputChange('address.line2', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Apt 4B"
              disabled={isProcessing || success}
            />
          </div>

          {/* City, State, Postal Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                id="city"
                value={billingInfo.address.city}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="New York"
                required
                disabled={isProcessing || success}
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <input
                type="text"
                id="state"
                value={billingInfo.address.state}
                onChange={(e) => handleInputChange('address.state', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="NY"
                required
                disabled={isProcessing || success}
              />
            </div>

            <div>
              <label
                htmlFor="postalCode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Postal Code *
              </label>
              <input
                type="text"
                id="postalCode"
                value={billingInfo.address.postalCode}
                onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10001"
                required
                disabled={isProcessing || success}
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <select
              id="country"
              value={billingInfo.address.country}
              onChange={(e) => handleInputChange('address.country', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isProcessing || success}
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="TH">Thailand</option>
            </select>
          </div>
        </div>
      )}

      {/* Card Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Card Information</span>
        </h3>

        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={handleCardChange}
            className="stripe-card-element"
          />
        </div>

        {savePaymentMethod && (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isProcessing || success}
            />
            <span className="text-sm text-gray-700">Save card for future purchases</span>
          </label>
        )}
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
        <Lock className="w-4 h-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={!stripe || !formValid || isProcessing || success}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Payment Complete</span>
            </>
          ) : (
            <span>Pay {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: currency,
            }).format(amount)}</span>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// ============================================================================
// Payment Form Component (Outer - with Stripe Elements Provider)
// ============================================================================

export default function PaymentForm(props: PaymentFormProps) {
  const { amount, currency = 'USD' } = props;

  const elementsOptions: StripeElementsOptions = {
    mode: 'payment',
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0066cc',
        colorBackground: '#ffffff',
        colorText: '#1a1a1a',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <PaymentFormInner {...props} />
    </Elements>
  );
}
