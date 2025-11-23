'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

const THAI_BANKS = [
  'Bangkok Bank',
  'Kasikornbank',
  'Krung Thai Bank',
  'Siam Commercial Bank',
  'Bank of Ayudhya (Krungsri)',
  'TMB Bank',
  'Government Savings Bank',
  'CIMB Thai Bank',
  'United Overseas Bank (UOB)',
  'Standard Chartered Bank',
];

export default function PaymentSettingsPage() {
  const { settings, updateBankAccountSettings } = useSettings();
  const [formData, setFormData] = useState(settings.bankAccount);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setFormData(settings.bankAccount);
  }, [settings.bankAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bankName || !formData.accountNumber.trim() || !formData.accountHolder.trim()) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await updateBankAccountSettings(formData);
      setMessage({ type: 'success', text: 'Payment settings updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update payment settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Settings</h1>
        <p className="text-gray-600">Configure bank account for customer payments</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bank Name */}
          <div>
            <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <select
              id="bankName"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a bank</option>
              {THAI_BANKS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="accountNumber"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234567890"
              required
            />
          </div>

          {/* Account Holder Name */}
          <div>
            <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="accountHolder"
              value={formData.accountHolder}
              onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your Name Here"
              required
            />
          </div>

          {/* Show in Checkout */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showInCheckout"
              checked={formData.showInCheckout}
              onChange={(e) => setFormData({ ...formData, showInCheckout: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showInCheckout" className="ml-2 block text-sm text-gray-700">
              Show bank account details in checkout
            </label>
          </div>

          {/* Preview Button */}
          <div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              {showPreview ? 'Hide Preview' : 'Test Bank Transfer Info Display'}
            </button>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
              <h3 className="font-semibold text-lg mb-4 text-gray-900">
                Bank Transfer Information Preview
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-medium text-gray-900">{formData.bankName || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Number:</span>
                  <span className="font-medium text-gray-900">
                    {formData.accountNumber || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Name:</span>
                  <span className="font-medium text-gray-900">
                    {formData.accountHolder || 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          )}

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
  );
}
