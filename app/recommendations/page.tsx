"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  BarChart3,
  Target,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Eye,
  MousePointer,
  ShoppingCart,
} from "lucide-react";

interface Recommendation {
  id: string;
  recommendedProductId: string;
  recommendationReason: string;
  rankPosition: number;
  relevanceScore: number;
  algorithmType: string;
  recommendationContext: string;
}

interface Algorithm {
  id: string;
  algorithmName: string;
  algorithmType: string;
  description?: string;
  isActive: boolean;
}

interface Analytics {
  date: string;
  totalRecommendations: number;
  totalClicks: number;
  totalConversions: number;
  clickThroughRate: number;
  conversionRate: number;
  revenueGenerated: number;
}

interface Rule {
  id: string;
  ruleName: string;
  ruleType: string;
  isActive: boolean;
  priority: number;
}

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [isCreatingAlgorithm, setIsCreatingAlgorithm] = useState(false);
  const [newAlgorithm, setNewAlgorithm] = useState({
    algorithmName: "",
    algorithmType: "collaborative",
    description: "",
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      window.location.href = "/login";
      return;
    }
    setUserId(storedUserId);
    fetchData(storedUserId);
  }, []);

  const fetchData = async (userId: string) => {
    try {
      setIsLoading(true);
      // Fetch analytics
      const analyticsRes = await fetch(
        `/api/recommendations/analytics?userId=${userId}&days=30`
      );
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAlgorithm = async () => {
    if (!userId || !newAlgorithm.algorithmName.trim()) return;

    try {
      const response = await fetch("/api/recommendations/algorithms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...newAlgorithm }),
      });

      if (response.ok) {
        setNewAlgorithm({
          algorithmName: "",
          algorithmType: "collaborative",
          description: "",
        });
        setIsCreatingAlgorithm(false);
        fetchData(userId);
      }
    } catch (error) {
      console.error("Error creating algorithm:", error);
    }
  };

  const stats = {
    totalRecommendations: analytics.reduce(
      (sum, a) => sum + (a.totalRecommendations || 0),
      0
    ),
    avgClickThroughRate: analytics.length
      ? Math.round(
          (analytics.reduce((sum, a) => sum + (a.clickThroughRate || 0), 0) /
            analytics.length) *
            100
        ) / 100
      : 0,
    totalConversions: analytics.reduce(
      (sum, a) => sum + (a.totalConversions || 0),
      0
    ),
    totalRevenue: analytics.reduce(
      (sum, a) => sum + (a.revenueGenerated || 0),
      0
    ),
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold dark:text-white">
              Product Recommendations
            </h1>
          </div>
          <button
            onClick={() => setIsCreatingAlgorithm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white"
          >
            <Plus className="h-5 w-5" />
            New Algorithm
          </button>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Recommendations</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">
                  {stats.totalRecommendations.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Click-Through Rate</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">
                  {stats.avgClickThroughRate.toFixed(2)}%
                </p>
              </div>
              <MousePointer className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Conversions</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">
                  {stats.totalConversions.toLocaleString()}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Generated</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium ${
              activeTab === "overview"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("algorithms")}
            className={`px-4 py-2 font-medium ${
              activeTab === "algorithms"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Algorithms
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 font-medium ${
              activeTab === "analytics"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-4 py-2 font-medium ${
              activeTab === "rules"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Rules
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold">Analytics Overview</h2>
            <div className="space-y-4">
              {analytics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left font-semibold">
                          Recommendations
                        </th>
                        <th className="px-4 py-2 text-left font-semibold">
                          Clicks
                        </th>
                        <th className="px-4 py-2 text-left font-semibold">
                          CTR
                        </th>
                        <th className="px-4 py-2 text-left font-semibold">
                          Conversions
                        </th>
                        <th className="px-4 py-2 text-left font-semibold">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.map((a, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-4 py-3">{a.date}</td>
                          <td className="px-4 py-3">
                            {a.totalRecommendations}
                          </td>
                          <td className="px-4 py-3">{a.totalClicks}</td>
                          <td className="px-4 py-3">
                            {a.clickThroughRate?.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3">{a.totalConversions}</td>
                          <td className="px-4 py-3">
                            ${a.revenueGenerated?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-600">
                  No analytics data yet
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "algorithms" && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold">Recommendation Algorithms</h2>
            <div className="space-y-4">
              {algorithms.length > 0 ? (
                algorithms.map((algo) => (
                  <div
                    key={algo.id}
                    className="rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {algo.algorithmName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Type: {algo.algorithmType} | Status:{" "}
                          {algo.isActive ? "Active" : "Inactive"}
                        </p>
                        {algo.description && (
                          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            {algo.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="rounded bg-blue-100 p-2 text-blue-600">
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button className="rounded bg-red-100 p-2 text-red-600">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600">
                  No algorithms configured
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold">Performance Analytics</h2>
            <div className="space-y-4">
              {analytics.length > 0 ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Average CTR:</strong>{" "}
                    {stats.avgClickThroughRate.toFixed(2)}%
                  </p>
                  <p>
                    <strong>Total Recommendations:</strong>{" "}
                    {stats.totalRecommendations}
                  </p>
                  <p>
                    <strong>Total Conversions:</strong> {stats.totalConversions}
                  </p>
                  <p>
                    <strong>Total Revenue:</strong> ${stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-center text-gray-600">
                  No performance data available
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "rules" && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <h2 className="mb-4 text-2xl font-bold">Recommendation Rules</h2>
            <div className="space-y-4">
              {rules.length > 0 ? (
                rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{rule.ruleName}</h3>
                        <p className="text-sm text-gray-600">
                          Type: {rule.ruleType} | Priority: {rule.priority} |
                          Status: {rule.isActive ? "Active" : "Inactive"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="rounded bg-blue-100 p-2 text-blue-600">
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button className="rounded bg-red-100 p-2 text-red-600">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600">No rules configured</p>
              )}
            </div>
          </div>
        )}

        {/* Create Algorithm Modal */}
        {isCreatingAlgorithm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
              <h2 className="mb-4 text-2xl font-bold">Create Algorithm</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">
                    Algorithm Name
                  </label>
                  <input
                    type="text"
                    value={newAlgorithm.algorithmName}
                    onChange={(e) =>
                      setNewAlgorithm({
                        ...newAlgorithm,
                        algorithmName: e.target.value,
                      })
                    }
                    placeholder="e.g., Collaborative Filtering v2"
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Type</label>
                  <select
                    value={newAlgorithm.algorithmType}
                    onChange={(e) =>
                      setNewAlgorithm({
                        ...newAlgorithm,
                        algorithmType: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2"
                  >
                    <option value="collaborative">Collaborative</option>
                    <option value="content_based">Content-Based</option>
                    <option value="popularity">Popularity</option>
                    <option value="rule_based">Rule-Based</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Description</label>
                  <textarea
                    value={newAlgorithm.description}
                    onChange={(e) =>
                      setNewAlgorithm({
                        ...newAlgorithm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional description"
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateAlgorithm}
                    className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setIsCreatingAlgorithm(false)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
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
