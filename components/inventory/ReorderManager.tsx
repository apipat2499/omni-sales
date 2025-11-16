'use client';

import React, { useState, useMemo } from 'react';
import { useReorderSystem } from '@/lib/hooks/useReorderSystem';
import { ReorderRule, ReorderSuggestion } from '@/lib/utils/reorder-management';
import { Product, Supplier, PurchaseOrder } from '@/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ReorderManagerProps {
  userId: string;
  products?: Product[];
  suppliers?: Supplier[];
}

type ViewMode = 'rules' | 'suggestions' | 'purchaseOrders' | 'createRule' | 'createPO';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ReorderManager({
  userId,
  products = [],
  suppliers = [],
}: ReorderManagerProps) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('rules');
  const [selectedRule, setSelectedRule] = useState<ReorderRule | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for new rule
  const [newRule, setNewRule] = useState<Partial<ReorderRule>>({
    productId: '',
    supplierId: '',
    reorderPoint: 0,
    reorderQuantity: 0,
    minimumStock: 0,
    maximumStock: 0,
    leadTime: 7,
    isActive: true,
    autoGenerate: false,
  });

  // Hooks
  const {
    rules,
    purchaseOrders,
    suggestions,
    isLoading,
    error,
    createReorderRule,
    updateReorderRule,
    deleteReorderRule,
    toggleReorderRule,
    generatePurchaseOrder,
    approvePurchaseOrder,
    cancelPurchaseOrder,
    refreshRules,
    refreshSuggestions,
  } = useReorderSystem({ userId, autoCheckReorders: true });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreateRule = async () => {
    const result = await createReorderRule(newRule);
    if (result) {
      setViewMode('rules');
      setNewRule({
        productId: '',
        supplierId: '',
        reorderPoint: 0,
        reorderQuantity: 0,
        minimumStock: 0,
        maximumStock: 0,
        leadTime: 7,
        isActive: true,
        autoGenerate: false,
      });
    }
  };

  const handleEditRule = async (rule: ReorderRule) => {
    setSelectedRule(rule);
    setNewRule(rule);
    setViewMode('createRule');
  };

  const handleUpdateRule = async () => {
    if (selectedRule) {
      const success = await updateReorderRule(selectedRule.id, newRule);
      if (success) {
        setViewMode('rules');
        setSelectedRule(null);
        setNewRule({
          productId: '',
          supplierId: '',
          reorderPoint: 0,
          reorderQuantity: 0,
          minimumStock: 0,
          maximumStock: 0,
          leadTime: 7,
          isActive: true,
          autoGenerate: false,
        });
      }
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this reorder rule?')) {
      await deleteReorderRule(ruleId);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    await toggleReorderRule(ruleId, isActive);
  };

  const handleGeneratePO = async (suggestion: ReorderSuggestion) => {
    const po = await generatePurchaseOrder({
      supplierId: suggestion.supplierId,
      warehouseId: '', // Should be selected by user
      items: [
        {
          productId: suggestion.productId,
          quantity: suggestion.suggestedQuantity,
          unitCost: suggestion.estimatedCost / suggestion.suggestedQuantity,
        },
      ],
      notes: `Auto-generated from reorder suggestion`,
    });

    if (po) {
      alert('Purchase order created successfully!');
      setViewMode('purchaseOrders');
    }
  };

  const handleApprovePO = async (poId: string) => {
    await approvePurchaseOrder(poId);
  };

  const handleCancelPO = async (poId: string) => {
    if (confirm('Are you sure you want to cancel this purchase order?')) {
      await cancelPurchaseOrder(poId);
    }
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const activeRules = useMemo(() => {
    return rules.filter(r => r.isActive);
  }, [rules]);

  const filteredRules = useMemo(() => {
    if (!searchQuery) return rules;
    return rules.filter(
      r =>
        r.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.productSKU?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rules, searchQuery]);

  const urgentSuggestions = useMemo(() => {
    return suggestions.filter(s => s.priority === 'high');
  }, [suggestions]);

  const pendingPOs = useMemo(() => {
    return purchaseOrders.filter(po => po.status === 'draft' || po.status === 'pending');
  }, [purchaseOrders]);

  // ============================================================================
  // RENDER: HEADER
  // ============================================================================

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reorder Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage reorder rules and purchase orders
        </p>
      </div>
      <div className="flex items-center space-x-2">
        {viewMode !== 'createRule' && viewMode !== 'createPO' && (
          <button
            onClick={() => setViewMode('createRule')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create Rule
          </button>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // RENDER: NAVIGATION TABS
  // ============================================================================

  const renderTabs = () => (
    <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
      <button
        onClick={() => setViewMode('rules')}
        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
          viewMode === 'rules'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Reorder Rules ({rules.length})
      </button>
      <button
        onClick={() => setViewMode('suggestions')}
        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
          viewMode === 'suggestions'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Suggestions ({suggestions.length})
        {urgentSuggestions.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
            {urgentSuggestions.length} urgent
          </span>
        )}
      </button>
      <button
        onClick={() => setViewMode('purchaseOrders')}
        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
          viewMode === 'purchaseOrders'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Purchase Orders ({purchaseOrders.length})
      </button>
    </div>
  );

  // ============================================================================
  // RENDER: REORDER RULES
  // ============================================================================

  const renderRules = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={refreshRules}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reorder Point
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Lead Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Auto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRules.map(rule => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {rule.productName || 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-500">{rule.productSKU}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {rule.supplierName || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {rule.reorderPoint}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {rule.reorderQuantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {rule.leadTime} days
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {rule.autoGenerate ? (
                    <span className="text-green-600 text-sm">Yes</span>
                  ) : (
                    <span className="text-gray-400 text-sm">No</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.isActive}
                      onChange={e => handleToggleRule(rule.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => handleEditRule(rule)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRules.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No reorder rules found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // RENDER: SUGGESTIONS
  // ============================================================================

  const renderSuggestions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {suggestions.length} products need reordering
        </p>
        <button
          onClick={refreshSuggestions}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map(suggestion => (
          <div
            key={suggestion.productId}
            className={`bg-white border rounded-lg p-4 ${
              suggestion.priority === 'high'
                ? 'border-red-300 bg-red-50'
                : suggestion.priority === 'medium'
                ? 'border-yellow-300 bg-yellow-50'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {suggestion.productName}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Supplier: {suggestion.supplierName}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  suggestion.priority === 'high'
                    ? 'bg-red-100 text-red-800'
                    : suggestion.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {suggestion.priority}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Stock:</span>
                <span className="font-medium">{suggestion.currentStock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reorder Point:</span>
                <span className="font-medium">{suggestion.reorderPoint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Suggested Qty:</span>
                <span className="font-medium">{suggestion.suggestedQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Est. Cost:</span>
                <span className="font-medium">
                  ${suggestion.estimatedCost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Days to Stockout:</span>
                <span className="font-medium text-red-600">
                  {suggestion.daysUntilStockout}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleGeneratePO(suggestion)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate PO
            </button>
          </div>
        ))}
      </div>

      {suggestions.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-lg">
          No reorder suggestions at this time. All products are well-stocked!
        </div>
      )}
    </div>
  );

  // ============================================================================
  // RENDER: PURCHASE ORDERS
  // ============================================================================

  const renderPurchaseOrders = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                PO #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Expected Delivery
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchaseOrders.map(po => (
              <tr key={po.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {po.poNumber || po.id?.substring(0, 8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {/* Supplier name would come from joined data */}
                  Supplier
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {/* Items count */}
                  - items
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      po.status === 'draft'
                        ? 'bg-gray-100 text-gray-800'
                        : po.status === 'sent'
                        ? 'bg-blue-100 text-blue-800'
                        : po.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : po.status === 'received'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {po.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {po.expectedDeliveryDate
                    ? new Date(po.expectedDeliveryDate).toLocaleDateString()
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {po.status === 'draft' && (
                    <button
                      onClick={() => handleApprovePO(po.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Approve
                    </button>
                  )}
                  {(po.status === 'draft' || po.status === 'sent') && (
                    <button
                      onClick={() => handleCancelPO(po.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {purchaseOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No purchase orders found
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // RENDER: CREATE/EDIT RULE FORM
  // ============================================================================

  const renderRuleForm = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {selectedRule ? 'Edit Reorder Rule' : 'Create Reorder Rule'}
        </h3>
        <button
          onClick={() => {
            setViewMode('rules');
            setSelectedRule(null);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product *
          </label>
          <select
            value={newRule.productId}
            onChange={e => setNewRule({ ...newRule, productId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select product...</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier *
          </label>
          <select
            value={newRule.supplierId}
            onChange={e => setNewRule({ ...newRule, supplierId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select supplier...</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.supplierName}
              </option>
            ))}
          </select>
        </div>

        {/* Reorder Point */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reorder Point *
          </label>
          <input
            type="number"
            value={newRule.reorderPoint}
            onChange={e =>
              setNewRule({ ...newRule, reorderPoint: parseInt(e.target.value) || 0 })
            }
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Reorder Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reorder Quantity *
          </label>
          <input
            type="number"
            value={newRule.reorderQuantity}
            onChange={e =>
              setNewRule({ ...newRule, reorderQuantity: parseInt(e.target.value) || 0 })
            }
            min={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Minimum Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Stock
          </label>
          <input
            type="number"
            value={newRule.minimumStock}
            onChange={e =>
              setNewRule({ ...newRule, minimumStock: parseInt(e.target.value) || 0 })
            }
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Maximum Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Stock
          </label>
          <input
            type="number"
            value={newRule.maximumStock}
            onChange={e =>
              setNewRule({ ...newRule, maximumStock: parseInt(e.target.value) || 0 })
            }
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Lead Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lead Time (days) *
          </label>
          <input
            type="number"
            value={newRule.leadTime}
            onChange={e =>
              setNewRule({ ...newRule, leadTime: parseInt(e.target.value) || 7 })
            }
            min={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Auto Generate */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoGenerate"
            checked={newRule.autoGenerate}
            onChange={e => setNewRule({ ...newRule, autoGenerate: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label htmlFor="autoGenerate" className="text-sm text-gray-700">
            Auto-generate purchase orders
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 pt-4 border-t">
        <button
          onClick={() => {
            setViewMode('rules');
            setSelectedRule(null);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={selectedRule ? handleUpdateRule : handleCreateRule}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {selectedRule ? 'Update Rule' : 'Create Rule'}
        </button>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {renderHeader()}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {viewMode !== 'createRule' && viewMode !== 'createPO' && renderTabs()}

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!isLoading && (
        <>
          {viewMode === 'rules' && renderRules()}
          {viewMode === 'suggestions' && renderSuggestions()}
          {viewMode === 'purchaseOrders' && renderPurchaseOrders()}
          {viewMode === 'createRule' && renderRuleForm()}
        </>
      )}
    </div>
  );
}
