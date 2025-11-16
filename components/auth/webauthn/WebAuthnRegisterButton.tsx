'use client';

/**
 * WebAuthn Register Button
 * Button component for registering a new WebAuthn credential
 */

import { useState, useEffect } from 'react';
import WebAuthnClient from '@/lib/auth/webauthn/webauthn-client';

interface WebAuthnRegisterButtonProps {
  onSuccess?: (credential: any) => void;
  onError?: (error: string) => void;
  className?: string;
  deviceType?: 'platform' | 'cross-platform' | 'auto';
  credentialName?: string;
}

export default function WebAuthnRegisterButton({
  onSuccess,
  onError,
  className = '',
  deviceType = 'auto',
  credentialName,
}: WebAuthnRegisterButtonProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPlatformAuth, setHasPlatformAuth] = useState(false);

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = async () => {
    const capabilities = await WebAuthnClient.getBrowserCapabilities();
    setIsSupported(capabilities.isSupported);
    setHasPlatformAuth(capabilities.hasPlatformAuthenticator);
  };

  const handleRegister = async () => {
    if (!isSupported) {
      onError?.('WebAuthn is not supported on this browser');
      return;
    }

    setIsRegistering(true);

    try {
      // Get session token (adjust based on your auth implementation)
      const token = localStorage.getItem('supabase.auth.token');

      // Request registration options
      const optionsResponse = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!optionsResponse.ok) {
        throw new Error('Failed to get registration options');
      }

      const options = await optionsResponse.json();

      // Start registration with authenticator
      const result = await WebAuthnClient.register(options);

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      // Determine device type
      let finalDeviceType: 'platform' | 'cross-platform';
      if (deviceType === 'auto') {
        // Auto-detect from response or use platform if available
        finalDeviceType = hasPlatformAuth ? 'platform' : 'cross-platform';
      } else {
        finalDeviceType = deviceType;
      }

      // Verify registration with server
      const verifyResponse = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          response: result.response,
          deviceType: finalDeviceType,
          credentialName,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify registration');
      }

      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        onSuccess?.(verifyResult.credential);
      } else {
        throw new Error(verifyResult.error || 'Verification failed');
      }
    } catch (error) {
      const errorMessage = WebAuthnClient.getErrorMessage(error);
      onError?.(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={handleRegister}
      disabled={isRegistering}
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isRegistering ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
          Registering...
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          {hasPlatformAuth && deviceType !== 'cross-platform'
            ? 'Add Biometric'
            : 'Add Security Key'}
        </>
      )}
    </button>
  );
}
