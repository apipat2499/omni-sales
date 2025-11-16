/**
 * WhatsApp Webhook Handler
 * Processes incoming webhook events from WhatsApp Business API
 */

import crypto from 'crypto';
import type {
  WebhookPayload,
  WebhookEntry,
  IncomingMessage,
  MessageStatus,
} from './types';

export interface WebhookConfig {
  verifyToken: string;
  appSecret?: string;
}

export interface ProcessedWebhook {
  messages: Array<{
    messageId: string;
    from: string;
    timestamp: string;
    type: string;
    content: any;
    context?: {
      from: string;
      id: string;
    };
  }>;
  statuses: MessageStatus[];
  errors: any[];
}

export class WhatsAppWebhookHandler {
  private verifyToken: string;
  private appSecret?: string;

  constructor(config: WebhookConfig) {
    this.verifyToken = config.verifyToken;
    this.appSecret = config.appSecret;
  }

  /**
   * Verify webhook challenge (GET request)
   */
  verifyWebhook(params: {
    'hub.mode'?: string;
    'hub.verify_token'?: string;
    'hub.challenge'?: string;
  }): string | null {
    const mode = params['hub.mode'];
    const token = params['hub.verify_token'];
    const challenge = params['hub.challenge'];

    if (mode === 'subscribe' && token === this.verifyToken) {
      console.log('Webhook verified successfully');
      return challenge || null;
    }

    console.error('Webhook verification failed');
    return null;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string): boolean {
    if (!this.appSecret) {
      console.warn('App secret not configured, skipping signature verification');
      return true;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.appSecret)
        .update(payload)
        .digest('hex');

      const signatureHash = signature.replace('sha256=', '');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signatureHash)
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process webhook payload
   */
  processWebhook(payload: WebhookPayload): ProcessedWebhook {
    const result: ProcessedWebhook = {
      messages: [],
      statuses: [],
      errors: [],
    };

    if (payload.object !== 'whatsapp_business_account') {
      console.warn('Unknown webhook object type:', payload.object);
      return result;
    }

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const value = change.value;

        // Process incoming messages
        if (value.messages && value.messages.length > 0) {
          for (const message of value.messages) {
            result.messages.push(this.processIncomingMessage(message));
          }
        }

        // Process message statuses
        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses) {
            result.statuses.push(status);
          }
        }

        // Process errors
        if (value.errors && value.errors.length > 0) {
          for (const error of value.errors) {
            result.errors.push(error);
          }
        }
      }
    }

    return result;
  }

  /**
   * Process incoming message
   */
  private processIncomingMessage(message: IncomingMessage): {
    messageId: string;
    from: string;
    timestamp: string;
    type: string;
    content: any;
    context?: {
      from: string;
      id: string;
    };
  } {
    let content: any = {};

    switch (message.type) {
      case 'text':
        content = {
          text: message.text?.body || '',
        };
        break;

      case 'image':
        content = {
          id: message.image?.id,
          mimeType: message.image?.mime_type,
          sha256: message.image?.sha256,
          caption: message.image?.caption,
        };
        break;

      case 'audio':
        content = {
          id: message.audio?.id,
          mimeType: message.audio?.mime_type,
          sha256: message.audio?.sha256,
        };
        break;

      case 'video':
        content = {
          id: message.video?.id,
          mimeType: message.video?.mime_type,
          sha256: message.video?.sha256,
          caption: message.video?.caption,
        };
        break;

      case 'document':
        content = {
          id: message.document?.id,
          mimeType: message.document?.mime_type,
          sha256: message.document?.sha256,
          caption: message.document?.caption,
          filename: message.document?.filename,
        };
        break;

      case 'location':
        content = {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          name: message.location?.name,
          address: message.location?.address,
        };
        break;

      case 'contacts':
        content = {
          contacts: message.contacts,
        };
        break;

      case 'interactive':
        if (message.interactive?.type === 'button_reply') {
          content = {
            buttonId: message.interactive.button_reply?.id,
            buttonText: message.interactive.button_reply?.title,
          };
        } else if (message.interactive?.type === 'list_reply') {
          content = {
            listId: message.interactive.list_reply?.id,
            listTitle: message.interactive.list_reply?.title,
            listDescription: message.interactive.list_reply?.description,
          };
        }
        break;

      case 'button':
        content = {
          text: message.button?.text,
          payload: message.button?.payload,
        };
        break;

      default:
        content = { raw: message };
    }

    return {
      messageId: message.id,
      from: message.from,
      timestamp: message.timestamp,
      type: message.type,
      content,
      context: message.context,
    };
  }

  /**
   * Extract phone number from webhook
   */
  extractPhoneNumber(message: IncomingMessage): string {
    return message.from;
  }

  /**
   * Check if message is a reply
   */
  isReply(message: IncomingMessage): boolean {
    return !!message.context;
  }

  /**
   * Get reply context
   */
  getReplyContext(message: IncomingMessage): { from: string; id: string } | null {
    return message.context || null;
  }
}

// ============================================
// Webhook Event Handlers
// ============================================

export type MessageHandler = (message: {
  messageId: string;
  from: string;
  timestamp: string;
  type: string;
  content: any;
  context?: {
    from: string;
    id: string;
  };
}) => Promise<void>;

export type StatusHandler = (status: MessageStatus) => Promise<void>;

export type ErrorHandler = (error: any) => Promise<void>;

export class WebhookEventEmitter {
  private messageHandlers: MessageHandler[] = [];
  private statusHandlers: StatusHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];

  /**
   * Register message handler
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Register status handler
   */
  onStatus(handler: StatusHandler): void {
    this.statusHandlers.push(handler);
  }

  /**
   * Register error handler
   */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Emit message event
   */
  async emitMessage(message: any): Promise<void> {
    for (const handler of this.messageHandlers) {
      try {
        await handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    }
  }

  /**
   * Emit status event
   */
  async emitStatus(status: MessageStatus): Promise<void> {
    for (const handler of this.statusHandlers) {
      try {
        await handler(status);
      } catch (error) {
        console.error('Error in status handler:', error);
      }
    }
  }

  /**
   * Emit error event
   */
  async emitError(error: any): Promise<void> {
    for (const handler of this.errorHandlers) {
      try {
        await handler(error);
      } catch (error) {
        console.error('Error in error handler:', error);
      }
    }
  }

  /**
   * Process webhook with event emission
   */
  async processWebhookEvents(processed: ProcessedWebhook): Promise<void> {
    // Emit message events
    for (const message of processed.messages) {
      await this.emitMessage(message);
    }

    // Emit status events
    for (const status of processed.statuses) {
      await this.emitStatus(status);
    }

    // Emit error events
    for (const error of processed.errors) {
      await this.emitError(error);
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let webhookHandler: WhatsAppWebhookHandler | null = null;
let eventEmitter: WebhookEventEmitter | null = null;

export function getWebhookHandler(config?: WebhookConfig): WhatsAppWebhookHandler {
  if (!webhookHandler && config) {
    webhookHandler = new WhatsAppWebhookHandler(config);
  }
  if (!webhookHandler) {
    throw new Error('Webhook handler not initialized');
  }
  return webhookHandler;
}

export function getEventEmitter(): WebhookEventEmitter {
  if (!eventEmitter) {
    eventEmitter = new WebhookEventEmitter();
  }
  return eventEmitter;
}

export function initWebhookHandler(config: WebhookConfig): {
  handler: WhatsAppWebhookHandler;
  emitter: WebhookEventEmitter;
} {
  webhookHandler = new WhatsAppWebhookHandler(config);
  eventEmitter = new WebhookEventEmitter();

  return {
    handler: webhookHandler,
    emitter: eventEmitter,
  };
}
