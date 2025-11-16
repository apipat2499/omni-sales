import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import {
  WebSocketConnection,
  WebSocketServerConfig,
  WebSocketNamespace,
  UserRole,
  WebSocketAuthToken,
  RateLimitConfig,
} from './types';

// Extended WebSocket with custom properties
interface ExtendedWebSocket extends WebSocket {
  id: string;
  userId?: string;
  role?: UserRole;
  namespaces: Set<WebSocketNamespace>;
  connectedAt: number;
  lastActivity: number;
  isAlive: boolean;
  eventCount: number;
  eventWindowStart: number;
}

class WebSocketManager {
  private static instance: WebSocketManager;
  private wss: WebSocketServer | null = null;
  private connections: Map<string, ExtendedWebSocket> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set of connection IDs
  private pingInterval: NodeJS.Timeout | null = null;
  private config: Required<WebSocketServerConfig>;
  private rateLimitConfig: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxEvents: 100,
    message: 'Rate limit exceeded',
  };

  private constructor() {
    this.config = {
      port: parseInt(process.env.WS_PORT || '3001', 10),
      path: '/api/ws',
      maxConnections: 10000,
      pingInterval: 30000, // 30 seconds
      pongTimeout: 5000, // 5 seconds
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
    };
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Initialize WebSocket server
   */
  public initialize(server: any): void {
    if (this.wss) {
      console.log('[WebSocket] Server already initialized');
      return;
    }

    this.wss = new WebSocketServer({
      server,
      path: this.config.path,
      maxPayload: 1024 * 1024, // 1MB
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();

    console.log(`[WebSocket] Server initialized on path ${this.config.path}`);
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    // Check max connections
    if (this.connections.size >= this.config.maxConnections) {
      ws.close(1008, 'Maximum connections reached');
      return;
    }

    // Check origin
    const origin = request.headers.origin;
    if (!this.isOriginAllowed(origin)) {
      ws.close(1008, 'Origin not allowed');
      return;
    }

    // Generate connection ID
    const connectionId = this.generateConnectionId();

    // Extend WebSocket with custom properties
    const extWs = ws as ExtendedWebSocket;
    extWs.id = connectionId;
    extWs.namespaces = new Set();
    extWs.connectedAt = Date.now();
    extWs.lastActivity = Date.now();
    extWs.isAlive = true;
    extWs.eventCount = 0;
    extWs.eventWindowStart = Date.now();

    // Store connection
    this.connections.set(connectionId, extWs);

    // Setup event handlers
    extWs.on('message', (data: Buffer) => this.handleMessage(extWs, data));
    extWs.on('close', () => this.handleClose(extWs));
    extWs.on('error', (error) => this.handleError(extWs, error));
    extWs.on('pong', () => {
      extWs.isAlive = true;
    });

    console.log(`[WebSocket] New connection: ${connectionId} (Total: ${this.connections.size})`);

    // Send welcome message
    this.send(extWs, {
      type: 'system:notification',
      data: {
        message: 'Connected to real-time server',
        connectionId,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(ws: ExtendedWebSocket, data: Buffer): void {
    try {
      ws.lastActivity = Date.now();

      // Check rate limit
      if (!this.checkRateLimit(ws)) {
        this.send(ws, {
          type: 'system:alert',
          data: {
            severity: 'error',
            message: this.rateLimitConfig.message,
          },
          timestamp: Date.now(),
        });
        return;
      }

      const message = JSON.parse(data.toString());

      // Handle different message types
      switch (message.type) {
        case 'auth':
          this.handleAuth(ws, message.data);
          break;
        case 'subscribe':
          this.handleSubscribe(ws, message.data);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(ws, message.data);
          break;
        case 'ping':
          this.send(ws, { type: 'pong', timestamp: Date.now() });
          break;
        default:
          console.log(`[WebSocket] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[WebSocket] Error handling message:', error);
    }
  }

  /**
   * Handle authentication
   */
  private handleAuth(ws: ExtendedWebSocket, authData: WebSocketAuthToken): void {
    try {
      // Verify token (in production, verify JWT or session token)
      if (!authData.userId || !authData.role) {
        this.send(ws, {
          type: 'system:alert',
          data: { severity: 'error', message: 'Invalid authentication' },
          timestamp: Date.now(),
        });
        return;
      }

      // Check token expiration
      if (authData.expiresAt && authData.expiresAt < Date.now()) {
        this.send(ws, {
          type: 'system:alert',
          data: { severity: 'error', message: 'Token expired' },
          timestamp: Date.now(),
        });
        return;
      }

      // Set user info
      ws.userId = authData.userId;
      ws.role = authData.role;

      // Track user connections
      if (!this.userConnections.has(authData.userId)) {
        this.userConnections.set(authData.userId, new Set());
      }
      this.userConnections.get(authData.userId)!.add(ws.id);

      console.log(`[WebSocket] User authenticated: ${authData.userId} (${authData.role})`);

      this.send(ws, {
        type: 'system:notification',
        data: {
          severity: 'success',
          message: 'Authentication successful',
          userId: authData.userId,
          role: authData.role,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[WebSocket] Auth error:', error);
    }
  }

  /**
   * Handle namespace subscription
   */
  private handleSubscribe(ws: ExtendedWebSocket, data: { namespace: WebSocketNamespace }): void {
    const { namespace } = data;

    // Check permissions
    if (!this.hasPermission(ws.role, namespace)) {
      this.send(ws, {
        type: 'system:alert',
        data: {
          severity: 'error',
          message: `No permission to subscribe to ${namespace}`,
        },
        timestamp: Date.now(),
      });
      return;
    }

    ws.namespaces.add(namespace);
    console.log(`[WebSocket] ${ws.id} subscribed to ${namespace}`);

    this.send(ws, {
      type: 'system:notification',
      data: {
        severity: 'success',
        message: `Subscribed to ${namespace}`,
        namespace,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Handle namespace unsubscription
   */
  private handleUnsubscribe(ws: ExtendedWebSocket, data: { namespace: WebSocketNamespace }): void {
    const { namespace } = data;
    ws.namespaces.delete(namespace);

    this.send(ws, {
      type: 'system:notification',
      data: {
        severity: 'info',
        message: `Unsubscribed from ${namespace}`,
        namespace,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Handle connection close
   */
  private handleClose(ws: ExtendedWebSocket): void {
    console.log(`[WebSocket] Connection closed: ${ws.id}`);

    // Remove from user connections
    if (ws.userId) {
      const userConns = this.userConnections.get(ws.userId);
      if (userConns) {
        userConns.delete(ws.id);
        if (userConns.size === 0) {
          this.userConnections.delete(ws.userId);
        }
      }
    }

    // Remove connection
    this.connections.delete(ws.id);
  }

  /**
   * Handle WebSocket error
   */
  private handleError(ws: ExtendedWebSocket, error: Error): void {
    console.error(`[WebSocket] Error on connection ${ws.id}:`, error);
  }

  /**
   * Send message to a specific connection
   */
  private send(ws: ExtendedWebSocket, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('[WebSocket] Error sending message:', error);
      }
    }
  }

  /**
   * Broadcast message to multiple connections
   */
  public broadcast(message: any, options: {
    namespace?: WebSocketNamespace;
    userIds?: string[];
    roles?: UserRole[];
    excludeUserIds?: string[];
    excludeConnectionId?: string;
  } = {}): void {
    const { namespace, userIds, roles, excludeUserIds, excludeConnectionId } = options;

    this.connections.forEach((ws) => {
      // Skip excluded connections
      if (excludeConnectionId && ws.id === excludeConnectionId) return;
      if (excludeUserIds && ws.userId && excludeUserIds.includes(ws.userId)) return;

      // Filter by namespace
      if (namespace && !ws.namespaces.has(namespace)) return;

      // Filter by user IDs
      if (userIds && (!ws.userId || !userIds.includes(ws.userId))) return;

      // Filter by roles
      if (roles && (!ws.role || !roles.includes(ws.role))) return;

      this.send(ws, message);
    });
  }

  /**
   * Send message to specific user (all their connections)
   */
  public sendToUser(userId: string, message: any): void {
    const userConns = this.userConnections.get(userId);
    if (userConns) {
      userConns.forEach((connId) => {
        const ws = this.connections.get(connId);
        if (ws) {
          this.send(ws, message);
        }
      });
    }
  }

  /**
   * Start heartbeat to check connection health
   */
  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      this.connections.forEach((ws) => {
        if (!ws.isAlive) {
          console.log(`[WebSocket] Terminating inactive connection: ${ws.id}`);
          ws.terminate();
          this.connections.delete(ws.id);
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, this.config.pingInterval);
  }

  /**
   * Check if origin is allowed
   */
  private isOriginAllowed(origin: string | undefined): boolean {
    if (!origin) return true;
    if (this.config.allowedOrigins.includes('*')) return true;
    return this.config.allowedOrigins.includes(origin);
  }

  /**
   * Check rate limit for connection
   */
  private checkRateLimit(ws: ExtendedWebSocket): boolean {
    const now = Date.now();
    const windowElapsed = now - ws.eventWindowStart;

    // Reset window if expired
    if (windowElapsed > this.rateLimitConfig.windowMs) {
      ws.eventCount = 0;
      ws.eventWindowStart = now;
    }

    ws.eventCount++;
    return ws.eventCount <= this.rateLimitConfig.maxEvents;
  }

  /**
   * Check if user role has permission for namespace
   */
  private hasPermission(role: UserRole | undefined, namespace: WebSocketNamespace): boolean {
    if (!role) return namespace === 'products'; // Unauthenticated can only view products

    const permissions: Record<UserRole, WebSocketNamespace[]> = {
      admin: ['orders', 'customers', 'products', 'inventory', 'payments', 'system'],
      manager: ['orders', 'customers', 'products', 'inventory', 'payments'],
      staff: ['orders', 'customers', 'products', 'inventory'],
      customer: ['products', 'orders'],
      guest: ['products'],
    };

    return permissions[role]?.includes(namespace) || false;
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection statistics
   */
  public getStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    connectionsByRole: Record<string, number>;
    connectionsByNamespace: Record<string, number>;
  } {
    const stats = {
      totalConnections: this.connections.size,
      authenticatedConnections: 0,
      connectionsByRole: {} as Record<string, number>,
      connectionsByNamespace: {} as Record<string, number>,
    };

    this.connections.forEach((ws) => {
      if (ws.userId) {
        stats.authenticatedConnections++;
      }

      if (ws.role) {
        stats.connectionsByRole[ws.role] = (stats.connectionsByRole[ws.role] || 0) + 1;
      }

      ws.namespaces.forEach((ns) => {
        stats.connectionsByNamespace[ns] = (stats.connectionsByNamespace[ns] || 0) + 1;
      });
    });

    return stats;
  }

  /**
   * Shutdown WebSocket server
   */
  public shutdown(): void {
    console.log('[WebSocket] Shutting down server...');

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.connections.forEach((ws) => {
      ws.close(1001, 'Server shutting down');
    });

    this.wss?.close(() => {
      console.log('[WebSocket] Server shut down');
    });
  }
}

// Export singleton instance
export const wsManager = WebSocketManager.getInstance();
export default WebSocketManager;
