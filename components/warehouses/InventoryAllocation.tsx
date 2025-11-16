'use client';

import React, { useState, useMemo } from 'react';
import { useInventoryAllocation, useAllocationRules, useTransferTracking } from '@/lib/hooks/useInventoryAllocation';
import { useWarehouseManagement } from '@/lib/hooks/useWarehouseManagement';
import { Order, AllocationResult, InventoryTransfer, AllocationRule } from '@/lib/utils/inventory-allocation';
import { t } from '@/lib/utils/i18n';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface InventoryAllocationProps {
  warehouseId?: string;
}

type ViewMode = 'allocation' | 'transfers' | 'forecast' | 'rebalancing';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InventoryAllocation({ warehouseId }: InventoryAllocationProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('allocation');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AllocationRule['algorithm']>('hybrid');
  const [testOrder, setTestOrder] = useState<Partial<Order>>({
    items: [],
    customerLocation: undefined,
  });
  const [allocationResult, setAllocationResult] = useState<AllocationResult | null>(null);

  const {
    transfers,
    pendingTransfers,
    rebalancingPlan,
    isLoading,
    allocateOrder,
    initiateTransfer,
    updateTransfer,
    forecastDemand,
    createRebalancingPlan,
    executeRebalancingPlan,
    refresh,
  } = useInventoryAllocation();

  const { rules, getApplicableRule } = useAllocationRules();
  const { warehouses } = useWarehouseManagement();

  const handleTestAllocation = async () => {
    if (!testOrder.items || testOrder.items.length === 0) {
      alert(t('warehouse.allocation.error.noItems'));
      return;
    }

    const order: Order = {
      id: `test-${Date.now()}`,
      customerId: 'test',
      items: testOrder.items,
      customerLocation: testOrder.customerLocation,
      priority: 'medium',
      status: 'pending',
    };

    const result = await allocateOrder(order, selectedAlgorithm);
    setAllocationResult(result);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('warehouse.allocation.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('warehouse.allocation.subtitle')}
          </p>
        </div>
        <button
          onClick={() => refresh()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
        >
          {t('common.refresh')}
        </button>
      </div>

      {/* View Mode Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <ViewTab
            active={viewMode === 'allocation'}
            onClick={() => setViewMode('allocation')}
            label={t('warehouse.allocation.tab.allocation')}
            count={null}
          />
          <ViewTab
            active={viewMode === 'transfers'}
            onClick={() => setViewMode('transfers')}
            label={t('warehouse.allocation.tab.transfers')}
            count={pendingTransfers.length}
          />
          <ViewTab
            active={viewMode === 'forecast'}
            onClick={() => setViewMode('forecast')}
            label={t('warehouse.allocation.tab.forecast')}
            count={null}
          />
          <ViewTab
            active={viewMode === 'rebalancing'}
            onClick={() => setViewMode('rebalancing')}
            label={t('warehouse.allocation.tab.rebalancing')}
            count={null}
          />
        </nav>
      </div>

      {/* View Content */}
      <div className="mt-6">
        {viewMode === 'allocation' && (
          <AllocationView
            algorithm={selectedAlgorithm}
            onAlgorithmChange={setSelectedAlgorithm}
            testOrder={testOrder}
            onTestOrderChange={setTestOrder}
            result={allocationResult}
            onTest={handleTestAllocation}
            rules={rules}
          />
        )}
        {viewMode === 'transfers' && (
          <TransfersView
            transfers={transfers}
            pendingTransfers={pendingTransfers}
            onUpdateStatus={updateTransfer}
            onCreateTransfer={initiateTransfer}
          />
        )}
        {viewMode === 'forecast' && (
          <ForecastView onForecast={forecastDemand} />
        )}
        {viewMode === 'rebalancing' && (
          <RebalancingView
            plan={rebalancingPlan}
            onCreatePlan={createRebalancingPlan}
            onExecutePlan={executeRebalancingPlan}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// VIEW COMPONENTS
// ============================================================================

function AllocationView({
  algorithm,
  onAlgorithmChange,
  testOrder,
  onTestOrderChange,
  result,
  onTest,
  rules,
}: {
  algorithm: AllocationRule['algorithm'];
  onAlgorithmChange: (algo: AllocationRule['algorithm']) => void;
  testOrder: Partial<Order>;
  onTestOrderChange: (order: Partial<Order>) => void;
  result: AllocationResult | null;
  onTest: () => void;
  rules: AllocationRule[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Test Allocation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('warehouse.allocation.testAllocation')}
        </h3>

        <div className="space-y-4">
          {/* Algorithm Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('warehouse.allocation.algorithm')}
            </label>
            <select
              value={algorithm}
              onChange={(e) => onAlgorithmChange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="nearest">{t('warehouse.allocation.algorithm.nearest')}</option>
              <option value="inventory">{t('warehouse.allocation.algorithm.inventory')}</option>
              <option value="cost">{t('warehouse.allocation.algorithm.cost')}</option>
              <option value="hybrid">{t('warehouse.allocation.algorithm.hybrid')}</option>
            </select>
          </div>

          {/* Customer Location */}
          {(algorithm === 'nearest' || algorithm === 'cost' || algorithm === 'hybrid') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('warehouse.allocation.customerLocation')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder={t('warehouse.allocation.latitude')}
                  value={testOrder.customerLocation?.lat || ''}
                  onChange={(e) =>
                    onTestOrderChange({
                      ...testOrder,
                      customerLocation: {
                        lat: parseFloat(e.target.value),
                        lng: testOrder.customerLocation?.lng || 0,
                      },
                    })
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder={t('warehouse.allocation.longitude')}
                  value={testOrder.customerLocation?.lng || ''}
                  onChange={(e) =>
                    onTestOrderChange({
                      ...testOrder,
                      customerLocation: {
                        lat: testOrder.customerLocation?.lat || 0,
                        lng: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Test Button */}
          <button
            onClick={onTest}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {t('warehouse.allocation.testAllocation')}
          </button>
        </div>
      </div>

      {/* Allocation Result */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('warehouse.allocation.result')}
        </h3>

        {result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('warehouse.allocation.status')}:
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  result.status === 'full'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : result.status === 'partial'
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                }`}
              >
                {result.status}
              </span>
            </div>

            {result.allocations.map((alloc, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="font-medium text-gray-900 dark:text-white mb-2">
                  {alloc.warehouseName}
                </div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div>Items: {alloc.items.length}</div>
                  {alloc.distance && (
                    <div>Distance: {Math.round(alloc.distance)} km</div>
                  )}
                  {alloc.estimatedShippingCost && (
                    <div>Cost: ${alloc.estimatedShippingCost.toFixed(2)}</div>
                  )}
                  {alloc.estimatedDeliveryDays && (
                    <div>Delivery: {alloc.estimatedDeliveryDays} days</div>
                  )}
                </div>
              </div>
            ))}

            {result.unallocatedItems && result.unallocatedItems.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="font-medium text-red-900 dark:text-red-200 mb-2">
                  {t('warehouse.allocation.unallocated')}
                </div>
                <ul className="space-y-1 text-sm text-red-800 dark:text-red-300">
                  {result.unallocatedItems.map((item, idx) => (
                    <li key={idx}>
                      {item.productId}: {item.shortfall} units short
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('warehouse.allocation.noResult')}
          </div>
        )}
      </div>

      {/* Allocation Rules */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('warehouse.allocation.rules')}
        </h3>
        <div className="space-y-3">
          {rules.map(rule => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {rule.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('warehouse.allocation.priority')}: {rule.priority} • {rule.algorithm}
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  rule.isActive
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                }`}
              >
                {rule.isActive ? t('warehouse.active') : t('warehouse.inactive')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TransfersView({
  transfers,
  pendingTransfers,
  onUpdateStatus,
  onCreateTransfer,
}: {
  transfers: InventoryTransfer[];
  pendingTransfers: InventoryTransfer[];
  onUpdateStatus: (id: string, status: InventoryTransfer['status']) => void;
  onCreateTransfer: (transfer: any) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<'all' | InventoryTransfer['status']>('all');

  const filteredTransfers = useMemo(() => {
    if (filterStatus === 'all') return transfers;
    return transfers.filter(t => t.status === filterStatus);
  }, [transfers, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Pending Transfers Alert */}
      {pendingTransfers.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                {pendingTransfers.length} {t('warehouse.transfers.pending')}
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {t('warehouse.transfers.pendingDescription')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1 rounded ${
            filterStatus === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {t('warehouse.transfers.all')}
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-3 py-1 rounded ${
            filterStatus === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {t('warehouse.transfers.pending')}
        </button>
        <button
          onClick={() => setFilterStatus('in-transit')}
          className={`px-3 py-1 rounded ${
            filterStatus === 'in-transit'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {t('warehouse.transfers.inTransit')}
        </button>
        <button
          onClick={() => setFilterStatus('received')}
          className={`px-3 py-1 rounded ${
            filterStatus === 'received'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {t('warehouse.transfers.received')}
        </button>
      </div>

      {/* Transfers List */}
      <div className="space-y-4">
        {filteredTransfers.map(transfer => (
          <TransferCard
            key={transfer.id}
            transfer={transfer}
            onUpdateStatus={onUpdateStatus}
          />
        ))}
      </div>
    </div>
  );
}

function ForecastView({ onForecast }: { onForecast: (productId: string, warehouseId: string | undefined, days: number) => Promise<any> }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('warehouse.forecast.title')}
      </h3>
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {t('warehouse.forecast.comingSoon')}
      </div>
    </div>
  );
}

function RebalancingView({
  plan,
  onCreatePlan,
  onExecutePlan,
}: {
  plan: any;
  onCreatePlan: () => void;
  onExecutePlan: (plan: any) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('warehouse.rebalancing.title')}
        </h3>
        <button
          onClick={onCreatePlan}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          {t('warehouse.rebalancing.createPlan')}
        </button>
      </div>

      {plan ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('warehouse.rebalancing.transfers')}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.transfers.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('warehouse.rebalancing.estimatedCost')}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${plan.estimatedCost}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('warehouse.rebalancing.improvement')}
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  +{plan.expectedImprovement}%
                </div>
              </div>
            </div>

            <button
              onClick={() => onExecutePlan(plan)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              {t('warehouse.rebalancing.execute')}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          {t('warehouse.rebalancing.noPlan')}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ViewTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number | null;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
        active
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
      }`}
    >
      {label}
      {count !== null && count > 0 && (
        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}

function TransferCard({
  transfer,
  onUpdateStatus,
}: {
  transfer: InventoryTransfer;
  onUpdateStatus: (id: string, status: InventoryTransfer['status']) => void;
}) {
  const getStatusColor = () => {
    switch (transfer.status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'in-transit':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'received':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            Transfer #{transfer.id.slice(-8)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(transfer.initiatedAt).toLocaleDateString()}
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
          {transfer.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">{t('warehouse.transfers.from')}</span>
          <span className="text-gray-900 dark:text-white">{transfer.fromWarehouse}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">{t('warehouse.transfers.to')}</span>
          <span className="text-gray-900 dark:text-white">{transfer.toWarehouse}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">{t('warehouse.transfers.items')}</span>
          <span className="text-gray-900 dark:text-white">{transfer.items.length}</span>
        </div>
      </div>

      {transfer.status === 'pending' && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onUpdateStatus(transfer.id, 'in-transit')}
            className="flex-1 px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            {t('warehouse.transfers.ship')}
          </button>
          <button
            onClick={() => onUpdateStatus(transfer.id, 'cancelled')}
            className="flex-1 px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
          >
            {t('common.cancel')}
          </button>
        </div>
      )}

      {transfer.status === 'in-transit' && (
        <button
          onClick={() => onUpdateStatus(transfer.id, 'received')}
          className="mt-4 w-full px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
        >
          {t('warehouse.transfers.markReceived')}
        </button>
      )}
    </div>
  );
}
