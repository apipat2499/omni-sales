/**
 * WhatsApp Business API Integration
 * Main export file
 */

export * from './types';
export * from './client';
export * from './webhook';
export * from './templates';

// Re-export commonly used functions
export {
  WhatsAppClient,
  getWhatsAppClient,
  initWhatsAppClient,
} from './client';

export {
  WhatsAppWebhookHandler,
  WebhookEventEmitter,
  getWebhookHandler,
  getEventEmitter,
  initWebhookHandler,
} from './webhook';

export {
  getAllThaiTemplates,
  getTemplateByName,
  formatOrderConfirmation,
  formatShippingUpdate,
  formatDeliveryConfirmation,
  formatPaymentReminder,
  formatPromotionalCampaign,
} from './templates';
