/**
 * WebSocket Handler for Real-time Chat
 * Manages WebSocket connections for live chat functionality
 */

import type { ChatEvent, TypingIndicator } from './types';

/**
 * WebSocket Connection Manager
 *
 * This is a placeholder implementation. In production, you would use:
 * - Socket.IO for easier WebSocket management
 * - Redis for pub/sub across multiple server instances
 * - Proper authentication and authorization
 */

interface WebSocketClient {
  id: string;
  socket: WebSocket;
  userId: string;
  userType: 'customer' | 'agent';
  conversationId?: string;
  lastActivity: Date;
}

export class WebSocketHandler {
  private clients: Map<string, WebSocketClient> = new Map();
  private conversationClients: Map<string, Set<string>> = new Map();

  /**
   * Register a new WebSocket client
   */
  registerClient(
    clientId: string,
    socket: WebSocket,
    userId: string,
    userType: 'customer' | 'agent',
    conversationId?: string
  ): void {
    const client: WebSocketClient = {
      id: clientId,
      socket,
      userId,
      userType,
      conversationId,
      lastActivity: new Date(),
    };

    this.clients.set(clientId, client);

    if (conversationId) {
      if (!this.conversationClients.has(conversationId)) {
        this.conversationClients.set(conversationId, new Set());
      }
      this.conversationClients.get(conversationId)!.add(clientId);
    }

    // Setup event handlers
    socket.addEventListener('message', (event) => {
      this.handleMessage(clientId, event.data);
    });

    socket.addEventListener('close', () => {
      this.unregisterClient(clientId);
    });

    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.unregisterClient(clientId);
    });
  }

  /**
   * Unregister a WebSocket client
   */
  unregisterClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      if (client.conversationId) {
        const conversationClients = this.conversationClients.get(client.conversationId);
        if (conversationClients) {
          conversationClients.delete(clientId);
          if (conversationClients.size === 0) {
            this.conversationClients.delete(client.conversationId);
          }
        }
      }
      this.clients.delete(clientId);
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(clientId: string, data: string): void {
    try {
      const message = JSON.parse(data);
      const client = this.clients.get(clientId);

      if (!client) return;

      // Update last activity
      client.lastActivity = new Date();

      // Handle different message types
      switch (message.type) {
        case 'typing':
          this.handleTyping(client, message.data);
          break;
        case 'stop_typing':
          this.handleStopTyping(client, message.data);
          break;
        case 'read':
          this.handleReadReceipt(client, message.data);
          break;
        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: new Date() });
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle typing indicator
   */
  private handleTyping(client: WebSocketClient, data: any): void {
    if (!client.conversationId) return;

    const typingEvent: ChatEvent = {
      type: 'typing',
      conversationId: client.conversationId,
      data: {
        userId: client.userId,
        userName: data.userName || 'User',
        isTyping: true,
      } as TypingIndicator,
      timestamp: new Date(),
    };

    this.broadcastToConversation(client.conversationId, typingEvent, client.id);
  }

  /**
   * Handle stop typing indicator
   */
  private handleStopTyping(client: WebSocketClient, data: any): void {
    if (!client.conversationId) return;

    const typingEvent: ChatEvent = {
      type: 'typing',
      conversationId: client.conversationId,
      data: {
        userId: client.userId,
        userName: data.userName || 'User',
        isTyping: false,
      } as TypingIndicator,
      timestamp: new Date(),
    };

    this.broadcastToConversation(client.conversationId, typingEvent, client.id);
  }

  /**
   * Handle read receipt
   */
  private handleReadReceipt(client: WebSocketClient, data: any): void {
    if (!client.conversationId) return;

    const readEvent: ChatEvent = {
      type: 'read',
      conversationId: client.conversationId,
      data: {
        messageId: data.messageId,
        userId: client.userId,
      },
      timestamp: new Date(),
    };

    this.broadcastToConversation(client.conversationId, readEvent, client.id);
  }

  /**
   * Broadcast event to all clients in a conversation
   */
  broadcastToConversation(
    conversationId: string,
    event: ChatEvent,
    excludeClientId?: string
  ): void {
    const clientIds = this.conversationClients.get(conversationId);
    if (!clientIds) return;

    clientIds.forEach((clientId) => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, event);
      }
    });
  }

  /**
   * Send message to a specific client
   */
  sendToClient(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error sending to client:', error);
      }
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastToAll(data: any): void {
    this.clients.forEach((client) => {
      this.sendToClient(client.id, data);
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get clients in conversation
   */
  getConversationClientsCount(conversationId: string): number {
    return this.conversationClients.get(conversationId)?.size || 0;
  }

  /**
   * Clean up inactive connections
   */
  cleanupInactiveConnections(maxInactiveMinutes = 30): void {
    const now = new Date();
    const maxInactiveMs = maxInactiveMinutes * 60 * 1000;

    this.clients.forEach((client, clientId) => {
      const inactiveTime = now.getTime() - client.lastActivity.getTime();
      if (inactiveTime > maxInactiveMs) {
        console.log(`Cleaning up inactive client: ${clientId}`);
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.close();
        }
        this.unregisterClient(clientId);
      }
    });
  }
}

// Singleton instance
let wsHandlerInstance: WebSocketHandler | null = null;

export function getWebSocketHandler(): WebSocketHandler {
  if (!wsHandlerInstance) {
    wsHandlerInstance = new WebSocketHandler();

    // Setup cleanup interval
    setInterval(() => {
      wsHandlerInstance?.cleanupInactiveConnections();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
  return wsHandlerInstance;
}

/**
 * Example Next.js API Route for WebSocket
 *
 * Create this file: app/api/ws/route.ts
 *
 * import { NextRequest } from 'next/server';
 * import { getWebSocketHandler } from '@/lib/chat/websocket-handler';
 *
 * export async function GET(request: NextRequest) {
 *   const upgradeHeader = request.headers.get('upgrade');
 *
 *   if (upgradeHeader !== 'websocket') {
 *     return new Response('Expected Upgrade: websocket', { status: 426 });
 *   }
 *
 *   // WebSocket upgrade logic here
 *   // This requires a WebSocket server setup
 *   // Consider using Socket.IO for easier implementation
 * }
 */
