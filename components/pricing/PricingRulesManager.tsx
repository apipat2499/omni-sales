/**
 * PricingRulesManager Component
 * Comprehensive UI for creating, editing, and managing pricing rules
 */

'use client';

import React, { useState, useMemo } from 'react';
import { usePricingRules, useRuleWizard } from '@/lib/hooks/usePricingRules';
import type { PricingRule, RuleType, RuleCondition, RuleAction, ActionType, RuleOperator } from '@/lib/utils/pricing-rules';

interface PricingRulesManagerProps {
  className?: string;
}

export default function PricingRulesManager({ className = '' }: PricingRulesManagerProps) {
  const {
    rules,
    activeRules,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    duplicateRule,
    statistics,
    refresh,
  } = usePricingRules();

  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<RuleType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'name' | 'date' | 'usage'>('priority');

  /**
   * Handle create rule
   */
  const handleCreate = () => {
    setSelectedRule(null);
    setView('create');
  };

  /**
   * Handle edit rule
   */
  const handleEdit = (rule: PricingRule) => {
    setSelectedRule(rule);
    setView('edit');
  };

  /**
   * Handle delete rule
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await deleteRule(id);
    } catch (err) {
      alert('Failed to delete rule');
    }
  };

  /**
   * Handle toggle rule
   */
  const handleToggle = async (id: string) => {
    try {
      await toggleRule(id);
    } catch (err) {
      alert('Failed to toggle rule');
    }
  };

  /**
   * Handle duplicate rule
   */
  const handleDuplicate = async (id: string) => {
    try {
      await duplicateRule(id);
    } catch (err) {
      alert('Failed to duplicate rule');
    }
  };

  /**
   * Filter and sort rules
   */
  const filteredRules = useMemo(() => {
    let filtered = rules;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (rule) =>
          rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rule.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((rule) => rule.type === filterType);
    }

    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter((rule) => rule.isActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter((rule) => !rule.isActive);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'usage':
          return b.usageCount - a.usageCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [rules, searchQuery, filterType, filterStatus, sortBy]);

  /**
   * Detect conflicts
   */
  const conflicts = useMemo(() => {
    const conflicts: { rule1: PricingRule; rule2: PricingRule; reason: string }[] = [];

    for (let i = 0; i < activeRules.length; i++) {
      for (let j = i + 1; j < activeRules.length; j++) {
        const rule1 = activeRules[i];
        const rule2 = activeRules[j];

        // Check for overlapping conditions
        const hasOverlap = hasConditionOverlap(rule1, rule2);

        if (hasOverlap) {
          const reason =
            rule1.priority === rule2.priority
              ? 'Same priority - may cause unpredictable behavior'
              : rule1.isStackable && rule2.isStackable
              ? 'Both stackable - will apply together'
              : 'Non-stackable - only one will apply';

          conflicts.push({ rule1, rule2, reason });
        }
      }
    }

    return conflicts;
  }, [activeRules]);

  if (view === 'create') {
    return (
      <RuleEditor
        onSave={async (rule) => {
          await createRule(rule);
          setView('list');
        }}
        onCancel={() => setView('list')}
        className={className}
      />
    );
  }

  if (view === 'edit' && selectedRule) {
    return (
      <RuleEditor
        rule={selectedRule}
        onSave={async (rule) => {
          await updateRule(selectedRule.id, rule);
          setView('list');
        }}
        onCancel={() => setView('list')}
        className={className}
      />
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pricing Rules</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage volume discounts, seasonal pricing, and promotional rules
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Rule
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Rules</div>
            <div className="text-2xl font-bold text-blue-600">{statistics.totalRules}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Active Rules</div>
            <div className="text-2xl font-bold text-green-600">{statistics.activeRules}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Usages</div>
            <div className="text-2xl font-bold text-purple-600">{statistics.totalUsages}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Conflicts</div>
            <div className="text-2xl font-bold text-orange-600">{conflicts.length}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as RuleType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="volume_discount">Volume Discount</option>
            <option value="customer_tier">Customer Tier</option>
            <option value="seasonal">Seasonal</option>
            <option value="category_discount">Category Discount</option>
            <option value="promotional">Promotional</option>
            <option value="time_limited">Time Limited</option>
            <option value="bogo">BOGO</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="priority">Sort by Priority</option>
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date</option>
            <option value="usage">Sort by Usage</option>
          </select>
        </div>
      </div>

      {/* Conflicts Warning */}
      {conflicts.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800">Rule Conflicts Detected</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {conflicts.length} potential conflict(s) found. Review rule priorities and stacking settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading rules...</p>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No rules found</p>
            <button
              onClick={handleCreate}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Rule
            </button>
          </div>
        ) : (
          filteredRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => handleEdit(rule)}
              onDelete={() => handleDelete(rule.id)}
              onToggle={() => handleToggle(rule.id)}
              onDuplicate={() => handleDuplicate(rule.id)}
              hasConflicts={conflicts.some((c) => c.rule1.id === rule.id || c.rule2.id === rule.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Rule Card Component
 */
interface RuleCardProps {
  rule: PricingRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  hasConflicts: boolean;
}

function RuleCard({ rule, onEdit, onDelete, onToggle, onDuplicate, hasConflicts }: RuleCardProps) {
  const [expanded, setExpanded] = useState(false);

  const typeColors: Record<RuleType, string> = {
    volume_discount: 'bg-blue-100 text-blue-800',
    customer_tier: 'bg-purple-100 text-purple-800',
    seasonal: 'bg-green-100 text-green-800',
    category_discount: 'bg-yellow-100 text-yellow-800',
    promotional: 'bg-pink-100 text-pink-800',
    time_limited: 'bg-red-100 text-red-800',
    bogo: 'bg-indigo-100 text-indigo-800',
    bundle: 'bg-teal-100 text-teal-800',
    loyalty_multiplier: 'bg-orange-100 text-orange-800',
    first_purchase: 'bg-cyan-100 text-cyan-800',
    referral: 'bg-lime-100 text-lime-800',
  };

  return (
    <div className={`border rounded-lg p-4 ${hasConflicts ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[rule.type]}`}>
              {rule.type.replace(/_/g, ' ')}
            </span>
            {rule.isStackable && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                Stackable
              </span>
            )}
            {hasConflicts && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                Has Conflicts
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Priority: {rule.priority}</span>
            <span>Used: {rule.usageCount} times</span>
            {rule.maxUsages && <span>Max: {rule.maxUsages}</span>}
            <span>
              {rule.startDate.toLocaleDateString()}
              {rule.endDate && ` - ${rule.endDate.toLocaleDateString()}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={rule.isActive}
              onChange={onToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
            Edit
          </button>
          <button onClick={onDuplicate} className="p-2 text-green-600 hover:bg-green-50 rounded">
            Duplicate
          </button>
          <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded">
            Delete
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Conditions</h4>
              <div className="space-y-2">
                {rule.conditions.map((condition, index) => (
                  <div key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {condition.field} {condition.operator} {JSON.stringify(condition.value)}
                    {condition.logicalOperator && (
                      <span className="ml-2 text-gray-500">({condition.logicalOperator})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Actions</h4>
              <div className="space-y-2">
                {rule.actions.map((action, index) => (
                  <div key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {action.type}: {action.value}
                    {action.type === 'percentage_discount' && '%'}
                    {action.maxDiscount && ` (max: $${action.maxDiscount})`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Rule Editor Component
 */
interface RuleEditorProps {
  rule?: PricingRule;
  onSave: (rule: any) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

function RuleEditor({ rule, onSave, onCancel, className = '' }: RuleEditorProps) {
  const wizard = useRuleWizard();

  // Initialize wizard with existing rule
  React.useEffect(() => {
    if (rule) {
      wizard.updateRule(rule);
    }
  }, [rule]);

  const handleSave = async () => {
    if (!wizard.validate()) {
      return;
    }

    try {
      await onSave(wizard.state.rule);
    } catch (err) {
      alert('Failed to save rule');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {rule ? 'Edit Rule' : 'Create New Rule'}
        </h2>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex-1 ${step < 4 ? 'relative' : ''}`}
            >
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    wizard.state.step >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      wizard.state.step > step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {step === 1 && 'Basic Info'}
                {step === 2 && 'Conditions'}
                {step === 3 && 'Actions'}
                {step === 4 && 'Settings'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Messages */}
      {Object.keys(wizard.state.errors).length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          {Object.values(wizard.state.errors).map((error, index) => (
            <p key={index} className="text-sm text-red-700">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Step 1: Basic Info */}
      {wizard.state.step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
            <input
              type="text"
              value={wizard.state.rule.name || ''}
              onChange={(e) => wizard.updateRule({ name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Volume Discount 10+"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={wizard.state.rule.description || ''}
              onChange={(e) => wizard.updateRule({ description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe what this rule does..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
            <select
              value={wizard.state.rule.type || ''}
              onChange={(e) => wizard.updateRule({ type: e.target.value as RuleType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select type...</option>
              <option value="volume_discount">Volume Discount</option>
              <option value="customer_tier">Customer Tier</option>
              <option value="seasonal">Seasonal</option>
              <option value="category_discount">Category Discount</option>
              <option value="promotional">Promotional</option>
              <option value="time_limited">Time Limited</option>
              <option value="bogo">BOGO</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 2: Conditions */}
      {wizard.state.step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Rule Conditions</h3>
            <button
              onClick={() =>
                wizard.addCondition({
                  field: 'quantity',
                  operator: 'gte',
                  value: 1,
                })
              }
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add Condition
            </button>
          </div>

          {wizard.state.rule.conditions && wizard.state.rule.conditions.length > 0 ? (
            <div className="space-y-3">
              {wizard.state.rule.conditions.map((condition, index) => (
                <ConditionEditor
                  key={index}
                  condition={condition}
                  onChange={(updates) => wizard.updateCondition(index, updates)}
                  onRemove={() => wizard.removeCondition(index)}
                  showLogicalOperator={index < (wizard.state.rule.conditions?.length || 0) - 1}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No conditions added yet</p>
          )}
        </div>
      )}

      {/* Step 3: Actions */}
      {wizard.state.step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Rule Actions</h3>
            <button
              onClick={() =>
                wizard.addAction({
                  type: 'percentage_discount',
                  value: 10,
                  applyTo: 'item',
                })
              }
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add Action
            </button>
          </div>

          {wizard.state.rule.actions && wizard.state.rule.actions.length > 0 ? (
            <div className="space-y-3">
              {wizard.state.rule.actions.map((action, index) => (
                <ActionEditor
                  key={index}
                  action={action}
                  onChange={(updates) => wizard.updateAction(index, updates)}
                  onRemove={() => wizard.removeAction(index)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No actions added yet</p>
          )}
        </div>
      )}

      {/* Step 4: Settings */}
      {wizard.state.step === 4 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <input
                type="number"
                value={wizard.state.rule.priority || 10}
                onChange={(e) => wizard.updateRule({ priority: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">Lower number = higher priority</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Usages</label>
              <input
                type="number"
                value={wizard.state.rule.maxUsages || ''}
                onChange={(e) =>
                  wizard.updateRule({ maxUsages: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={wizard.state.rule.startDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => wizard.updateRule({ startDate: new Date(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={wizard.state.rule.endDate?.toISOString().split('T')[0] || ''}
                onChange={(e) =>
                  wizard.updateRule({
                    endDate: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="No end date"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wizard.state.rule.isActive ?? true}
                onChange={(e) => wizard.updateRule({ isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wizard.state.rule.isStackable ?? true}
                onChange={(e) => wizard.updateRule({ isStackable: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Stackable with other rules</span>
            </label>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={wizard.prevStep}
          disabled={wizard.state.step === 1}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="flex gap-2">
          {wizard.state.step < 4 ? (
            <button
              onClick={wizard.nextStep}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Rule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Condition Editor Component
 */
interface ConditionEditorProps {
  condition: RuleCondition;
  onChange: (updates: Partial<RuleCondition>) => void;
  onRemove: () => void;
  showLogicalOperator: boolean;
}

function ConditionEditor({ condition, onChange, onRemove, showLogicalOperator }: ConditionEditorProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-1 grid grid-cols-3 gap-3">
          <select
            value={condition.field}
            onChange={(e) => onChange({ field: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="quantity">Quantity</option>
            <option value="price">Price</option>
            <option value="orderTotal">Order Total</option>
            <option value="customerTier">Customer Tier</option>
            <option value="totalOrders">Total Orders</option>
            <option value="totalSpent">Total Spent</option>
            <option value="month">Month</option>
            <option value="dayOfWeek">Day of Week</option>
            <option value="isWeekend">Is Weekend</option>
            <option value="isNewCustomer">Is New Customer</option>
          </select>
          <select
            value={condition.operator}
            onChange={(e) => onChange({ operator: e.target.value as RuleOperator })}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="equals">Equals</option>
            <option value="not_equals">Not Equals</option>
            <option value="gt">Greater Than</option>
            <option value="gte">Greater Than or Equal</option>
            <option value="lt">Less Than</option>
            <option value="lte">Less Than or Equal</option>
            <option value="in">In List</option>
            <option value="contains">Contains</option>
          </select>
          <input
            type="text"
            value={typeof condition.value === 'object' ? JSON.stringify(condition.value) : condition.value}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange({ value: parsed });
              } catch {
                onChange({ value: e.target.value });
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Value"
          />
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      {showLogicalOperator && (
        <div className="mt-2">
          <select
            value={condition.logicalOperator || 'and'}
            onChange={(e) => onChange({ logicalOperator: e.target.value as 'and' | 'or' })}
            className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="and">AND</option>
            <option value="or">OR</option>
          </select>
        </div>
      )}
    </div>
  );
}

/**
 * Action Editor Component
 */
interface ActionEditorProps {
  action: RuleAction;
  onChange: (updates: Partial<RuleAction>) => void;
  onRemove: () => void;
}

function ActionEditor({ action, onChange, onRemove }: ActionEditorProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-1 grid grid-cols-3 gap-3">
          <select
            value={action.type}
            onChange={(e) => onChange({ type: e.target.value as ActionType })}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="percentage_discount">Percentage Discount</option>
            <option value="fixed_discount">Fixed Discount</option>
            <option value="fixed_price">Fixed Price</option>
            <option value="free_shipping">Free Shipping</option>
            <option value="bonus_points">Bonus Points</option>
          </select>
          <input
            type="number"
            value={action.value}
            onChange={(e) => onChange({ value: parseFloat(e.target.value) })}
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Value"
            step="0.01"
          />
          <input
            type="number"
            value={action.maxDiscount || ''}
            onChange={(e) =>
              onChange({ maxDiscount: e.target.value ? parseFloat(e.target.value) : undefined })
            }
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Max discount"
            step="0.01"
          />
        </div>
        <button
          onClick={onRemove}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Helper function to check condition overlap
 */
function hasConditionOverlap(rule1: PricingRule, rule2: PricingRule): boolean {
  // Simplified overlap detection
  // In a real implementation, this would be more sophisticated
  const fields1 = rule1.conditions.map((c) => c.field);
  const fields2 = rule2.conditions.map((c) => c.field);

  return fields1.some((field) => fields2.includes(field));
}
