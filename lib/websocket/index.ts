/**
 * WebSocket Module Exports
 * Central export point for all WebSocket functionality
 */

// Server
export { wsManager, default as WebSocketManager } from './server';

// Events
export { wsEvents, default as WebSocketEventEmitter } from './events';

// Types
export * from './types';

// Authentication
export * from './auth';

// Middleware
export * from './middleware';

// Helpers
export * from './helpers';

// Re-export for convenience
export { useWebSocket, useWebSocketEvent, useWebSocketNamespace } from '@/lib/hooks/useWebSocket';
