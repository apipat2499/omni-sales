'use client';

import { useState } from 'react';
import {
  Copy,
  Plus,
  Minus,
  Percent,
  RefreshCw,
  MoreHorizontal,
  X,
} from 'lucide-react';
import type { OrderItem } from '@/types';
import {
  quickActions,
  quickActionMetadata,
  duplicateItem,
  splitItemQuantity,
} from '@/lib/utils/quick-actions';

interface QuickActionButtonsProps {
  item: OrderItem;
  onAction: (action: string, updatedItem: Omit<OrderItem, 'id'> | [Omit<OrderItem, 'id'>, Omit<OrderItem, 'id'>]) => void;
  showLabels?: boolean;
  compact?: boolean;
  maxVisibleActions?: number;
}

export default function QuickActionButtons({
  item,
  onAction,
  showLabels = false,
  compact = true,
  maxVisibleActions = 6,
}: QuickActionButtonsProps) {
  const [showMore, setShowMore] = useState(false);

  const actions = Object.entries(quickActions);
  const visibleActions = actions.slice(0, maxVisibleActions);
  const moreActions = actions.slice(maxVisibleActions);

  const handleAction = (actionKey: string) => {
    const action = quickActions[actionKey as keyof typeof quickActions];
    if (actionKey === 'duplicate') {
      onAction('duplicate', action(item));
    } else if (actionKey === 'split') {
      onAction('split', action(item));
    } else {
      onAction(actionKey, action(item));
    }
  };

  const getActionColor = (actionKey: string) => {
    const meta = quickActionMetadata[actionKey as keyof typeof quickActionMetadata];
    const colorMap = {
      blue: 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20',
      green: 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20',
      red: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20',
      yellow: 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20',
      purple: 'text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20',
      gray: 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900/20',
    };
    return colorMap[meta.color];
  };

  const getActionIcon = (actionKey: string) => {
    switch (actionKey) {
      case 'double':
      case 'half':
      case 'roundToFive':
      case 'roundToTen':
        return <RefreshCw className="h-4 w-4" />;
      case 'addOne':
        return <Plus className="h-4 w-4" />;
      case 'removeOne':
        return <Minus className="h-4 w-4" />;
      case 'discount10':
      case 'discount20':
      case 'discount50':
        return <Percent className="h-4 w-4" />;
      case 'removeDiscount':
        return <X className="h-4 w-4" />;
      case 'duplicate':
        return <Copy className="h-4 w-4" />;
      case 'split':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {/* Main Actions */}
      <div className="flex flex-wrap gap-1">
        {visibleActions.map(([actionKey, action]) => {
          const meta = quickActionMetadata[actionKey as keyof typeof quickActionMetadata];
          return (
            <button
              key={actionKey}
              onClick={() => handleAction(actionKey)}
              title={meta.tooltip}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors ${getActionColor(actionKey)}`}
            >
              {getActionIcon(actionKey)}
              {showLabels && <span className="text-xs font-medium">{meta.label}</span>}
              {!showLabels && compact && (
                <span className="text-xs font-medium">{meta.label}</span>
              )}
            </button>
          );
        })}

        {/* More Actions Button */}
        {moreActions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className="inline-flex items-center justify-center p-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
              title="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {/* Dropdown Menu */}
            {showMore && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-max">
                {moreActions.map(([actionKey, action]) => {
                  const meta = quickActionMetadata[actionKey as keyof typeof quickActionMetadata];
                  return (
                    <button
                      key={actionKey}
                      onClick={() => {
                        handleAction(actionKey);
                        setShowMore(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-2 ${getActionColor(actionKey)}`}
                      title={meta.tooltip}
                    >
                      {getActionIcon(actionKey)}
                      <span>{meta.label}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        {meta.tooltip}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tooltip Text */}
      {showLabels && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Click any button to apply quick action
        </p>
      )}
    </div>
  );
}
