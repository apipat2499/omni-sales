/**
 * WhatsApp Business API Client
 * API Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import type {
  WhatsAppConfig,
  OutgoingMessage,
  MessageResponse,
  TextMessage,
  ImageMessage,
  DocumentMessage,
  TemplateMessage,
  InteractiveMessage,
  MediaUploadResponse,
  MediaInfo,
  PhoneNumberInfo,
  MessageTemplate,
  QueuedMessage,
  MessageQueueConfig,
} from './types';

export class WhatsAppClient {
  private businessAccountId: string;
  private phoneNumberId: string;
  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;
  private messageQueue: QueuedMessage[] = [];
  private queueConfig: MessageQueueConfig;
  private processingQueue = false;

  constructor(config: WhatsAppConfig) {
    this.businessAccountId = config.businessAccountId;
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    this.queueConfig = {
      maxConcurrent: 5,
      retryDelay: 1000,
      maxRetries: 3,
    };
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to: string, text: string, previewUrl = false): Promise<MessageResponse> {
    const message: TextMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: previewUrl,
        body: text,
      },
    };

    return this.sendMessage(message);
  }

  /**
   * Send an image message
   */
  async sendImageMessage(
    to: string,
    imageId: string,
    caption?: string
  ): Promise<MessageResponse> {
    const message: ImageMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        id: imageId,
        caption,
      },
    };

    return this.sendMessage(message);
  }

  /**
   * Send an image message by URL
   */
  async sendImageByUrl(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<MessageResponse> {
    const message: ImageMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption,
      },
    };

    return this.sendMessage(message);
  }

  /**
   * Send a document message
   */
  async sendDocumentMessage(
    to: string,
    documentId: string,
    filename?: string,
    caption?: string
  ): Promise<MessageResponse> {
    const message: DocumentMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: {
        id: documentId,
        filename,
        caption,
      },
    };

    return this.sendMessage(message);
  }

  /**
   * Send a document by URL
   */
  async sendDocumentByUrl(
    to: string,
    documentUrl: string,
    filename?: string,
    caption?: string
  ): Promise<MessageResponse> {
    const message: DocumentMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: {
        link: documentUrl,
        filename,
        caption,
      },
    };

    return this.sendMessage(message);
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string,
    components?: any[]
  ): Promise<MessageResponse> {
    const message: TemplateMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components,
      },
    };

    return this.sendMessage(message);
  }

  /**
   * Send an interactive button message
   */
  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    headerText?: string,
    footerText?: string
  ): Promise<MessageResponse> {
    const message: InteractiveMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: headerText ? { type: 'text', text: headerText } : undefined,
        body: {
          text: bodyText,
        },
        footer: footerText ? { text: footerText } : undefined,
        action: {
          buttons: buttons.map((btn) => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title,
            },
          })),
        },
      },
    };

    return this.sendMessage(message);
  }

  /**
   * Send an interactive list message
   */
  async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title?: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    headerText?: string,
    footerText?: string
  ): Promise<MessageResponse> {
    const message: InteractiveMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: headerText ? { type: 'text', text: headerText } : undefined,
        body: {
          text: bodyText,
        },
        footer: footerText ? { text: footerText } : undefined,
        action: {
          button: buttonText,
          sections,
        },
      },
    };

    return this.sendMessage(message);
  }

  /**
   * Send a message (generic method)
   */
  async sendMessage(message: OutgoingMessage): Promise<MessageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `WhatsApp API error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      return data as MessageResponse;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Upload media file
   */
  async uploadMedia(file: File | Buffer, mimeType: string): Promise<MediaUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('file', file);
      formData.append('type', mimeType);

      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp media upload error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data as MediaUploadResponse;
    } catch (error) {
      console.error('Error uploading media to WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Get media info
   */
  async getMediaInfo(mediaId: string): Promise<MediaInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/${mediaId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data as MediaInfo;
    } catch (error) {
      console.error('Error getting WhatsApp media info:', error);
      throw error;
    }
  }

  /**
   * Download media
   */
  async downloadMedia(mediaUrl: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(mediaUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error downloading WhatsApp media:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking WhatsApp message as read:', error);
      throw error;
    }
  }

  /**
   * Get phone number info
   */
  async getPhoneNumberInfo(): Promise<PhoneNumberInfo> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.phoneNumberId}?fields=verified_name,code_verification_status,display_phone_number,quality_rating,platform_type,throughput,webhook_configuration,last_onboarded_time`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data as PhoneNumberInfo;
    } catch (error) {
      console.error('Error getting WhatsApp phone number info:', error);
      throw error;
    }
  }

  /**
   * Create message template
   */
  async createTemplate(template: MessageTemplate): Promise<{ id: string; status: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.businessAccountId}/message_templates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(template),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp template creation error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating WhatsApp template:', error);
      throw error;
    }
  }

  /**
   * Get all message templates
   */
  async getTemplates(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.businessAccountId}/message_templates`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error getting WhatsApp templates:', error);
      throw error;
    }
  }

  /**
   * Delete message template
   */
  async deleteTemplate(templateName: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${this.businessAccountId}/message_templates?name=${templateName}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting WhatsApp template:', error);
      throw error;
    }
  }

  // ============================================
  // Message Queue Management
  // ============================================

  /**
   * Add message to queue
   */
  addToQueue(message: OutgoingMessage, priority = 1, scheduledAt?: Date): string {
    const queuedMessage: QueuedMessage = {
      id: Math.random().toString(36).substring(7),
      message,
      priority,
      retries: 0,
      maxRetries: this.queueConfig.maxRetries || 3,
      scheduledAt,
      createdAt: new Date(),
    };

    this.messageQueue.push(queuedMessage);
    this.messageQueue.sort((a, b) => b.priority - a.priority);

    // Start processing queue if not already processing
    if (!this.processingQueue) {
      this.processQueue();
    }

    return queuedMessage.id;
  }

  /**
   * Process message queue
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (!message) continue;

      // Check if message should be sent now
      if (message.scheduledAt && message.scheduledAt > new Date()) {
        this.messageQueue.push(message);
        continue;
      }

      try {
        await this.sendMessage(message.message);
      } catch (error) {
        console.error('Error processing queued message:', error);

        // Retry if not exceeded max retries
        if (message.retries < message.maxRetries) {
          message.retries++;
          this.messageQueue.push(message);

          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, this.queueConfig.retryDelay || 1000)
          );
        }
      }

      // Small delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    this.processingQueue = false;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    pending: number;
    processing: boolean;
  } {
    return {
      pending: this.messageQueue.length,
      processing: this.processingQueue,
    };
  }

  /**
   * Clear message queue
   */
  clearQueue(): void {
    this.messageQueue = [];
  }
}

// ============================================
// Singleton Instance
// ============================================

let whatsappClient: WhatsAppClient | null = null;

export function getWhatsAppClient(config?: WhatsAppConfig): WhatsAppClient {
  if (!whatsappClient && config) {
    whatsappClient = new WhatsAppClient(config);
  }
  if (!whatsappClient) {
    throw new Error('WhatsApp client not initialized');
  }
  return whatsappClient;
}

export function initWhatsAppClient(config: WhatsAppConfig): WhatsAppClient {
  whatsappClient = new WhatsAppClient(config);
  return whatsappClient;
}
