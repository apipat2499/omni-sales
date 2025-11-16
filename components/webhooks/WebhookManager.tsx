'use client';

import { useState } from 'react';
import {
  Webhook,
  Plus,
  Trash2,
  Edit,
  Power,
  PowerOff,
  Send,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  X,
  Copy,
  Settings,
  BarChart,
} from 'lucide-react';
import { useWebhooks, useWebhookDetails, useWebhookEvents } from '@/lib/hooks/useWebhooks';
import type { WebhookConfig, WebhookDelivery, WebhookEventType } from '@/lib/utils/webhooks';

/**
 * Main webhook manager component
 */
export default function WebhookManager() {
  const {
    webhooks,
    deliveries,
    loading,
    stats,
    create,
    update,
    remove,
    toggle,
    test,
    retry,
    clearOld,
    clearAll,
    exportConfig,
    importConfig,
    refresh,
  } = useWebhooks();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [showDeliveries, setShowDeliveries] = useState(false);

  const handleCreate = (config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    create(config);
    setShowAddModal(false);
  };

  const handleUpdate = (id: string, updates: Partial<WebhookConfig>) => {
    update(id, updates);
    setEditingWebhook(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      remove(id);
    }
  };

  const handleTest = async (id: string) => {
    const delivery = await test(id);
    if (delivery) {
      alert('Test webhook sent! Check the delivery history for results.');
      refresh();
    }
  };

  const handleExport = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webhooks-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      const count = importConfig(json);
      alert(`Imported ${count} webhook(s)`);
      refresh();
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            Webhook Manager
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure and monitor webhook integrations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeliveries(!showDeliveries)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <BarChart className="h-4 w-4" />
            {showDeliveries ? 'Hide' : 'Show'} Deliveries
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>

          <label className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="h-4 w-4" />
            Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Webhook
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Webhooks"
          value={webhooks.length}
          icon={<Webhook className="h-5 w-5 text-blue-600" />}
        />
        <StatsCard
          title="Total Deliveries"
          value={stats.total}
          icon={<Send className="h-5 w-5 text-purple-600" />}
        />
        <StatsCard
          title="Successful"
          value={stats.successful}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
        />
        <StatsCard
          title="Failed"
          value={stats.failed}
          icon={<XCircle className="h-5 w-5 text-red-600" />}
        />
      </div>

      {/* Webhooks List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">Configured Webhooks</h2>
        </div>

        {webhooks.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No webhooks configured yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Webhook
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Events
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {webhooks.map((webhook) => (
                  <WebhookRow
                    key={webhook.id}
                    webhook={webhook}
                    onEdit={() => setEditingWebhook(webhook)}
                    onDelete={() => handleDelete(webhook.id)}
                    onToggle={() => toggle(webhook.id)}
                    onTest={() => handleTest(webhook.id)}
                    onViewDetails={() => setSelectedWebhook(webhook.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deliveries History */}
      {showDeliveries && (
        <DeliveryHistory
          deliveries={deliveries}
          onRetry={retry}
          onClearOld={() => {
            if (confirm('Clear deliveries older than 30 days?')) {
              clearOld(30);
            }
          }}
          onClearAll={() => {
            if (confirm('Clear all delivery history?')) {
              clearAll();
            }
          }}
        />
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingWebhook) && (
        <WebhookModal
          webhook={editingWebhook}
          onSave={(config) => {
            if (editingWebhook) {
              handleUpdate(editingWebhook.id, config);
            } else {
              handleCreate(config as any);
            }
          }}
          onClose={() => {
            setShowAddModal(false);
            setEditingWebhook(null);
          }}
        />
      )}

      {/* Webhook Details Modal */}
      {selectedWebhook && (
        <WebhookDetailsModal
          webhookId={selectedWebhook}
          onClose={() => setSelectedWebhook(null)}
          onRetry={retry}
        />
      )}
    </div>
  );
}

/**
 * Statistics card
 */
function StatsCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold dark:text-white mt-1">{value}</p>
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">{icon}</div>
      </div>
    </div>
  );
}

/**
 * Webhook table row
 */
function WebhookRow({
  webhook,
  onEdit,
  onDelete,
  onToggle,
  onTest,
  onViewDetails,
}: {
  webhook: WebhookConfig;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onTest: () => void;
  onViewDetails: () => void;
}) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {webhook.enabled ? (
            <Power className="h-4 w-4 text-green-600" />
          ) : (
            <PowerOff className="h-4 w-4 text-gray-400" />
          )}
          <span className="font-medium dark:text-white">{webhook.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <code className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          {webhook.method} {webhook.url}
        </code>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {webhook.events.map((event) => (
            <span
              key={event}
              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
            >
              {event}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-xs px-2 py-1 rounded ${
            webhook.enabled
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
        >
          {webhook.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onViewDetails}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={onTest}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Test Webhook"
          >
            <Send className="h-4 w-4 text-blue-600" />
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title={webhook.enabled ? 'Disable' : 'Enable'}
          >
            {webhook.enabled ? (
              <PowerOff className="h-4 w-4 text-gray-600" />
            ) : (
              <Power className="h-4 w-4 text-green-600" />
            )}
          </button>
          <button
            onClick={onEdit}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Edit"
          >
            <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Webhook modal for add/edit
 */
function WebhookModal({
  webhook,
  onSave,
  onClose,
}: {
  webhook: WebhookConfig | null;
  onSave: (config: Partial<WebhookConfig>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: webhook?.name || '',
    url: webhook?.url || '',
    method: webhook?.method || 'POST' as const,
    events: webhook?.events || [] as WebhookEventType[],
    secret: webhook?.secret || '',
    enabled: webhook?.enabled ?? true,
    headers: webhook?.headers || {},
    retryConfig: webhook?.retryConfig || {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
    },
  });

  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  const eventTypes: WebhookEventType[] = [
    'onCreate',
    'onUpdate',
    'onDelete',
    'onBulkOperation',
    'onStatusChange',
    'onPayment',
    'onInventoryChange',
  ];

  const toggleEvent = (event: WebhookEventType) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const addHeader = () => {
    if (headerKey && headerValue) {
      setFormData((prev) => ({
        ...prev,
        headers: { ...prev.headers, [headerKey]: headerValue },
      }));
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const removeHeader = (key: string) => {
    setFormData((prev) => {
      const headers = { ...prev.headers };
      delete headers[key];
      return { ...prev, headers };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold dark:text-white">
            {webhook ? 'Edit Webhook' : 'Add Webhook'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="https://api.example.com/webhook"
              required
            />
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              HTTP Method
            </label>
            <select
              value={formData.method}
              onChange={(e) =>
                setFormData({ ...formData, method: e.target.value as WebhookConfig['method'] })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          {/* Events */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Events *
            </label>
            <div className="space-y-2">
              {eventTypes.map((event) => (
                <label key={event} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="h-4 w-4 rounded cursor-pointer"
                  />
                  <span className="text-sm dark:text-white">{event}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Secret (for signature verification)
            </label>
            <input
              type="password"
              value={formData.secret}
              onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Optional secret key"
            />
          </div>

          {/* Custom Headers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Headers
            </label>
            <div className="space-y-2">
              {Object.entries(formData.headers || {}).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {key}: {value}
                  </code>
                  <button
                    type="button"
                    onClick={() => removeHeader(key)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={headerKey}
                  onChange={(e) => setHeaderKey(e.target.value)}
                  placeholder="Header name"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                />
                <input
                  type="text"
                  value={headerValue}
                  onChange={(e) => setHeaderValue(e.target.value)}
                  placeholder="Header value"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                />
                <button
                  type="button"
                  onClick={addHeader}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Retry Configuration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Retry Configuration
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Max Retries
                </label>
                <input
                  type="number"
                  value={formData.retryConfig.maxRetries}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      retryConfig: {
                        ...formData.retryConfig,
                        maxRetries: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  min="0"
                  max="10"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Retry Delay (ms)
                </label>
                <input
                  type="number"
                  value={formData.retryConfig.retryDelay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      retryConfig: {
                        ...formData.retryConfig,
                        retryDelay: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  min="100"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Backoff Multiplier
                </label>
                <input
                  type="number"
                  value={formData.retryConfig.backoffMultiplier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      retryConfig: {
                        ...formData.retryConfig,
                        backoffMultiplier: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  min="1"
                  max="5"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Enabled */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="h-4 w-4 rounded cursor-pointer"
            />
            <label className="text-sm dark:text-white">Enable webhook</label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={!formData.name || !formData.url || formData.events.length === 0}
            >
              {webhook ? 'Update' : 'Create'} Webhook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Delivery history panel
 */
function DeliveryHistory({
  deliveries,
  onRetry,
  onClearOld,
  onClearAll,
}: {
  deliveries: WebhookDelivery[];
  onRetry: (id: string) => void;
  onClearOld: () => void;
  onClearAll: () => void;
}) {
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold dark:text-white">Delivery History</h2>
        <div className="flex gap-2">
          <button
            onClick={onClearOld}
            className="text-sm px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Clear Old
          </button>
          <button
            onClick={onClearAll}
            className="text-sm px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Webhook
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Event
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Attempts
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {deliveries.map((delivery) => (
              <tr key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-sm dark:text-white">{delivery.webhookName}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    {delivery.eventType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DeliveryStatus status={delivery.status} statusCode={delivery.statusCode} />
                </td>
                <td className="px-4 py-3 text-sm dark:text-white">{delivery.attempts}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {formatTime(delivery.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDelivery(delivery)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    {delivery.status === 'failed' && (
                      <button
                        onClick={() => onRetry(delivery.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title="Retry"
                      >
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delivery Details Modal */}
      {selectedDelivery && (
        <DeliveryDetailsModal
          delivery={selectedDelivery}
          onClose={() => setSelectedDelivery(null)}
        />
      )}
    </div>
  );
}

/**
 * Delivery status badge
 */
function DeliveryStatus({
  status,
  statusCode,
}: {
  status: WebhookDelivery['status'];
  statusCode?: number;
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      case 'retrying':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-3 w-3" />;
      case 'failed':
        return <XCircle className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'retrying':
        return <RefreshCw className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${getStatusColor()}`}>
        {getIcon()}
        {status}
      </span>
      {statusCode && (
        <span className="text-xs text-gray-500 dark:text-gray-400">({statusCode})</span>
      )}
    </div>
  );
}

/**
 * Webhook details modal
 */
function WebhookDetailsModal({
  webhookId,
  onClose,
  onRetry,
}: {
  webhookId: string;
  onClose: () => void;
  onRetry: (id: string) => void;
}) {
  const { webhook, deliveries, stats } = useWebhookDetails(webhookId);

  if (!webhook) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold dark:text-white">{webhook.name}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Successful</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Failed</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.successRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Success Rate</p>
              </div>
            </div>
          )}

          {/* Recent Deliveries */}
          <div>
            <h3 className="text-lg font-semibold dark:text-white mb-4">Recent Deliveries</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {deliveries.slice(0, 20).map((delivery) => (
                <div
                  key={delivery.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DeliveryStatus status={delivery.status} statusCode={delivery.statusCode} />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {delivery.eventType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(delivery.createdAt)}
                      </span>
                      {delivery.status === 'failed' && (
                        <button
                          onClick={() => onRetry(delivery.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        >
                          <RefreshCw className="h-3 w-3 text-blue-600" />
                        </button>
                      )}
                    </div>
                  </div>
                  {delivery.error && (
                    <p className="text-xs text-red-600 dark:text-red-400">{delivery.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Delivery details modal
 */
function DeliveryDetailsModal({
  delivery,
  onClose,
}: {
  delivery: WebhookDelivery;
  onClose: () => void;
}) {
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold dark:text-white">Delivery Details</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Webhook</p>
              <p className="text-sm font-medium dark:text-white mt-1">{delivery.webhookName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Event</p>
              <p className="text-sm font-medium dark:text-white mt-1">{delivery.eventType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
              <div className="mt-1">
                <DeliveryStatus status={delivery.status} statusCode={delivery.statusCode} />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Attempts</p>
              <p className="text-sm font-medium dark:text-white mt-1">{delivery.attempts}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Created At</p>
              <p className="text-sm font-medium dark:text-white mt-1">
                {delivery.createdAt.toLocaleString()}
              </p>
            </div>
            {delivery.completedAt && (
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Completed At</p>
                <p className="text-sm font-medium dark:text-white mt-1">
                  {delivery.completedAt.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* URL */}
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">URL</p>
            <code className="block text-xs bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
              {delivery.method} {delivery.url}
            </code>
          </div>

          {/* Error */}
          {delivery.error && (
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Error</p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{delivery.error}</p>
              </div>
            </div>
          )}

          {/* Payload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">Payload</p>
              <button
                onClick={() =>
                  copyToClipboard(JSON.stringify(delivery.payload, null, 2), setCopiedPayload)
                }
                className="text-xs flex items-center gap-1 px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <Copy className="h-3 w-3" />
                {copiedPayload ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded overflow-x-auto max-h-64">
              {JSON.stringify(delivery.payload, null, 2)}
            </pre>
          </div>

          {/* Response */}
          {delivery.response && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Response</p>
                <button
                  onClick={() => copyToClipboard(delivery.response || '', setCopiedResponse)}
                  className="text-xs flex items-center gap-1 px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  {copiedResponse ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded overflow-x-auto max-h-64">
                {delivery.response}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString();
}
