'use client';

/**
 * WebAuthn Registration Page
 * Allows users to register new WebAuthn credentials (biometric or security keys)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WebAuthnRegisterButton from '@/components/auth/webauthn/WebAuthnRegisterButton';
import RecoveryCodesDisplay from '@/components/auth/webauthn/RecoveryCodesDisplay';
import WebAuthnClient from '@/lib/auth/webauthn/webauthn-client';

export default function RegisterWebAuthnPage() {
  const router = useRouter();
  const [step, setStep] = useState<'device' | 'recovery' | 'complete'>('device');
  const [deviceType, setDeviceType] = useState<'platform' | 'cross-platform' | null>(null);
  const [credential, setCredential] = useState<any>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState({
    isSupported: false,
    hasPlatformAuthenticator: false,
    hasConditionalMediation: false,
  });

  useEffect(() => {
    checkCapabilities();
  }, []);

  const checkCapabilities = async () => {
    const caps = await WebAuthnClient.getBrowserCapabilities();
    setCapabilities(caps);

    if (!caps.isSupported) {
      setError('WebAuthn is not supported on this browser. Please use a modern browser like Chrome, Firefox, Safari, or Edge.');
    }
  };

  const handleDeviceSelection = (type: 'platform' | 'cross-platform') => {
    setDeviceType(type);
    setError(null);
  };

  const handleRegistrationSuccess = async (cred: any) => {
    setCredential(cred);
    setStep('recovery');

    // Auto-generate recovery codes
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch('/api/auth/webauthn/recovery-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ regenerate: false }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecoveryCodes(data.codes);
      }
    } catch (err) {
      console.error('Failed to generate recovery codes:', err);
    }
  };

  const handleRegistrationError = (err: string) => {
    setError(err);
  };

  const handleComplete = () => {
    setStep('complete');
    // Redirect to dashboard or settings after a delay
    setTimeout(() => {
      router.push('/settings/security/credentials');
    }, 2000);
  };

  if (!capabilities.isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Not Supported</h3>
                <p className="mt-1 text-sm text-gray-600">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Set Up Passwordless Login</h1>
          <p className="mt-2 text-sm text-gray-600">
            Use your biometric or security key to sign in securely
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step === 'device' || step === 'recovery' || step === 'complete' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                1
              </div>
              <div className={`w-20 h-1 ${step === 'recovery' || step === 'complete' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            </div>
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step === 'recovery' || step === 'complete' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
              <div className={`w-20 h-1 ${step === 'complete' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            </div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step === 'complete' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              3
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span className="w-32 text-center">Choose Device</span>
            <span className="w-32 text-center">Save Recovery</span>
            <span className="w-32 text-center">Complete</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="ml-3 text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Device Selection */}
        {step === 'device' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Choose Your Authentication Method
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Platform Authenticator */}
              <div className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${deviceType === 'platform' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                    <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Biometric</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Use Face ID, Touch ID, Windows Hello, or fingerprint
                  </p>
                  {capabilities.hasPlatformAuthenticator ? (
                    <WebAuthnRegisterButton
                      deviceType="platform"
                      onSuccess={handleRegistrationSuccess}
                      onError={handleRegistrationError}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Not available on this device
                    </p>
                  )}
                </div>
              </div>

              {/* Cross-platform Authenticator */}
              <div className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${deviceType === 'cross-platform' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Security Key</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Use a physical security key like YubiKey
                  </p>
                  <WebAuthnRegisterButton
                    deviceType="cross-platform"
                    credentialName="Security Key"
                    onSuccess={handleRegistrationSuccess}
                    onError={handleRegistrationError}
                    className="w-full bg-green-600 hover:bg-green-700"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">About Passwordless Login</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>More secure than passwords</li>
                      <li>Faster and easier to use</li>
                      <li>Protected against phishing</li>
                      <li>You can register multiple devices</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Recovery Codes */}
        {step === 'recovery' && (
          <div>
            <RecoveryCodesDisplay
              codes={recoveryCodes}
              onDownload={handleComplete}
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleComplete}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 'complete' && (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              All Set!
            </h2>
            <p className="text-gray-600 mb-6">
              You can now sign in using your {credential?.device_type === 'platform' ? 'biometric' : 'security key'}.
            </p>
            <button
              onClick={() => router.push('/settings/security/credentials')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Security Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
