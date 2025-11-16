'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  WebSocketEvent,
  WebSocketEventType,
  WebSocketNamespace,
  WebSocketAuthToken,
  UserRole,
} from '@/lib/websocket/types';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  auth?: WebSocketAuthToken;
  namespaces?: WebSocketNamespace[];
  debug?: boolean;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  reconnectAttempts: number;
}

type EventHandler<T = any> = (data: T, event: WebSocketEvent<T>) => void;

/**
 * Custom hook for WebSocket connection management
 * Handles connection, reconnection, authentication, and event handling
 */
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = typeof window !== 'undefined'
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`
      : '',
    autoConnect = true,
    reconnect = true,
    reconnectInterval = 1000,
    maxReconnectAttempts = 5,
    auth,
    namespaces = [],
    debug = false,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventHandlersRef = useRef<Map<WebSocketEventType, Set<EventHandler>>>(new Map());
  const subscribedNamespacesRef = useRef<Set<WebSocketNamespace>>(new Set());

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    isAuthenticated: false,
    error: null,
    reconnectAttempts: 0,
  });

  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log('[useWebSocket]', ...args);
    }
  }, [debug]);

  /**
   * Calculate exponential backoff delay
   */
  const getReconnectDelay = useCallback((attempt: number): number => {
    return Math.min(reconnectInterval * Math.pow(2, attempt), 30000); // Max 30s
  }, [reconnectInterval]);

  /**
   * Send message through WebSocket
   */
  const send = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      log('Sent message:', message);
    } else {
      console.warn('[useWebSocket] Cannot send message: WebSocket not connected');
    }
  }, [log]);

  /**
   * Subscribe to a namespace
   */
  const subscribe = useCallback((namespace: WebSocketNamespace) => {
    if (!subscribedNamespacesRef.current.has(namespace)) {
      subscribedNamespacesRef.current.add(namespace);
      send({ type: 'subscribe', data: { namespace } });
      log('Subscribed to namespace:', namespace);
    }
  }, [send, log]);

  /**
   * Unsubscribe from a namespace
   */
  const unsubscribe = useCallback((namespace: WebSocketNamespace) => {
    if (subscribedNamespacesRef.current.has(namespace)) {
      subscribedNamespacesRef.current.delete(namespace);
      send({ type: 'unsubscribe', data: { namespace } });
      log('Unsubscribed from namespace:', namespace);
    }
  }, [send, log]);

  /**
   * Register event handler
   */
  const on = useCallback(<T = any>(eventType: WebSocketEventType, handler: EventHandler<T>) => {
    if (!eventHandlersRef.current.has(eventType)) {
      eventHandlersRef.current.set(eventType, new Set());
    }
    eventHandlersRef.current.get(eventType)!.add(handler as EventHandler);
    log('Registered handler for:', eventType);

    // Return cleanup function
    return () => {
      const handlers = eventHandlersRef.current.get(eventType);
      if (handlers) {
        handlers.delete(handler as EventHandler);
        if (handlers.size === 0) {
          eventHandlersRef.current.delete(eventType);
        }
      }
    };
  }, [log]);

  /**
   * Unregister event handler
   */
  const off = useCallback((eventType: WebSocketEventType, handler?: EventHandler) => {
    if (handler) {
      const handlers = eventHandlersRef.current.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          eventHandlersRef.current.delete(eventType);
        }
      }
    } else {
      eventHandlersRef.current.delete(eventType);
    }
    log('Unregistered handler for:', eventType);
  }, [log]);

  /**
   * Handle incoming messages
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketEvent = JSON.parse(event.data);
      log('Received message:', message);

      // Handle special system messages
      if (message.type === 'system:notification') {
        if (message.data.message === 'Authentication successful') {
          setState(prev => ({ ...prev, isAuthenticated: true }));
        }
      }

      // Call registered handlers
      const handlers = eventHandlersRef.current.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.data, message);
          } catch (error) {
            console.error('[useWebSocket] Error in event handler:', error);
          }
        });
      }
    } catch (error) {
      console.error('[useWebSocket] Error parsing message:', error);
    }
  }, [log]);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      log('Already connected or connecting');
      return;
    }

    if (!url) {
      console.error('[useWebSocket] No URL provided');
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    log('Connecting to:', url);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        log('Connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          reconnectAttempts: 0,
          error: null,
        }));

        // Send authentication if provided
        if (auth) {
          send({ type: 'auth', data: auth });
        }

        // Subscribe to initial namespaces
        namespaces.forEach(ns => subscribe(ns));

        // Re-subscribe to previously subscribed namespaces
        subscribedNamespacesRef.current.forEach(ns => {
          if (!namespaces.includes(ns)) {
            subscribe(ns);
          }
        });
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        log('Error:', error);
        setState(prev => ({
          ...prev,
          error: new Error('WebSocket error occurred')
        }));
      };

      ws.onclose = (event) => {
        log('Disconnected:', event.code, event.reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          isAuthenticated: false,
        }));

        // Attempt reconnection
        if (reconnect && state.reconnectAttempts < maxReconnectAttempts) {
          const delay = getReconnectDelay(state.reconnectAttempts);
          log(`Reconnecting in ${delay}ms (attempt ${state.reconnectAttempts + 1}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            setState(prev => ({
              ...prev,
              reconnectAttempts: prev.reconnectAttempts + 1
            }));
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[useWebSocket] Connection error:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error as Error,
      }));
    }
  }, [url, auth, namespaces, reconnect, maxReconnectAttempts, state.reconnectAttempts, getReconnectDelay, send, subscribe, handleMessage, log]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setState({
      isConnected: false,
      isConnecting: false,
      isAuthenticated: false,
      error: null,
      reconnectAttempts: 0,
    });

    log('Disconnected');
  }, [log]);

  /**
   * Authenticate with the server
   */
  const authenticate = useCallback((authToken: WebSocketAuthToken) => {
    send({ type: 'auth', data: authToken });
  }, [send]);

  /**
   * Send ping to keep connection alive
   */
  const ping = useCallback(() => {
    send({ type: 'ping' });
  }, [send]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, []); // Only run on mount/unmount

  // Setup ping interval
  useEffect(() => {
    if (!state.isConnected) return;

    const pingInterval = setInterval(() => {
      ping();
    }, 30000); // Ping every 30 seconds

    return () => {
      clearInterval(pingInterval);
    };
  }, [state.isConnected, ping]);

  return {
    // State
    ...state,

    // Methods
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    on,
    off,
    authenticate,
    ping,

    // Helpers
    isReady: state.isConnected && state.isAuthenticated,
  };
}

/**
 * Hook to listen to specific event type
 */
export function useWebSocketEvent<T = any>(
  eventType: WebSocketEventType,
  handler: EventHandler<T>,
  deps: any[] = []
) {
  const ws = useWebSocket({ autoConnect: false });

  useEffect(() => {
    const cleanup = ws.on(eventType, handler);
    return cleanup;
  }, [eventType, ...deps]);

  return ws;
}

/**
 * Hook to subscribe to a namespace
 */
export function useWebSocketNamespace(namespace: WebSocketNamespace, autoSubscribe = true) {
  const ws = useWebSocket();

  useEffect(() => {
    if (autoSubscribe && ws.isConnected) {
      ws.subscribe(namespace);
    }

    return () => {
      if (autoSubscribe) {
        ws.unsubscribe(namespace);
      }
    };
  }, [namespace, autoSubscribe, ws.isConnected]);

  return ws;
}
