"use client";

import { useEffect, useState } from "react";
import { Gift, Users, TrendingUp, Award, RefreshCw, Plus, BarChart3, Star, Zap, Target } from "lucide-react";

interface LoyaltyMetrics {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
}

interface Member {
  id: string;
  customerName: string;
  email: string;
  currentPoints: number;
  totalSpent: number;
  membershipStatus: string;
}

export default function LoyaltyDashboardPage() {
  const [metrics, setMetrics] = useState<LoyaltyMetrics[]>([]);
  const [topMembers, setTopMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState("user-1");

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/loyalty/dashboard?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setupDashboard(data.data);
      }
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupDashboard = (dashboardData: any) => {
    const metricsData: LoyaltyMetrics[] = [
      {
        label: "Total Programs",
        value: dashboardData.totalPrograms || 0,
        icon: Target,
        color: "bg-blue-500",
      },
      {
        label: "Active Programs",
        value: dashboardData.activePrograms || 0,
        icon: Zap,
        color: "bg-green-500",
      },
      {
        label: "Total Members",
        value: dashboardData.totalMembers || 0,
        icon: Users,
        color: "bg-purple-500",
      },
      {
        label: "Active Members",
        value: dashboardData.activeMembers || 0,
        icon: Award,
        color: "bg-yellow-500",
      },
      {
        label: "Points Outstanding",
        value: `${((dashboardData.totalPointsOutstanding || 0) / 1000).toFixed(0)}K`,
        icon: TrendingUp,
        color: "bg-pink-500",
      },
      {
        label: "Redemption Rate",
        value: `${(dashboardData.redemptionRate || 0).toFixed(1)}%`,
        icon: Gift,
        color: "bg-orange-500",
      },
    ];

    setMetrics(metricsData);
    setTopMembers(dashboardData.topMembers || []);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Gift className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading Loyalty Program...</p>
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
              Loyalty Program Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage customer rewards, tiers, and redemptions
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchLoyaltyData}
              className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
              <Plus className="w-4 h-4" />
              New Program
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
          {/* Top Members */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Top Members
                </h2>
                <Star className="w-5 h-5 text-yellow-500" />
              </div>

              {topMembers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Member Name
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Points
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Total Spent
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topMembers.map((member) => (
                        <tr key={member.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                            {member.customerName}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {member.email}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                              {member.currentPoints?.toLocaleString()} pts
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                            ${(member.totalSpent || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                member.membershipStatus === "active"
                                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                              }`}
                            >
                              {member.membershipStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No members yet</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition font-medium text-sm">
                  + Create Program
                </button>
                <button className="w-full text-left px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition font-medium text-sm">
                  + Create Tier
                </button>
                <button className="w-full text-left px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition font-medium text-sm">
                  + Add Reward
                </button>
                <button className="w-full text-left px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition font-medium text-sm">
                  + Enroll Member
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Program Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg Points/Member</span>
                  <span className="font-semibold text-gray-900 dark:text-white">1,250</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tier Distribution</span>
                  <span className="font-semibold text-gray-900 dark:text-white">5 tiers</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pending Redemptions</span>
                  <span className="font-semibold text-gray-900 dark:text-white">12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
