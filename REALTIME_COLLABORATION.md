# Real-time Collaboration and WebSocket System

## Overview

The omni-sales application now includes a comprehensive real-time collaboration system that enables live updates, multi-user editing, presence tracking, and activity monitoring. This system is built on WebSocket technology and provides a robust, scalable solution for real-time features.

## Architecture

### Core Components

#### 1. WebSocket Client (`/lib/utils/websocket-client.ts`)
- **Purpose**: Manages WebSocket connections on the client side
- **Features**:
  - Automatic reconnection with exponential backoff
  - Message queueing for offline mode
  - Connection state management
  - Heartbeat/ping mechanism
  - Event-based architecture
  - Channel subscription management

**Key Classes**:
- `WebSocketClient`: Main client class with comprehensive connection management
- `createWebSocketClient()`: Factory function for creating client instances
- `getWebSocketClient()`: Singleton accessor

**Configuration Options**:
```typescript
{
  url: string;                    // WebSocket server URL
  reconnect: boolean;             // Enable auto-reconnect
  reconnectInterval: number;      // Initial reconnect delay (ms)
  maxReconnectInterval: number;   // Max reconnect delay (ms)
  reconnectDecay: number;         // Exponential backoff multiplier
  maxReconnectAttempts: number;   // Max reconnection attempts
  heartbeatInterval: number;      // Ping interval (ms)
  messageQueueSize: number;       // Max queued messages
  debug: boolean;                 // Enable debug logging
}
```

#### 2. Real-time Sync Manager (`/lib/utils/realtime-sync.ts`)
- **Purpose**: Handles real-time data synchronization and conflict resolution
- **Features**:
  - Change tracking and operational transformation
  - Multiple conflict resolution strategies
  - Lock management for exclusive editing
  - Change history with undo/redo support
  - Version control

**Conflict Resolution Strategies**:
- **Last-Write-Wins (LWW)**: Simple, fast - latest change wins
- **Operational Transformation (OT)**: Preserves all edits, no data loss
- **CRDT**: Math-based, eventual consistency
- **Lock-based**: Prevents simultaneous edits
- **Manual**: User-driven conflict resolution

**Key Classes**:
- `RealtimeSyncManager`: Main synchronization manager
- `createRealtimeSyncManager()`: Factory function

#### 3. WebSocket Middleware (`/lib/middleware/websocketMiddleware.ts`)
- **Purpose**: Server-side WebSocket handling for Next.js
- **Features**:
  - Room/channel management
  - Event broadcasting
  - Client connection handling
  - Presence tracking
  - Message routing

**Key Classes**:
- `WebSocketServerManager`: Server-side manager
- `initializeWebSocketServer()`: Server initialization

### React Hooks

#### 1. `useWebSocket` (`/lib/hooks/useWebSocket.ts`)
Main hook for WebSocket connections.

```typescript
const {
  status,           // Connection status
  connected,        // Boolean: is connected
  connecting,       // Boolean: is connecting
  disconnected,     // Boolean: is disconnected
  latency,          // Connection latency (ms)
  queuedMessages,   // Number of queued messages

  connect,          // Connect to server
  disconnect,       // Disconnect from server
  send,             // Send message
  subscribe,        // Subscribe to channel
  unsubscribe,      // Unsubscribe from channel
  publish,          // Publish to channel
  subscriptions,    // Active subscriptions
  clearQueue,       // Clear message queue
} = useWebSocket({
  url: 'ws://localhost:3001/ws',
  autoConnect: true,
  reconnect: true,
  onMessage: (msg) => console.log(msg),
});
```

**Additional Hooks**:
- `useWebSocketChannel`: Subscribe to specific channel
- `useWebSocketMessages`: Listen to all messages
- `useWebSocketStatus`: Connection status only

#### 2. `useRealtimeSync` (`/lib/hooks/useRealtimeSync.ts`)
Hook for real-time data synchronization.

```typescript
const {
  syncState,        // Current sync state
  syncing,          // Boolean: is syncing
  version,          // Current version number
  lastSyncedAt,     // Last sync timestamp

  localChanges,     // Local changes array
  remoteChanges,    // Remote changes array
  conflicts,        // Detected conflicts
  changeHistory,    // Full change history

  lock,             // Current lock info
  isLocked,         // Boolean: is locked by others
  lockedByMe,       // Boolean: is locked by me

  startSync,        // Start syncing entity
  stopSync,         // Stop syncing entity
  pushChange,       // Push local change
  acquireLock,      // Acquire edit lock
  releaseLock,      // Release edit lock
  resolveConflict,  // Resolve conflict
  undoChange,       // Undo specific change
} = useRealtimeSync({
  wsClient,
  userId,
  username,
  entityType: 'order',
  entityId: '123',
  conflictStrategy: 'last-write-wins',
});
```

**Additional Hooks**:
- `useEntitySync`: Simple entity sync
- `useLock`: Lock management only

#### 3. `usePresence` (`/lib/hooks/usePresence.ts`)
Hook for user presence tracking.

```typescript
const {
  currentUser,      // Current user presence data
  status,           // User status (online/away/offline)

  activeUsers,      // Array of active users
  onlineCount,      // Number of online users
  awayCount,        // Number of away users

  setStatus,        // Set user status
  setLocation,      // Set current page/section
  setActivity,      // Set activity description
  updateMousePosition, // Update mouse position
  subscribe,        // Subscribe to presence changes
} = usePresence({
  wsClient,
  userId,
  username,
  avatar,
  initialPage: 'dashboard',
  trackMouse: false,
  awayTimeout: 300000, // 5 minutes
});
```

**Additional Hooks**:
- `useRoomPresence`: Track presence in specific room
- `useOnlineStatus`: Simple online/offline status

### UI Components

#### 1. PresenceIndicator (`/components/realtime/PresenceIndicator.tsx`)
Displays online users with status and activity.

```tsx
<PresenceIndicator
  users={activeUsers}
  currentUserId={userId}
  showLocation={true}
  showActivity={true}
  showMouseCursor={false}
  maxDisplay={10}
  compact={false}
/>
```

**Features**:
- User avatars with status indicators
- Activity descriptions
- Current location tracking
- Mouse cursor tracking (optional)
- Compact mode for sidebar

#### 2. ActivityFeed (`/components/realtime/ActivityFeed.tsx`)
Live activity log of user actions.

```tsx
<ActivityFeed
  activities={activityLog}
  maxItems={50}
  showFilters={true}
  showDetails={true}
  compact={false}
  autoScroll={true}
  onActivityClick={(activity) => console.log(activity)}
/>
```

**Features**:
- Timeline view with icons
- Action filtering (created, updated, deleted, viewed)
- Entity filtering (order, customer, item, etc.)
- Expandable change details
- Relative timestamps
- Auto-scroll to latest

#### 3. CollaborationPanel (`/components/realtime/CollaborationPanel.tsx`)
Comprehensive collaboration panel with multiple tabs.

```tsx
<CollaborationPanel
  activeUsers={activeUsers}
  currentUserId={userId}
  lock={lock}
  isLocked={isLocked}
  lockedByMe={lockedByMe}
  onAcquireLock={acquireLock}
  onReleaseLock={releaseLock}
  comments={comments}
  onAddComment={addComment}
  onResolveComment={resolveComment}
  changeHistory={changeHistory}
  onUndoChange={undoChange}
  conflicts={conflicts}
  onResolveConflict={resolveConflict}
  defaultTab="collaborators"
/>
```

**Tabs**:
1. **Collaborators**: Active users list
2. **Comments**: Discussion thread
3. **History**: Change history with undo
4. **Conflicts**: Conflict resolution UI

## Data Structures

### WebSocketMessage
```typescript
interface WebSocketMessage {
  type: 'update' | 'presence' | 'activity' | 'lock' | 'comment' | 'error' | 'ping' | 'pong' | 'sync';
  channel?: string;
  payload: any;
  timestamp: Date | string;
  userId?: string;
  messageId: string;
}
```

### PresenceData
```typescript
interface PresenceData {
  userId: string;
  username: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentLocation: {
    page: string;
    section?: string;
  };
  activity?: string;
  mousePosition?: { x: number; y: number };
}
```

### Change
```typescript
interface Change {
  id: string;
  entityId: string;
  entityType: string;
  userId: string;
  operation: 'insert' | 'update' | 'delete' | 'move';
  path: string;
  before: any;
  after: any;
  timestamp: Date | string;
  resolved: boolean;
  version: number;
  metadata?: Record<string, any>;
}
```

### Lock
```typescript
interface Lock {
  entityId: string;
  entityType: string;
  lockedBy: string;
  lockedByName?: string;
  lockedAt: Date | string;
  expiresAt: Date | string;
  renewable?: boolean;
}
```

### Conflict
```typescript
interface Conflict {
  id: string;
  localChange: Change;
  remoteChange: Change;
  resolutionStrategy?: ConflictResolutionStrategy;
  resolved: boolean;
  resolution?: 'local' | 'remote' | 'merged';
  mergedValue?: any;
}
```

### ActivityLog
```typescript
interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  action: 'created' | 'updated' | 'deleted' | 'viewed';
  entity: {
    type: string;
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
```

## WebSocket Events and Channels

### Channels
- `order-updates`: Order status changes
- `inventory-updates`: Stock level changes
- `customer-updates`: Customer info changes
- `pricing-updates`: Pricing rule changes
- `user-presence`: User online/offline status
- `activity-feed`: User action logs
- `edit-locks`: Entity lock status
- `comments`: User comments and notes
- `notifications`: System notifications

### Event Types
- `ping/pong`: Heartbeat mechanism
- `subscribe/unsubscribe`: Channel management
- `update`: Data updates
- `presence`: Presence changes
- `activity`: Activity logs
- `lock`: Lock operations
- `comment`: Comments
- `sync`: Synchronization requests
- `error`: Error messages

## Usage Examples

### Example 1: Real-time Order Editing

```tsx
'use client';

import React, { useEffect } from 'react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useRealtimeSync } from '@/lib/hooks/useRealtimeSync';
import { usePresence } from '@/lib/hooks/usePresence';
import { CollaborationPanel } from '@/components/realtime/CollaborationPanel';

export default function OrderEditor({ orderId, userId, username }) {
  // Setup WebSocket connection
  const ws = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
    autoConnect: true,
    debug: process.env.NODE_ENV === 'development',
  });

  // Setup real-time sync
  const sync = useRealtimeSync({
    wsClient: ws,
    userId,
    username,
    entityType: 'order',
    entityId: orderId,
    conflictStrategy: 'lock-based',
    autoResolveConflicts: false,
  });

  // Setup presence tracking
  const presence = usePresence({
    wsClient: ws,
    userId,
    username,
    initialPage: 'orders',
    initialSection: `order-${orderId}`,
  });

  // Start syncing when connected
  useEffect(() => {
    if (ws.connected) {
      sync.startSync();
      presence.setActivity(`Editing order #${orderId}`);
    }

    return () => {
      sync.stopSync();
      if (sync.lockedByMe) {
        sync.releaseLock();
      }
    };
  }, [ws.connected, orderId]);

  // Handle field changes
  const handleFieldChange = async (field: string, value: any, oldValue: any) => {
    if (!sync.lockedByMe) {
      // Acquire lock first
      const lock = await sync.acquireLock();
      if (!lock) {
        alert('This order is being edited by another user');
        return;
      }
    }

    // Push change
    await sync.pushChange({
      entityId: orderId,
      entityType: 'order',
      operation: 'update',
      path: field,
      before: oldValue,
      after: value,
    });
  };

  return (
    <div className="flex gap-4">
      {/* Main editor */}
      <div className="flex-1">
        <h1>Order #{orderId}</h1>
        {/* Order form fields with onChange handlers */}
        {sync.isLocked && !sync.lockedByMe && (
          <div className="alert alert-warning">
            This order is locked by {sync.lock?.lockedByName}
          </div>
        )}
      </div>

      {/* Collaboration panel */}
      <div className="w-96">
        <CollaborationPanel
          activeUsers={presence.activeUsers}
          currentUserId={userId}
          lock={sync.lock}
          isLocked={sync.isLocked}
          lockedByMe={sync.lockedByMe}
          onAcquireLock={sync.acquireLock}
          onReleaseLock={sync.releaseLock}
          changeHistory={sync.changeHistory}
          conflicts={sync.conflicts}
          onResolveConflict={sync.resolveConflict}
          onUndoChange={sync.undoChange}
        />
      </div>
    </div>
  );
}
```

### Example 2: Live Activity Dashboard

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { ActivityFeed } from '@/components/realtime/ActivityFeed';
import { PresenceIndicator } from '@/components/realtime/PresenceIndicator';
import { usePresence } from '@/lib/hooks/usePresence';
import type { ActivityLog } from '@/components/realtime/ActivityFeed';

export default function LiveDashboard({ userId, username }) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  const ws = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
    autoConnect: true,
  });

  const presence = usePresence({
    wsClient: ws,
    userId,
    username,
    initialPage: 'dashboard',
  });

  // Subscribe to activity feed
  useEffect(() => {
    if (ws.connected) {
      ws.subscribe('activity-feed');
    }

    const unsubscribe = ws.on('message', (message) => {
      if (message.type === 'activity') {
        setActivities((prev) => [message.payload, ...prev].slice(0, 100));
      }
    });

    return () => {
      unsubscribe();
      ws.unsubscribe('activity-feed');
    };
  }, [ws.connected]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <ActivityFeed
          activities={activities}
          maxItems={50}
          showFilters={true}
          showDetails={true}
        />
      </div>
      <div>
        <PresenceIndicator
          users={presence.activeUsers}
          currentUserId={userId}
          showLocation={true}
          showActivity={true}
        />
      </div>
    </div>
  );
}
```

### Example 3: Simple Presence Tracking

```tsx
'use client';

import React from 'react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useRoomPresence } from '@/lib/hooks/usePresence';

export default function ProductPage({ productId, userId, username }) {
  const ws = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
  });

  const { usersInRoom, userCount } = useRoomPresence(
    ws,
    userId,
    username,
    `product-${productId}`
  );

  return (
    <div>
      <div className="flex items-center gap-2">
        <h1>Product Details</h1>
        <span className="text-sm text-gray-600">
          {userCount} {userCount === 1 ? 'person' : 'people'} viewing
        </span>
      </div>
      {/* Product content */}
    </div>
  );
}
```

## Internationalization

Translation files have been added for English and Thai:
- `/public/locales/en/realtime.json`
- `/public/locales/th/realtime.json`

**Translation Keys**:
- `realtime.presence.*`: Presence-related translations
- `realtime.activity.*`: Activity feed translations
- `realtime.collaboration.*`: Collaboration panel translations
- `realtime.websocket.*`: WebSocket status translations
- `realtime.sync.*`: Synchronization translations
- `realtime.notifications.*`: Notification messages
- `realtime.errors.*`: Error messages

**Usage**:
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation('realtime');

  return (
    <div>
      <h1>{t('presence.title')}</h1>
      <p>{t('websocket.status.connected')}</p>
    </div>
  );
}
```

## Performance Considerations

### Connection Management
- Automatic reconnection with exponential backoff prevents server overload
- Message queueing ensures no data loss during disconnections
- Heartbeat mechanism detects dead connections early

### Scalability
- Room-based subscriptions limit broadcast scope
- Message compression reduces bandwidth
- Connection pooling on server side
- Delta sync sends only changed fields

### Optimization
- Throttled mouse position updates (100ms)
- Periodic presence broadcasts (10s)
- Change history size limits (100 items)
- Away timeout (5 minutes)

## Server Setup

To use this real-time system, you need to set up a WebSocket server. Here's a basic example using the `ws` library:

```javascript
// server.js
const WebSocket = require('ws');
const { initializeWebSocketServer } = require('./lib/middleware/websocketMiddleware');

const wss = new WebSocket.Server({ port: 3001 });

const wsManager = initializeWebSocketServer(wss, {
  heartbeatInterval: 30000,
  clientTimeout: 60000,
  debug: process.env.NODE_ENV === 'development',
});

console.log('WebSocket server running on ws://localhost:3001');
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

## Testing

The system includes built-in debug logging. Enable it with:

```typescript
const ws = useWebSocket({
  url: 'ws://localhost:3001/ws',
  debug: true, // Enable debug logging
});
```

## Best Practices

1. **Always clean up connections**: Use `useEffect` cleanup functions
2. **Handle offline gracefully**: Check `ws.connected` before operations
3. **Acquire locks before editing**: Prevent conflicts in collaborative editing
4. **Release locks on unmount**: Prevent stuck locks
5. **Use appropriate conflict strategies**: Choose based on use case
6. **Throttle high-frequency updates**: Avoid overwhelming the server
7. **Show user feedback**: Display connection status and sync state
8. **Handle errors gracefully**: Show user-friendly error messages

## Troubleshooting

### Connection Issues
- Check WebSocket URL is correct
- Verify firewall/proxy settings
- Check server is running
- Enable debug logging

### Sync Issues
- Verify entity type and ID are correct
- Check conflict resolution strategy
- Review change history for clues
- Enable debug logging

### Lock Issues
- Check lock timeout settings
- Verify user has permission
- Ensure locks are released properly
- Check for expired locks

## Future Enhancements

Potential improvements for the real-time system:

1. **Advanced OT implementation**: Full operational transformation
2. **CRDT support**: Conflict-free replicated data types
3. **Offline-first**: Better offline support with IndexedDB
4. **Video/audio**: WebRTC integration for calls
5. **Screen sharing**: Collaborative viewing
6. **Rich text collaboration**: Real-time document editing
7. **Analytics**: Track collaboration metrics
8. **Security**: Encryption and authentication
9. **Rate limiting**: Prevent abuse
10. **Monitoring**: Real-time system health dashboard

## Support

For issues or questions:
1. Check the debug logs
2. Review the TypeScript types
3. Consult this documentation
4. Check the example implementations

## License

This real-time collaboration system is part of the omni-sales application.
