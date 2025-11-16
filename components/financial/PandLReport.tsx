'use client';

import React, { useState, useEffect } from 'react';

interface PandLData {
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  revenue: {
    totalRevenue: number;
    paidRevenue: number;
    pendingRevenue: number;
    orderCount: number;
    averageOrderValue: number;
  };
  expenses: {
    totalExpenses: number;
    costOfGoodsSold: number;
    operatingExpenses: number;
    byCategory: Record<string, number>;
  };
  profit: {
    grossProfit: number;
    grossMargin: number;
    operatingProfit: number;
    operatingMargin: number;
    netProfit: number;
    netMargin: number;
  };
  yearOverYear?: {
    revenueGrowth: number;
    expenseGrowth: number;
    profitGrowth: number;
  };
}

interface PandLReportProps {
  startDate?: string;
  endDate?: string;
  includeYoY?: boolean;
  tenantId?: string;
}

export default function PandLReport({
  startDate,
  endDate,
  includeYoY = false,
  tenantId,
}: PandLReportProps) {
  const [data, setData] = useState<PandLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPandLReport();
  }, [startDate, endDate, includeYoY, tenantId]);

  const fetchPandLReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(includeYoY && { includeYoY: 'true' }),
        ...(tenantId && { tenantId }),
      });

      const response = await fetch(`/api/financial/p-and-l?${params}`);
      if (!response.ok) throw new Error('Failed to fetch P&L report');

      const result = await response.json();
      setData(result.data);
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
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading P&L report: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
        <h2 className="text-2xl font-bold text-white">Profit & Loss Statement</h2>
        <p className="text-blue-100 mt-1">{data.period.label}</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Revenue Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b-2 border-gray-200 pb-2">
            Revenue
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold">{formatCurrency(data.revenue.totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 ml-4">Paid Revenue</span>
              <span className="text-green-600">{formatCurrency(data.revenue.paidRevenue)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 ml-4">Pending Revenue</span>
              <span className="text-yellow-600">{formatCurrency(data.revenue.pendingRevenue)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span className="ml-4">{data.revenue.orderCount} orders</span>
              <span>Avg: {formatCurrency(data.revenue.averageOrderValue)}</span>
            </div>
          </div>
        </div>

        {/* Cost of Goods Sold */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b-2 border-gray-200 pb-2">
            Cost of Goods Sold (COGS)
          </h3>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total COGS</span>
            <span className="font-semibold text-red-600">
              ({formatCurrency(data.expenses.costOfGoodsSold)})
            </span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Gross Profit</span>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(data.profit.grossProfit)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-600">Gross Margin</span>
            <span className="text-sm font-semibold text-green-600">
              {data.profit.grossMargin.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b-2 border-gray-200 pb-2">
            Operating Expenses
          </h3>
          <div className="space-y-2">
            {Object.entries(data.expenses.byCategory).map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{category}</span>
                <span className="text-red-600">({formatCurrency(amount)})</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-semibold text-gray-900">Total Operating Expenses</span>
              <span className="font-semibold text-red-600">
                ({formatCurrency(data.expenses.operatingExpenses)})
              </span>
            </div>
          </div>
        </div>

        {/* Operating Profit */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Operating Profit</span>
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(data.profit.operatingProfit)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-600">Operating Margin</span>
            <span className="text-sm font-semibold text-blue-600">
              {data.profit.operatingMargin.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Net Profit */}
        <div className={`p-6 rounded-lg ${data.profit.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Net Profit</span>
            <span className={`text-3xl font-bold ${data.profit.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.profit.netProfit)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">Net Margin</span>
            <span className={`text-sm font-semibold ${data.profit.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.profit.netMargin.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Year-over-Year Comparison */}
        {data.yearOverYear && (
          <div className="border-t-2 border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Year-over-Year Growth
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Revenue Growth</div>
                <div className={`text-xl font-bold ${data.yearOverYear.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(data.yearOverYear.revenueGrowth)}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Expense Growth</div>
                <div className={`text-xl font-bold ${data.yearOverYear.expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(data.yearOverYear.expenseGrowth)}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">Profit Growth</div>
                <div className={`text-xl font-bold ${data.yearOverYear.profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(data.yearOverYear.profitGrowth)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export / Print
          </button>
        </div>
      </div>
    </div>
  );
}
