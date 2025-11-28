'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AuthGuard } from '@/components/RouteGuard';
import { Package, AlertTriangle, TrendingUp, BarChart3, Plus, RefreshCw } from 'lucide-react';
import { InventoryLevel, Warehouse, StockMovement } from '@/types';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryLevel[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryLevel[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'demo-user';
    fetchWarehouses(userId);
    fetchInventory(userId);
    fetchLowStockItems(userId);
    fetchMovements(userId);
  }, []);

  const fetchWarehouses = async (userId: string) => {
    try {
      const response = await fetch(`/api/inventory/warehouses?userId=${userId}`);
      if (!response.ok) {
        // Use demo data if API fails
        const demoWarehouses = [
          { id: 'wh-1', name: 'Main Warehouse', code: 'WH-001', location: 'Bangkok' },
          { id: 'wh-2', name: 'Secondary Warehouse', code: 'WH-002', location: 'Chiang Mai' },
        ];
        setWarehouses(demoWarehouses);
        setSelectedWarehouse(demoWarehouses[0].id);
        return;
      }
      const data = await response.json();
      setWarehouses(data);
      if (data.length > 0) {
        setSelectedWarehouse(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      // Use demo data on error
      const demoWarehouses = [
        { id: 'wh-1', name: 'Main Warehouse', code: 'WH-001', location: 'Bangkok' },
      ];
      setWarehouses(demoWarehouses);
      setSelectedWarehouse(demoWarehouses[0].id);
    }
  };

  const fetchInventory = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/inventory/levels?userId=${userId}&includeProducts=true`
      );
      if (!response.ok) {
        // Use demo data if API fails
        const demoInventory = [
          {
            id: '1',
            product_id: 'prod-1',
            warehouse_id: 'wh-1',
            quantity_on_hand: 150,
            quantity_reserved: 20,
            products: { name: 'Product A', sku: 'SKU-001', cost: 100, category: 'Electronics' }
          },
          {
            id: '2',
            product_id: 'prod-2',
            warehouse_id: 'wh-1',
            quantity_on_hand: 75,
            quantity_reserved: 10,
            products: { name: 'Product B', sku: 'SKU-002', cost: 150, category: 'Accessories' }
          },
          {
            id: '3',
            product_id: 'prod-3',
            warehouse_id: 'wh-1',
            quantity_on_hand: 5,
            quantity_reserved: 2,
            products: { name: 'Product C', sku: 'SKU-003', cost: 200, category: 'Electronics' }
          },
        ];
        setInventory(demoInventory);
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      setInventory(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      // Use demo data on error
      const demoInventory = [
        {
          id: '1',
          product_id: 'prod-1',
          warehouse_id: 'wh-1',
          quantity_on_hand: 150,
          quantity_reserved: 20,
          products: { name: 'Product A', sku: 'SKU-001', cost: 100, category: 'Electronics' }
        },
      ];
      setInventory(demoInventory);
      setIsLoading(false);
    }
  };

  const fetchLowStockItems = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/inventory/movements?userId=${userId}&movementType=low_stock`
      );
      if (!response.ok) {
        // Use demo data if API fails
        const demoLowStock = [
          {
            id: '3',
            product_id: 'prod-3',
            warehouse_id: 'wh-1',
            quantity_on_hand: 5,
            quantity_reserved: 2,
            products: { name: 'Product C', sku: 'SKU-003', cost: 200 }
          },
        ];
        setLowStockItems(demoLowStock);
        return;
      }
      const data = await response.json();
      setLowStockItems(data.data || []);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      setLowStockItems([]);
    }
  };

  const fetchMovements = async (userId: string) => {
    try {
      const response = await fetch(`/api/inventory/movements?userId=${userId}&limit=10`);
      if (!response.ok) {
        // Use demo data if API fails
        const demoMovements = [
          {
            id: '1',
            product_id: 'prod-1',
            quantity_change: 50,
            movement_type: 'purchase',
            reason: 'New stock arrived',
            created_at: new Date().toISOString(),
            products: { name: 'Product A', sku: 'SKU-001' }
          },
          {
            id: '2',
            product_id: 'prod-2',
            quantity_change: -10,
            movement_type: 'sale',
            reason: 'Customer order',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            products: { name: 'Product B', sku: 'SKU-002' }
          },
        ];
        setMovements(demoMovements);
        return;
      }
      const data = await response.json();
      setMovements(data.data || []);
    } catch (error) {
      console.error('Error fetching movements:', error);
      setMovements([]);
    }
  };

  const handleRefresh = async () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setIsLoading(true);
      await fetchInventory(userId);
      await fetchLowStockItems(userId);
      await fetchMovements(userId);
    }
  };

  const totalItems = inventory.length;
  const totalValue = inventory.reduce(
    (sum, item) => sum + ((item.quantity_on_hand || 0) * (item.products?.cost || 0)),
    0
  );
  const lowStockCount = lowStockItems.length;

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <div className="text-gray-600 dark:text-gray-400">Loading inventory...</div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold dark:text-white">Inventory Management</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="rounded-lg bg-gray-200 p-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
              <Plus className="h-5 w-5" />
              Add Inventory
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">
                  ${totalValue.toFixed(2)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Alerts</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Warehouses</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{warehouses.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'stock', label: 'Stock Levels' },
                { id: 'movements', label: 'Movements' },
                { id: 'transfers', label: 'Transfers' },
                { id: 'count', label: 'Stock Count' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
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
                <div>
                  <h3 className="mb-4 text-lg font-semibold dark:text-white">
                    Low Stock Alerts
                  </h3>
                  {lowStockItems.length > 0 ? (
                    <div className="space-y-2">
                      {lowStockItems.slice(0, 5).map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20"
                        >
                          <div>
                            <p className="font-medium dark:text-white">
                              {item.products?.name || 'Unknown Product'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              SKU: {item.products?.sku}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                              {item.quantity_on_hand} units
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Below threshold
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">All items have sufficient stock</p>
                  )}
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-semibold dark:text-white">
                    Warehouses
                  </h3>
                  <div className="grid gap-3">
                    {warehouses.map((warehouse) => (
                      <div
                        key={warehouse.id}
                        className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold dark:text-white">{warehouse.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {warehouse.code}
                            </p>
                          </div>
                          <button className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stock Levels Tab */}
            {activeTab === 'stock' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold dark:text-white">Current Stock Levels</h3>
                  <select
                    value={selectedWarehouse || ''}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Warehouses</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-3 text-left font-semibold dark:text-white">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left font-semibold dark:text-white">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-right font-semibold dark:text-white">
                          On Hand
                        </th>
                        <th className="px-4 py-3 text-right font-semibold dark:text-white">
                          Reserved
                        </th>
                        <th className="px-4 py-3 text-right font-semibold dark:text-white">
                          Available
                        </th>
                        <th className="px-4 py-3 text-right font-semibold dark:text-white">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item: any) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-4 py-3 dark:text-white">
                            {item.products?.name || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {item.products?.sku}
                          </td>
                          <td className="px-4 py-3 text-right dark:text-white">
                            {item.quantity_on_hand || 0}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                            {item.quantity_reserved || 0}
                          </td>
                          <td className="px-4 py-3 text-right font-medium dark:text-white">
                            {(item.quantity_on_hand || 0) - (item.quantity_reserved || 0)}
                          </td>
                          <td className="px-4 py-3 text-right dark:text-white">
                            ${(
                              (item.quantity_on_hand || 0) *
                              (item.products?.cost || 0)
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Movements Tab */}
            {activeTab === 'movements' && (
              <div>
                <h3 className="mb-4 text-lg font-semibold dark:text-white">
                  Recent Stock Movements
                </h3>
                <div className="space-y-3">
                  {movements.map((movement: any) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="flex-1">
                        <p className="font-medium dark:text-white">
                          {movement.products?.name || 'Unknown Product'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {movement.movement_type} • {movement.reason || 'No reason provided'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            movement.quantity_change > 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {movement.quantity_change > 0 ? '+' : ''}
                          {movement.quantity_change}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(movement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transfers Tab */}
            {activeTab === 'transfers' && (
              <div>
                <button className="mb-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                  New Transfer
                </button>
                <p className="text-gray-600 dark:text-gray-400">
                  Stock transfer feature coming soon
                </p>
              </div>
            )}

            {/* Stock Count Tab */}
            {activeTab === 'count' && (
              <div>
                <button className="mb-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
                  Start Stock Count
                </button>
                <p className="text-gray-600 dark:text-gray-400">
                  Physical inventory counting feature coming soon
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
    </AuthGuard>
  );
}
