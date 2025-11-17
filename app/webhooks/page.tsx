'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import WebhookManager from '@/components/webhooks/WebhookManager';
import WebhookLogs from '@/components/webhooks/WebhookLogs';
import { Webhook, List, Activity } from 'lucide-react';

export default function WebhooksPage() {
  const [activeTab, setActiveTab] = useState<'webhooks' | 'logs' | 'events'>('webhooks');

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Webhooks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            จัดการ webhook endpoints และติดตามการส่งข้อมูล
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('webhooks')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'webhooks'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                <span>Webhooks</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <List className="h-5 w-5" />
                <span>Delivery Logs</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'events'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <span>Event History</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'webhooks' && <WebhookManager />}
          {activeTab === 'logs' && <WebhookLogs />}
          {activeTab === 'events' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-gray-600 dark:text-gray-400">Event history coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
