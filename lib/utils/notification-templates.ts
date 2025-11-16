/**
 * Notification Templates Service
 *
 * Email and SMS template management, rendering, and preview generation.
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Type Definitions
// ============================================================================

export type TemplateType = 'email' | 'sms';
export type TemplateCategory = 'order' | 'customer' | 'payment' | 'inventory' | 'marketing' | 'system';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: TemplateType;
  category: TemplateCategory;

  // Email specific
  subject?: string;
  htmlBody?: string;
  textBody?: string;

  // SMS specific
  smsBody?: string;

  // Common
  variables: string[];
  description?: string;

  // Metadata
  isActive: boolean;
  isDefault: boolean;

  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

export interface RenderOptions {
  variables: Record<string, any>;
  escapeHtml?: boolean;
}

export interface TemplatePreview {
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  smsContent?: string;
}

// ============================================================================
// Constants
// ============================================================================

const TEMPLATE_STORAGE_KEY = 'notification_templates';

// Common template variables
export const COMMON_VARIABLES: Record<string, TemplateVariable> = {
  // Customer variables
  customerName: {
    name: 'customerName',
    description: 'Customer full name',
    example: 'John Doe',
    required: false,
  },
  customerEmail: {
    name: 'customerEmail',
    description: 'Customer email address',
    example: 'john@example.com',
    required: false,
  },
  customerPhone: {
    name: 'customerPhone',
    description: 'Customer phone number',
    example: '+1234567890',
    required: false,
  },

  // Order variables
  orderNumber: {
    name: 'orderNumber',
    description: 'Order number',
    example: 'ORD-12345',
    required: false,
  },
  orderDate: {
    name: 'orderDate',
    description: 'Order date',
    example: '2024-01-15',
    required: false,
  },
  orderTotal: {
    name: 'orderTotal',
    description: 'Order total amount',
    example: '$150.00',
    required: false,
  },
  orderStatus: {
    name: 'orderStatus',
    description: 'Order status',
    example: 'Processing',
    required: false,
  },
  orderItems: {
    name: 'orderItems',
    description: 'List of order items',
    example: '3 items',
    required: false,
  },
  trackingNumber: {
    name: 'trackingNumber',
    description: 'Shipping tracking number',
    example: '1Z999AA10123456784',
    required: false,
  },
  trackingUrl: {
    name: 'trackingUrl',
    description: 'Tracking URL',
    example: 'https://tracking.example.com/12345',
    required: false,
  },

  // Payment variables
  paymentAmount: {
    name: 'paymentAmount',
    description: 'Payment amount',
    example: '$150.00',
    required: false,
  },
  paymentMethod: {
    name: 'paymentMethod',
    description: 'Payment method',
    example: 'Credit Card',
    required: false,
  },
  invoiceNumber: {
    name: 'invoiceNumber',
    description: 'Invoice number',
    example: 'INV-12345',
    required: false,
  },
  invoiceUrl: {
    name: 'invoiceUrl',
    description: 'Invoice download URL',
    example: 'https://app.example.com/invoices/12345',
    required: false,
  },

  // Product variables
  productName: {
    name: 'productName',
    description: 'Product name',
    example: 'Widget Pro',
    required: false,
  },
  productUrl: {
    name: 'productUrl',
    description: 'Product URL',
    example: 'https://shop.example.com/product/123',
    required: false,
  },
  stockQuantity: {
    name: 'stockQuantity',
    description: 'Stock quantity',
    example: '5',
    required: false,
  },

  // Generic variables
  companyName: {
    name: 'companyName',
    description: 'Company name',
    example: 'OmniSales',
    required: false,
  },
  supportEmail: {
    name: 'supportEmail',
    description: 'Support email',
    example: 'support@omnisales.com',
    required: false,
  },
  supportPhone: {
    name: 'supportPhone',
    description: 'Support phone',
    example: '+1-800-123-4567',
    required: false,
  },
  websiteUrl: {
    name: 'websiteUrl',
    description: 'Website URL',
    example: 'https://omnisales.com',
    required: false,
  },
  currentYear: {
    name: 'currentYear',
    description: 'Current year',
    example: '2024',
    required: false,
  },
};

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * Get all templates from storage
 */
export function getAllTemplates(): NotificationTemplate[] {
  try {
    const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (!stored) return getDefaultTemplates();

    const templates = JSON.parse(stored) as NotificationTemplate[];
    return templates.map(t => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
    }));
  } catch (error) {
    console.error('Error loading templates:', error);
    return getDefaultTemplates();
  }
}

/**
 * Save template to storage
 */
export function saveTemplate(template: NotificationTemplate): void {
  try {
    const templates = getAllTemplates();
    const index = templates.findIndex(t => t.id === template.id);

    if (index >= 0) {
      templates[index] = template;
    } else {
      templates.push(template);
    }

    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving template:', error);
  }
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): NotificationTemplate | null {
  const templates = getAllTemplates();
  return templates.find(t => t.id === id) || null;
}

/**
 * Delete template
 */
export function deleteTemplate(id: string): boolean {
  try {
    const templates = getAllTemplates();
    const filtered = templates.filter(t => t.id !== id);

    if (filtered.length === templates.length) {
      return false;
    }

    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    return false;
  }
}

/**
 * Get templates by type
 */
export function getTemplatesByType(type: TemplateType): NotificationTemplate[] {
  return getAllTemplates().filter(t => t.type === type);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): NotificationTemplate[] {
  return getAllTemplates().filter(t => t.category === category);
}

/**
 * Get active templates
 */
export function getActiveTemplates(type?: TemplateType): NotificationTemplate[] {
  let templates = getAllTemplates().filter(t => t.isActive);
  if (type) {
    templates = templates.filter(t => t.type === type);
  }
  return templates;
}

// ============================================================================
// Template Creation
// ============================================================================

/**
 * Create a new template
 */
export function createTemplate(
  params: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'variables'>
): NotificationTemplate {
  const now = new Date();

  // Extract variables from template content
  const variables = extractVariables(params);

  const template: NotificationTemplate = {
    ...params,
    id: uuidv4(),
    variables,
    createdAt: now,
    updatedAt: now,
  };

  saveTemplate(template);
  return template;
}

/**
 * Update template
 */
export function updateTemplate(id: string, updates: Partial<NotificationTemplate>): NotificationTemplate | null {
  const template = getTemplateById(id);
  if (!template) return null;

  // Extract variables if content changed
  const variables = extractVariables({ ...template, ...updates });

  const updated: NotificationTemplate = {
    ...template,
    ...updates,
    variables,
    updatedAt: new Date(),
  };

  saveTemplate(updated);
  return updated;
}

// ============================================================================
// Variable Extraction
// ============================================================================

/**
 * Extract variables from template content
 */
export function extractVariables(template: Pick<NotificationTemplate, 'subject' | 'htmlBody' | 'textBody' | 'smsBody'>): string[] {
  const content = [
    template.subject,
    template.htmlBody,
    template.textBody,
    template.smsBody,
  ].filter(Boolean).join(' ');

  // Match {{variableName}} patterns
  const matches = content.match(/\{\{([^}]+)\}\}/g) || [];

  const variables = matches.map(match => {
    // Extract variable name (remove {{ and }})
    return match.replace(/\{\{|\}\}/g, '').trim();
  });

  // Return unique variables
  return Array.from(new Set(variables));
}

/**
 * Validate template variables
 */
export function validateTemplateVariables(
  template: NotificationTemplate,
  variables: Record<string, any>
): { valid: boolean; missing: string[]; errors: string[] } {
  const missing: string[] = [];
  const errors: string[] = [];

  template.variables.forEach(varName => {
    const varDef = COMMON_VARIABLES[varName];

    if (varDef && varDef.required && !(varName in variables)) {
      missing.push(varName);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
    errors,
  };
}

// ============================================================================
// Template Rendering
// ============================================================================

/**
 * Render template with variables
 */
export function renderTemplate(
  template: NotificationTemplate,
  options: RenderOptions
): TemplatePreview {
  const { variables, escapeHtml = true } = options;

  // Helper function to replace variables
  const replaceVariables = (content: string, shouldEscape: boolean = false): string => {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const trimmedVar = varName.trim();
      let value = variables[trimmedVar];

      if (value === undefined || value === null) {
        return match; // Keep placeholder if variable not provided
      }

      // Convert to string
      value = String(value);

      // Escape HTML if needed
      if (shouldEscape && escapeHtml) {
        value = escapeHtmlChars(value);
      }

      return value;
    });
  };

  const preview: TemplatePreview = {};

  if (template.type === 'email') {
    if (template.subject) {
      preview.subject = replaceVariables(template.subject, false);
    }
    if (template.htmlBody) {
      preview.htmlContent = replaceVariables(template.htmlBody, true);
    }
    if (template.textBody) {
      preview.textContent = replaceVariables(template.textBody, false);
    }
  } else if (template.type === 'sms') {
    if (template.smsBody) {
      preview.smsContent = replaceVariables(template.smsBody, false);
    }
  }

  return preview;
}

/**
 * Escape HTML characters
 */
function escapeHtmlChars(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, char => htmlEscapeMap[char]);
}

/**
 * Generate preview with sample data
 */
export function generatePreview(template: NotificationTemplate): TemplatePreview {
  const sampleVariables: Record<string, any> = {};

  // Populate with sample data
  template.variables.forEach(varName => {
    const varDef = COMMON_VARIABLES[varName];
    if (varDef) {
      sampleVariables[varName] = varDef.example;
    } else {
      sampleVariables[varName] = `[${varName}]`;
    }
  });

  return renderTemplate(template, { variables: sampleVariables });
}

// ============================================================================
// Default Templates
// ============================================================================

/**
 * Get default templates
 */
export function getDefaultTemplates(): NotificationTemplate[] {
  const now = new Date();

  return [
    // Order Confirmation Email
    {
      id: 'tpl_order_confirmation_email',
      name: 'Order Confirmation',
      type: 'email',
      category: 'order',
      subject: 'Order Confirmation - {{orderNumber}}',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for your order!</h2>
          <p>Hi {{customerName}},</p>
          <p>We've received your order and we're getting it ready. Here are the details:</p>

          <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Order Number:</strong> {{orderNumber}}</p>
            <p><strong>Order Date:</strong> {{orderDate}}</p>
            <p><strong>Total:</strong> {{orderTotal}}</p>
          </div>

          <p>We'll send you another email when your order ships.</p>

          <p>Thanks,<br>{{companyName}} Team</p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            If you have any questions, contact us at {{supportEmail}}
          </p>
        </div>
      `,
      textBody: `Thank you for your order!\n\nHi {{customerName}},\n\nWe've received your order and we're getting it ready.\n\nOrder Number: {{orderNumber}}\nOrder Date: {{orderDate}}\nTotal: {{orderTotal}}\n\nWe'll send you another email when your order ships.\n\nThanks,\n{{companyName}} Team`,
      variables: ['customerName', 'orderNumber', 'orderDate', 'orderTotal', 'companyName', 'supportEmail'],
      description: 'Email sent when an order is confirmed',
      isActive: true,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },

    // Order Shipped Email
    {
      id: 'tpl_order_shipped_email',
      name: 'Order Shipped',
      type: 'email',
      category: 'order',
      subject: 'Your Order Has Shipped - {{orderNumber}}',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your order is on its way!</h2>
          <p>Hi {{customerName}},</p>
          <p>Great news! Your order has been shipped and is on its way to you.</p>

          <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Order Number:</strong> {{orderNumber}}</p>
            <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{trackingUrl}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Track Your Package</a>
          </div>

          <p>Thanks for shopping with us!</p>
          <p>{{companyName}} Team</p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">
            Questions? Contact us at {{supportEmail}}
          </p>
        </div>
      `,
      textBody: `Your order is on its way!\n\nHi {{customerName}},\n\nGreat news! Your order has been shipped.\n\nOrder Number: {{orderNumber}}\nTracking Number: {{trackingNumber}}\n\nTrack your package: {{trackingUrl}}\n\nThanks for shopping with us!\n{{companyName}} Team`,
      variables: ['customerName', 'orderNumber', 'trackingNumber', 'trackingUrl', 'companyName', 'supportEmail'],
      description: 'Email sent when an order is shipped',
      isActive: true,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },

    // Order Confirmation SMS
    {
      id: 'tpl_order_confirmation_sms',
      name: 'Order Confirmation SMS',
      type: 'sms',
      category: 'order',
      smsBody: 'Hi {{customerName}}! Your order {{orderNumber}} for {{orderTotal}} has been confirmed. Thanks for shopping with {{companyName}}!',
      variables: ['customerName', 'orderNumber', 'orderTotal', 'companyName'],
      description: 'SMS sent when an order is confirmed',
      isActive: true,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },

    // Order Shipped SMS
    {
      id: 'tpl_order_shipped_sms',
      name: 'Order Shipped SMS',
      type: 'sms',
      category: 'order',
      smsBody: 'Your order {{orderNumber}} has shipped! Track it here: {{trackingUrl}}',
      variables: ['orderNumber', 'trackingUrl'],
      description: 'SMS sent when an order is shipped',
      isActive: true,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },

    // Payment Receipt Email
    {
      id: 'tpl_payment_receipt_email',
      name: 'Payment Receipt',
      type: 'email',
      category: 'payment',
      subject: 'Payment Receipt - {{invoiceNumber}}',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Payment Received</h2>
          <p>Hi {{customerName}},</p>
          <p>Thank you for your payment. Here's your receipt:</p>

          <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Invoice Number:</strong> {{invoiceNumber}}</p>
            <p><strong>Amount Paid:</strong> {{paymentAmount}}</p>
            <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{invoiceUrl}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Download Invoice</a>
          </div>

          <p>Best regards,<br>{{companyName}} Team</p>
        </div>
      `,
      textBody: `Payment Received\n\nHi {{customerName}},\n\nThank you for your payment.\n\nInvoice Number: {{invoiceNumber}}\nAmount Paid: {{paymentAmount}}\nPayment Method: {{paymentMethod}}\n\nDownload invoice: {{invoiceUrl}}\n\nBest regards,\n{{companyName}} Team`,
      variables: ['customerName', 'invoiceNumber', 'paymentAmount', 'paymentMethod', 'invoiceUrl', 'companyName'],
      description: 'Email sent when payment is received',
      isActive: true,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },

    // Welcome Email
    {
      id: 'tpl_welcome_email',
      name: 'Welcome Email',
      type: 'email',
      category: 'customer',
      subject: 'Welcome to {{companyName}}!',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Welcome to {{companyName}}!</h1>
          <p>Hi {{customerName}},</p>
          <p>Thanks for joining us! We're excited to have you as part of our community.</p>

          <p>Here's what you can do next:</p>
          <ul>
            <li>Browse our products</li>
            <li>Set up your preferences</li>
            <li>Track your orders</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{websiteUrl}}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Shopping</a>
          </div>

          <p>If you need any help, we're here for you at {{supportEmail}}</p>

          <p>Happy shopping!<br>The {{companyName}} Team</p>
        </div>
      `,
      textBody: `Welcome to {{companyName}}!\n\nHi {{customerName}},\n\nThanks for joining us! We're excited to have you as part of our community.\n\nStart shopping: {{websiteUrl}}\n\nNeed help? Contact us at {{supportEmail}}\n\nHappy shopping!\nThe {{companyName}} Team`,
      variables: ['customerName', 'companyName', 'websiteUrl', 'supportEmail'],
      description: 'Welcome email for new customers',
      isActive: true,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },

    // Low Stock Alert Email
    {
      id: 'tpl_low_stock_email',
      name: 'Low Stock Alert',
      type: 'email',
      category: 'inventory',
      subject: 'Low Stock Alert - {{productName}}',
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b6b;">Low Stock Alert</h2>
          <p>The following product is running low on stock:</p>

          <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107; border-radius: 5px;">
            <p><strong>Product:</strong> {{productName}}</p>
            <p><strong>Current Stock:</strong> {{stockQuantity}} units</p>
          </div>

          <p>Please restock soon to avoid stockouts.</p>

          <p>{{companyName}} Inventory System</p>
        </div>
      `,
      textBody: `Low Stock Alert\n\nThe following product is running low on stock:\n\nProduct: {{productName}}\nCurrent Stock: {{stockQuantity}} units\n\nPlease restock soon to avoid stockouts.\n\n{{companyName}} Inventory System`,
      variables: ['productName', 'stockQuantity', 'companyName'],
      description: 'Alert email for low stock items',
      isActive: true,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Initialize default templates
 */
export function initializeDefaultTemplates(): void {
  const existing = getAllTemplates();
  if (existing.length === 0) {
    const defaults = getDefaultTemplates();
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(defaults));
  }
}

// ============================================================================
// Export template service
// ============================================================================

export const templateService = {
  // Storage
  getAllTemplates,
  getTemplateById,
  saveTemplate,
  deleteTemplate,
  getTemplatesByType,
  getTemplatesByCategory,
  getActiveTemplates,

  // Creation
  createTemplate,
  updateTemplate,

  // Variables
  extractVariables,
  validateTemplateVariables,

  // Rendering
  renderTemplate,
  generatePreview,

  // Defaults
  getDefaultTemplates,
  initializeDefaultTemplates,
};

export default templateService;
