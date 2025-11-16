'use client';

import { useEffect, useState } from 'react';
import { EmailPreferences } from '@/types';
import { Bell, Mail, AlertCircle } from 'lucide-react';

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      window.location.href = '/login';
      return;
    }

    fetchPreferences(userId);
  }, []);

  const fetchPreferences = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/email/preferences?userId=${userId}`);
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key: keyof EmailPreferences) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleTimeChange = (value: string) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      dailySummaryTime: value,
    });
  };

  const handleThresholdChange = (value: number) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      lowStockThreshold: value,
    });
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      const userId = localStorage.getItem('userId');

      const response = await fetch('/api/email/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...preferences,
        }),
      });

      if (!response.ok) throw new Error('Failed to save preferences');

      setSuccessMessage('Notification preferences saved!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert('Failed to save preferences: ' + (error instanceof Error ? error.message : ''));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Failed to load preferences</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold dark:text-white">Notifications</h1>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your email notification preferences
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900 dark:text-green-200">
            {successMessage}
          </div>
        )}

        {/* Settings */}
        <div className="space-y-6">
          {/* Order Notifications */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-xl font-bold dark:text-white">
              Order Notifications
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Get alerts when customers place orders or make payments
            </p>

            <div className="mt-6 space-y-4">
              {/* New Order */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold dark:text-white">
                    New Order Alert
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notify when a customer places a new order
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('newOrderNotification')}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    preferences.newOrderNotification
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      preferences.newOrderNotification
                        ? 'translate-x-7'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Payment Confirmation */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold dark:text-white">
                    Payment Confirmation
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notify when payment is received
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('paymentConfirmation')}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    preferences.paymentConfirmation
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      preferences.paymentConfirmation
                        ? 'translate-x-7'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-xl font-bold dark:text-white">
              Inventory Alerts
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Get notified about stock levels
            </p>

            <div className="mt-6 space-y-4">
              {/* Low Stock Alert */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold dark:text-white">
                    Low Stock Alert
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notify when product stock falls below threshold
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('lowStockAlert')}
                  className={`relative ml-4 inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    preferences.lowStockAlert
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      preferences.lowStockAlert
                        ? 'translate-x-7'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Low Stock Threshold */}
              {preferences.lowStockAlert && (
                <div className="mt-4 ml-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stock Threshold ({preferences.lowStockThreshold} units)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={preferences.lowStockThreshold}
                    onChange={(e) =>
                      handleThresholdChange(parseInt(e.target.value))
                    }
                    className="mt-2 w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Reports & Analytics */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-xl font-bold dark:text-white">
              Reports & Analytics
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Receive regular business reports
            </p>

            <div className="mt-6 space-y-4">
              {/* Daily Summary */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold dark:text-white">
                    Daily Summary
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Daily sales summary at specified time
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('dailySummaryEnabled')}
                  className={`relative ml-4 inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    preferences.dailySummaryEnabled
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      preferences.dailySummaryEnabled
                        ? 'translate-x-7'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Daily Summary Time */}
              {preferences.dailySummaryEnabled && (
                <div className="mt-4 ml-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Send at (24-hour format)
                  </label>
                  <input
                    type="time"
                    value={preferences.dailySummaryTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="mt-2 rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              {/* Weekly Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold dark:text-white">
                    Weekly Analytics
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Detailed weekly analytics report
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('weeklyAnalytics')}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    preferences.weeklyAnalytics
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      preferences.weeklyAnalytics
                        ? 'translate-x-7'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Monthly Report */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold dark:text-white">
                    Monthly Report
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Comprehensive monthly business report
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('monthlyReport')}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    preferences.monthlyReport
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      preferences.monthlyReport
                        ? 'translate-x-7'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
