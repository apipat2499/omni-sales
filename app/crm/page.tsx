"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from '@/components/RouteGuard';
import { Users, Zap, Target, TrendingUp, Activity, AlertCircle } from "lucide-react";

interface CRMMetric {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  trend?: number;
}

interface Opportunity {
  id: string;
  name: string;
  value: number;
  stage: string;
  probabilityPercent: number;
}

interface Interaction {
  id: string;
  interactionType: string;
  subject: string;
  interactionDate: string;
}

export default function CRMPage() {
  const [metrics, setMetrics] = useState<CRMMetric[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState("user-1");

  useEffect(() => {
    fetchCRMData();
  }, []);

  const fetchCRMData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/crm/dashboard?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setupDashboard(data.data);
      }
    } catch (error) {
      console.error("Error fetching CRM data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupDashboard = (dashboardData: any) => {
    const metricsData: CRMMetric[] = [
      {
        label: "Total Customers",
        value: dashboardData.totalCustomers || 0,
        icon: Users,
        color: "bg-blue-500",
        trend: 12,
      },
      {
        label: "Active Leads",
        value: dashboardData.totalLeads || 0,
        icon: Zap,
        color: "bg-yellow-500",
        trend: 8,
      },
      {
        label: "Open Opportunities",
        value: dashboardData.totalOpportunities || 0,
        icon: Target,
        color: "bg-purple-500",
        trend: 15,
      },
      {
        label: "Pipeline Value",
        value: `$${(dashboardData.pipelineValue / 1000).toFixed(1)}K`,
        icon: TrendingUp,
        color: "bg-green-500",
        trend: 5,
      },
    ];

    setMetrics(metricsData);
    setOpportunities(dashboardData.topOpportunities || []);
    setInteractions(dashboardData.recentInteractions || []);
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 dark:text-gray-400">Loading CRM...</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            CRM Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage customers, leads, and opportunities
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {metric.value}
                </div>
                {metric.trend !== undefined && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    +{metric.trend}% vs last period
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Opportunities Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Top Opportunities
                </h2>
                <Target className="w-5 h-5 text-purple-500" />
              </div>

              {opportunities.length > 0 ? (
                <div className="space-y-4">
                  {opportunities.slice(0, 5).map((opp: any) => (
                    <div
                      key={opp.id}
                      className="border-l-4 border-purple-500 bg-gray-50 dark:bg-gray-700 p-4 rounded"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {opp.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Stage: {opp.stage}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                          ${opp.value?.toLocaleString() || "0"}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${opp.probabilityPercent || 50}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {opp.probabilityPercent || 50}% probability
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No opportunities yet
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Quick Actions
            </h2>

            <div className="space-y-3">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
                + New Customer
              </button>
              <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition">
                + New Lead
              </button>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition">
                + New Opportunity
              </button>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition">
                + Log Interaction
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Conversion Metrics
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Lead to Customer
                  </p>
                  <p className="text-2xl font-bold text-blue-600">32%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Sales Cycle
                  </p>
                  <p className="text-2xl font-bold text-purple-600">45 days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customer Retention
                  </p>
                  <p className="text-2xl font-bold text-green-600">85%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>

          {interactions.length > 0 ? (
            <div className="space-y-3">
              {interactions.slice(0, 10).map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                >
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {activity.interactionType}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {activity.subject}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {new Date(activity.interactionDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
          )}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
