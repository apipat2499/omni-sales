/**
 * CollaborationPanel Component
 *
 * Comprehensive collaboration panel with:
 * - Active collaborators list
 * - Lock status indicator
 * - Comments and notes
 * - Change history
 * - Conflict resolution
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Lock,
  Unlock,
  MessageSquare,
  History,
  AlertTriangle,
  X,
  Send,
  Clock,
  Eye,
  Edit3,
  Check,
  XCircle,
} from 'lucide-react';
import { PresenceData } from '@/lib/hooks/usePresence';
import { Change, Conflict, Lock as LockType } from '@/lib/utils/realtime-sync';

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  text: string;
  timestamp: Date | string;
  resolved?: boolean;
}

export interface CollaborationPanelProps {
  // Presence
  activeUsers: PresenceData[];
  currentUserId: string;

  // Lock
  lock: LockType | null;
  isLocked: boolean;
  lockedByMe: boolean;
  onAcquireLock?: () => Promise<void>;
  onReleaseLock?: () => Promise<void>;

  // Comments
  comments?: Comment[];
  onAddComment?: (text: string) => Promise<void>;
  onResolveComment?: (commentId: string) => Promise<void>;

  // Changes
  changeHistory?: Change[];
  onUndoChange?: (changeId: string) => Promise<void>;

  // Conflicts
  conflicts?: Conflict[];
  onResolveConflict?: (conflictId: string, resolution: 'local' | 'remote' | 'merged') => Promise<void>;

  // UI
  defaultTab?: 'collaborators' | 'comments' | 'history' | 'conflicts';
  className?: string;
}

/**
 * Tab button component
 */
const TabButton: React.FC<{
  active: boolean;
  icon: React.ElementType;
  label: string;
  count?: number;
  alert?: boolean;
  onClick: () => void;
}> = ({ active, icon: Icon, label, count, alert, onClick }) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span
        className={`px-1.5 py-0.5 text-xs rounded-full ${
          alert ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

/**
 * Lock status component
 */
const LockStatus: React.FC<{
  lock: LockType | null;
  isLocked: boolean;
  lockedByMe: boolean;
  onAcquireLock?: () => Promise<void>;
  onReleaseLock?: () => Promise<void>;
}> = ({ lock, isLocked, lockedByMe, onAcquireLock, onReleaseLock }) => {
  const [loading, setLoading] = useState(false);

  const handleLockAction = async () => {
    setLoading(true);
    try {
      if (lockedByMe) {
        await onReleaseLock?.();
      } else if (!isLocked) {
        await onAcquireLock?.();
      }
    } catch (error) {
      console.error('Lock action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!lock) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Unlock className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-900">Available for editing</span>
        </div>
        {onAcquireLock && (
          <button
            onClick={handleLockAction}
            disabled={loading}
            className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Acquiring...' : 'Start Editing'}
          </button>
        )}
      </div>
    );
  }

  if (lockedByMe) {
    return (
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-900">You are editing</span>
        </div>
        {onReleaseLock && (
          <button
            onClick={handleLockAction}
            disabled={loading}
            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            {loading ? 'Releasing...' : 'Done Editing'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-900">
            Locked by {lock.lockedByName || 'another user'}
          </span>
        </div>
        <div className="text-xs text-yellow-700 mt-1">
          Editing in progress - read-only mode
        </div>
      </div>
    </div>
  );
};

/**
 * Collaborators tab
 */
const CollaboratorsTab: React.FC<{
  users: PresenceData[];
  currentUserId: string;
}> = ({ users, currentUserId }) => (
  <div className="space-y-2">
    {users.map((user) => (
      <div key={user.userId} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
        {/* Avatar */}
        <div className="relative">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.username}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
              user.status === 'online'
                ? 'bg-green-500'
                : user.status === 'away'
                ? 'bg-yellow-500'
                : 'bg-gray-400'
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">
            {user.username}
            {user.userId === currentUserId && (
              <span className="text-xs text-gray-500 ml-1">(You)</span>
            )}
          </div>
          {user.activity && (
            <div className="text-xs text-gray-600 truncate">{user.activity}</div>
          )}
        </div>

        {/* Status */}
        <div className="text-xs text-gray-500">
          {user.status === 'online' ? (
            <Eye className="w-4 h-4 text-green-600" />
          ) : (
            <Clock className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
    ))}
  </div>
);

/**
 * Comments tab
 */
const CommentsTab: React.FC<{
  comments: Comment[];
  onAddComment?: (text: string) => Promise<void>;
  onResolveComment?: (commentId: string) => Promise<void>;
}> = ({ comments, onAddComment, onResolveComment }) => {
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !onAddComment) return;

    setSending(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add comment form */}
      {onAddComment && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !newComment.trim()}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg border ${
                comment.resolved
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-white border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.text}</p>
                </div>

                {!comment.resolved && onResolveComment && (
                  <button
                    onClick={() => onResolveComment(comment.id)}
                    className="flex-shrink-0 p-1 text-green-600 hover:bg-green-50 rounded"
                    title="Mark as resolved"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * History tab
 */
const HistoryTab: React.FC<{
  changes: Change[];
  onUndoChange?: (changeId: string) => Promise<void>;
}> = ({ changes, onUndoChange }) => {
  const [undoing, setUndoing] = useState<string | null>(null);

  const handleUndo = async (changeId: string) => {
    if (!onUndoChange) return;

    setUndoing(changeId);
    try {
      await onUndoChange(changeId);
    } catch (error) {
      console.error('Failed to undo change:', error);
    } finally {
      setUndoing(null);
    }
  };

  return (
    <div className="space-y-2">
      {changes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No change history</p>
        </div>
      ) : (
        changes.map((change) => (
          <div
            key={change.id}
            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {change.operation} - {change.path}
                </div>
                <div className="text-xs text-gray-600">
                  Version {change.version} •{' '}
                  {new Date(change.timestamp).toLocaleString()}
                </div>
              </div>

              {onUndoChange && (
                <button
                  onClick={() => handleUndo(change.id)}
                  disabled={undoing === change.id}
                  className="flex-shrink-0 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 disabled:opacity-50"
                >
                  {undoing === change.id ? 'Undoing...' : 'Undo'}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

/**
 * Conflicts tab
 */
const ConflictsTab: React.FC<{
  conflicts: Conflict[];
  onResolveConflict?: (conflictId: string, resolution: 'local' | 'remote' | 'merged') => Promise<void>;
}> = ({ conflicts, onResolveConflict }) => {
  const [resolving, setResolving] = useState<string | null>(null);

  const handleResolve = async (conflictId: string, resolution: 'local' | 'remote') => {
    if (!onResolveConflict) return;

    setResolving(conflictId);
    try {
      await onResolveConflict(conflictId, resolution);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="space-y-3">
      {conflicts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Check className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No conflicts</p>
        </div>
      ) : (
        conflicts.map((conflict) => (
          <div
            key={conflict.id}
            className="p-3 border-2 border-red-200 bg-red-50 rounded-lg"
          >
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-red-900 mb-1">
                  Conflict in {conflict.localChange.path}
                </div>
                <div className="text-xs text-red-700">
                  Your changes conflict with remote changes
                </div>
              </div>
            </div>

            {/* Local vs Remote */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="text-xs font-medium text-gray-700 mb-1">
                  Your Version
                </div>
                <div className="text-xs text-gray-900 font-mono">
                  {String(conflict.localChange.after)}
                </div>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="text-xs font-medium text-gray-700 mb-1">
                  Remote Version
                </div>
                <div className="text-xs text-gray-900 font-mono">
                  {String(conflict.remoteChange.after)}
                </div>
              </div>
            </div>

            {/* Resolution buttons */}
            {onResolveConflict && !conflict.resolved && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleResolve(conflict.id, 'local')}
                  disabled={resolving === conflict.id}
                  className="flex-1 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50"
                >
                  Keep Mine
                </button>
                <button
                  onClick={() => handleResolve(conflict.id, 'remote')}
                  disabled={resolving === conflict.id}
                  className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Use Remote
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

/**
 * Main CollaborationPanel component
 */
export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  activeUsers,
  currentUserId,
  lock,
  isLocked,
  lockedByMe,
  onAcquireLock,
  onReleaseLock,
  comments = [],
  onAddComment,
  onResolveComment,
  changeHistory = [],
  onUndoChange,
  conflicts = [],
  onResolveConflict,
  defaultTab = 'collaborators',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const unresolvedComments = comments.filter((c) => !c.resolved).length;
  const unresolvedConflicts = conflicts.filter((c) => !c.resolved).length;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Lock status */}
      <div className="p-4 border-b border-gray-200">
        <LockStatus
          lock={lock}
          isLocked={isLocked}
          lockedByMe={lockedByMe}
          onAcquireLock={onAcquireLock}
          onReleaseLock={onReleaseLock}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <TabButton
          active={activeTab === 'collaborators'}
          icon={Users}
          label="Collaborators"
          count={activeUsers.length}
          onClick={() => setActiveTab('collaborators')}
        />
        <TabButton
          active={activeTab === 'comments'}
          icon={MessageSquare}
          label="Comments"
          count={unresolvedComments}
          onClick={() => setActiveTab('comments')}
        />
        <TabButton
          active={activeTab === 'history'}
          icon={History}
          label="History"
          count={changeHistory.length}
          onClick={() => setActiveTab('history')}
        />
        <TabButton
          active={activeTab === 'conflicts'}
          icon={AlertTriangle}
          label="Conflicts"
          count={unresolvedConflicts}
          alert={unresolvedConflicts > 0}
          onClick={() => setActiveTab('conflicts')}
        />
      </div>

      {/* Tab content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'collaborators' && (
          <CollaboratorsTab users={activeUsers} currentUserId={currentUserId} />
        )}
        {activeTab === 'comments' && (
          <CommentsTab
            comments={comments}
            onAddComment={onAddComment}
            onResolveComment={onResolveComment}
          />
        )}
        {activeTab === 'history' && (
          <HistoryTab changes={changeHistory} onUndoChange={onUndoChange} />
        )}
        {activeTab === 'conflicts' && (
          <ConflictsTab conflicts={conflicts} onResolveConflict={onResolveConflict} />
        )}
      </div>
    </div>
  );
};

export default CollaborationPanel;
