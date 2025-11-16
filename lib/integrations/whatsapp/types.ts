/**
 * WhatsApp Business API TypeScript Interfaces
 * API Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

export interface WhatsAppConfig {
  businessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
  apiVersion?: string;
  webhookSecret?: string;
}

export interface WhatsAppContact {
  input: string;
  wa_id: string;
}

export interface WhatsAppMessage {
  id: string;
  messaging_product: 'whatsapp';
  to: string;
  type: string;
}

// ============================================
// Message Types
// ============================================

export interface TextMessage {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'text';
  text: {
    preview_url?: boolean;
    body: string;
  };
}

export interface ImageMessage {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'image';
  image: {
    id?: string;
    link?: string;
    caption?: string;
  };
}

export interface DocumentMessage {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'document';
  document: {
    id?: string;
    link?: string;
    caption?: string;
    filename?: string;
  };
}

export interface AudioMessage {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'audio';
  audio: {
    id?: string;
    link?: string;
  };
}

export interface VideoMessage {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'video';
  video: {
    id?: string;
    link?: string;
    caption?: string;
  };
}

export interface LocationMessage {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'location';
  location: {
    longitude: number;
    latitude: number;
    name?: string;
    address?: string;
  };
}

export interface ContactMessage {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'contacts';
  contacts: Array<{
    name: {
      formatted_name: string;
      first_name?: string;
      last_name?: string;
    };
    phones?: Array<{
      phone: string;
      type?: string;
    }>;
    emails?: Array<{
      email: string;
      type?: string;
    }>;
  }>;
}

export interface TemplateMessage {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: TemplateComponent[];
  };
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters?: TemplateParameter[];
  sub_type?: 'quick_reply' | 'url';
  index?: number;
}

export interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
  image?: {
    id?: string;
    link?: string;
  };
  document?: {
    id?: string;
    link?: string;
    filename?: string;
  };
  video?: {
    id?: string;
    link?: string;
  };
}

export interface InteractiveMessage {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'interactive';
  interactive: {
    type: 'button' | 'list' | 'product' | 'product_list';
    header?: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      image?: { id?: string; link?: string };
      video?: { id?: string; link?: string };
      document?: { id?: string; link?: string; filename?: string };
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: InteractiveAction;
  };
}

export interface InteractiveAction {
  button?: string;
  buttons?: Array<{
    type: 'reply';
    reply: {
      id: string;
      title: string;
    };
  }>;
  sections?: Array<{
    title?: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
}

export type OutgoingMessage =
  | TextMessage
  | ImageMessage
  | DocumentMessage
  | AudioMessage
  | VideoMessage
  | LocationMessage
  | ContactMessage
  | TemplateMessage
  | InteractiveMessage;

// ============================================
// Response Types
// ============================================

export interface MessageResponse {
  messaging_product: 'whatsapp';
  contacts: WhatsAppContact[];
  messages: Array<{
    id: string;
  }>;
}

export interface MessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id?: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
    error_data?: {
      details: string;
    };
  }>;
}

// ============================================
// Webhook Types
// ============================================

export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  value: WebhookValue;
  field: string;
}

export interface WebhookValue {
  messaging_product: 'whatsapp';
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: {
      name: string;
    };
    wa_id: string;
  }>;
  messages?: IncomingMessage[];
  statuses?: MessageStatus[];
  errors?: Array<{
    code: number;
    title: string;
    message: string;
    error_data?: {
      details: string;
    };
  }>;
}

export interface IncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contacts' | 'interactive' | 'button';
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
  audio?: {
    id: string;
    mime_type: string;
    sha256: string;
  };
  video?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
  document?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
    filename?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts?: Array<{
    name: {
      formatted_name: string;
      first_name?: string;
      last_name?: string;
    };
    phones?: Array<{
      phone: string;
      type?: string;
    }>;
  }>;
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
  button?: {
    text: string;
    payload: string;
  };
  context?: {
    from: string;
    id: string;
  };
}

export interface WebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

// ============================================
// Template Types
// ============================================

export interface MessageTemplate {
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    example?: {
      header_text?: string[];
      body_text?: string[][];
    };
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  }>;
}

// ============================================
// Media Types
// ============================================

export interface MediaUploadResponse {
  id: string;
}

export interface MediaInfo {
  messaging_product: 'whatsapp';
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
}

// ============================================
// Phone Number Types
// ============================================

export interface PhoneNumberInfo {
  verified_name: string;
  code_verification_status: string;
  display_phone_number: string;
  quality_rating: 'GREEN' | 'YELLOW' | 'RED';
  platform_type: string;
  throughput: {
    level: string;
  };
  webhook_configuration?: {
    application: string;
    webhooks_url: string;
  };
  last_onboarded_time?: string;
}

// ============================================
// Queue Management Types
// ============================================

export interface QueuedMessage {
  id: string;
  message: OutgoingMessage;
  priority: number;
  retries: number;
  maxRetries: number;
  scheduledAt?: Date;
  createdAt: Date;
}

export interface MessageQueueConfig {
  maxConcurrent?: number;
  retryDelay?: number;
  maxRetries?: number;
}
