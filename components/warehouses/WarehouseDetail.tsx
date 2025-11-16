'use client';

import React, { useState, useMemo } from 'react';
import { useWarehouseManagement } from '@/lib/hooks/useWarehouseManagement';
import { Warehouse, WarehouseLocation, InventoryLevel } from '@/lib/utils/warehouse-management';
import { t } from '@/lib/utils/i18n';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface WarehouseDetailProps {
  warehouseId: string;
  onBack?: () => void;
}

type TabType = 'overview' | 'locations' | 'inventory' | 'zones' | 'staff' | 'metrics';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WarehouseDetail({ warehouseId, onBack }: WarehouseDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    warehouse,
    locations,
    inventory,
    zones,
    metrics,
    isLoading,
    editWarehouse,
    getUtilization,
    getCapacityStatus,
    getLowStockItems,
    refresh,
  } = useWarehouseManagement(warehouseId);

  if (isLoading || !warehouse) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const utilization = getUtilization(warehouseId);
  const capacityStatus = getCapacityStatus(warehouseId);
  const lowStockItems = getLowStockItems(warehouseId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ← {t('common.back')}
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {warehouse.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {warehouse.code} • {warehouse.type}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              warehouse.isActive
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
            }`}
          >
            {warehouse.isActive ? t('warehouse.active') : t('warehouse.inactive')}
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refresh()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
          >
            {t('common.refresh')}
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {t('common.edit')}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <QuickStatCard
          label={t('warehouse.detail.utilization')}
          value={`${Math.round(utilization)}%`}
          status={capacityStatus}
        />
        <QuickStatCard
          label={t('warehouse.detail.locations')}
          value={locations.length}
        />
        <QuickStatCard
          label={t('warehouse.detail.inventoryItems')}
          value={inventory.length}
        />
        <QuickStatCard
          label={t('warehouse.detail.lowStockItems')}
          value={lowStockItems.length}
          status={lowStockItems.length > 0 ? 'warning' : undefined}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            label={t('warehouse.tab.overview')}
          />
          <TabButton
            active={activeTab === 'locations'}
            onClick={() => setActiveTab('locations')}
            label={t('warehouse.tab.locations')}
          />
          <TabButton
            active={activeTab === 'inventory'}
            onClick={() => setActiveTab('inventory')}
            label={t('warehouse.tab.inventory')}
          />
          <TabButton
            active={activeTab === 'zones'}
            onClick={() => setActiveTab('zones')}
            label={t('warehouse.tab.zones')}
          />
          <TabButton
            active={activeTab === 'staff'}
            onClick={() => setActiveTab('staff')}
            label={t('warehouse.tab.staff')}
          />
          <TabButton
            active={activeTab === 'metrics'}
            onClick={() => setActiveTab('metrics')}
            label={t('warehouse.tab.metrics')}
          />
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <OverviewTab warehouse={warehouse} utilization={utilization} />
        )}
        {activeTab === 'locations' && (
          <LocationsTab locations={locations} warehouseId={warehouseId} />
        )}
        {activeTab === 'inventory' && (
          <InventoryTab inventory={inventory} />
        )}
        {activeTab === 'zones' && (
          <ZonesTab zones={zones} warehouseId={warehouseId} />
        )}
        {activeTab === 'staff' && (
          <StaffTab warehouse={warehouse} />
        )}
        {activeTab === 'metrics' && (
          <MetricsTab metrics={metrics} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function OverviewTab({ warehouse, utilization }: { warehouse: Warehouse; utilization: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('warehouse.basicInfo')}
        </h3>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">{t('warehouse.code')}</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {warehouse.code}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">{t('warehouse.type')}</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white capitalize">
              {warehouse.type}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">{t('warehouse.address')}</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {warehouse.address.street}<br />
              {warehouse.address.city}, {warehouse.address.state} {warehouse.address.postalCode}<br />
              {warehouse.address.country}
            </dd>
          </div>
        </dl>
      </div>

      {/* Operating Hours */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('warehouse.operatingHours')}
        </h3>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">{t('warehouse.hours')}</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {warehouse.hours.open} - {warehouse.hours.close}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">{t('warehouse.timezone')}</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
              {warehouse.hours.timezone}
            </dd>
          </div>
        </dl>
      </div>

      {/* Capacity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('warehouse.capacity')}
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">
                {t('warehouse.utilization')}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round(utilization)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  utilization >= 90
                    ? 'bg-red-500'
                    : utilization >= 75
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${utilization}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('warehouse.totalSlots')}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {warehouse.capacity.totalSlots}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('warehouse.usedSlots')}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {warehouse.capacity.usedSlots}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('warehouse.recentActivity')}
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('warehouse.noRecentActivity')}
        </div>
      </div>
    </div>
  );
}

function LocationsTab({ locations, warehouseId }: { locations: WarehouseLocation[]; warehouseId: string }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Group locations by zone
  const locationsByZone = useMemo(() => {
    const grouped: Record<string, WarehouseLocation[]> = {};
    locations.forEach(loc => {
      if (!grouped[loc.zone]) {
        grouped[loc.zone] = [];
      }
      grouped[loc.zone].push(loc);
    });
    return grouped;
  }, [locations]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('warehouse.locations')} ({locations.length})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {t('warehouse.gridView')}
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {t('warehouse.listView')}
          </button>
        </div>
      </div>

      {Object.entries(locationsByZone).map(([zone, locs]) => (
        <div key={zone} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            {t('warehouse.zone')} {zone} ({locs.length} {t('warehouse.locations')})
          </h4>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-2">
              {locs.map(loc => (
                <LocationCell key={loc.id} location={loc} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {locs.map(loc => (
                <LocationRow key={loc.id} location={loc} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function InventoryTab({ inventory }: { inventory: InventoryLevel[] }) {
  const [sortBy, setSortBy] = useState<'product' | 'quantity' | 'available'>('product');

  const sortedInventory = useMemo(() => {
    return [...inventory].sort((a, b) => {
      switch (sortBy) {
        case 'quantity':
          return b.totalQuantity - a.totalQuantity;
        case 'available':
          return b.available - a.available;
        default:
          return a.productId.localeCompare(b.productId);
      }
    });
  }, [inventory, sortBy]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('warehouse.inventory')} ({inventory.length})
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="product">{t('warehouse.sort.product')}</option>
          <option value="quantity">{t('warehouse.sort.quantity')}</option>
          <option value="available">{t('warehouse.sort.available')}</option>
        </select>
      </div>

      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {t('warehouse.product')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {t('warehouse.totalQty')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {t('warehouse.available')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {t('warehouse.reserved')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {t('warehouse.inTransit')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              {t('warehouse.locations')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {sortedInventory.map(inv => (
            <tr key={inv.productId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                {inv.productId}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                {inv.totalQuantity}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                {inv.available}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                {inv.reserved}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                {inv.inTransit}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                {inv.byLocation.length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ZonesTab({ zones, warehouseId }: { zones: any[]; warehouseId: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {zones.map(zone => (
        <div
          key={zone.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {zone.name}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{zone.code}</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('warehouse.type')}</span>
              <span className="text-gray-900 dark:text-white capitalize">{zone.type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('warehouse.capacity')}</span>
              <span className="text-gray-900 dark:text-white">
                {zone.usedCapacity} / {zone.capacity}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StaffTab({ warehouse }: { warehouse: Warehouse }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('warehouse.staff')}
      </h3>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('warehouse.capacity')}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {warehouse.staff.capacity}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {t('warehouse.managers')}
          </div>
          <ul className="space-y-2">
            {warehouse.staff.managers.map((manager, idx) => (
              <li key={idx} className="text-sm text-gray-900 dark:text-white">
                {manager}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MetricsTab({ metrics }: { metrics: any }) {
  if (!metrics) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        {t('warehouse.noMetrics')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MetricCard
        label={t('warehouse.metrics.utilization')}
        value={`${Math.round(metrics.utilization)}%`}
      />
      <MetricCard
        label={t('warehouse.metrics.accuracy')}
        value={`${Math.round(metrics.accuracy)}%`}
      />
      <MetricCard
        label={t('warehouse.metrics.throughput')}
        value={`${metrics.throughput}/day`}
      />
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function QuickStatCard({
  label,
  value,
  status
}: {
  label: string;
  value: string | number;
  status?: string;
}) {
  const getStatusColor = () => {
    if (!status) return 'text-gray-900 dark:text-white';
    switch (status) {
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical':
      case 'high':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-900 dark:text-white';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${getStatusColor()}`}>{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`py-4 px-1 border-b-2 font-medium text-sm ${
        active
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

function LocationCell({ location }: { location: WarehouseLocation }) {
  const occupied = location.currentStock.length > 0;

  return (
    <div
      className={`aspect-square rounded border-2 flex items-center justify-center text-xs font-medium ${
        occupied
          ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100'
          : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
      }`}
      title={location.barcode}
    >
      {location.bin}
    </div>
  );
}

function LocationRow({ location }: { location: WarehouseLocation }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-gray-900 dark:text-white">
          {location.barcode}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Zone {location.zone}, Aisle {location.aisle}, Shelf {location.shelf}, Bin {location.bin}
        </span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {location.currentStock.length > 0 ? (
          <span className="text-blue-600 dark:text-blue-400">
            {location.currentStock.reduce((sum, s) => sum + s.quantity, 0)} items
          </span>
        ) : (
          <span>{t('warehouse.empty')}</span>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}
