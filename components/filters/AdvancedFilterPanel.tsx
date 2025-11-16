'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, X, Copy } from 'lucide-react';
import { useAdvancedFiltering, useSavedFilters } from '@/lib/hooks/useAdvancedFiltering';
import { useI18n } from '@/lib/hooks/useI18n';
import type { OrderItem } from '@/types';
import type { FilterCriterion, FilterOperator } from '@/lib/utils/advanced-filtering';

interface AdvancedFilterPanelProps {
  items: OrderItem[];
  onItemsChange?: (items: OrderItem[]) => void;
  compact?: boolean;
  className?: string;
}

export default function AdvancedFilterPanel({
  items,
  onItemsChange,
  compact = false,
  className = '',
}: AdvancedFilterPanelProps) {
  const i18n = useI18n();
  const {
    items: filteredItems,
    filterGroups,
    globalLogic,
    error,
    addFilterGroup,
    deleteFilterGroupLocal,
    toggleGroupActive,
    clearAllFilters,
    setGlobalLogic,
    filterCount,
  } = useAdvancedFiltering(items);

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showNewFilter, setShowNewFilter] = useState(false);

  // Call onItemsChange when filtered items change
  useState(() => {
    onItemsChange?.(filteredItems);
  });

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold dark:text-white">
          {i18n.t('common.filter')} ({filterCount})
        </h3>
        <div className="flex items-center gap-2">
          {filterCount > 0 && (
            <>
              <select
                value={globalLogic}
                onChange={(e) => setGlobalLogic(e.target.value as 'and' | 'or')}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
              >
                <option value="and">AND</option>
                <option value="or">OR</option>
              </select>
              <button
                onClick={clearAllFilters}
                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                Clear
              </button>
            </>
          )}
          <button
            onClick={() => setShowNewFilter(!showNewFilter)}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3 w-3 inline mr-1" />
            Add
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
          {error}
        </div>
      )}

      {/* Filter Groups */}
      <div className="space-y-2">
        {filterGroups.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
            No filters applied
          </p>
        ) : (
          filterGroups.map((group) => (
            <FilterGroupItem
              key={group.id}
              group={group}
              expanded={expandedGroup === group.id}
              onToggle={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
              onToggleActive={() => toggleGroupActive(group.id)}
              onDelete={() => deleteFilterGroupLocal(group.id)}
            />
          ))
        )}
      </div>

      {/* New Filter Form */}
      {showNewFilter && (
        <FilterForm
          onCreate={(groupData) => {
            addFilterGroup(groupData);
            setShowNewFilter(false);
          }}
          onCancel={() => setShowNewFilter(false)}
        />
      )}

      {/* Results Summary */}
      {filterCount > 0 && (
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 text-xs">
          <span className="font-semibold text-blue-900 dark:text-blue-300">
            {filteredItems.length} / {items.length} items
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Filter group item component
 */
function FilterGroupItem({
  group,
  expanded,
  onToggle,
  onToggleActive,
  onDelete,
}: {
  group: any;
  expanded: boolean;
  onToggle: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-2 bg-gray-50 dark:bg-gray-700 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
        <div className="flex-1 flex items-center gap-2 cursor-pointer" onClick={onToggle}>
          <input
            type="checkbox"
            checked={group.isActive}
            onChange={(e) => {
              e.stopPropagation();
              onToggleActive();
            }}
            className="h-3 w-3"
          />
          <span className="text-sm font-medium dark:text-white flex-1">{group.name}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-2 space-y-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {group.criteria.map((criterion: FilterCriterion, idx: number) => (
            <div key={idx} className="text-xs p-1 bg-gray-100 dark:bg-gray-700 rounded">
              <div className="font-medium dark:text-white">
                {criterion.field} {criterion.operator}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {typeof criterion.value === 'string'
                  ? criterion.value
                  : JSON.stringify(criterion.value)}
              </div>
            </div>
          ))}
          <div className="text-xs text-gray-600 dark:text-gray-400 pt-1">
            Logic: <span className="font-semibold">{group.logic.toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Filter creation form
 */
function FilterForm({
  onCreate,
  onCancel,
}: {
  onCreate: (data: any) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [logic, setLogic] = useState<'and' | 'or'>('and');
  const [criteria, setCriteria] = useState<FilterCriterion[]>([]);

  const handleCreate = () => {
    if (!name.trim()) return;

    onCreate({
      name,
      logic,
      criteria,
      isActive: true,
    });
  };

  return (
    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Filter name"
          className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="flex gap-2">
        <select
          value={logic}
          onChange={(e) => setLogic(e.target.value as 'and' | 'or')}
          className="flex-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
        >
          <option value="and">AND</option>
          <option value="or">OR</option>
        </select>

        <button
          onClick={handleCreate}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Create
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
