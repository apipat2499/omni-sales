'use client';

import { useState, useEffect } from 'react';
import { AdminGuard } from '@/components/RouteGuard';
import { useSettings } from '@/contexts/SettingsContext';

export default function StoreSettingsPage() {
  const { settings, updateStoreSettings } = useSettings();
  const [formData, setFormData] = useState(settings.store);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setFormData(settings.store);
  }, [settings.store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim()) {
      setMessage({ type: 'error', text: 'Name and description are required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await updateStoreSettings(formData);
      setMessage({ type: 'success', text: 'Store settings updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update store settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Settings</h1>
        <p className="text-gray-600">Manage your store information and branding</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="My Store"
              required
            />
          </div>

          {/* Store Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Store Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Quality clothing and accessories"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Brief description of your store (max 500 characters)
            </p>
          </div>

          {/* Store Logo */}
          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
              Store Logo URL (Optional)
            </label>
            <input
              type="url"
              id="logo"
              value={formData.logo || ''}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value || null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/logo.png"
            />
            {formData.logo && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Logo Preview:</p>
                <img
                  src={formData.logo}
                  alt="Store logo"
                  className="h-20 object-contain border border-gray-200 rounded p-2"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${
                saving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </AdminGuard>
  );
}
