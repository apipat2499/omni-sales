/**
 * Fulfillment Dashboard Component
 * Main interface for managing fulfillment workflow
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FulfillmentOrder,
  FulfillmentStatus,
  FulfillmentMetrics,
  calculateMetrics,
  sortByPriority,
} from '@/lib/utils/fulfillment-management';
import { useI18n } from '@/lib/hooks/useI18n';

interface FulfillmentDashboardProps {
  initialOrders?: FulfillmentOrder[];
  onOrderClick?: (order: FulfillmentOrder) => void;
  onStartPicking?: (orderId: string) => void;
  onStartPacking?: (orderId: string) => void;
  onShip?: (orderId: string) => void;
}

type FilterStatus = FulfillmentStatus | 'all';
type FilterPriority = 'all' | 'urgent' | 'high' | 'normal' | 'low';

export function FulfillmentDashboard({
  initialOrders = [],
  onOrderClick,
  onStartPicking,
  onStartPacking,
  onShip,
}: FulfillmentDashboardProps) {
  const { t } = useI18n();
  const [orders, setOrders] = useState<FulfillmentOrder[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'status'>('priority');

  // Load fulfillment orders
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/fulfillment/orders');
      if (!response.ok) {
        throw new Error('Failed to load fulfillment orders');
      }

      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((order) => order.priority === priorityFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.orderId.toLowerCase().includes(query) ||
          order.items.some((item) => item.productName.toLowerCase().includes(query))
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter((order) => order.createdAt >= filterDate);
    }

    // Sort
    if (sortBy === 'priority') {
      filtered = sortByPriority(filtered);
    } else if (sortBy === 'date') {
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (sortBy === 'status') {
      filtered.sort((a, b) => a.status.localeCompare(b.status));
    }

    return filtered;
  }, [orders, statusFilter, priorityFilter, searchQuery, dateFilter, sortBy]);

  // Calculate metrics
  const metrics = useMemo(() => calculateMetrics(orders), [orders]);

  // Get status counts
  const statusCounts = useMemo(() => {
    const counts: Record<FulfillmentStatus, number> = {
      new: 0,
      payment_received: 0,
      ready_for_fulfillment: 0,
      picking: 0,
      picked: 0,
      packing: 0,
      packed: 0,
      shipped: 0,
      in_transit: 0,
      out_for_delivery: 0,
      delivered: 0,
      returned: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      counts[order.status]++;
    });

    return counts;
  }, [orders]);

  // Status badge color
  const getStatusColor = (status: FulfillmentStatus): string => {
    switch (status) {
      case 'new':
      case 'payment_received':
        return 'bg-gray-100 text-gray-800';
      case 'ready_for_fulfillment':
      case 'picking':
      case 'picked':
        return 'bg-blue-100 text-blue-800';
      case 'packing':
      case 'packed':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
      case 'in_transit':
      case 'out_for_delivery':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Priority badge color
  const getPriorityColor = (priority: FulfillmentOrder['priority']): string => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get available actions for order
  const getAvailableActions = (order: FulfillmentOrder) => {
    const actions: Array<{ label: string; onClick: () => void; variant: string }> = [];

    if (order.status === 'ready_for_fulfillment' && onStartPicking) {
      actions.push({
        label: t('fulfillment.startPicking'),
        onClick: () => onStartPicking(order.id),
        variant: 'primary',
      });
    }

    if (order.status === 'picked' && onStartPacking) {
      actions.push({
        label: t('fulfillment.startPacking'),
        onClick: () => onStartPacking(order.id),
        variant: 'primary',
      });
    }

    if (order.status === 'packed' && onShip) {
      actions.push({
        label: t('fulfillment.ship'),
        onClick: () => onShip(order.id),
        variant: 'primary',
      });
    }

    return actions;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('fulfillment.dashboard')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('fulfillment.dashboardDescription')}
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('common.loading') : t('common.refresh')}
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('fulfillment.metrics.totalOrders')}
          value={metrics.totalOrders}
          icon="📦"
        />
        <MetricCard
          title={t('fulfillment.metrics.averagePickTime')}
          value={`${Math.round(metrics.averagePickTime)} ${t('common.minutes')}`}
          icon="⏱️"
        />
        <MetricCard
          title={t('fulfillment.metrics.pickAccuracy')}
          value={`${Math.round(metrics.pickAccuracy)}%`}
          icon="✓"
        />
        <MetricCard
          title={t('fulfillment.metrics.onTimeShipment')}
          value={`${Math.round(metrics.onTimeShipment)}%`}
          icon="🚚"
        />
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('fulfillment.statusOverview')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatusCount
            label={t('fulfillment.status.readyForFulfillment')}
            count={statusCounts.ready_for_fulfillment}
            color="blue"
          />
          <StatusCount
            label={t('fulfillment.status.picking')}
            count={statusCounts.picking}
            color="blue"
          />
          <StatusCount
            label={t('fulfillment.status.packing')}
            count={statusCounts.packing}
            color="purple"
          />
          <StatusCount
            label={t('fulfillment.status.packed')}
            count={statusCounts.packed}
            color="purple"
          />
          <StatusCount
            label={t('fulfillment.status.shipped')}
            count={statusCounts.shipped}
            color="yellow"
          />
          <StatusCount
            label={t('fulfillment.status.delivered')}
            count={statusCounts.delivered}
            color="green"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.search')}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('fulfillment.searchPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.status')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('common.all')}</option>
              <option value="ready_for_fulfillment">
                {t('fulfillment.status.readyForFulfillment')}
              </option>
              <option value="picking">{t('fulfillment.status.picking')}</option>
              <option value="picked">{t('fulfillment.status.picked')}</option>
              <option value="packing">{t('fulfillment.status.packing')}</option>
              <option value="packed">{t('fulfillment.status.packed')}</option>
              <option value="shipped">{t('fulfillment.status.shipped')}</option>
              <option value="in_transit">{t('fulfillment.status.inTransit')}</option>
              <option value="delivered">{t('fulfillment.status.delivered')}</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('fulfillment.priority')}
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('common.all')}</option>
              <option value="urgent">{t('fulfillment.priority.urgent')}</option>
              <option value="high">{t('fulfillment.priority.high')}</option>
              <option value="normal">{t('fulfillment.priority.normal')}</option>
              <option value="low">{t('fulfillment.priority.low')}</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.sortBy')}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="priority">{t('fulfillment.sortBy.priority')}</option>
              <option value="date">{t('fulfillment.sortBy.date')}</option>
              <option value="status">{t('fulfillment.sortBy.status')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('fulfillment.order')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('fulfillment.priority')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('fulfillment.items')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('fulfillment.assignedTo')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.date')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {loading ? t('common.loading') : t('fulfillment.noOrders')}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onOrderClick?.(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.id}</div>
                      <div className="text-sm text-gray-500">{order.orderId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {t(`fulfillment.status.${order.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                          order.priority
                        )}`}
                      >
                        {t(`fulfillment.priority.${order.priority}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.items.length} {t('fulfillment.items')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                        {t('common.total')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.assignedTo || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {getAvailableActions(order).map((action, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick();
                            }}
                            className={`px-3 py-1 rounded-lg ${
                              action.variant === 'primary'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {t('common.showing')} <span className="font-medium">1</span> {t('common.to')}{' '}
              <span className="font-medium">{filteredOrders.length}</span> {t('common.of')}{' '}
              <span className="font-medium">{filteredOrders.length}</span> {t('common.results')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <span className="text-3xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Status Count Component
function StatusCount({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
  };

  return (
    <div className="text-center">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${colorClasses[color]}`}>
        <span className="text-lg font-bold">{count}</span>
      </div>
      <p className="mt-2 text-sm text-gray-600">{label}</p>
    </div>
  );
}
