'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, TestTube, BarChart3, Webhook } from 'lucide-react';
import CreateWebhookModal from './CreateWebhookModal';
import EditWebhookModal from './EditWebhookModal';
import WebhookStatsModal from './WebhookStatsModal';

interface Webhook {
  id: string;
  name: string;
  description?: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at?: string;
  created_at: string;
}

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [statsWebhook, setStatsWebhook] = useState<Webhook | null>(null);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks');
      const data = await response.json();
      if (data.success) {
        setWebhooks(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleToggleActive = async (webhookId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      const data = await response.json();
      if (data.success) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const handleTest = async (webhookId: string) => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}/test`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        alert('Test webhook sent successfully!');
      } else {
        alert(`Failed to send test webhook: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to send test webhook:', error);
      alert('Failed to send test webhook');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading webhooks...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with Create Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Webhook Endpoints</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure endpoints to receive real-time event notifications
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Webhook
          </button>
        </div>

        {/* Webhooks List */}
        {webhooks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No webhooks yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by creating your first webhook endpoint
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Webhook
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {webhook.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          webhook.is_active
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {webhook.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {webhook.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {webhook.description}
                      </p>
                    )}
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">URL:</span>
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-gray-100 text-xs">
                          {webhook.url}
                        </code>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Events:</span>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 3).map((event) => (
                            <span
                              key={event}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs"
                            >
                              {event}
                            </span>
                          ))}
                          {webhook.events.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 rounded text-xs">
                              +{webhook.events.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      {webhook.last_triggered_at && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Last triggered:</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {new Date(webhook.last_triggered_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setStatsWebhook(webhook)}
                      className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      title="View Stats"
                    >
                      <BarChart3 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleTest(webhook.id)}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Send Test"
                    >
                      <TestTube className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(webhook.id, webhook.is_active)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title={webhook.is_active ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setEditingWebhook(webhook)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateWebhookModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchWebhooks();
          }}
        />
      )}

      {editingWebhook && (
        <EditWebhookModal
          webhook={editingWebhook}
          onClose={() => setEditingWebhook(null)}
          onSuccess={() => {
            setEditingWebhook(null);
            fetchWebhooks();
          }}
        />
      )}

      {statsWebhook && (
        <WebhookStatsModal webhook={statsWebhook} onClose={() => setStatsWebhook(null)} />
      )}
    </>
  );
}
