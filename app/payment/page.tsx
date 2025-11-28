'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  CreditCard,
  FileText,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Plus,
  Wallet,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { PaymentDashboardData, Payment, Invoice } from '@/types';
import { AdminGuard } from '@/components/RouteGuard';

interface MetricCard {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  subtext?: string;
}

export default function PaymentPage() {
  const [dashboardData, setDashboardData] = useState<PaymentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState('user-1');
  const [metrics, setMetrics] = useState<MetricCard[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/payment/dashboard?userId=${userId}`);

      if (response.ok) {
        const result = await response.json();
        setDashboardData(result.data);
        setupMetrics(result.data);
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupMetrics = (data: PaymentDashboardData) => {
    const metricsData: MetricCard[] = [
      {
        label: 'Total Revenue',
        value: `$${data.totalRevenue.toFixed(2)}`,
        icon: DollarSign,
        color: 'bg-green-500',
        subtext: `Today: $${data.todayRevenue.toFixed(2)}`,
      },
      {
        label: 'Pending Payments',
        value: data.pendingPayments,
        icon: Clock,
        color: 'bg-yellow-500',
        subtext: `${data.pendingPayments} awaiting completion`,
      },
      {
        label: 'Failed Payments',
        value: data.failedPayments,
        icon: AlertTriangle,
        color: 'bg-red-500',
        subtext: `Requires attention`,
      },
      {
        label: 'Total Invoices',
        value: data.totalInvoices,
        icon: FileText,
        color: 'bg-blue-500',
        subtext: `${data.paidInvoices} paid, ${data.unpaidInvoices} unpaid`,
      },
      {
        label: 'Overdue Invoices',
        value: data.overdueInvoices,
        icon: AlertCircle,
        color: 'bg-orange-500',
        subtext: `Action needed`,
      },
      {
        label: 'Success Rate',
        value: `${data.paymentSuccessRate.toFixed(1)}%`,
        icon: CheckCircle,
        color: 'bg-emerald-500',
        subtext: `Payment completion rate`,
      },
    ];

    setMetrics(metricsData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading Payment System...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Failed to load payment data</p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Payment & Invoicing
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage payments, invoices, and revenue tracking
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
              <Plus className="w-4 h-4" />
              New Invoice
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
                {metric.subtext && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {metric.subtext}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Payments */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Recent Payments
                </h2>
                <CreditCard className="w-5 h-5 text-blue-500" />
              </div>

              {dashboardData.recentPayments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Customer
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Provider
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentPayments.slice(0, 10).map((payment: Payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                            {payment.customerName}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                            ${payment.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="capitalize">{payment.provider}</span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                payment.status === 'completed'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : payment.status === 'pending'
                                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No payments yet
                </p>
              )}
            </div>
          </div>

          {/* Revenue & Stats Sidebar */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wallet className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Payment Methods
                </h3>
              </div>

              {dashboardData.paymentMethodStats.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.paymentMethodStats.map((stat, idx) => (
                    <div key={idx} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {stat.method}
                        </p>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          {stat.count}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ${stat.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No payment data
                </p>
              )}
            </div>

            {/* Invoice Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Invoice Status
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Paid</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {dashboardData.paidInvoices}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Unpaid</span>
                  <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                    {dashboardData.unpaidInvoices}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Overdue</span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {dashboardData.overdueInvoices}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue by Provider */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Revenue by Provider
                </h3>
              </div>

              <div className="space-y-3">
                {Object.entries(dashboardData.revenueByProvider).map(([provider, amount]) => (
                  <div key={provider} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {provider}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Invoices
            </h2>
            <FileText className="w-5 h-5 text-orange-500" />
          </div>

          {dashboardData.recentInvoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                      Invoice #
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white text-sm">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentInvoices.slice(0, 8).map((invoice: Invoice) => {
                    const statusColors = {
                      draft: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
                      sent: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
                      viewed: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
                      partially_paid: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
                      paid: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
                      overdue: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
                      cancelled: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
                    };

                    return (
                      <tr
                        key={invoice.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {invoice.customerName}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                          ${invoice.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusColors[invoice.status]}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'No due date'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No invoices yet
            </p>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
