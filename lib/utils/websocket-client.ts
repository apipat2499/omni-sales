/**
 * WebSocket Client Utility
 *
 * Provides robust WebSocket connection management with:
 * - Automatic reconnection with exponential backoff
 * - Message queueing for offline mode
 * - Connection state management
 * - Heartbeat/ping mechanism
 * - Event-based architecture
 */

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface WebSocketMessage {
  type: 'update' | 'presence' | 'activity' | 'lock' | 'comment' | 'error' | 'ping' | 'pong' | 'sync' | 'subscribe' | 'unsubscribe';
  channel?: string;
  payload: any;
  timestamp: Date | string;
  userId?: string;
  messageId: string;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  reconnectDecay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  messageQueueSize?: number;
  debug?: boolean;
}

export interface WebSocketClientEvents {
  open: () => void;
  close: (event: CloseEvent) => void;
  error: (error: Event) => void;
  message: (message: WebSocketMessage) => void;
  reconnecting: (attempt: number) => void;
  reconnected: () => void;
  statusChange: (status: ConnectionStatus) => void;
}

/**
 * WebSocket Client with advanced features
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private eventHandlers: Map<keyof WebSocketClientEvents, Set<Function>> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private status: ConnectionStatus = 'disconnected';
  private lastPingTime: number = 0;
  private latency: number = 0;
  private shouldReconnect = true;
  private subscriptions: Set<string> = new Set();

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      protocols: config.protocols || [],
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval || 1000,
      maxReconnectInterval: config.maxReconnectInterval || 30000,
      reconnectDecay: config.reconnectDecay || 1.5,
      maxReconnectAttempts: config.maxReconnectAttempts || Infinity,
      heartbeatInterval: config.heartbeatInterval || 30000,
      messageQueueSize: config.messageQueueSize || 100,
      debug: config.debug || false,
    };

    this.log('WebSocket client initialized with config:', this.config);
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      this.log('Already connected or connecting');
      return;
    }

    this.shouldReconnect = true;
    this.setStatus('connecting');
    this.log('Connecting to:', this.config.url);

    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols);
      this.setupEventHandlers();
    } catch (error) {
      this.log('Connection error:', error);
      this.setStatus('error');
      this.handleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.shouldReconnect = false;
    this.clearTimers();

    if (this.ws) {
      this.log('Disconnecting...');
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  /**
   * Send message to server
   */
  public send(message: Omit<WebSocketMessage, 'messageId' | 'timestamp'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fullMessage: WebSocketMessage = {
        ...message,
        messageId: this.generateMessageId(),
        timestamp: new Date().toISOString(),
      };

      // Queue message if not connected
      if (!this.isConnected()) {
        if (this.messageQueue.length < this.config.messageQueueSize) {
          this.messageQueue.push(fullMessage);
          this.log('Message queued:', fullMessage);
          resolve();
        } else {
          reject(new Error('Message queue full'));
        }
        return;
      }

      try {
        this.ws!.send(JSON.stringify(fullMessage));
        this.log('Message sent:', fullMessage);
        resolve();
      } catch (error) {
        this.log('Send error:', error);

        // Queue on error if possible
        if (this.messageQueue.length < this.config.messageQueueSize) {
          this.messageQueue.push(fullMessage);
          resolve();
        } else {
          reject(error);
        }
      }
    });
  }

  /**
   * Subscribe to a channel
   */
  public subscribe(channel: string): Promise<void> {
    this.subscriptions.add(channel);
    return this.send({
      type: 'subscribe',
      channel,
      payload: { channel },
    });
  }

  /**
   * Unsubscribe from a channel
   */
  public unsubscribe(channel: string): Promise<void> {
    this.subscriptions.delete(channel);
    return this.send({
      type: 'unsubscribe',
      channel,
      payload: { channel },
    });
  }

  /**
   * Publish message to a channel
   */
  public publish(channel: string, payload: any): Promise<void> {
    return this.send({
      type: 'update',
      channel,
      payload,
    });
  }

  /**
   * Add event listener
   */
  public on<K extends keyof WebSocketClientEvents>(
    event: K,
    handler: WebSocketClientEvents[K]
  ): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  /**
   * Remove event listener
   */
  public off<K extends keyof WebSocketClientEvents>(
    event: K,
    handler: WebSocketClientEvents[K]
  ): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Get current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current latency in ms
   */
  public getLatency(): number {
    return this.latency;
  }

  /**
   * Get active subscriptions
   */
  public getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  /**
   * Get queued message count
   */
  public getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  /**
   * Clear message queue
   */
  public clearQueue(): void {
    this.messageQueue = [];
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.log('Connection opened');
      this.reconnectAttempts = 0;
      this.setStatus('connected');
      this.startHeartbeat();
      this.flushMessageQueue();
      this.resubscribeChannels();
      this.emit('open');

      if (this.reconnectAttempts > 0) {
        this.emit('reconnected');
      }
    };

    this.ws.onclose = (event) => {
      this.log('Connection closed:', event.code, event.reason);
      this.stopHeartbeat();
      this.setStatus('disconnected');
      this.emit('close', event);

      if (this.shouldReconnect) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      this.log('WebSocket error:', error);
      this.setStatus('error');
      this.emit('error', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.log('Message received:', message);

        // Handle pong for heartbeat
        if (message.type === 'pong') {
          this.latency = Date.now() - this.lastPingTime;
          this.log('Latency:', this.latency, 'ms');
          return;
        }

        this.emit('message', message);
      } catch (error) {
        this.log('Failed to parse message:', error);
      }
    };
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (!this.config.reconnect || !this.shouldReconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnect attempts reached');
      this.setStatus('error');
      return;
    }

    this.reconnectAttempts++;
    this.setStatus('reconnecting');
    this.emit('reconnecting', this.reconnectAttempts);

    // Calculate backoff delay
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(this.config.reconnectDecay, this.reconnectAttempts - 1),
      this.config.maxReconnectInterval
    );

    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.log('Attempting to reconnect...');
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.lastPingTime = Date.now();
        this.send({ type: 'ping', payload: {} }).catch((error) => {
          this.log('Heartbeat failed:', error);
        });
      }
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
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    this.log(`Flushing ${this.messageQueue.length} queued messages`);

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    queue.forEach((message) => {
      this.send(message).catch((error) => {
        this.log('Failed to send queued message:', error);
      });
    });
  }

  /**
   * Resubscribe to channels after reconnection
   */
  private resubscribeChannels(): void {
    if (this.subscriptions.size === 0) return;

    this.log(`Resubscribing to ${this.subscriptions.size} channels`);

    this.subscriptions.forEach((channel) => {
      this.subscribe(channel).catch((error) => {
        this.log('Failed to resubscribe to channel:', channel, error);
      });
    });
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();
  }

  /**
   * Set connection status and emit event
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('statusChange', status);
    }
  }

  /**
   * Emit event to all registered handlers
   */
  private emit<K extends keyof WebSocketClientEvents>(
    event: K,
    ...args: Parameters<WebSocketClientEvents[K]>
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          // @ts-ignore - TypeScript has issues with spread args
          handler(...args);
        } catch (error) {
          this.log('Error in event handler:', error);
        }
      });
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log debug messages
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[WebSocketClient]', ...args);
    }
  }
}

/**
 * Create a WebSocket client instance
 */
export function createWebSocketClient(config: WebSocketConfig): WebSocketClient {
  return new WebSocketClient(config);
}

/**
 * Global WebSocket client singleton
 */
let globalClient: WebSocketClient | null = null;

/**
 * Get or create global WebSocket client
 */
export function getWebSocketClient(config?: WebSocketConfig): WebSocketClient {
  if (!globalClient) {
    if (!config) {
      throw new Error('WebSocket config required for first initialization');
    }
    globalClient = new WebSocketClient(config);
  }
  return globalClient;
}

/**
 * Reset global WebSocket client (useful for testing)
 */
export function resetWebSocketClient(): void {
  if (globalClient) {
    globalClient.disconnect();
    globalClient = null;
  }
}

/**
 * WebSocket connection state
 */
export interface WebSocketState {
  status: ConnectionStatus;
  connected: boolean;
  latency: number;
  queuedMessages: number;
  subscriptions: string[];
}

/**
 * Get current WebSocket state
 */
export function getWebSocketState(client: WebSocketClient): WebSocketState {
  return {
    status: client.getStatus(),
    connected: client.isConnected(),
    latency: client.getLatency(),
    queuedMessages: client.getQueuedMessageCount(),
    subscriptions: client.getSubscriptions(),
  };
}
