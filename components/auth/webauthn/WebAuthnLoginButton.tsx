'use client';

/**
 * WebAuthn Login Button
 * Button component for authenticating with WebAuthn
 */

import { useState, useEffect } from 'react';
import WebAuthnClient from '@/lib/auth/webauthn/webauthn-client';

interface WebAuthnLoginButtonProps {
  email?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'text';
  autoFill?: boolean;
}

export default function WebAuthnLoginButton({
  email,
  onSuccess,
  onError,
  className = '',
  variant = 'primary',
  autoFill = false,
}: WebAuthnLoginButtonProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasConditionalMediation, setHasConditionalMediation] = useState(false);

  useEffect(() => {
    checkSupport();
  }, []);

  useEffect(() => {
    if (autoFill && isSupported && hasConditionalMediation) {
      handleAutoFillLogin();
    }
  }, [autoFill, isSupported, hasConditionalMediation]);

  const checkSupport = async () => {
    const capabilities = await WebAuthnClient.getBrowserCapabilities();
    setIsSupported(capabilities.isSupported);
    setHasConditionalMediation(capabilities.hasConditionalMediation);
  };

  const handleAutoFillLogin = async () => {
    try {
      await handleAuthenticate(true);
    } catch (error) {
      // Silent fail for autofill
      console.log('Autofill authentication not available');
    }
  };

  const handleClick = async () => {
    await handleAuthenticate(false);
  };

  const handleAuthenticate = async (useBrowserAutofill: boolean = false) => {
    if (!isSupported) {
      onError?.('WebAuthn is not supported on this browser');
      return;
    }

    setIsAuthenticating(true);

    try {
      // Request authentication options
      const optionsResponse = await fetch('/api/auth/webauthn/authenticate/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to get authentication options');
      }

      const options = await optionsResponse.json();

      // Start authentication with authenticator
      const result = await WebAuthnClient.authenticate(options, useBrowserAutofill);

      if (!result.success) {
        throw new Error(result.error || 'Authentication failed');
      }

      // Verify authentication with server
      const verifyResponse = await fetch('/api/auth/webauthn/authenticate/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: result.response,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify authentication');
      }

      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        onSuccess?.(verifyResult);
      } else {
        throw new Error(verifyResult.error || 'Verification failed');
      }
    } catch (error) {
      const errorMessage = WebAuthnClient.getErrorMessage(error);
      onError?.(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'border border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500',
    text: 'text-blue-600 hover:text-blue-700 focus:ring-blue-500',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isAuthenticating}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {isAuthenticating ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Authenticating...
        </>
      ) : (
        <>
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          Sign in with Passkey
        </>
      )}
    </button>
  );
}
