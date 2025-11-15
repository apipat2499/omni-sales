'use client';

import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Send,
  BarChart3,
  Zap,
  CheckCircle,
  XCircle,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  templateType: string;
  content: string;
  smsCount: number;
  isActive: boolean;
}

interface Campaign {
  id: string;
  campaignName: string;
  campaignType: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
}

interface KPIStats {
  totalTemplates: number;
  activeCampaigns: number;
  totalSent: number;
  deliveryRate: number;
}

export default function SMSPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'campaigns' | 'logs' | 'analytics'>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    templateType: 'order_confirmation',
    content: '',
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      window.location.href = '/login';
      return;
    }
    setUserId(storedUserId);
    fetchData(storedUserId);
  }, []);

  const fetchData = async (userId: string) => {
    try {
      setIsLoading(true);
      const [templatesRes, campaignsRes] = await Promise.all([
        fetch(`/api/sms/templates?userId=${userId}`),
        fetch(`/api/sms/campaigns?userId=${userId}`),
      ]);
      const templatesData = await templatesRes.json();
      const campaignsData = await campaignsRes.json();
      setTemplates(templatesData.data || []);
      setCampaigns(campaignsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!userId || !newTemplate.name.trim() || !newTemplate.content.trim()) return;

    try {
      const response = await fetch('/api/sms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...newTemplate }),
      });

      if (response.ok) {
        setNewTemplate({ name: '', templateType: 'order_confirmation', content: '' });
        setIsCreatingTemplate(false);
        fetchData(userId);
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const stats: KPIStats = {
    totalTemplates: templates.length,
    activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
    totalSent: campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0),
    deliveryRate: 94.5,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading SMS module...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold dark:text-white">SMS Notifications</h1>
          </div>
          <button
            onClick={() => setIsCreatingTemplate(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            <Plus className="h-5 w-5" />
            New Template
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Templates</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.totalTemplates}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.activeCampaigns}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sent</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.totalSent.toLocaleString()}</p>
              </div>
              <Send className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Rate</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.deliveryRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'templates'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Templates ({stats.totalTemplates})
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'campaigns'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Campaigns
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'logs'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Logs
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'templates' && (
              <div className="space-y-4">
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <div
                      key={template.id}
                      className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold dark:text-white">{template.name}</h3>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Type: {template.templateType} • Length: {template.smsCount} SMS
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                            {template.content}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button className="rounded bg-blue-100 p-2 text-blue-600 hover:bg-blue-200 dark:bg-blue-900">
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button className="rounded bg-red-100 p-2 text-red-600 hover:bg-red-200 dark:bg-red-900">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-600 dark:text-gray-400">No templates yet</p>
                )}
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div className="space-y-4">
                {campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <div key={campaign.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold dark:text-white">{campaign.campaignName}</h3>
                          <div className="mt-2 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Recipients: {campaign.recipientCount.toLocaleString()}</span>
                            <span>Sent: {campaign.sentCount}</span>
                            <span>Delivered: {campaign.deliveredCount}</span>
                            <span>Failed: {campaign.failedCount}</span>
                          </div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          campaign.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-600 dark:text-gray-400">No campaigns yet</p>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <p className="text-gray-600 dark:text-gray-400">SMS delivery logs and history</p>
            )}

            {activeTab === 'analytics' && (
              <p className="text-gray-600 dark:text-gray-400">SMS performance analytics and insights</p>
            )}
          </div>
        </div>

        {/* Create Template Modal */}
        {isCreatingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-bold dark:text-white">Create SMS Template</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Template Name</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Order Confirmation"
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">Template Type</label>
                  <select
                    value={newTemplate.templateType}
                    onChange={(e) => setNewTemplate({ ...newTemplate, templateType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="order_confirmation">Order Confirmation</option>
                    <option value="shipping_update">Shipping Update</option>
                    <option value="payment_reminder">Payment Reminder</option>
                    <option value="promotional">Promotional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium dark:text-gray-300">
                    Message Content ({newTemplate.content.length}/160 characters)
                  </label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    placeholder="Enter SMS content"
                    maxLength={160}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateTemplate}
                    className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreatingTemplate(false)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
