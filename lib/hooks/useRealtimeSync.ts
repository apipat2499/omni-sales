/**
 * useRealtimeSync Hook
 *
 * React hook for real-time data synchronization with:
 * - Change tracking
 * - Conflict detection and resolution
 * - Lock management
 * - Change history
 * - Undo/redo support
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient } from '../utils/websocket-client';
import {
  RealtimeSyncManager,
  createRealtimeSyncManager,
  Change,
  Conflict,
  Lock,
  SyncState,
  ConflictResolutionStrategy,
} from '../utils/realtime-sync';

export interface UseRealtimeSyncOptions {
  wsClient: WebSocketClient;
  userId: string;
  username: string;
  entityType: string;
  entityId: string;
  conflictStrategy?: ConflictResolutionStrategy;
  autoResolveConflicts?: boolean;
  lockTimeout?: number;
  syncInterval?: number;
  maxHistorySize?: number;
  debug?: boolean;
  onChangeDetected?: (change: Change) => void;
  onConflictDetected?: (conflict: Conflict) => void;
  onLockChanged?: (lock: Lock | null) => void;
}

export interface UseRealtimeSyncReturn {
  // Sync state
  syncState: SyncState | null;
  syncing: boolean;
  version: number;
  lastSyncedAt: Date | null;

  // Changes
  localChanges: Change[];
  remoteChanges: Change[];
  conflicts: Conflict[];
  changeHistory: Change[];

  // Lock
  lock: Lock | null;
  isLocked: boolean;
  lockedByMe: boolean;

  // Methods
  startSync: () => Promise<void>;
  stopSync: () => Promise<void>;
  pushChange: (change: Omit<Change, 'id' | 'timestamp' | 'userId' | 'resolved' | 'version'>) => Promise<Change>;
  acquireLock: () => Promise<Lock | null>;
  releaseLock: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merged', mergedValue?: any) => Promise<void>;
  undoChange: (changeId: string) => Promise<void>;
}

/**
 * Hook for real-time data synchronization
 */
export function useRealtimeSync(options: UseRealtimeSyncOptions): UseRealtimeSyncReturn {
  const {
    wsClient,
    userId,
    username,
    entityType,
    entityId,
    conflictStrategy = 'last-write-wins',
    autoResolveConflicts = true,
    lockTimeout = 300000,
    syncInterval = 5000,
    maxHistorySize = 100,
    debug = false,
    onChangeDetected,
    onConflictDetected,
    onLockChanged,
  } = options;

  const syncManagerRef = useRef<RealtimeSyncManager | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [lock, setLock] = useState<Lock | null>(null);
  const [changeHistory, setChangeHistory] = useState<Change[]>([]);

  // Initialize sync manager
  useEffect(() => {
    if (!syncManagerRef.current) {
      syncManagerRef.current = createRealtimeSyncManager({
        wsClient,
        userId,
        username,
        conflictStrategy,
        autoResolveConflicts,
        lockTimeout,
        syncInterval,
        maxHistorySize,
        debug,
      });
    }

    return () => {
      if (syncManagerRef.current) {
        syncManagerRef.current.stopSync(entityType, entityId);
      }
    };
  }, [wsClient, userId, username, entityType, entityId]);

  // Subscribe to changes
  useEffect(() => {
    const manager = syncManagerRef.current;
    if (!manager) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to change events
    unsubscribers.push(
      manager.onChangeDetected(entityType, entityId, (change) => {
        updateSyncState();
        if (onChangeDetected) {
          onChangeDetected(change);
        }
      })
    );

    // Subscribe to conflict events
    unsubscribers.push(
      manager.onConflictDetected(entityType, entityId, (conflict) => {
        updateSyncState();
        if (onConflictDetected) {
          onConflictDetected(conflict);
        }
      })
    );

    // Subscribe to lock events
    unsubscribers.push(
      manager.onLockChanged(entityType, entityId, (newLock) => {
        setLock(newLock);
        if (onLockChanged) {
          onLockChanged(newLock);
        }
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [entityType, entityId, onChangeDetected, onConflictDetected, onLockChanged]);

  // Update sync state periodically
  const updateSyncState = useCallback(() => {
    const manager = syncManagerRef.current;
    if (!manager) return;

    const state = manager.getSyncState(entityType, entityId);
    setSyncState(state);

    const history = manager.getChangeHistory(entityType, entityId);
    setChangeHistory(history);

    const currentLock = manager.getLock(entityType, entityId);
    setLock(currentLock);
  }, [entityType, entityId]);

  useEffect(() => {
    const interval = setInterval(updateSyncState, 1000);
    return () => clearInterval(interval);
  }, [updateSyncState]);

  // Start sync
  const startSync = useCallback(async () => {
    const manager = syncManagerRef.current;
    if (!manager) {
      throw new Error('Sync manager not initialized');
    }

    setSyncing(true);

    try {
      await manager.startSync(entityType, entityId);
      updateSyncState();
    } catch (error) {
      console.error('Failed to start sync:', error);
      setSyncing(false);
      throw error;
    }
  }, [entityType, entityId, updateSyncState]);

  // Stop sync
  const stopSync = useCallback(async () => {
    const manager = syncManagerRef.current;
    if (!manager) return;

    try {
      await manager.stopSync(entityType, entityId);
      setSyncing(false);
    } catch (error) {
      console.error('Failed to stop sync:', error);
      throw error;
    }
  }, [entityType, entityId]);

  // Push change
  const pushChange = useCallback(
    async (change: Omit<Change, 'id' | 'timestamp' | 'userId' | 'resolved' | 'version'>) => {
      const manager = syncManagerRef.current;
      if (!manager) {
        throw new Error('Sync manager not initialized');
      }

      const fullChange = await manager.pushChange(change);
      updateSyncState();
      return fullChange;
    },
    [updateSyncState]
  );

  // Acquire lock
  const acquireLock = useCallback(async () => {
    const manager = syncManagerRef.current;
    if (!manager) {
      throw new Error('Sync manager not initialized');
    }

    const newLock = await manager.acquireLock(entityType, entityId);
    setLock(newLock);
    return newLock;
  }, [entityType, entityId]);

  // Release lock
  const releaseLock = useCallback(async () => {
    const manager = syncManagerRef.current;
    if (!manager) return;

    await manager.releaseLock(entityType, entityId);
    setLock(null);
  }, [entityType, entityId]);

  // Resolve conflict
  const resolveConflict = useCallback(
    async (conflictId: string, resolution: 'local' | 'remote' | 'merged', mergedValue?: any) => {
      const manager = syncManagerRef.current;
      if (!manager) {
        throw new Error('Sync manager not initialized');
      }

      await manager.resolveConflict(conflictId, resolution, mergedValue);
      updateSyncState();
    },
    [updateSyncState]
  );

  // Undo change
  const undoChange = useCallback(
    async (changeId: string) => {
      const manager = syncManagerRef.current;
      if (!manager) {
        throw new Error('Sync manager not initialized');
      }

      await manager.undoChange(changeId);
      updateSyncState();
    },
    [updateSyncState]
  );

  return {
    // Sync state
    syncState,
    syncing,
    version: syncState?.version || 0,
    lastSyncedAt: syncState?.lastSyncedAt ? new Date(syncState.lastSyncedAt) : null,

    // Changes
    localChanges: syncState?.localChanges || [],
    remoteChanges: syncState?.remoteChanges || [],
    conflicts: syncState?.conflicts || [],
    changeHistory,

    // Lock
    lock,
    isLocked: !!lock && lock.lockedBy !== userId,
    lockedByMe: !!lock && lock.lockedBy === userId,

    // Methods
    startSync,
    stopSync,
    pushChange,
    acquireLock,
    releaseLock,
    resolveConflict,
    undoChange,
  };
}

/**
 * Hook for simple entity sync without advanced features
 */
export function useEntitySync(
  wsClient: WebSocketClient,
  userId: string,
  username: string,
  entityType: string,
  entityId: string
): {
  syncing: boolean;
  startSync: () => Promise<void>;
  stopSync: () => Promise<void>;
  onChange: (callback: (change: Change) => void) => () => void;
} {
  const syncManagerRef = useRef<RealtimeSyncManager | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!syncManagerRef.current) {
      syncManagerRef.current = createRealtimeSyncManager({
        wsClient,
        userId,
        username,
      });
    }

    return () => {
      if (syncManagerRef.current) {
        syncManagerRef.current.stopSync(entityType, entityId);
      }
    };
  }, [wsClient, userId, username, entityType, entityId]);

  const startSync = useCallback(async () => {
    const manager = syncManagerRef.current;
    if (!manager) return;

    setSyncing(true);
    await manager.startSync(entityType, entityId);
  }, [entityType, entityId]);

  const stopSync = useCallback(async () => {
    const manager = syncManagerRef.current;
    if (!manager) return;

    await manager.stopSync(entityType, entityId);
    setSyncing(false);
  }, [entityType, entityId]);

  const onChange = useCallback(
    (callback: (change: Change) => void) => {
      const manager = syncManagerRef.current;
      if (!manager) return () => {};

      return manager.onChangeDetected(entityType, entityId, callback);
    },
    [entityType, entityId]
  );

  return {
    syncing,
    startSync,
    stopSync,
    onChange,
  };
}

/**
 * Hook for lock management only
 */
export function useLock(
  wsClient: WebSocketClient,
  userId: string,
  username: string,
  entityType: string,
  entityId: string
): {
  lock: Lock | null;
  isLocked: boolean;
  lockedByMe: boolean;
  acquireLock: () => Promise<Lock | null>;
  releaseLock: () => Promise<void>;
} {
  const syncManagerRef = useRef<RealtimeSyncManager | null>(null);
  const [lock, setLock] = useState<Lock | null>(null);

  useEffect(() => {
    if (!syncManagerRef.current) {
      syncManagerRef.current = createRealtimeSyncManager({
        wsClient,
        userId,
        username,
      });
    }

    const manager = syncManagerRef.current;

    const unsubscribe = manager.onLockChanged(entityType, entityId, (newLock) => {
      setLock(newLock);
    });

    // Check initial lock state
    const currentLock = manager.getLock(entityType, entityId);
    setLock(currentLock);

    return () => {
      unsubscribe();
    };
  }, [wsClient, userId, username, entityType, entityId]);

  const acquireLock = useCallback(async () => {
    const manager = syncManagerRef.current;
    if (!manager) return null;

    const newLock = await manager.acquireLock(entityType, entityId);
    setLock(newLock);
    return newLock;
  }, [entityType, entityId]);

  const releaseLock = useCallback(async () => {
    const manager = syncManagerRef.current;
    if (!manager) return;

    await manager.releaseLock(entityType, entityId);
    setLock(null);
  }, [entityType, entityId]);

  return {
    lock,
    isLocked: !!lock && lock.lockedBy !== userId,
    lockedByMe: !!lock && lock.lockedBy === userId,
    acquireLock,
    releaseLock,
  };
}
