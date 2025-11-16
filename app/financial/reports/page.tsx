'use client';

import React, { useState } from 'react';
import FinancialDashboard from '@/components/financial/FinancialDashboard';
import PandLReport from '@/components/financial/PandLReport';
import CashFlowChart from '@/components/financial/CashFlowChart';
import ExpenseManager from '@/components/financial/ExpenseManager';

type ReportView = 'dashboard' | 'pandl' | 'cashflow' | 'expenses' | 'tax';

export default function FinancialReportsPage() {
  const [activeView, setActiveView] = useState<ReportView>('dashboard');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [showTaxSummary, setShowTaxSummary] = useState(false);
  const [taxData, setTaxData] = useState<any>(null);
  const [loadingTax, setLoadingTax] = useState(false);

  const fetchTaxSummary = async () => {
    setLoadingTax(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const response = await fetch(`/api/financial/tax-summary?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tax summary');

      const result = await response.json();
      setTaxData(result.data);
      setShowTaxSummary(true);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoadingTax(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
            <p className="mt-2 text-sm text-gray-600">
              Comprehensive financial analysis and reporting tools
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Financial Reports">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'pandl', label: 'P&L Report', icon: '📈' },
              { id: 'cashflow', label: 'Cash Flow', icon: '💰' },
              { id: 'expenses', label: 'Expenses', icon: '💳' },
              { id: 'tax', label: 'Tax Summary', icon: '🧾' },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => {
                  setActiveView(view.id as ReportView);
                  if (view.id === 'tax') {
                    fetchTaxSummary();
                  }
                }}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeView === view.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{view.icon}</span>
                <span>{view.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => {
                  const today = new Date();
                  setDateRange({
                    startDate: new Date(today.getFullYear(), today.getMonth(), 1)
                      .toISOString()
                      .split('T')[0],
                    endDate: today.toISOString().split('T')[0],
                  });
                }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                This Month
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                  setDateRange({
                    startDate: lastMonth.toISOString().split('T')[0],
                    endDate: lastMonthEnd.toISOString().split('T')[0],
                  });
                }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Last Month
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  setDateRange({
                    startDate: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0],
                  });
                }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Year to Date
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {activeView === 'dashboard' && (
            <FinancialDashboard
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          )}

          {activeView === 'pandl' && (
            <PandLReport
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              includeYoY={true}
            />
          )}

          {activeView === 'cashflow' && (
            <CashFlowChart
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              periodType="monthly"
            />
          )}

          {activeView === 'expenses' && <ExpenseManager />}

          {activeView === 'tax' && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Tax Summary</h2>
                <p className="text-indigo-100 mt-1">
                  {dateRange.startDate} to {dateRange.endDate}
                </p>
              </div>

              {loadingTax ? (
                <div className="p-8">
                  <div className="animate-pulse space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-6 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : taxData ? (
                <div className="p-8 space-y-6">
                  {/* Sales Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b-2 border-gray-200 pb-2">
                      Sales Summary
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Sales</span>
                        <span className="font-semibold">
                          {formatCurrency(taxData.sales?.totalSales || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taxable Sales</span>
                        <span className="font-semibold">
                          {formatCurrency(taxData.sales?.taxableSales || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sales Tax Collected</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(taxData.sales?.salesTaxCollected || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Deductions */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b-2 border-gray-200 pb-2">
                      Tax Deductions
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Deductions</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(taxData.deductions?.totalDeductions || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 ml-4">Cost of Goods Sold</span>
                        <span>{formatCurrency(taxData.deductions?.costOfGoodsSold || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 ml-4">Operating Expenses</span>
                        <span>
                          {formatCurrency(taxData.deductions?.operatingExpenses || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Liability */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Estimated Tax Liability
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Income Tax</span>
                        <span className="font-semibold">
                          {formatCurrency(taxData.liability?.estimatedIncomeTax || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sales Tax</span>
                        <span className="font-semibold">
                          {formatCurrency(taxData.liability?.estimatedSalesTax || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payroll Tax</span>
                        <span className="font-semibold">
                          {formatCurrency(taxData.liability?.estimatedPayrollTax || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-3 border-t-2 border-orange-200">
                        <span className="font-bold text-gray-900">Total Tax Liability</span>
                        <span className="text-xl font-bold text-orange-600">
                          {formatCurrency(taxData.liability?.totalEstimatedTax || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Balance */}
                  {taxData.balance && (
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">Amount Due</span>
                        <span className="text-2xl font-bold text-red-600">
                          {formatCurrency(taxData.balance.amountDue || 0)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Export Button */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => window.print()}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Export / Print
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Click to load tax summary
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
