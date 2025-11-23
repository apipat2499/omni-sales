'use client';

import { MarketplacePlatform } from '@/types';
import { X } from 'lucide-react';
import { useState } from 'react';

interface ConnectMarketplaceModalProps {
  platform: MarketplacePlatform;
  onConnect: (data: Record<string, string>) => Promise<void>;
  onClose: () => void;
}

export function ConnectMarketplaceModal({
  platform,
  onConnect,
  onClose,
}: ConnectMarketplaceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [useOAuth, setUseOAuth] = useState(platform.code === 'shopee'); // Default to OAuth for Shopee

  const platformCode = platform.code;

  // Different form fields based on platform
  const getFormFields = () => {
    switch (platformCode) {
      case 'shopee':
        return [
          { name: 'shopId', label: 'Shop ID', required: true },
          { name: 'shopName', label: 'Shop Name', required: false },
          { name: 'accessToken', label: 'Access Token', required: true },
          { name: 'refreshToken', label: 'Refresh Token', required: false },
          { name: 'apiKey', label: 'API Key', required: true },
          { name: 'apiSecret', label: 'API Secret', required: true },
        ];
      case 'lazada':
        return [
          { name: 'shopId', label: 'Shop ID', required: true },
          { name: 'shopName', label: 'Shop Name', required: false },
          { name: 'accessToken', label: 'Access Token', required: true },
          { name: 'refreshToken', label: 'Refresh Token', required: true },
          { name: 'apiKey', label: 'API Key', required: true },
          { name: 'apiSecret', label: 'API Secret', required: true },
        ];
      case 'facebook':
        return [
          { name: 'shopId', label: 'Shop ID / Page ID', required: true },
          { name: 'shopName', label: 'Shop Name', required: false },
          { name: 'accessToken', label: 'Access Token', required: true },
          { name: 'apiKey', label: 'App ID', required: true },
          { name: 'apiSecret', label: 'App Secret', required: true },
        ];
      default:
        return [];
    }
  };

  const fields = getFormFields();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOAuthConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call API to get Shopee authorization URL
      const response = await fetch('/api/marketplace/shopee/auth');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get authorization URL');
      }

      // Redirect to Shopee authorization page
      window.location.href = data.authUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to start OAuth flow'
      );
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    const requiredFields = fields.filter((f) => f.required);
    const missingFields = requiredFields.filter((f) => !formData[f.name]);

    if (missingFields.length > 0) {
      setError(
        `Missing required fields: ${missingFields.map((f) => f.label).join(', ')}`
      );
      return;
    }

    setIsLoading(true);
    try {
      await onConnect({
        ...formData,
        platformCode,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect marketplace'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-white">
            Connect {platform.name}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-200 mb-4">
              {error}
            </div>
          )}

          {/* OAuth Option for Shopee */}
          {platformCode === 'shopee' && useOAuth && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <p className="font-semibold mb-2">🔐 Connect with Shopee OAuth (Recommended)</p>
                <p className="mb-3">
                  Securely connect your Shopee shop using official OAuth authorization.
                  You will be redirected to Shopee to approve access.
                </p>
                <p className="text-xs mb-2">Prerequisites:</p>
                <ul className="text-xs list-disc list-inside space-y-1">
                  <li>Register your app at: <a href="https://open.shopee.com/" target="_blank" rel="noopener noreferrer" className="underline">https://open.shopee.com/</a></li>
                  <li>Set SHOPEE_PARTNER_ID and SHOPEE_PARTNER_KEY in .env</li>
                  <li>Make sure you have admin access to your Shopee shop</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleOAuthConnect}
                disabled={isLoading}
                className="w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Redirecting to Shopee...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span>Connect with Shopee</span>
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                    or enter credentials manually
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUseOAuth(false)}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Use manual credentials instead
              </button>
            </div>
          )}

          {/* Manual Form (shown for non-Shopee or when OAuth is disabled) */}
          {(!useOAuth || platformCode !== 'shopee') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {platformCode === 'shopee' && (
                <button
                  type="button"
                  onClick={() => setUseOAuth(true)}
                  className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 mb-4"
                >
                  ← Back to OAuth connection
                </button>
              )}

              {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={
                  field.name.includes('Secret') ||
                  field.name.includes('Token')
                    ? 'password'
                    : 'text'
                }
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                required={field.required}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                placeholder={field.label}
              />
            </div>
          ))}

              {/* Help text */}
              <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <p className="font-semibold mb-1">Where to find your credentials:</p>
                {platformCode === 'shopee' && (
                  <p>
                    Get your credentials from Shopee Partner Portal {'->'} Settings {'->'} API
                  </p>
                )}
                {platformCode === 'lazada' && (
                  <p>
                    Get your credentials from Lazada Open Platform {'->'} My Applications
                  </p>
                )}
                {platformCode === 'facebook' && (
                  <p>
                    Get your credentials from Facebook Business Manager {'->'} Apps
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          )}

          {/* Close button for OAuth view */}
          {platformCode === 'shopee' && useOAuth && (
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
