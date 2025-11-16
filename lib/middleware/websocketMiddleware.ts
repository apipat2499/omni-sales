/**
 * WebSocket Middleware for Next.js
 *
 * Provides server-side WebSocket functionality with:
 * - Room/channel management
 * - Event broadcasting
 * - Client connection handling
 * - Presence tracking
 * - Message routing
 */

import { IncomingMessage } from 'http';
import { WebSocketMessage } from '../utils/websocket-client';

// Note: In a real implementation, you'd use a WebSocket library like 'ws'
// This is a conceptual implementation showing the architecture

export interface WebSocketServerConfig {
  port?: number;
  path?: string;
  heartbeatInterval?: number;
  clientTimeout?: number;
  maxMessageSize?: number;
  enableCompression?: boolean;
  debug?: boolean;
}

export interface WebSocketClient {
  id: string;
  userId?: string;
  username?: string;
  ws: any; // WebSocket instance
  rooms: Set<string>;
  lastActivity: Date;
  metadata: Record<string, any>;
}

export interface Room {
  id: string;
  clients: Set<string>; // client IDs
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface PresenceInfo {
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

/**
 * WebSocket Server Manager
 */
export class WebSocketServerManager {
  private config: Required<WebSocketServerConfig>;
  private clients: Map<string, WebSocketClient> = new Map();
  private rooms: Map<string, Room> = new Map();
  private presenceData: Map<string, PresenceInfo> = new Map();
  private messageHandlers: Map<string, Set<(client: WebSocketClient, message: WebSocketMessage) => void>> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private wss: any = null; // WebSocket Server instance

  constructor(config: WebSocketServerConfig = {}) {
    this.config = {
      port: config.port || 3001,
      path: config.path || '/ws',
      heartbeatInterval: config.heartbeatInterval || 30000,
      clientTimeout: config.clientTimeout || 60000,
      maxMessageSize: config.maxMessageSize || 1024 * 1024, // 1MB
      enableCompression: config.enableCompression ?? true,
      debug: config.debug || false,
    };

    this.log('WebSocket server manager initialized with config:', this.config);
  }

  /**
   * Initialize WebSocket server
   * Note: This is a conceptual implementation
   */
  public initialize(server?: any): void {
    // In a real implementation:
    // const WebSocket = require('ws');
    // this.wss = new WebSocket.Server({
    //   server,
    //   path: this.config.path,
    //   perMessageDeflate: this.config.enableCompression,
    // });
    //
    // this.wss.on('connection', this.handleConnection.bind(this));

    this.startHeartbeat();

    this.log('WebSocket server initialized');
  }

  /**
   * Handle new client connection
   */
  private handleConnection(ws: any, request: IncomingMessage): void {
    const clientId = this.generateClientId();

    const client: WebSocketClient = {
      id: clientId,
      ws,
      rooms: new Set(),
      lastActivity: new Date(),
      metadata: {},
    };

    this.clients.set(clientId, client);

    // Setup event handlers
    ws.on('message', (data: string) => {
      this.handleMessage(client, data);
    });

    ws.on('close', () => {
      this.handleDisconnection(client);
    });

    ws.on('error', (error: Error) => {
      this.log('WebSocket error:', error);
    });

    ws.on('pong', () => {
      client.lastActivity = new Date();
    });

    // Send welcome message
    this.sendToClient(client, {
      type: 'sync',
      payload: {
        clientId,
        message: 'Connected to WebSocket server',
      },
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId(),
    });

    this.log('Client connected:', clientId);
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(client: WebSocketClient): void {
    // Remove from all rooms
    client.rooms.forEach((roomId) => {
      this.leaveRoom(client, roomId);
    });

    // Update presence
    if (client.userId) {
      const presence = this.presenceData.get(client.userId);
      if (presence) {
        presence.status = 'offline';
        presence.lastSeen = new Date();
        this.broadcastPresence(presence);
      }
    }

    // Remove client
    this.clients.delete(client.id);

    this.log('Client disconnected:', client.id);
  }

  /**
   * Handle incoming message
   */
  private handleMessage(client: WebSocketClient, data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      client.lastActivity = new Date();

      // Route message based on type
      switch (message.type) {
        case 'ping':
          this.handlePing(client);
          break;

        case 'subscribe':
          this.handleSubscribe(client, message);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(client, message);
          break;

        case 'update':
          this.handleUpdate(client, message);
          break;

        case 'presence':
          this.handlePresence(client, message);
          break;

        case 'activity':
          this.handleActivity(client, message);
          break;

        case 'lock':
          this.handleLock(client, message);
          break;

        case 'comment':
          this.handleComment(client, message);
          break;

        case 'sync':
          this.handleSync(client, message);
          break;

        default:
          this.log('Unknown message type:', message.type);
      }

      // Notify custom handlers
      this.notifyMessageHandlers(message.type, client, message);
    } catch (error) {
      this.log('Error parsing message:', error);
      this.sendError(client, 'Invalid message format');
    }
  }

  /**
   * Handle ping message
   */
  private handlePing(client: WebSocketClient): void {
    this.sendToClient(client, {
      type: 'pong',
      payload: {},
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId(),
    });
  }

  /**
   * Handle subscribe message
   */
  private handleSubscribe(client: WebSocketClient, message: WebSocketMessage): void {
    const { channel } = message.payload;

    if (!channel) {
      this.sendError(client, 'Channel required');
      return;
    }

    this.joinRoom(client, channel);

    this.sendToClient(client, {
      type: 'sync',
      payload: {
        subscribed: true,
        channel,
      },
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId(),
    });
  }

  /**
   * Handle unsubscribe message
   */
  private handleUnsubscribe(client: WebSocketClient, message: WebSocketMessage): void {
    const { channel } = message.payload;

    if (!channel) {
      this.sendError(client, 'Channel required');
      return;
    }

    this.leaveRoom(client, channel);

    this.sendToClient(client, {
      type: 'sync',
      payload: {
        unsubscribed: true,
        channel,
      },
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId(),
    });
  }

  /**
   * Handle update message
   */
  private handleUpdate(client: WebSocketClient, message: WebSocketMessage): void {
    const { channel } = message;

    if (!channel) {
      this.sendError(client, 'Channel required');
      return;
    }

    // Broadcast to room
    this.broadcastToRoom(channel, message, client.id);
  }

  /**
   * Handle presence message
   */
  private handlePresence(client: WebSocketClient, message: WebSocketMessage): void {
    const presenceInfo: PresenceInfo = message.payload;

    if (!presenceInfo.userId) {
      this.sendError(client, 'User ID required');
      return;
    }

    // Update client info
    client.userId = presenceInfo.userId;
    client.username = presenceInfo.username;

    // Update presence data
    this.presenceData.set(presenceInfo.userId, presenceInfo);

    // Broadcast presence
    this.broadcastPresence(presenceInfo);
  }

  /**
   * Handle activity message
   */
  private handleActivity(client: WebSocketClient, message: WebSocketMessage): void {
    // Broadcast to activity feed
    this.broadcastToRoom('activity-feed', message, client.id);
  }

  /**
   * Handle lock message
   */
  private handleLock(client: WebSocketClient, message: WebSocketMessage): void {
    // Broadcast to edit-locks channel
    this.broadcastToRoom('edit-locks', message, client.id);
  }

  /**
   * Handle comment message
   */
  private handleComment(client: WebSocketClient, message: WebSocketMessage): void {
    const { channel } = message;

    if (!channel) {
      this.sendError(client, 'Channel required');
      return;
    }

    // Broadcast to room
    this.broadcastToRoom(channel, message, client.id);
  }

  /**
   * Handle sync request
   */
  private handleSync(client: WebSocketClient, message: WebSocketMessage): void {
    const { entityType, entityId, requestSync } = message.payload;

    if (requestSync) {
      // In a real implementation, fetch data from database
      // and send back to client
      this.sendToClient(client, {
        type: 'sync',
        payload: {
          entityType,
          entityId,
          changes: [],
          version: 0,
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      });
    }
  }

  /**
   * Join a room
   */
  private joinRoom(client: WebSocketClient, roomId: string): void {
    // Create room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        clients: new Set(),
        metadata: {},
        createdAt: new Date(),
      });
    }

    const room = this.rooms.get(roomId)!;
    room.clients.add(client.id);
    client.rooms.add(roomId);

    this.log('Client joined room:', client.id, roomId);

    // Notify others in room
    this.broadcastToRoom(
      roomId,
      {
        type: 'presence',
        payload: {
          event: 'user-joined',
          userId: client.userId,
          username: client.username,
          roomId,
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
      },
      client.id
    );
  }

  /**
   * Leave a room
   */
  private leaveRoom(client: WebSocketClient, roomId: string): void {
    const room = this.rooms.get(roomId);

    if (room) {
      room.clients.delete(client.id);
      client.rooms.delete(roomId);

      // Delete room if empty
      if (room.clients.size === 0) {
        this.rooms.delete(roomId);
      }

      this.log('Client left room:', client.id, roomId);

      // Notify others in room
      if (room.clients.size > 0) {
        this.broadcastToRoom(
          roomId,
          {
            type: 'presence',
            payload: {
              event: 'user-left',
              userId: client.userId,
              username: client.username,
              roomId,
            },
            timestamp: new Date().toISOString(),
            messageId: this.generateMessageId(),
          },
          client.id
        );
      }
    }
  }

  /**
   * Broadcast message to a room
   */
  private broadcastToRoom(roomId: string, message: WebSocketMessage, excludeClientId?: string): void {
    const room = this.rooms.get(roomId);

    if (!room) {
      this.log('Room not found:', roomId);
      return;
    }

    room.clients.forEach((clientId) => {
      if (clientId !== excludeClientId) {
        const client = this.clients.get(clientId);
        if (client) {
          this.sendToClient(client, message);
        }
      }
    });
  }

  /**
   * Broadcast presence update
   */
  private broadcastPresence(presence: PresenceInfo): void {
    const message: WebSocketMessage = {
      type: 'presence',
      payload: presence,
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId(),
    };

    this.broadcastToRoom('user-presence', message);
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: WebSocketClient, message: WebSocketMessage): void {
    try {
      if (client.ws.readyState === 1) {
        // WebSocket.OPEN
        client.ws.send(JSON.stringify(message));
      }
    } catch (error) {
      this.log('Error sending message to client:', error);
    }
  }

  /**
   * Send error to client
   */
  private sendError(client: WebSocketClient, error: string): void {
    this.sendToClient(client, {
      type: 'error',
      payload: { error },
      timestamp: new Date().toISOString(),
      messageId: this.generateMessageId(),
    });
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = new Date();

      this.clients.forEach((client) => {
        const timeSinceLastActivity = now.getTime() - client.lastActivity.getTime();

        // Check for timeout
        if (timeSinceLastActivity > this.config.clientTimeout) {
          this.log('Client timed out:', client.id);
          client.ws.terminate();
          this.handleDisconnection(client);
          return;
        }

        // Send ping
        if (client.ws.readyState === 1) {
          // WebSocket.OPEN
          client.ws.ping();
        }
      });
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Register custom message handler
   */
  public onMessage(
    type: string,
    handler: (client: WebSocketClient, message: WebSocketMessage) => void
  ): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    this.messageHandlers.get(type)!.add(handler);

    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  /**
   * Notify custom message handlers
   */
  private notifyMessageHandlers(type: string, client: WebSocketClient, message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(type);

    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(client, message);
        } catch (error) {
          this.log('Error in message handler:', error);
        }
      });
    }
  }

  /**
   * Get active clients count
   */
  public getActiveClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get rooms count
   */
  public getRoomsCount(): number {
    return this.rooms.size;
  }

  /**
   * Get clients in room
   */
  public getClientsInRoom(roomId: string): WebSocketClient[] {
    const room = this.rooms.get(roomId);

    if (!room) {
      return [];
    }

    return Array.from(room.clients)
      .map((clientId) => this.clients.get(clientId))
      .filter((client): client is WebSocketClient => client !== undefined);
  }

  /**
   * Get all presence data
   */
  public getAllPresence(): PresenceInfo[] {
    return Array.from(this.presenceData.values());
  }

  /**
   * Shutdown server
   */
  public shutdown(): void {
    this.stopHeartbeat();

    // Close all client connections
    this.clients.forEach((client) => {
      client.ws.close(1000, 'Server shutdown');
    });

    this.clients.clear();
    this.rooms.clear();
    this.presenceData.clear();

    if (this.wss) {
      this.wss.close();
    }

    this.log('WebSocket server shut down');
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocketServerManager]', ...args);
    }
  }
}

/**
 * Global server instance
 */
let globalServer: WebSocketServerManager | null = null;

/**
 * Get or create global WebSocket server
 */
export function getWebSocketServer(config?: WebSocketServerConfig): WebSocketServerManager {
  if (!globalServer) {
    globalServer = new WebSocketServerManager(config);
  }
  return globalServer;
}

/**
 * Initialize WebSocket server for Next.js
 */
export function initializeWebSocketServer(server: any, config?: WebSocketServerConfig): WebSocketServerManager {
  const wsServer = getWebSocketServer(config);
  wsServer.initialize(server);
  return wsServer;
}

/**
 * Shutdown WebSocket server
 */
export function shutdownWebSocketServer(): void {
  if (globalServer) {
    globalServer.shutdown();
    globalServer = null;
  }
}
