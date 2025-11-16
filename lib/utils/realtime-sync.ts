/**
 * Real-time Synchronization Utility
 *
 * Provides real-time data synchronization with:
 * - Conflict resolution strategies
 * - Change tracking and operational transformation
 * - Lock management
 * - Change history and undo/redo
 * - Multi-user collaboration support
 */

import { WebSocketClient, WebSocketMessage } from './websocket-client';

export type ConflictResolutionStrategy =
  | 'last-write-wins'
  | 'operational-transformation'
  | 'crdt'
  | 'lock-based'
  | 'manual';

export type OperationType = 'insert' | 'update' | 'delete' | 'move';

export interface Change {
  id: string;
  entityId: string;
  entityType: string;
  userId: string;
  operation: OperationType;
  path: string; // JSON path to changed field
  before: any;
  after: any;
  timestamp: Date | string;
  resolved: boolean;
  version: number;
  metadata?: Record<string, any>;
}

export interface Lock {
  entityId: string;
  entityType: string;
  lockedBy: string;
  lockedByName?: string;
  lockedAt: Date | string;
  expiresAt: Date | string;
  renewable?: boolean;
}

export interface SyncState {
  entityId: string;
  entityType: string;
  version: number;
  lastSyncedAt: Date | string;
  localChanges: Change[];
  remoteChanges: Change[];
  conflicts: Conflict[];
}

export interface Conflict {
  id: string;
  localChange: Change;
  remoteChange: Change;
  resolutionStrategy?: ConflictResolutionStrategy;
  resolved: boolean;
  resolution?: 'local' | 'remote' | 'merged';
  mergedValue?: any;
}

export interface RealtimeSyncConfig {
  wsClient: WebSocketClient;
  userId: string;
  username: string;
  conflictStrategy?: ConflictResolutionStrategy;
  autoResolveConflicts?: boolean;
  lockTimeout?: number; // in milliseconds
  syncInterval?: number; // in milliseconds
  maxHistorySize?: number;
  debug?: boolean;
}

/**
 * Real-time Synchronization Manager
 */
export class RealtimeSyncManager {
  private config: Required<RealtimeSyncConfig>;
  private wsClient: WebSocketClient;
  private syncStates: Map<string, SyncState> = new Map();
  private locks: Map<string, Lock> = new Map();
  private changeHistory: Map<string, Change[]> = new Map();
  private syncTimers: Map<string, NodeJS.Timeout> = new Map();
  private changeListeners: Map<string, Set<(change: Change) => void>> = new Map();
  private conflictListeners: Map<string, Set<(conflict: Conflict) => void>> = new Map();
  private lockListeners: Map<string, Set<(lock: Lock | null) => void>> = new Map();

  constructor(config: RealtimeSyncConfig) {
    this.config = {
      ...config,
      conflictStrategy: config.conflictStrategy || 'last-write-wins',
      autoResolveConflicts: config.autoResolveConflicts ?? true,
      lockTimeout: config.lockTimeout || 300000, // 5 minutes
      syncInterval: config.syncInterval || 5000, // 5 seconds
      maxHistorySize: config.maxHistorySize || 100,
      debug: config.debug || false,
    };

    this.wsClient = config.wsClient;
    this.setupMessageHandlers();
  }

  /**
   * Start syncing an entity
   */
  public async startSync(entityType: string, entityId: string): Promise<void> {
    const key = this.getEntityKey(entityType, entityId);

    // Initialize sync state
    if (!this.syncStates.has(key)) {
      this.syncStates.set(key, {
        entityId,
        entityType,
        version: 0,
        lastSyncedAt: new Date().toISOString(),
        localChanges: [],
        remoteChanges: [],
        conflicts: [],
      });
    }

    // Subscribe to entity updates
    await this.wsClient.subscribe(`${entityType}-${entityId}`);

    // Request initial sync
    await this.requestSync(entityType, entityId);

    // Start periodic sync
    this.startPeriodicSync(entityType, entityId);

    this.log('Started sync for:', key);
  }

  /**
   * Stop syncing an entity
   */
  public async stopSync(entityType: string, entityId: string): Promise<void> {
    const key = this.getEntityKey(entityType, entityId);

    // Unsubscribe from entity updates
    await this.wsClient.unsubscribe(`${entityType}-${entityId}`);

    // Stop periodic sync
    this.stopPeriodicSync(entityType, entityId);

    // Clean up state
    this.syncStates.delete(key);

    this.log('Stopped sync for:', key);
  }

  /**
   * Push a local change
   */
  public async pushChange(change: Omit<Change, 'id' | 'timestamp' | 'userId' | 'resolved' | 'version'>): Promise<Change> {
    const fullChange: Change = {
      ...change,
      id: this.generateChangeId(),
      timestamp: new Date().toISOString(),
      userId: this.config.userId,
      resolved: false,
      version: this.getNextVersion(change.entityType, change.entityId),
    };

    const key = this.getEntityKey(change.entityType, change.entityId);
    const state = this.syncStates.get(key);

    if (state) {
      state.localChanges.push(fullChange);
      state.version = fullChange.version;
    }

    // Add to history
    this.addToHistory(key, fullChange);

    // Broadcast change
    await this.wsClient.publish(`${change.entityType}-${change.entityId}`, {
      type: 'change',
      change: fullChange,
    });

    // Notify listeners
    this.notifyChangeListeners(key, fullChange);

    this.log('Pushed change:', fullChange);

    return fullChange;
  }

  /**
   * Acquire a lock on an entity
   */
  public async acquireLock(entityType: string, entityId: string): Promise<Lock | null> {
    const key = this.getEntityKey(entityType, entityId);
    const existingLock = this.locks.get(key);

    // Check if already locked by someone else
    if (existingLock && existingLock.lockedBy !== this.config.userId) {
      const expiresAt = new Date(existingLock.expiresAt);
      if (expiresAt > new Date()) {
        this.log('Entity already locked:', existingLock);
        return null;
      }
    }

    // Create new lock
    const lock: Lock = {
      entityId,
      entityType,
      lockedBy: this.config.userId,
      lockedByName: this.config.username,
      lockedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.config.lockTimeout).toISOString(),
      renewable: true,
    };

    this.locks.set(key, lock);

    // Broadcast lock
    await this.wsClient.publish('edit-locks', {
      type: 'lock-acquired',
      lock,
    });

    // Notify listeners
    this.notifyLockListeners(key, lock);

    // Auto-renew lock
    this.scheduleAutoRenew(lock);

    this.log('Lock acquired:', lock);

    return lock;
  }

  /**
   * Release a lock on an entity
   */
  public async releaseLock(entityType: string, entityId: string): Promise<void> {
    const key = this.getEntityKey(entityType, entityId);
    const lock = this.locks.get(key);

    if (!lock || lock.lockedBy !== this.config.userId) {
      this.log('Cannot release lock - not owned by user');
      return;
    }

    this.locks.delete(key);

    // Broadcast lock release
    await this.wsClient.publish('edit-locks', {
      type: 'lock-released',
      entityType,
      entityId,
      lockedBy: this.config.userId,
    });

    // Notify listeners
    this.notifyLockListeners(key, null);

    this.log('Lock released:', key);
  }

  /**
   * Check if entity is locked
   */
  public isLocked(entityType: string, entityId: string): boolean {
    const key = this.getEntityKey(entityType, entityId);
    const lock = this.locks.get(key);

    if (!lock) return false;

    // Check if lock expired
    const expiresAt = new Date(lock.expiresAt);
    if (expiresAt <= new Date()) {
      this.locks.delete(key);
      return false;
    }

    return lock.lockedBy !== this.config.userId;
  }

  /**
   * Get lock for entity
   */
  public getLock(entityType: string, entityId: string): Lock | null {
    const key = this.getEntityKey(entityType, entityId);
    return this.locks.get(key) || null;
  }

  /**
   * Resolve a conflict
   */
  public async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'remote' | 'merged',
    mergedValue?: any
  ): Promise<void> {
    // Find conflict
    let conflict: Conflict | undefined;
    let key: string | undefined;

    for (const [stateKey, state] of this.syncStates.entries()) {
      conflict = state.conflicts.find((c) => c.id === conflictId);
      if (conflict) {
        key = stateKey;
        break;
      }
    }

    if (!conflict || !key) {
      throw new Error('Conflict not found');
    }

    // Mark as resolved
    conflict.resolved = true;
    conflict.resolution = resolution;
    conflict.resolutionStrategy = this.config.conflictStrategy;

    if (resolution === 'merged') {
      conflict.mergedValue = mergedValue;
    }

    // Apply resolution
    const finalChange = this.applyResolution(conflict, resolution, mergedValue);

    // Push resolved change
    await this.pushChange({
      entityId: finalChange.entityId,
      entityType: finalChange.entityType,
      operation: finalChange.operation,
      path: finalChange.path,
      before: finalChange.before,
      after: finalChange.after,
      metadata: {
        ...finalChange.metadata,
        conflictResolution: true,
        conflictId,
        resolution,
      },
    });

    // Remove from conflicts
    const state = this.syncStates.get(key);
    if (state) {
      state.conflicts = state.conflicts.filter((c) => c.id !== conflictId);
    }

    this.log('Conflict resolved:', conflictId, resolution);
  }

  /**
   * Get change history for entity
   */
  public getChangeHistory(entityType: string, entityId: string): Change[] {
    const key = this.getEntityKey(entityType, entityId);
    return this.changeHistory.get(key) || [];
  }

  /**
   * Undo a change
   */
  public async undoChange(changeId: string): Promise<void> {
    // Find change in history
    let change: Change | undefined;
    let key: string | undefined;

    for (const [historyKey, history] of this.changeHistory.entries()) {
      change = history.find((c) => c.id === changeId);
      if (change) {
        key = historyKey;
        break;
      }
    }

    if (!change || !key) {
      throw new Error('Change not found');
    }

    // Create reverse change
    const reverseChange: Omit<Change, 'id' | 'timestamp' | 'userId' | 'resolved' | 'version'> = {
      entityId: change.entityId,
      entityType: change.entityType,
      operation: change.operation,
      path: change.path,
      before: change.after,
      after: change.before,
      metadata: {
        ...change.metadata,
        undo: true,
        undoOf: changeId,
      },
    };

    await this.pushChange(reverseChange);

    this.log('Change undone:', changeId);
  }

  /**
   * Get sync state for entity
   */
  public getSyncState(entityType: string, entityId: string): SyncState | null {
    const key = this.getEntityKey(entityType, entityId);
    return this.syncStates.get(key) || null;
  }

  /**
   * Subscribe to changes
   */
  public onChangeDetected(
    entityType: string,
    entityId: string,
    callback: (change: Change) => void
  ): () => void {
    const key = this.getEntityKey(entityType, entityId);

    if (!this.changeListeners.has(key)) {
      this.changeListeners.set(key, new Set());
    }

    this.changeListeners.get(key)!.add(callback);

    return () => {
      this.changeListeners.get(key)?.delete(callback);
    };
  }

  /**
   * Subscribe to conflicts
   */
  public onConflictDetected(
    entityType: string,
    entityId: string,
    callback: (conflict: Conflict) => void
  ): () => void {
    const key = this.getEntityKey(entityType, entityId);

    if (!this.conflictListeners.has(key)) {
      this.conflictListeners.set(key, new Set());
    }

    this.conflictListeners.get(key)!.add(callback);

    return () => {
      this.conflictListeners.get(key)?.delete(callback);
    };
  }

  /**
   * Subscribe to lock changes
   */
  public onLockChanged(
    entityType: string,
    entityId: string,
    callback: (lock: Lock | null) => void
  ): () => void {
    const key = this.getEntityKey(entityType, entityId);

    if (!this.lockListeners.has(key)) {
      this.lockListeners.set(key, new Set());
    }

    this.lockListeners.get(key)!.add(callback);

    return () => {
      this.lockListeners.get(key)?.delete(callback);
    };
  }

  /**
   * Setup WebSocket message handlers
   */
  private setupMessageHandlers(): void {
    this.wsClient.on('message', (message: WebSocketMessage) => {
      if (message.type === 'sync') {
        this.handleSyncMessage(message);
      } else if (message.type === 'update') {
        this.handleUpdateMessage(message);
      } else if (message.type === 'lock') {
        this.handleLockMessage(message);
      }
    });
  }

  /**
   * Handle sync message
   */
  private handleSyncMessage(message: WebSocketMessage): void {
    const { entityType, entityId, changes, version } = message.payload;
    const key = this.getEntityKey(entityType, entityId);
    const state = this.syncStates.get(key);

    if (!state) return;

    // Update state
    state.version = version;
    state.lastSyncedAt = new Date().toISOString();
    state.remoteChanges = changes || [];

    // Detect conflicts
    this.detectConflicts(key);

    this.log('Sync message received:', message);
  }

  /**
   * Handle update message (real-time change)
   */
  private handleUpdateMessage(message: WebSocketMessage): void {
    const { change } = message.payload;

    if (!change || change.userId === this.config.userId) {
      return; // Ignore own changes
    }

    const key = this.getEntityKey(change.entityType, change.entityId);
    const state = this.syncStates.get(key);

    if (state) {
      state.remoteChanges.push(change);
      this.addToHistory(key, change);
      this.detectConflicts(key);
    }

    // Notify listeners
    this.notifyChangeListeners(key, change);

    this.log('Update message received:', change);
  }

  /**
   * Handle lock message
   */
  private handleLockMessage(message: WebSocketMessage): void {
    const { type, lock, entityType, entityId } = message.payload;
    const key = this.getEntityKey(entityType, entityId);

    if (type === 'lock-acquired') {
      this.locks.set(key, lock);
      this.notifyLockListeners(key, lock);
    } else if (type === 'lock-released') {
      this.locks.delete(key);
      this.notifyLockListeners(key, null);
    }

    this.log('Lock message received:', message);
  }

  /**
   * Request sync from server
   */
  private async requestSync(entityType: string, entityId: string): Promise<void> {
    await this.wsClient.send({
      type: 'sync',
      channel: `${entityType}-${entityId}`,
      payload: {
        entityType,
        entityId,
        requestSync: true,
      },
    });
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(entityType: string, entityId: string): void {
    const key = this.getEntityKey(entityType, entityId);

    this.stopPeriodicSync(entityType, entityId);

    const timer = setInterval(() => {
      this.requestSync(entityType, entityId);
    }, this.config.syncInterval);

    this.syncTimers.set(key, timer);
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(entityType: string, entityId: string): void {
    const key = this.getEntityKey(entityType, entityId);
    const timer = this.syncTimers.get(key);

    if (timer) {
      clearInterval(timer);
      this.syncTimers.delete(key);
    }
  }

  /**
   * Detect conflicts between local and remote changes
   */
  private detectConflicts(key: string): void {
    const state = this.syncStates.get(key);
    if (!state) return;

    const newConflicts: Conflict[] = [];

    // Compare local and remote changes
    for (const localChange of state.localChanges) {
      for (const remoteChange of state.remoteChanges) {
        if (this.changesConflict(localChange, remoteChange)) {
          const conflict: Conflict = {
            id: this.generateConflictId(),
            localChange,
            remoteChange,
            resolutionStrategy: this.config.conflictStrategy,
            resolved: false,
          };

          newConflicts.push(conflict);

          // Auto-resolve if enabled
          if (this.config.autoResolveConflicts) {
            this.autoResolveConflict(conflict);
          } else {
            // Notify listeners
            this.notifyConflictListeners(key, conflict);
          }
        }
      }
    }

    state.conflicts.push(...newConflicts);

    this.log('Detected conflicts:', newConflicts.length);
  }

  /**
   * Check if two changes conflict
   */
  private changesConflict(change1: Change, change2: Change): boolean {
    // Same path and overlapping time
    return (
      change1.path === change2.path &&
      Math.abs(new Date(change1.timestamp).getTime() - new Date(change2.timestamp).getTime()) < 5000
    );
  }

  /**
   * Auto-resolve conflict based on strategy
   */
  private autoResolveConflict(conflict: Conflict): void {
    switch (this.config.conflictStrategy) {
      case 'last-write-wins':
        const localTime = new Date(conflict.localChange.timestamp).getTime();
        const remoteTime = new Date(conflict.remoteChange.timestamp).getTime();
        conflict.resolution = localTime > remoteTime ? 'local' : 'remote';
        break;

      case 'operational-transformation':
        // Simplified OT - in real implementation, this would be more complex
        conflict.resolution = 'merged';
        conflict.mergedValue = this.mergeChanges(conflict.localChange, conflict.remoteChange);
        break;

      case 'lock-based':
        // If we have the lock, prefer local, otherwise remote
        const key = this.getEntityKey(conflict.localChange.entityType, conflict.localChange.entityId);
        const lock = this.locks.get(key);
        conflict.resolution = lock?.lockedBy === this.config.userId ? 'local' : 'remote';
        break;

      default:
        conflict.resolution = 'remote'; // Default to remote
    }

    conflict.resolved = true;
  }

  /**
   * Apply conflict resolution
   */
  private applyResolution(conflict: Conflict, resolution: string, mergedValue?: any): Change {
    if (resolution === 'local') {
      return conflict.localChange;
    } else if (resolution === 'remote') {
      return conflict.remoteChange;
    } else {
      // Merged
      return {
        ...conflict.localChange,
        after: mergedValue || conflict.mergedValue,
      };
    }
  }

  /**
   * Merge two changes (simple implementation)
   */
  private mergeChanges(local: Change, remote: Change): any {
    // This is a simplified merge - in real OT, this would be much more sophisticated
    if (typeof local.after === 'object' && typeof remote.after === 'object') {
      return { ...remote.after, ...local.after };
    }
    return local.after;
  }

  /**
   * Schedule auto-renew for lock
   */
  private scheduleAutoRenew(lock: Lock): void {
    if (!lock.renewable) return;

    const renewTime = this.config.lockTimeout * 0.8; // Renew at 80% of timeout

    setTimeout(async () => {
      const key = this.getEntityKey(lock.entityType, lock.entityId);
      const currentLock = this.locks.get(key);

      if (currentLock?.lockedBy === this.config.userId) {
        await this.acquireLock(lock.entityType, lock.entityId);
      }
    }, renewTime);
  }

  /**
   * Add change to history
   */
  private addToHistory(key: string, change: Change): void {
    if (!this.changeHistory.has(key)) {
      this.changeHistory.set(key, []);
    }

    const history = this.changeHistory.get(key)!;
    history.push(change);

    // Limit history size
    if (history.length > this.config.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Notify change listeners
   */
  private notifyChangeListeners(key: string, change: Change): void {
    const listeners = this.changeListeners.get(key);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(change);
        } catch (error) {
          this.log('Error in change listener:', error);
        }
      });
    }
  }

  /**
   * Notify conflict listeners
   */
  private notifyConflictListeners(key: string, conflict: Conflict): void {
    const listeners = this.conflictListeners.get(key);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(conflict);
        } catch (error) {
          this.log('Error in conflict listener:', error);
        }
      });
    }
  }

  /**
   * Notify lock listeners
   */
  private notifyLockListeners(key: string, lock: Lock | null): void {
    const listeners = this.lockListeners.get(key);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(lock);
        } catch (error) {
          this.log('Error in lock listener:', error);
        }
      });
    }
  }

  /**
   * Get next version number
   */
  private getNextVersion(entityType: string, entityId: string): number {
    const key = this.getEntityKey(entityType, entityId);
    const state = this.syncStates.get(key);
    return state ? state.version + 1 : 1;
  }

  /**
   * Get entity key
   */
  private getEntityKey(entityType: string, entityId: string): string {
    return `${entityType}:${entityId}`;
  }

  /**
   * Generate unique change ID
   */
  private generateChangeId(): string {
    return `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique conflict ID
   */
  private generateConflictId(): string {
    return `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[RealtimeSyncManager]', ...args);
    }
  }
}

/**
 * Create realtime sync manager
 */
export function createRealtimeSyncManager(config: RealtimeSyncConfig): RealtimeSyncManager {
  return new RealtimeSyncManager(config);
}
