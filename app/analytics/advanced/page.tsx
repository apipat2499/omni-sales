'use client';

/**
 * Advanced Analytics Dashboard
 *
 * Comprehensive analytics page featuring:
 * - Cohort analysis (user segments over time)
 * - RFM segmentation (Recency, Frequency, Monetary)
 * - Customer lifetime value (CLV) calculation
 * - Retention curves and churn analysis
 * - Funnel analysis (browse → cart → purchase)
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import DashboardCards from '@/components/analytics/DashboardCards';
import { AdminGuard } from '@/components/RouteGuard';

export default function AdvancedAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'cohort' | 'rfm' | 'clv' | 'retention' | 'funnel'>('overview');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'cohort', label: 'Cohort Analysis', icon: Users },
    { id: 'rfm', label: 'RFM Segmentation', icon: Target },
    { id: 'clv', label: 'Customer Lifetime Value', icon: DollarSign },
    { id: 'retention', label: 'Retention & Churn', icon: RefreshCw },
    { id: 'funnel', label: 'Conversion Funnel', icon: Filter }
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Advanced Analytics & Business Intelligence
          </h1>
          <p className="text-gray-600">
            Comprehensive analytics dashboard with cohort analysis, customer segmentation, and retention metrics
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button
              onClick={() => {/* Export functionality */}}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                      ${isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === 'overview' && <OverviewTab dateRange={dateRange} />}
          {activeTab === 'cohort' && <CohortAnalysisTab dateRange={dateRange} />}
          {activeTab === 'rfm' && <RFMSegmentationTab />}
          {activeTab === 'clv' && <CustomerLifetimeValueTab />}
          {activeTab === 'retention' && <RetentionChurnTab dateRange={dateRange} />}
          {activeTab === 'funnel' && <ConversionFunnelTab dateRange={dateRange} />}
        </div>
      </div>
    </div>
  );
}

/**
 * Overview Tab Component
 */
function OverviewTab({ dateRange }: { dateRange: any }) {
  return (
    <div className="space-y-6">
      <DashboardCards
        autoRefresh={true}
        refreshInterval={300000}
        dateRange={dateRange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart placeholder - Revenue over time
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Chart placeholder - Top selling products
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cohort Analysis Tab Component
 */
function CohortAnalysisTab({ dateRange }: { dateRange: any }) {
  const [cohortData, setCohortData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState('month');

  useEffect(() => {
    fetchCohortData();
  }, [dateRange, periodType]);

  const fetchCohortData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
        periodType
      });

      const response = await fetch(`/api/analytics/cohort?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCohortData(data.data);
      }
    } catch (error) {
      console.error('Cohort data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Cohort Analysis</h3>
        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="quarter">Quarterly</option>
        </select>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <p className="text-gray-600 mb-4">
            Cohort analysis shows how customer segments behave over time based on their first purchase date.
          </p>
          <div className="h-96 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
            Cohort retention matrix - {cohortData?.length || 0} cohorts
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * RFM Segmentation Tab Component
 */
function RFMSegmentationTab() {
  const [rfmData, setRfmData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRFMData();
  }, []);

  const fetchRFMData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/rfm?groupBy=segment');
      const data = await response.json();

      if (data.success) {
        setRfmData(data.data);
      }
    } catch (error) {
      console.error('RFM data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">RFM Customer Segmentation</h3>
      <p className="text-gray-600 mb-6">
        Customers are segmented based on Recency, Frequency, and Monetary value (RFM) analysis.
      </p>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rfmData?.map((segment: any) => (
            <div
              key={segment.segment}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="font-semibold text-lg mb-2">{segment.segment}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customers:</span>
                  <span className="font-medium">{segment.customers?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue:</span>
                  <span className="font-medium">${segment.totalRevenue?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg CLV:</span>
                  <span className="font-medium">${segment.avgLifetimeValue?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Percentage:</span>
                  <span className="font-medium">{segment.percentage?.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Customer Lifetime Value Tab Component
 */
function CustomerLifetimeValueTab() {
  const [clvData, setClvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCLVData();
  }, []);

  const fetchCLVData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/clv?topN=10');
      const data = await response.json();

      if (data.success) {
        setClvData(data.data);
      }
    } catch (error) {
      console.error('CLV data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Customer Lifetime Value Metrics</h3>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Avg Historical CLV</p>
              <p className="text-3xl font-bold text-blue-600">
                ${clvData?.avgHistoricalCLV?.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Avg Predicted CLV</p>
              <p className="text-3xl font-bold text-green-600">
                ${clvData?.avgPredictedCLV?.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">
                {clvData?.totalCustomers?.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Top 10 Customers by Predicted CLV</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Historical CLV</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Predicted CLV</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clvData?.topCustomers?.map((customer: any) => (
                <tr key={customer.customerId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.segment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${customer.historicalCLV?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    ${customer.predictedCLV?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.totalOrders}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Retention & Churn Tab Component
 */
function RetentionChurnTab({ dateRange }: { dateRange: any }) {
  const [retentionData, setRetentionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [churnDays, setChurnDays] = useState(90);

  useEffect(() => {
    fetchRetentionData();
  }, [dateRange, churnDays]);

  const fetchRetentionData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period: 'month',
        churnDays: churnDays.toString()
      });

      const response = await fetch(`/api/analytics/retention?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRetentionData(data.data);
      }
    } catch (error) {
      console.error('Retention data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Retention & Churn Analysis</h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Churn threshold (days):</label>
            <input
              type="number"
              value={churnDays}
              onChange={(e) => setChurnDays(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm w-20"
            />
          </div>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Retention Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {retentionData?.overallRetentionRate?.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Churn Rate</p>
              <p className="text-3xl font-bold text-red-600">
                {retentionData?.churnRate?.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Active Customers</p>
              <p className="text-3xl font-bold text-blue-600">
                {retentionData?.activeCustomers?.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">At Risk</p>
              <p className="text-3xl font-bold text-yellow-600">
                {retentionData?.atRiskCustomers?.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Retention Curve</h3>
        <div className="h-96 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
          Retention curve chart - Customer retention over time
        </div>
      </div>
    </div>
  );
}

/**
 * Conversion Funnel Tab Component
 */
function ConversionFunnelTab({ dateRange }: { dateRange: any }) {
  const [funnelData, setFunnelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFunnelData();
  }, [dateRange]);

  const fetchFunnelData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end
      });

      const response = await fetch(`/api/analytics/funnel?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setFunnelData(data.data);
      }
    } catch (error) {
      console.error('Funnel data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
        <p className="text-gray-600 mb-6">
          Track user journey from browsing to purchase completion
        </p>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {funnelData?.stages?.map((stage: any, index: number) => (
              <div key={stage.stage} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">
                    {index + 1}. {stage.stage}
                  </h4>
                  <span className="text-2xl font-bold text-blue-600">
                    {stage.users?.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div>
                    <span className="text-gray-600">Conversion Rate: </span>
                    <span className="font-semibold text-green-600">
                      {stage.conversionRate?.toFixed(1)}%
                    </span>
                  </div>
                  {stage.dropOffRate > 0 && (
                    <div>
                      <span className="text-gray-600">Drop-off: </span>
                      <span className="font-semibold text-red-600">
                        {stage.dropOffRate?.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all"
                    style={{ width: `${stage.conversionRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Overall Conversion Rate</h3>
        <div className="text-center">
          <p className="text-5xl font-bold text-blue-600">
            {funnelData?.overallConversionRate?.toFixed(2)}%
          </p>
          <p className="text-gray-600 mt-2">
            from {funnelData?.stages?.[0]?.users?.toLocaleString()} visitors to{' '}
            {funnelData?.stages?.[funnelData.stages.length - 1]?.users?.toLocaleString()} purchases
          </p>
        </div>
      </div>
    </div>
  );
}
