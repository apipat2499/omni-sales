"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from '@/components/RouteGuard';
import { Mail, Send, Users, TrendingUp, Eye, Pointer, Zap, RefreshCw, Plus, BarChart3, Gauge } from "lucide-react";

interface EmailMetrics {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
}

interface Campaign {
  id: string;
  campaignName: string;
  status: string;
  totalRecipients: number;
  deliveredCount: number;
  openCount: number;
  clickCount: number;
}

export default function EmailMarketingPage() {
  const [metrics, setMetrics] = useState<EmailMetrics[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState("user-1");

  useEffect(() => {
    fetchEmailData();
  }, []);

  const fetchEmailData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/email/dashboard?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setupDashboard(data.data);
      }
    } catch (error) {
      console.error("Error fetching email data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupDashboard = (dashboardData: any) => {
    const metricsData: EmailMetrics[] = [
      {
        label: "Total Campaigns",
        value: dashboardData.totalCampaigns || 0,
        icon: Mail,
        color: "bg-blue-500",
      },
      {
        label: "Active Campaigns",
        value: dashboardData.activeCampaigns || 0,
        icon: Send,
        color: "bg-green-500",
      },
      {
        label: "Subscribers",
        value: dashboardData.totalSubscribers || 0,
        icon: Users,
        color: "bg-purple-500",
      },
      {
        label: "Avg Open Rate",
        value: `${(dashboardData.avgOpenRate || 0).toFixed(1)}%`,
        icon: Eye,
        color: "bg-yellow-500",
      },
      {
        label: "Avg Click Rate",
        value: `${(dashboardData.avgClickRate || 0).toFixed(1)}%`,
        icon: Pointer,
        color: "bg-pink-500",
      },
      {
        label: "Active Automations",
        value: dashboardData.automationCount || 0,
        icon: Zap,
        color: "bg-orange-500",
      },
    ];

    setMetrics(metricsData);
    setCampaigns(dashboardData.recentCampaigns || []);
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 dark:text-gray-400">Loading Email Marketing...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Email Marketing
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage campaigns, templates, and automations
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchEmailData}
              className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.label}
                  </h3>
                  <div className={`${metric.color} p-3 rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Campaigns */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Recent Campaigns
                </h2>
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>

              {campaigns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Campaign Name
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Recipients
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Delivered
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Opens
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Clicks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.slice(0, 10).map((campaign: any) => {
                        const deliveryRate = campaign.totalRecipients
                          ? ((campaign.deliveredCount / campaign.totalRecipients) * 100).toFixed(1)
                          : "0";
                        const openRate = campaign.deliveredCount
                          ? ((campaign.openCount / campaign.deliveredCount) * 100).toFixed(1)
                          : "0";
                        const clickRate = campaign.deliveredCount
                          ? ((campaign.clickCount / campaign.deliveredCount) * 100).toFixed(1)
                          : "0";

                        return (
                          <tr key={campaign.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                              {campaign.campaignName}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  campaign.status === "sent"
                                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                    : campaign.status === "draft"
                                    ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                    : campaign.status === "scheduled"
                                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                    : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                                }`}
                              >
                                {campaign.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                              {campaign.totalRecipients?.toLocaleString() || "0"}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                              {campaign.deliveredCount?.toLocaleString() || "0"}
                              <span className="text-gray-500 dark:text-gray-400 ml-1">
                                ({deliveryRate}%)
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                              {campaign.openCount?.toLocaleString() || "0"}
                              <span className="text-gray-500 dark:text-gray-400 ml-1">
                                ({openRate}%)
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                              {campaign.clickCount?.toLocaleString() || "0"}
                              <span className="text-gray-500 dark:text-gray-400 ml-1">
                                ({clickRate}%)
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No campaigns yet</p>
              )}
            </div>
          </div>

          {/* Quick Start Sidebar */}
          <div className="space-y-6">
            {/* Templates Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Templates
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create and manage email templates
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
                Manage Templates
              </button>
            </div>

            {/* Segments Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Segments
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create dynamic audience segments
              </p>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition">
                Manage Segments
              </button>
            </div>

            {/* Automations Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Automations
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Set up automated email workflows
              </p>
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition">
                Manage Automations
              </button>
            </div>
          </div>
        </div>

        {/* Performance Metrics Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Campaign Performance
            </h2>
            <Gauge className="w-5 h-5 text-green-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Total Sent
              </p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  0
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  emails
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Bounced
              </p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  0
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  emails
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Unsubscribed
              </p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  0
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  users
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Conversion Rate
              </p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  0%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  avg
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}