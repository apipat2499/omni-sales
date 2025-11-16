"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Package,
  BarChart3,
  RefreshCw,
  Download,
  Calendar,
  TrendingDown,
} from "lucide-react";

interface AnalyticsData {
  salesAnalytics: {
    totalOrders?: number;
    totalRevenue?: number;
    averageOrderValue?: number;
    totalItemsSold?: number;
    totalDiscountGiven?: number;
    totalRefunds?: number;
    netRevenue?: number;
    ordersByStatus?: Record<string, any>;
    revenueByChannel?: Record<string, any>;
    revenueByCategory?: Record<string, any>;
    topProducts?: Record<string, any>;
  } | null;
  customerAnalytics: {
    totalCustomers?: number;
    newCustomers?: number;
    returningCustomers?: number;
    activeCustomers?: number;
    customerRetentionRate?: number;
    averageCustomerLifetimeValue?: number;
    totalCustomerSpend?: number;
    customerAcquisitionCost?: number;
    churnRate?: number;
    repeatPurchaseRate?: number;
  } | null;
  financialAnalytics: {
    totalRevenue?: number;
    totalCost?: number;
    grossProfit?: number;
    operatingExpenses?: number;
    netProfit?: number;
    grossMargin?: number;
    operatingMargin?: number;
    netMargin?: number;
    revenueBySource?: Record<string, any>;
    expenseByCategory?: Record<string, any>;
    cashFlowData?: Record<string, any>;
  } | null;
  operationalAnalytics: {
    orderFulfillmentRate?: number;
    averageFulfillmentTime?: number;
    shippingOnTimeRate?: number;
    inventoryAccuracy?: number;
    stockOutIncidents?: number;
    warehouseUtilization?: number;
    averageComplaintResolutionTime?: number;
    complaintRate?: number;
    returnRate?: number;
    customerSatisfactionScore?: number;
    npsScore?: number;
  } | null;
  marketingAnalytics: any[];
  topProducts: any[];
  kpiTracking: any[];
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [userId, setUserId] = useState("user-1");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId") || "user-1";
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedDate, userId]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/analytics/dashboard?userId=${userId}&date=${selectedDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = () => {
    const reportData = {
      date: selectedDate,
      data: analyticsData,
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${selectedDate}.json`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: "Total Revenue",
      value: analyticsData?.salesAnalytics?.totalRevenue
        ? `$${(analyticsData.salesAnalytics.totalRevenue / 1000).toFixed(1)}K`
        : "$0",
      icon: DollarSign,
      color: "bg-blue-500",
      trend: 12,
    },
    {
      label: "Total Orders",
      value: analyticsData?.salesAnalytics?.totalOrders || 0,
      icon: Package,
      color: "bg-purple-500",
      trend: 8,
    },
    {
      label: "Active Customers",
      value: analyticsData?.customerAnalytics?.activeCustomers || 0,
      icon: Users,
      color: "bg-green-500",
      trend: 5,
    },
    {
      label: "Fulfillment Rate",
      value: `${(analyticsData?.operationalAnalytics?.orderFulfillmentRate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: "bg-orange-500",
      trend: -2,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your business performance and KPIs
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={fetchAnalyticsData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.label}
                  </h3>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {card.value}
                </div>
                <div className="flex items-center gap-1">
                  {card.trend >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${card.trend >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {Math.abs(card.trend)}% vs last period
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-8 px-6">
              {[
                { id: "overview", label: "Overview" },
                { id: "sales", label: "Sales" },
                { id: "customer", label: "Customer" },
                { id: "financial", label: "Financial" },
                { id: "operational", label: "Operational" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Sales Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Net Revenue
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${(analyticsData?.salesAnalytics?.netRevenue || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Avg Order Value
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${(analyticsData?.salesAnalytics?.averageOrderValue || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Items Sold
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {analyticsData?.salesAnalytics?.totalItemsSold || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Total Refunds
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${(analyticsData?.salesAnalytics?.totalRefunds || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Customer Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Total Customers
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {analyticsData?.customerAnalytics?.totalCustomers || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Returning Customers
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {analyticsData?.customerAnalytics?.returningCustomers || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Retention Rate
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(analyticsData?.customerAnalytics?.customerRetentionRate || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Avg Lifetime Value
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${(analyticsData?.customerAnalytics?.averageCustomerLifetimeValue || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sales Tab */}
            {activeTab === "sales" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Key Metrics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Total Orders
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {analyticsData?.salesAnalytics?.totalOrders || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Total Revenue
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${(analyticsData?.salesAnalytics?.totalRevenue || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Discount Given
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${(analyticsData?.salesAnalytics?.totalDiscountGiven || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Top Products
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {analyticsData?.topProducts && analyticsData.topProducts.length > 0 ? (
                        analyticsData.topProducts.slice(0, 5).map((product: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600"
                          >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {product.productId || `Product ${idx + 1}`}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {product.unitsSold || 0} units
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">No data available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Tab */}
            {activeTab === "customer" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Cohort Analysis
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          New Customers
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {analyticsData?.customerAnalytics?.newCustomers || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Returning Customers
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {analyticsData?.customerAnalytics?.returningCustomers || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Repeat Purchase Rate
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(analyticsData?.customerAnalytics?.repeatPurchaseRate || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Customer Health
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Churn Rate
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(analyticsData?.customerAnalytics?.churnRate || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          CAC
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${(analyticsData?.customerAnalytics?.customerAcquisitionCost || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Total Customer Spend
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${(analyticsData?.customerAnalytics?.totalCustomerSpend || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Tab */}
            {activeTab === "financial" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      P&L Statement
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Total Revenue
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${(analyticsData?.financialAnalytics?.totalRevenue || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Total Cost
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${(analyticsData?.financialAnalytics?.totalCost || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2">
                        <span className="text-gray-600 dark:text-gray-300">
                          Gross Profit
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ${(analyticsData?.financialAnalytics?.grossProfit || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Profitability Margins
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Gross Margin
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(analyticsData?.financialAnalytics?.grossMargin || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Operating Margin
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(analyticsData?.financialAnalytics?.operatingMargin || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Net Margin
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(analyticsData?.financialAnalytics?.netMargin || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Operational Tab */}
            {activeTab === "operational" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Fulfillment & Shipping
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Fulfillment Rate
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(analyticsData?.operationalAnalytics?.orderFulfillmentRate || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Avg Fulfillment Time
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(analyticsData?.operationalAnalytics?.averageFulfillmentTime || 0).toFixed(1)} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          On-Time Shipping
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(analyticsData?.operationalAnalytics?.shippingOnTimeRate || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Quality & Satisfaction
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Inventory Accuracy
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(analyticsData?.operationalAnalytics?.inventoryAccuracy || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Return Rate
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(analyticsData?.operationalAnalytics?.returnRate || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-300">
                          Customer Satisfaction
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(analyticsData?.operationalAnalytics?.customerSatisfactionScore || 0).toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
