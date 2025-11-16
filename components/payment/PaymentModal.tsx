/**
 * PaymentModal Component
 *
 * Modal wrapper for payment form with success/error states,
 * confirmation dialogs, and proper modal management.
 */

'use client';

import React, { useState, useEffect } from 'react';
import PaymentForm, { PaymentFormProps } from './PaymentForm';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

// ============================================================================
// Type Definitions
// ============================================================================

export interface PaymentModalProps extends Omit<PaymentFormProps, 'onSuccess' | 'onError' | 'onCancel'> {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  title?: string;
  description?: string;
}

// ============================================================================
// PaymentModal Component
// ============================================================================

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  title = 'Complete Payment',
  description = 'Enter your payment details to complete this transaction',
  ...paymentFormProps
}: PaymentModalProps) {
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentSuccessful(false);
      setPaymentError(null);
      setShowConfirmClose(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  /**
   * Handle payment success
   */
  const handleSuccess = (paymentId: string) => {
    setPaymentSuccessful(true);
    setPaymentError(null);
    onSuccess?.(paymentId);

    // Auto-close after 2 seconds
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  /**
   * Handle payment error
   */
  const handleError = (error: string) => {
    setPaymentError(error);
    setPaymentSuccessful(false);
    onError?.(error);
  };

  /**
   * Handle close request
   */
  const handleCloseRequest = () => {
    if (!paymentSuccessful && !paymentError) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  /**
   * Confirm close
   */
  const confirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  /**
   * Cancel close
   */
  const cancelClose = () => {
    setShowConfirmClose(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleCloseRequest}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                {description && (
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                )}
              </div>
              <button
                onClick={handleCloseRequest}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <PaymentForm
                {...paymentFormProps}
                onSuccess={handleSuccess}
                onError={handleError}
                onCancel={onClose}
              />
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>Powered by Stripe</span>
                  <span>•</span>
                  <span>PCI DSS Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-8 h-auto"
                    viewBox="0 0 60 25"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Stripe</title>
                    <path
                      fill="#635BFF"
                      d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.93 0 1.85 6.29.97 6.29 5.88z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmClose && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-60 z-[60]" />
          <div className="fixed inset-0 z-[70] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Cancel Payment?
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Are you sure you want to cancel? Your payment information will not be
                      saved.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={cancelClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Continue Payment
                  </button>
                  <button
                    onClick={confirmClose}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
