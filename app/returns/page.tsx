'use client';

import { useEffect, useState } from 'react';
import { Package, RefreshCw, Plus, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface ReturnData {
  id: string;
  rmaNumber: string;
  orderId: string;
  returnStatus: string;
  refundAmount?: number;
  refundStatus?: string;
  createdAt: string;
}

interface ReturnStatistics {
  totalReturns: number;
  totalReturnValue: number;
  returnRate: number;
  averageRefundAmount: number;
  averageDaysToRefund: number;
  resellablePercentage: number;
  mostCommonReason: string;
  pendingReturns: number;
  pendingRefunds: number;
}

export default function ReturnsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [returns, setReturns] = useState<ReturnData[]>([]);
  const [stats, setStats] = useState<ReturnStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || 'user-1' : 'user-1';

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch returns list with statistics
      const listRes = await fetch(`/api/returns/list?userId=${userId}&includeStats=true`);
      if (!listRes.ok) throw new Error('Failed to fetch returns');
      const listData = await listRes.json();
      setReturns(listData.data || []);
      setStats(listData.stats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const kpiCards = [
    {
      title: 'Total Returns',
      value: stats?.totalReturns || 0,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Pending Returns',
      value: stats?.pendingReturns || 0,
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      title: 'Pending Refunds',
      value: stats?.pendingRefunds || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Total Refunded',
      value: `$${stats?.totalReturnValue.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
  ];

  const pendingReturns = returns.filter(r => r.returnStatus === 'pending');
  const processingReturns = returns.filter(r => r.returnStatus === 'authorized' || r.returnStatus === 'awaiting_return' || r.returnStatus === 'received');
  const completedReturns = returns.filter(r => r.returnStatus === 'processed' || r.returnStatus === 'rejected');

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500 p-2">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold dark:text-white">Returns Management</h1>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg bg-gray-200 p-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-600 dark:text-gray-400">Loading returns data...</div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
              {kpiCards.map((card, index) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
                        <p className="mt-2 text-3xl font-bold dark:text-white">{card.value}</p>
                      </div>
                      <div className={`${card.color} rounded-lg p-3`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tabs */}
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'pending', label: `Pending (${pendingReturns.length})` },
                    { id: 'processing', label: `Processing (${processingReturns.length})` },
                    { id: 'completed', label: `Completed (${completedReturns.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <h3 className="font-semibold dark:text-white">Return Statistics</h3>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Average Refund:</span>
                            <span className="font-medium dark:text-white">
                              ${stats?.averageRefundAmount.toFixed(2) || '0.00'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Avg Days to Refund:</span>
                            <span className="font-medium dark:text-white">
                              {stats?.averageDaysToRefund || 0} days
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Return Rate:</span>
                            <span className="font-medium dark:text-white">
                              {stats?.returnRate.toFixed(2) || '0.00'}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <h3 className="font-semibold dark:text-white">Return Metrics</h3>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Pending Returns:</span>
                            <span className="font-medium dark:text-white">{stats?.pendingReturns || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Pending Refunds:</span>
                            <span className="font-medium dark:text-white">{stats?.pendingRefunds || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Resellable %:</span>
                            <span className="font-medium dark:text-white">
                              {stats?.resellablePercentage.toFixed(2) || '0.00'}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending Returns Tab */}
                {activeTab === 'pending' && (
                  <div>
                    <h3 className="mb-4 text-lg font-semibold dark:text-white">Pending Returns</h3>
                    {pendingReturns.length > 0 ? (
                      <div className="space-y-3">
                        {pendingReturns.map((ret) => (
                          <div
                            key={ret.id}
                            className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-900/20"
                          >
                            <div>
                              <p className="font-medium dark:text-white">{ret.rmaNumber}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Order: {ret.orderId}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="rounded-lg bg-orange-200 px-3 py-1 text-sm font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                Pending
                              </span>
                              <button className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">
                                Review
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">No pending returns</p>
                    )}
                  </div>
                )}

                {/* Processing Returns Tab */}
                {activeTab === 'processing' && (
                  <div>
                    <h3 className="mb-4 text-lg font-semibold dark:text-white">Processing Returns</h3>
                    {processingReturns.length > 0 ? (
                      <div className="space-y-3">
                        {processingReturns.map((ret) => (
                          <div
                            key={ret.id}
                            className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20"
                          >
                            <div>
                              <p className="font-medium dark:text-white">{ret.rmaNumber}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Status: {ret.returnStatus}
                              </p>
                            </div>
                            <span className="rounded-lg bg-blue-200 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Processing
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">No returns in processing</p>
                    )}
                  </div>
                )}

                {/* Completed Returns Tab */}
                {activeTab === 'completed' && (
                  <div>
                    <h3 className="mb-4 text-lg font-semibold dark:text-white">Completed Returns</h3>
                    {completedReturns.length > 0 ? (
                      <div className="space-y-3">
                        {completedReturns.map((ret) => (
                          <div
                            key={ret.id}
                            className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20"
                          >
                            <div>
                              <p className="font-medium dark:text-white">{ret.rmaNumber}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Refund: ${ret.refundAmount?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                {ret.returnStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">No completed returns</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
