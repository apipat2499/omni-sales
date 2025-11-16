/**
 * ActivityFeed Component
 *
 * Displays live activity log of user actions
 * Features:
 * - Timeline view
 * - Action icons and descriptions
 * - User avatars
 * - Relative timestamps
 * - Entity links
 * - Expandable details
 * - Real-time updates
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Plus,
  Edit,
  Trash2,
  Eye,
  ShoppingCart,
  Package,
  User,
  DollarSign,
  FileText,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  action: 'created' | 'updated' | 'deleted' | 'viewed';
  entity: {
    type: string; // 'order', 'item', 'customer', 'payment'
    id: string;
    name: string;
  };
  changes?: {
    field: string;
    before: any;
    after: any;
  }[];
  timestamp: Date | string;
  metadata?: Record<string, any>;
}

export interface ActivityFeedProps {
  activities: ActivityLog[];
  maxItems?: number;
  showFilters?: boolean;
  showDetails?: boolean;
  compact?: boolean;
  autoScroll?: boolean;
  onActivityClick?: (activity: ActivityLog) => void;
  className?: string;
}

/**
 * Get icon for action type
 */
const getActionIcon = (action: string) => {
  switch (action) {
    case 'created':
      return Plus;
    case 'updated':
      return Edit;
    case 'deleted':
      return Trash2;
    case 'viewed':
      return Eye;
    default:
      return Activity;
  }
};

/**
 * Get icon for entity type
 */
const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case 'order':
      return ShoppingCart;
    case 'item':
    case 'product':
      return Package;
    case 'customer':
      return User;
    case 'payment':
      return DollarSign;
    default:
      return FileText;
  }
};

/**
 * Get color for action type
 */
const getActionColor = (action: string) => {
  switch (action) {
    case 'created':
      return 'text-green-600 bg-green-50';
    case 'updated':
      return 'text-blue-600 bg-blue-50';
    case 'deleted':
      return 'text-red-600 bg-red-50';
    case 'viewed':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

/**
 * Format relative time
 */
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return then.toLocaleDateString();
}

/**
 * Format change value
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) return 'empty';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Activity item component
 */
const ActivityItem: React.FC<{
  activity: ActivityLog;
  showDetails: boolean;
  onExpand: () => void;
  onClick?: () => void;
}> = ({ activity, showDetails, onExpand, onClick }) => {
  const [expanded, setExpanded] = useState(false);

  const ActionIcon = getActionIcon(activity.action);
  const EntityIcon = getEntityIcon(activity.entity.type);
  const actionColor = getActionColor(activity.action);

  const hasChanges = activity.changes && activity.changes.length > 0;

  return (
    <div
      className={`group relative ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={onClick}
    >
      {/* Timeline line */}
      <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200 group-last:hidden" />

      <div className="flex gap-3 p-3">
        {/* Icon */}
        <div className={`relative flex-shrink-0 w-12 h-12 rounded-full ${actionColor} flex items-center justify-center`}>
          <ActionIcon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.username}</span>{' '}
                <span className="text-gray-600">{activity.action}</span>{' '}
                <span className="inline-flex items-center gap-1">
                  <EntityIcon className="w-3 h-3 inline" />
                  <span className="font-medium">{activity.entity.type}</span>
                </span>{' '}
                <span className="font-medium text-blue-600">
                  {activity.entity.name}
                </span>
              </p>

              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </div>
            </div>

            {/* Expand button */}
            {hasChanges && showDetails && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                  onExpand();
                }}
                className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}
          </div>

          {/* Changes detail */}
          {expanded && hasChanges && (
            <div className="mt-3 space-y-2">
              {activity.changes!.map((change, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-2 text-xs"
                >
                  <div className="font-medium text-gray-700 mb-1">
                    {change.field}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-gray-500">Before:</div>
                      <div className="text-gray-900 font-mono">
                        {formatValue(change.before)}
                      </div>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="flex-1">
                      <div className="text-gray-500">After:</div>
                      <div className="text-gray-900 font-mono">
                        {formatValue(change.after)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Main ActivityFeed component
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxItems = 50,
  showFilters = true,
  showDetails = true,
  compact = false,
  autoScroll = true,
  onActivityClick,
  className = '',
}) => {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const feedRef = React.useRef<HTMLDivElement>(null);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (filterAction !== 'all') {
      filtered = filtered.filter((a) => a.action === filterAction);
    }

    if (filterEntity !== 'all') {
      filtered = filtered.filter((a) => a.entity.type === filterEntity);
    }

    return filtered.slice(0, maxItems);
  }, [activities, filterAction, filterEntity, maxItems]);

  // Get unique action and entity types
  const { actionTypes, entityTypes } = useMemo(() => {
    const actions = new Set(activities.map((a) => a.action));
    const entities = new Set(activities.map((a) => a.entity.type));

    return {
      actionTypes: Array.from(actions),
      entityTypes: Array.from(entities),
    };
  }, [activities]);

  // Auto-scroll to bottom on new activities
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [activities.length, autoScroll]);

  // Update relative times
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div className={`space-y-1 ${className}`}>
        {filteredActivities.slice(0, 5).map((activity) => {
          const ActionIcon = getActionIcon(activity.action);
          const actionColor = getActionColor(activity.action);

          return (
            <div
              key={activity.id}
              className="flex items-center gap-2 text-sm p-2 rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => onActivityClick?.(activity)}
            >
              <div className={`w-6 h-6 rounded-full ${actionColor} flex items-center justify-center flex-shrink-0`}>
                <ActionIcon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0 truncate">
                <span className="font-medium">{activity.username}</span>{' '}
                <span className="text-gray-600">{activity.action}</span>{' '}
                <span className="font-medium">{activity.entity.name}</span>
              </div>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatRelativeTime(activity.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-900">
              Activity Feed
            </h3>
            <span className="text-xs text-gray-500">
              ({filteredActivities.length})
            </span>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (actionTypes.length > 1 || entityTypes.length > 1) && (
          <div className="flex gap-2 mt-3">
            {actionTypes.length > 1 && (
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All actions</option>
                {actionTypes.map((action) => (
                  <option key={action} value={action}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </option>
                ))}
              </select>
            )}

            {entityTypes.length > 1 && (
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All entities</option>
                {entityTypes.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity.charAt(0).toUpperCase() + entity.slice(1)}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Activity list */}
      <div
        ref={feedRef}
        className="max-h-96 overflow-y-auto"
      >
        {filteredActivities.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activities yet</p>
          </div>
        ) : (
          <div>
            {filteredActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                showDetails={showDetails}
                onExpand={() => setExpandedId(activity.id)}
                onClick={
                  onActivityClick ? () => onActivityClick(activity) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
