'use client';

import React, { useState, useEffect } from 'react';

interface CashFlowData {
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  operating: {
    cashFromSales: number;
    cashPaidToSuppliers: number;
    cashPaidForOperatingExpenses: number;
    netOperatingCashFlow: number;
  };
  investing: {
    purchaseOfEquipment: number;
    purchaseOfProperty: number;
    saleOfAssets: number;
    netInvestingCashFlow: number;
  };
  financing: {
    proceedsFromLoans: number;
    repaymentOfDebt: number;
    dividendsPaid: number;
    netFinancingCashFlow: number;
  };
  netCashFlow: number;
  beginningCashBalance: number;
  endingCashBalance: number;
}

interface CashFlowChartProps {
  startDate?: string;
  endDate?: string;
  periodType?: 'monthly' | 'quarterly' | 'yearly';
  tenantId?: string;
}

export default function CashFlowChart({
  startDate,
  endDate,
  periodType = 'monthly',
  tenantId,
}: CashFlowChartProps) {
  const [data, setData] = useState<CashFlowData | CashFlowData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'statement' | 'trends'>('statement');

  useEffect(() => {
    fetchCashFlowData();
  }, [startDate, endDate, periodType, viewMode, tenantId]);

  const fetchCashFlowData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        reportType: viewMode === 'trends' ? 'trends' : 'statement',
        ...(periodType && { periodType }),
        ...(tenantId && { tenantId }),
      });

      const response = await fetch(`/api/financial/cash-flow?${params}`);
      if (!response.ok) throw new Error('Failed to fetch cash flow data');

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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  const renderCashFlowStatement = (statement: CashFlowData) => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
        <h2 className="text-2xl font-bold text-white">Cash Flow Statement</h2>
        <p className="text-purple-100 mt-1">{statement.period.label}</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Operating Activities */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
            Operating Activities
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cash from Sales</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(statement.operating.cashFromSales)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Cash Paid to Suppliers</span>
              <span className="text-red-600">
                ({formatCurrency(statement.operating.cashPaidToSuppliers)})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Operating Expenses Paid</span>
              <span className="text-red-600">
                ({formatCurrency(statement.operating.cashPaidForOperatingExpenses)})
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
              <span className="font-bold text-gray-900">Net Operating Cash Flow</span>
              <span className={`font-bold text-lg ${statement.operating.netOperatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {statement.operating.netOperatingCashFlow >= 0 ? '' : '('}
                {formatCurrency(statement.operating.netOperatingCashFlow)}
                {statement.operating.netOperatingCashFlow >= 0 ? '' : ')'}
              </span>
            </div>
          </div>
        </div>

        {/* Investing Activities */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
            Investing Activities
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Purchase of Equipment</span>
              <span className="text-red-600">
                ({formatCurrency(statement.investing.purchaseOfEquipment)})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Purchase of Property</span>
              <span className="text-red-600">
                ({formatCurrency(statement.investing.purchaseOfProperty)})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sale of Assets</span>
              <span className="text-green-600">
                {formatCurrency(statement.investing.saleOfAssets)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
              <span className="font-bold text-gray-900">Net Investing Cash Flow</span>
              <span className={`font-bold text-lg ${statement.investing.netInvestingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {statement.investing.netInvestingCashFlow >= 0 ? '' : '('}
                {formatCurrency(statement.investing.netInvestingCashFlow)}
                {statement.investing.netInvestingCashFlow >= 0 ? '' : ')'}
              </span>
            </div>
          </div>
        </div>

        {/* Financing Activities */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
            Financing Activities
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Proceeds from Loans</span>
              <span className="text-green-600">
                {formatCurrency(statement.financing.proceedsFromLoans)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Repayment of Debt</span>
              <span className="text-red-600">
                ({formatCurrency(statement.financing.repaymentOfDebt)})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Dividends Paid</span>
              <span className="text-red-600">
                ({formatCurrency(statement.financing.dividendsPaid)})
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
              <span className="font-bold text-gray-900">Net Financing Cash Flow</span>
              <span className={`font-bold text-lg ${statement.financing.netFinancingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {statement.financing.netFinancingCashFlow >= 0 ? '' : '('}
                {formatCurrency(statement.financing.netFinancingCashFlow)}
                {statement.financing.netFinancingCashFlow >= 0 ? '' : ')'}
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Net Cash Flow</span>
            <span className={`text-2xl font-bold ${statement.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {statement.netCashFlow >= 0 ? '+' : ''}
              {formatCurrency(statement.netCashFlow)}
            </span>
          </div>
          <div className="border-t-2 border-indigo-200 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Beginning Cash Balance</span>
              <span className="font-semibold">{formatCurrency(statement.beginningCashBalance)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold text-gray-900">Ending Cash Balance</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(statement.endingCashBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Export / Print
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
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
        <p className="text-red-800">Error loading cash flow data: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  // If data is an array, show the first statement (for now)
  const statement = Array.isArray(data) ? data[0] : data;

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setViewMode('statement')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            viewMode === 'statement'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Statement View
        </button>
        <button
          onClick={() => setViewMode('trends')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            viewMode === 'trends'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Trend Analysis
        </button>
      </div>

      {renderCashFlowStatement(statement)}
    </div>
  );
}
