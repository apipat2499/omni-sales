'use client';

import React, { useState, useEffect } from 'react';

interface FinancialMetrics {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  cashFlow: number;
  cashBalance: number;
}

interface FinancialDashboardProps {
  startDate?: string;
  endDate?: string;
  tenantId?: string;
}

export default function FinancialDashboard({
  startDate,
  endDate,
  tenantId,
}: FinancialDashboardProps) {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetchFinancialMetrics();
  }, [selectedPeriod, startDate, endDate, tenantId]);

  const fetchFinancialMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch P&L data
      const pandlParams = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(tenantId && { tenantId }),
      });

      const pandlResponse = await fetch(`/api/financial/p-and-l?${pandlParams}`);
      if (!pandlResponse.ok) throw new Error('Failed to fetch P&L data');
      const pandlData = await pandlResponse.json();

      // Fetch cash flow data
      const cashFlowParams = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(tenantId && { tenantId }),
        reportType: 'position',
      });

      const cashFlowResponse = await fetch(`/api/financial/cash-flow?${cashFlowParams}`);
      if (!cashFlowResponse.ok) throw new Error('Failed to fetch cash flow data');
      const cashFlowData = await cashFlowResponse.json();

      // Extract metrics
      const pandl = pandlData.data;
      const cashPosition = cashFlowData.data;

      setMetrics({
        revenue: pandl.revenue?.paidRevenue || 0,
        expenses: pandl.expenses?.totalExpenses || 0,
        profit: pandl.profit?.netProfit || 0,
        profitMargin: pandl.profit?.netMargin || 0,
        cashFlow: cashPosition?.netCashFlow || 0,
        cashBalance: cashPosition?.currentBalance || 0,
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading financial metrics: {error}</p>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
        <div className="flex gap-2">
          {(['month', 'quarter', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Revenue</h3>
            <span className="text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(metrics.revenue)}
          </p>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Expenses</h3>
            <span className="text-red-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(metrics.expenses)}
          </p>
        </div>

        {/* Profit Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Net Profit</h3>
            <span className={metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
              {metrics.profit >= 0 ? '+' : '-'}
            </span>
          </div>
          <p className={`mt-2 text-3xl font-bold ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(metrics.profit)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Margin: {formatPercentage(metrics.profitMargin)}
          </p>
        </div>

        {/* Cash Balance Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Cash Balance</h3>
            <span className="text-blue-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(metrics.cashBalance)}
          </p>
        </div>

        {/* Cash Flow Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Net Cash Flow</h3>
            <span className={metrics.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
              {metrics.cashFlow >= 0 ? '+' : '-'}
            </span>
          </div>
          <p className={`mt-2 text-3xl font-bold ${metrics.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(metrics.cashFlow))}
          </p>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow-md border border-blue-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm bg-white rounded hover:bg-gray-50 transition-colors">
              View P&L Report
            </button>
            <button className="w-full text-left px-3 py-2 text-sm bg-white rounded hover:bg-gray-50 transition-colors">
              Cash Flow Analysis
            </button>
            <button className="w-full text-left px-3 py-2 text-sm bg-white rounded hover:bg-gray-50 transition-colors">
              Tax Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
