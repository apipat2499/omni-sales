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
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
              {error}
            </div>
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
      </div>
    </div>
  );
}
