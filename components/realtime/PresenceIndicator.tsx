/**
 * PresenceIndicator Component
 *
 * Displays online users, their status, and activity
 * Features:
 * - Online/away/offline status indicators
 * - User avatars
 * - Activity descriptions
 * - Current location
 * - Mouse cursor tracking (optional)
 */

'use client';

import React, { useMemo } from 'react';
import { PresenceData } from '@/lib/hooks/usePresence';
import { Users, Circle, MapPin, Activity } from 'lucide-react';

export interface PresenceIndicatorProps {
  users: PresenceData[];
  currentUserId?: string;
  showLocation?: boolean;
  showActivity?: boolean;
  showMouseCursor?: boolean;
  maxDisplay?: number;
  compact?: boolean;
  className?: string;
}

/**
 * Status indicator component
 */
const StatusIndicator: React.FC<{
  status: 'online' | 'away' | 'offline';
  size?: 'sm' | 'md' | 'lg';
}> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const colorClasses = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[status]} rounded-full border-2 border-white`}
      title={status.charAt(0).toUpperCase() + status.slice(1)}
    />
  );
};

/**
 * User avatar with status
 */
const UserAvatar: React.FC<{
  user: PresenceData;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}> = ({ user, size = 'md', showStatus = true }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = user.username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative inline-block">
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.username}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold`}
        >
          {initials}
        </div>
      )}

      {showStatus && (
        <div className="absolute -bottom-0.5 -right-0.5">
          <StatusIndicator status={user.status} size="sm" />
        </div>
      )}
    </div>
  );
};

/**
 * Compact user list
 */
const CompactUserList: React.FC<{
  users: PresenceData[];
  maxDisplay: number;
}> = ({ users, maxDisplay }) => {
  const displayUsers = users.slice(0, maxDisplay);
  const remaining = users.length - maxDisplay;

  return (
    <div className="flex items-center gap-1">
      <Users className="w-4 h-4 text-gray-500" />
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <div key={user.userId} className="inline-block" title={user.username}>
            <UserAvatar user={user} size="sm" />
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <span className="text-xs text-gray-600 ml-1">+{remaining}</span>
      )}
    </div>
  );
};

/**
 * Detailed user card
 */
const UserCard: React.FC<{
  user: PresenceData;
  showLocation: boolean;
  showActivity: boolean;
  isCurrent: boolean;
}> = ({ user, showLocation, showActivity, isCurrent }) => {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <UserAvatar user={user} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {user.username}
            {isCurrent && <span className="text-xs text-gray-500 ml-1">(You)</span>}
          </h4>
        </div>

        {showLocation && user.currentLocation && (
          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">
              {user.currentLocation.page}
              {user.currentLocation.section && ` / ${user.currentLocation.section}`}
            </span>
          </div>
        )}

        {showActivity && user.activity && (
          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
            <Activity className="w-3 h-3" />
            <span className="truncate">{user.activity}</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <Circle
            className={`w-2 h-2 fill-current ${
              user.status === 'online'
                ? 'text-green-500'
                : user.status === 'away'
                ? 'text-yellow-500'
                : 'text-gray-400'
            }`}
          />
          <span>
            {user.status === 'online'
              ? 'Active now'
              : user.status === 'away'
              ? 'Away'
              : `Last seen ${formatLastSeen(user.lastSeen)}`}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Format last seen time
 */
function formatLastSeen(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Main PresenceIndicator component
 */
export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  users,
  currentUserId,
  showLocation = true,
  showActivity = true,
  showMouseCursor = false,
  maxDisplay = 10,
  compact = false,
  className = '',
}) => {
  // Sort users by status and activity
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      // Current user first
      if (a.userId === currentUserId) return -1;
      if (b.userId === currentUserId) return 1;

      // Then by status: online > away > offline
      const statusOrder = { online: 0, away: 1, offline: 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      // Then by last seen
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    });
  }, [users, currentUserId]);

  // Filter active users (online or away)
  const activeUsers = sortedUsers.filter((u) => u.status !== 'offline');

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      online: users.filter((u) => u.status === 'online').length,
      away: users.filter((u) => u.status === 'away').length,
      offline: users.filter((u) => u.status === 'offline').length,
    };
  }, [users]);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <CompactUserList users={activeUsers} maxDisplay={maxDisplay} />
        {stats.online > 0 && (
          <span className="text-xs text-gray-600">{stats.online} online</span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-900">
              Active Users ({activeUsers.length})
            </h3>
          </div>

          {/* Status summary */}
          <div className="flex items-center gap-3 text-xs">
            {stats.online > 0 && (
              <div className="flex items-center gap-1">
                <Circle className="w-2 h-2 fill-current text-green-500" />
                <span className="text-gray-600">{stats.online}</span>
              </div>
            )}
            {stats.away > 0 && (
              <div className="flex items-center gap-1">
                <Circle className="w-2 h-2 fill-current text-yellow-500" />
                <span className="text-gray-600">{stats.away}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User list */}
      <div className="max-h-96 overflow-y-auto">
        {activeUsers.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active users</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activeUsers.slice(0, maxDisplay).map((user) => (
              <UserCard
                key={user.userId}
                user={user}
                showLocation={showLocation}
                showActivity={showActivity}
                isCurrent={user.userId === currentUserId}
              />
            ))}
          </div>
        )}

        {activeUsers.length > maxDisplay && (
          <div className="px-4 py-2 text-center text-xs text-gray-500 bg-gray-50">
            +{activeUsers.length - maxDisplay} more users
          </div>
        )}
      </div>

      {/* Mouse cursors overlay (optional) */}
      {showMouseCursor && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {users.map(
            (user) =>
              user.mousePosition &&
              user.userId !== currentUserId && (
                <div
                  key={user.userId}
                  className="absolute transition-all duration-100"
                  style={{
                    left: user.mousePosition.x,
                    top: user.mousePosition.y,
                  }}
                >
                  <div className="flex items-center gap-1">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="drop-shadow-md"
                    >
                      <path
                        d="M0 0L16 6L6 8L4 16L0 0Z"
                        fill={`hsl(${hashCode(user.userId) % 360}, 70%, 60%)`}
                      />
                    </svg>
                    <span className="text-xs font-medium text-white bg-black bg-opacity-75 px-2 py-1 rounded">
                      {user.username}
                    </span>
                  </div>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Simple hash function for consistent colors
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export default PresenceIndicator;
