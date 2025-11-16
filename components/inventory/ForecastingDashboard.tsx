'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  useInventoryForecast,
  useDemandHistory,
  useForecastSettings,
  useMultiProductForecast,
} from '@/lib/hooks/useInventoryForecast';
import { Product } from '@/types';
import { AlgorithmComparison } from '@/lib/utils/inventory-forecasting';
import ForecastChart from './ForecastChart';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ForecastingDashboardProps {
  userId: string;
  products?: Product[];
  onProductSelect?: (productId: string) => void;
}

interface ProductForecastSummary {
  productId: string;
  productName: string;
  productSKU: string;
  currentStock: number;
  trend: 'up' | 'down' | 'stable';
  forecastedDemand30Days: number;
  accuracy: number;
  reorderPoint?: number;
  nextReorderDate?: Date;
  status: 'healthy' | 'warning' | 'critical';
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ForecastingDashboard({
  userId,
  products = [],
  onProductSelect,
}: ForecastingDashboardProps) {
  // State
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'accuracy' | 'demand'>('name');
  const [showSettings, setShowSettings] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Hooks
  const { settings, updateSetting, resetSettings } = useForecastSettings();
  const {
    forecast,
    isCalculating,
    error,
    accuracy,
    trend,
    calculateForecast,
    getForecastData,
    getSeasonality,
    compareAlgorithms,
  } = useInventoryForecast();

  // Get demand history for selected product
  const {
    history: demandHistory,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useDemandHistory(selectedProductId || '', 90);

  // Algorithm comparison
  const [algorithmComparison, setAlgorithmComparison] = useState<AlgorithmComparison[]>([]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Calculate forecast when product is selected
   */
  useEffect(() => {
    if (selectedProductId && demandHistory.length > 0 && !isCalculating) {
      calculateForecast(selectedProductId, demandHistory, settings);
    }
  }, [selectedProductId, demandHistory, settings, calculateForecast, isCalculating]);

  /**
   * Update algorithm comparison when history changes
   */
  useEffect(() => {
    if (demandHistory.length >= 7 && showComparison) {
      const comparison = compareAlgorithms(demandHistory);
      setAlgorithmComparison(comparison);
    }
  }, [demandHistory, showComparison, compareAlgorithms]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    setViewMode('details');
    onProductSelect?.(productId);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedProductId(null);
  };

  const handleRefresh = () => {
    if (selectedProductId) {
      refetchHistory();
    }
  };

  const handleCompareAlgorithms = () => {
    setShowComparison(!showComparison);
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  const productSummaries = useMemo<ProductForecastSummary[]>(() => {
    return products.map(product => {
      // Calculate status based on stock level
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (product.stock === 0) status = 'critical';
      else if (product.stock < 10) status = 'warning';

      return {
        productId: product.id,
        productName: product.name,
        productSKU: product.sku,
        currentStock: product.stock,
        trend: 'stable' as const,
        forecastedDemand30Days: 0,
        accuracy: 0,
        status,
      };
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = productSummaries;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.productName.localeCompare(b.productName);
        case 'stock':
          return b.currentStock - a.currentStock;
        case 'accuracy':
          return b.accuracy - a.accuracy;
        case 'demand':
          return b.forecastedDemand30Days - a.forecastedDemand30Days;
        default:
          return 0;
      }
    });

    return filtered;
  }, [productSummaries, filterStatus, sortBy]);

  const chartData = useMemo(() => {
    if (!forecast) return [];
    return getForecastData(60);
  }, [forecast, getForecastData]);

  const seasonality = getSeasonality();

  // ============================================================================
  // RENDER: LIST VIEW
  // ============================================================================

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Inventory Forecasting</h2>
            <p className="text-sm text-gray-600 mt-1">
              Predict demand and optimize stock levels
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-5 h-5 inline mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Forecast Settings</h3>
              <button
                onClick={resetSettings}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Reset to Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Algorithm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Algorithm
                </label>
                <select
                  value={settings.algorithm}
                  onChange={e =>
                    updateSetting('algorithm', e.target.value as any)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hybrid">Hybrid (Auto-select Best)</option>
                  <option value="sma">Simple Moving Average</option>
                  <option value="exponential">Exponential Smoothing</option>
                  <option value="linear">Linear Regression</option>
                  <option value="seasonal">Seasonal Decomposition</option>
                </select>
              </div>

              {/* Forecast Periods */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forecast Days
                </label>
                <input
                  type="number"
                  value={settings.periods}
                  onChange={e =>
                    updateSetting('periods', parseInt(e.target.value) || 30)
                  }
                  min={7}
                  max={365}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Confidence Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confidence Level
                </label>
                <select
                  value={settings.confidenceLevel}
                  onChange={e =>
                    updateSetting('confidenceLevel', parseFloat(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0.90}>90%</option>
                  <option value={0.95}>95%</option>
                  <option value={0.99}>99%</option>
                </select>
              </div>

              {/* Smoothing Factor */}
              {settings.algorithm === 'exponential' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Smoothing Factor (α)
                  </label>
                  <input
                    type="number"
                    value={settings.smoothingFactor}
                    onChange={e =>
                      updateSetting(
                        'smoothingFactor',
                        parseFloat(e.target.value) || 0.3
                      )
                    }
                    min={0.1}
                    max={0.9}
                    step={0.1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* SMA Window */}
              {settings.algorithm === 'sma' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moving Average Window
                  </label>
                  <input
                    type="number"
                    value={settings.smaWindow}
                    onChange={e =>
                      updateSetting('smaWindow', parseInt(e.target.value) || 7)
                    }
                    min={3}
                    max={30}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters and Sort */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All</option>
                <option value="healthy">Healthy</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="name">Name</option>
                <option value="stock">Stock Level</option>
                <option value="accuracy">Accuracy</option>
                <option value="demand">Forecasted Demand</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {filteredProducts.length} of {products.length} products
          </div>
        </div>

        {/* Product List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  30-Day Forecast
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map(product => (
                <tr
                  key={product.productId}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleProductSelect(product.productId)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.productName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{product.productSKU}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.currentStock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        product.trend === 'up'
                          ? 'bg-green-100 text-green-800'
                          : product.trend === 'down'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.trend === 'up' ? '↑' : product.trend === 'down' ? '↓' : '→'}{' '}
                      {product.trend}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.forecastedDemand30Days || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'healthy'
                          ? 'bg-green-100 text-green-800'
                          : product.status === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 hover:text-blue-900">
                      View Forecast
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No products match the selected filters
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: DETAILS VIEW
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToList}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedProduct?.name || 'Product Forecast'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              SKU: {selectedProduct?.sku || '-'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCompareAlgorithms}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Compare Algorithms
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoadingHistory || isCalculating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoadingHistory || isCalculating ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Forecast Summary Cards */}
      {forecast && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Current Stock</div>
            <div className="text-2xl font-bold text-gray-900">
              {selectedProduct?.stock || 0}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Forecast Accuracy</div>
            <div className="text-2xl font-bold text-gray-900">
              {(accuracy * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Trend</div>
            <div className="text-2xl font-bold text-gray-900">
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trend}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Algorithm</div>
            <div className="text-2xl font-bold text-gray-900 capitalize">
              {forecast.algorithm}
            </div>
          </div>
        </div>
      )}

      {/* Seasonality Info */}
      {seasonality?.detected && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Seasonality Detected
          </h3>
          <p className="text-sm text-blue-800">
            Period: {seasonality.period} days | Strength:{' '}
            {(seasonality.strength * 100).toFixed(1)}%
          </p>
        </div>
      )}

      {/* Forecast Chart */}
      {forecast && chartData.length > 0 && (
        <ForecastChart
          data={chartData}
          productName={selectedProduct?.name || ''}
          reorderPoint={selectedProduct ? selectedProduct.stock * 0.3 : undefined}
          maxStock={selectedProduct ? selectedProduct.stock * 2 : undefined}
        />
      )}

      {/* Algorithm Comparison */}
      {showComparison && algorithmComparison.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Algorithm Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Algorithm
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    MAPE
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    MAE
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    RMSE
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    R²
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {algorithmComparison.map(algo => (
                  <tr
                    key={algo.algorithm}
                    className={algo.recommended ? 'bg-green-50' : ''}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                      {algo.algorithm}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {algo.mape.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {algo.mae.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {algo.rmse.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {algo.r2.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {algo.recommended && (
                        <span className="inline-flex px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Recommended
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading State */}
      {(isCalculating || isLoadingHistory) && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Calculating forecast...</p>
        </div>
      )}
    </div>
  );
}
