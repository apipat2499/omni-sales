'use client';

import React, { useState, useMemo } from 'react';
import { useWarehouseManagement, useWarehouseOverview } from '@/lib/hooks/useWarehouseManagement';
import { useInventoryAllocation } from '@/lib/hooks/useInventoryAllocation';
import { Warehouse, WarehouseLocation } from '@/lib/utils/warehouse-management';
import { t } from '@/lib/utils/i18n';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface WarehouseDashboardProps {
  onWarehouseSelect?: (warehouseId: string) => void;
}

interface WarehouseStats {
  id: string;
  name: string;
  type: string;
  utilization: number;
  totalSlots: number;
  usedSlots: number;
  inventoryValue: number;
  lowStockCount: number;
  status: 'healthy' | 'warning' | 'critical';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WarehouseDashboard({ onWarehouseSelect }: WarehouseDashboardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [filterType, setFilterType] = useState<'all' | Warehouse['type']>('all');
  const [sortBy, setSortBy] = useState<'name' | 'utilization' | 'inventory'>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    warehouses,
    activeWarehouses,
    totalInventory,
    averageUtilization,
    lowStockCount,
    isLoading,
    refresh,
  } = useWarehouseOverview();

  const { pendingTransfers } = useInventoryAllocation();

  // Calculate warehouse stats
  const warehouseStats = useMemo((): WarehouseStats[] => {
    return warehouses.map(wh => {
      const utilization = wh.capacity.totalSlots > 0
        ? (wh.capacity.usedSlots / wh.capacity.totalSlots) * 100
        : 0;

      const status: WarehouseStats['status'] =
        utilization >= 90 ? 'critical' : utilization >= 75 ? 'warning' : 'healthy';

      return {
        id: wh.id,
        name: wh.name,
        type: wh.type,
        utilization,
        totalSlots: wh.capacity.totalSlots,
        usedSlots: wh.capacity.usedSlots,
        inventoryValue: 0, // Would be calculated from actual inventory
        lowStockCount: 0, // Would be calculated from actual data
        status,
      };
    });
  }, [warehouses]);

  // Filter and sort warehouses
  const filteredWarehouses = useMemo(() => {
    let filtered = warehouseStats;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(w => w.type === filterType);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w => w.name.toLowerCase().includes(query));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'utilization':
          return b.utilization - a.utilization;
        case 'inventory':
          return b.inventoryValue - a.inventoryValue;
        default:
          return 0;
      }
    });

    return filtered;
  }, [warehouseStats, filterType, searchQuery, sortBy]);

  // Statistics
  const stats = useMemo(() => ({
    totalWarehouses: warehouses.length,
    activeWarehouses: activeWarehouses.length,
    totalInventory,
    averageUtilization: Math.round(averageUtilization),
    lowStockCount,
    pendingTransfers: pendingTransfers.length,
  }), [warehouses, activeWarehouses, totalInventory, averageUtilization, lowStockCount, pendingTransfers]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('warehouse.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('warehouse.dashboard.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refresh()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
          >
            {t('common.refresh')}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {t('warehouse.createWarehouse')}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('warehouse.stats.totalWarehouses')}
          value={stats.totalWarehouses}
          icon="🏭"
          trend={null}
        />
        <StatCard
          label={t('warehouse.stats.totalInventory')}
          value={stats.totalInventory.toLocaleString()}
          icon="📦"
          trend={null}
        />
        <StatCard
          label={t('warehouse.stats.avgUtilization')}
          value={`${stats.averageUtilization}%`}
          icon="📊"
          trend={stats.averageUtilization > 80 ? 'warning' : 'good'}
        />
        <StatCard
          label={t('warehouse.stats.lowStock')}
          value={stats.lowStockCount}
          icon="⚠️"
          trend={stats.lowStockCount > 0 ? 'critical' : 'good'}
        />
      </div>

      {/* Alerts */}
      {(stats.lowStockCount > 0 || stats.pendingTransfers > 0) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">
                {t('warehouse.alerts.title')}
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                {stats.lowStockCount > 0 && (
                  <li>
                    {stats.lowStockCount} {t('warehouse.alerts.lowStockItems')}
                  </li>
                )}
                {stats.pendingTransfers > 0 && (
                  <li>
                    {stats.pendingTransfers} {t('warehouse.alerts.pendingTransfers')}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filters and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('warehouse.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="all">{t('warehouse.filter.allTypes')}</option>
            <option value="primary">{t('warehouse.type.primary')}</option>
            <option value="secondary">{t('warehouse.type.secondary')}</option>
            <option value="regional">{t('warehouse.type.regional')}</option>
            <option value="pop-up">{t('warehouse.type.popup')}</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="name">{t('warehouse.sort.name')}</option>
            <option value="utilization">{t('warehouse.sort.utilization')}</option>
            <option value="inventory">{t('warehouse.sort.inventory')}</option>
          </select>
        </div>

        {/* View Mode */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            ⊞
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            ☰
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            🗺
          </button>
        </div>
      </div>

      {/* Warehouse List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-500">{t('common.loading')}</p>
        </div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">{t('warehouse.noWarehouses')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {t('warehouse.createFirst')}
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWarehouses.map(wh => (
            <WarehouseCard
              key={wh.id}
              warehouse={wh}
              onClick={() => onWarehouseSelect?.(wh.id)}
            />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('warehouse.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('warehouse.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('warehouse.utilization')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('warehouse.capacity')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('warehouse.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredWarehouses.map(wh => (
                <tr key={wh.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {wh.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {wh.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            wh.utilization >= 90
                              ? 'bg-red-500'
                              : wh.utilization >= 75
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${wh.utilization}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(wh.utilization)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {wh.usedSlots} / {wh.totalSlots}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={wh.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => onWarehouseSelect?.(wh.id)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      {t('common.view')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-2xl mb-2">🗺️</p>
            <p>{t('warehouse.mapViewComingSoon')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: string;
  trend: 'good' | 'warning' | 'critical' | null;
}) {
  const getTrendColor = () => {
    switch (trend) {
      case 'good':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${getTrendColor()}`}>{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function WarehouseCard({
  warehouse,
  onClick,
}: {
  warehouse: WarehouseStats;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {warehouse.name}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {warehouse.type}
          </span>
        </div>
        <StatusBadge status={warehouse.status} />
      </div>

      <div className="space-y-3">
        {/* Utilization */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">
              {t('warehouse.utilization')}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {Math.round(warehouse.utilization)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                warehouse.utilization >= 90
                  ? 'bg-red-500'
                  : warehouse.utilization >= 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${warehouse.utilization}%` }}
            />
          </div>
        </div>

        {/* Capacity */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {t('warehouse.capacity')}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {warehouse.usedSlots} / {warehouse.totalSlots}
          </span>
        </div>

        {/* Inventory Value */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {t('warehouse.inventoryValue')}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            ${warehouse.inventoryValue.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: WarehouseStats['status'] }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return {
          label: t('warehouse.status.healthy'),
          className: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
        };
      case 'warning':
        return {
          label: t('warehouse.status.warning'),
          className: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
        };
      case 'critical':
        return {
          label: t('warehouse.status.critical'),
          className: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
