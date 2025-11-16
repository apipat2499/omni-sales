/**
 * useWebSocket Hook
 *
 * React hook for managing WebSocket connections with:
 * - Connection state management
 * - Message sending/receiving
 * - Channel subscriptions
 * - Auto-reconnection
 * - Message queueing
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  WebSocketClient,
  createWebSocketClient,
  ConnectionStatus,
  WebSocketMessage,
  WebSocketConfig,
  getWebSocketState,
} from '../utils/websocket-client';

export interface UseWebSocketOptions {
  url: string;
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  reconnectDecay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnecting?: (attempt: number) => void;
  onReconnected?: () => void;
}

export interface UseWebSocketReturn {
  // Connection state
  status: ConnectionStatus;
  connected: boolean;
  connecting: boolean;
  disconnected: boolean;
  latency: number;
  queuedMessages: number;

  // Connection methods
  connect: () => void;
  disconnect: () => void;

  // Messaging
  send: (message: Omit<WebSocketMessage, 'messageId' | 'timestamp'>) => Promise<void>;
  subscribe: (channel: string) => Promise<void>;
  unsubscribe: (channel: string) => Promise<void>;
  publish: (channel: string, payload: any) => Promise<void>;

  // Subscriptions
  subscriptions: string[];

  // Utilities
  clearQueue: () => void;
}

/**
 * Hook for WebSocket connection management
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    autoConnect = true,
    reconnect = true,
    reconnectInterval = 1000,
    maxReconnectInterval = 30000,
    reconnectDecay = 1.5,
    maxReconnectAttempts = Infinity,
    heartbeatInterval = 30000,
    debug = false,
    onOpen,
    onClose,
    onError,
    onMessage,
    onReconnecting,
    onReconnected,
  } = options;

  const clientRef = useRef<WebSocketClient | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [latency, setLatency] = useState<number>(0);
  const [queuedMessages, setQueuedMessages] = useState<number>(0);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);

  // Initialize WebSocket client
  useEffect(() => {
    const config: WebSocketConfig = {
      url,
      reconnect,
      reconnectInterval,
      maxReconnectInterval,
      reconnectDecay,
      maxReconnectAttempts,
      heartbeatInterval,
      debug,
    };

    clientRef.current = createWebSocketClient(config);

    // Setup event listeners
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      clientRef.current.on('statusChange', (newStatus) => {
        setStatus(newStatus);
      })
    );

    if (onOpen) {
      unsubscribers.push(clientRef.current.on('open', onOpen));
    }

    if (onClose) {
      unsubscribers.push(clientRef.current.on('close', onClose));
    }

    if (onError) {
      unsubscribers.push(clientRef.current.on('error', onError));
    }

    if (onMessage) {
      unsubscribers.push(clientRef.current.on('message', onMessage));
    }

    if (onReconnecting) {
      unsubscribers.push(clientRef.current.on('reconnecting', onReconnecting));
    }

    if (onReconnected) {
      unsubscribers.push(clientRef.current.on('reconnected', onReconnected));
    }

    // Auto-connect
    if (autoConnect) {
      clientRef.current.connect();
    }

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [
    url,
    reconnect,
    reconnectInterval,
    maxReconnectInterval,
    reconnectDecay,
    maxReconnectAttempts,
    heartbeatInterval,
    debug,
    autoConnect,
  ]);

  // Update state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (clientRef.current) {
        const state = getWebSocketState(clientRef.current);
        setLatency(state.latency);
        setQueuedMessages(state.queuedMessages);
        setSubscriptions(state.subscriptions);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Connect method
  const connect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.connect();
    }
  }, []);

  // Disconnect method
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
  }, []);

  // Send message
  const send = useCallback(async (message: Omit<WebSocketMessage, 'messageId' | 'timestamp'>) => {
    if (clientRef.current) {
      await clientRef.current.send(message);
    } else {
      throw new Error('WebSocket client not initialized');
    }
  }, []);

  // Subscribe to channel
  const subscribe = useCallback(async (channel: string) => {
    if (clientRef.current) {
      await clientRef.current.subscribe(channel);
    } else {
      throw new Error('WebSocket client not initialized');
    }
  }, []);

  // Unsubscribe from channel
  const unsubscribe = useCallback(async (channel: string) => {
    if (clientRef.current) {
      await clientRef.current.unsubscribe(channel);
    } else {
      throw new Error('WebSocket client not initialized');
    }
  }, []);

  // Publish to channel
  const publish = useCallback(async (channel: string, payload: any) => {
    if (clientRef.current) {
      await clientRef.current.publish(channel, payload);
    } else {
      throw new Error('WebSocket client not initialized');
    }
  }, []);

  // Clear message queue
  const clearQueue = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.clearQueue();
    }
  }, []);

  return {
    // Connection state
    status,
    connected: status === 'connected',
    connecting: status === 'connecting',
    disconnected: status === 'disconnected',
    latency,
    queuedMessages,

    // Connection methods
    connect,
    disconnect,

    // Messaging
    send,
    subscribe,
    unsubscribe,
    publish,

    // Subscriptions
    subscriptions,

    // Utilities
    clearQueue,
  };
}

/**
 * Hook for subscribing to specific channel messages
 */
export function useWebSocketChannel(
  channel: string,
  onMessage: (message: WebSocketMessage) => void,
  options?: UseWebSocketOptions
): UseWebSocketReturn {
  const ws = useWebSocket(options || { url: '' });
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (ws.connected && !isSubscribed) {
      ws.subscribe(channel).then(() => {
        setIsSubscribed(true);
      });
    }

    return () => {
      if (isSubscribed) {
        ws.unsubscribe(channel);
        setIsSubscribed(false);
      }
    };
  }, [ws.connected, channel, isSubscribed]);

  // Listen for messages
  useEffect(() => {
    const client = (ws as any).clientRef?.current;

    if (client) {
      return client.on('message', (message: WebSocketMessage) => {
        if (message.channel === channel) {
          onMessage(message);
        }
      });
    }
  }, [channel, onMessage]);

  return ws;
}

/**
 * Hook for listening to all WebSocket messages
 */
export function useWebSocketMessages(
  onMessage: (message: WebSocketMessage) => void,
  options?: UseWebSocketOptions
): UseWebSocketReturn {
  const wsOptions = {
    ...options,
    onMessage,
  };

  return useWebSocket(wsOptions as UseWebSocketOptions);
}

/**
 * Hook for connection status only
 */
export function useWebSocketStatus(url: string): {
  status: ConnectionStatus;
  connected: boolean;
  connecting: boolean;
  disconnected: boolean;
} {
  const { status, connected, connecting, disconnected } = useWebSocket({
    url,
    autoConnect: true,
  });

  return { status, connected, connecting, disconnected };
}
