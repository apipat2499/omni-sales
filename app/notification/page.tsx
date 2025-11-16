"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, Smartphone, Bell, TrendingUp, BarChart3, RefreshCw, Plus, Users, Eye, Pointer, DollarSign } from "lucide-react";

interface NotificationMetrics {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
}

interface Campaign {
  id: string;
  campaignName: string;
  status: string;
  sentAt?: string;
}

export default function NotificationDashboardPage() {
  const [metrics, setMetrics] = useState<NotificationMetrics[]>([]);
  const [smsCampaigns, setSmsCampaigns] = useState<Campaign[]>([]);
  const [pushCampaigns, setPushCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState("user-1");

  useEffect(() => {
    fetchNotificationData();
  }, []);

  const fetchNotificationData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/notification/dashboard?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setupDashboard(data.data);
      }
    } catch (error) {
      console.error("Error fetching notification data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupDashboard = (dashboardData: any) => {
    const metricsData: NotificationMetrics[] = [
      {
        label: "Total SMS Campaigns",
        value: dashboardData.totalSMSCampaigns || 0,
        icon: MessageSquare,
        color: "bg-blue-500",
      },
      {
        label: "Total Push Campaigns",
        value: dashboardData.totalPushCampaigns || 0,
        icon: Bell,
        color: "bg-purple-500",
      },
      {
        label: "SMS Delivery Rate",
        value: `${(dashboardData.smsAverageDeliveryRate || 0).toFixed(1)}%`,
        icon: Send,
        color: "bg-green-500",
      },
      {
        label: "Push Open Rate",
        value: `${(dashboardData.pushAverageOpenRate || 0).toFixed(1)}%`,
        icon: Eye,
        color: "bg-yellow-500",
      },
      {
        label: "Push Click Rate",
        value: `${(dashboardData.pushAverageClickRate || 0).toFixed(1)}%`,
        icon: Pointer,
        color: "bg-pink-500",
      },
      {
        label: "SMS Send Cost",
        value: `$${(dashboardData.smsSendCost || 0).toFixed(2)}`,
        icon: DollarSign,
        color: "bg-orange-500",
      },
    ];

    setMetrics(metricsData);
    setSmsCampaigns(dashboardData.recentSMSCampaigns || []);
    setPushCampaigns(dashboardData.recentPushCampaigns || []);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bell className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading Notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              SMS & Push Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage multi-channel notification campaigns
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchNotificationData}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SMS Campaigns */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent SMS Campaigns
              </h2>
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>

            {smsCampaigns.length > 0 ? (
              <div className="space-y-4">
                {smsCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {campaign.campaignName}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === "sent"
                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            : campaign.status === "draft"
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    {campaign.sentAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Sent: {new Date(campaign.sentAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No SMS campaigns yet</p>
            )}
          </div>

          {/* Push Campaigns */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Push Campaigns
              </h2>
              <Bell className="w-5 h-5 text-purple-500" />
            </div>

            {pushCampaigns.length > 0 ? (
              <div className="space-y-4">
                {pushCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {campaign.campaignName}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === "sent"
                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            : campaign.status === "draft"
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    {campaign.sentAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Sent: {new Date(campaign.sentAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No push campaigns yet</p>
            )}
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <MessageSquare className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              SMS Templates
            </h3>
            <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
              Manage
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <Bell className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Push Templates
            </h3>
            <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
              Manage
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <Smartphone className="w-8 h-8 text-pink-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Providers
            </h3>
            <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
              Configure
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <Users className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Preferences
            </h3>
            <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
              Manage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
