import sgMail from '@sendgrid/mail';

export interface EmailProvider {
  name: string;
  send(params: SendEmailParams): Promise<EmailResult>;
  sendBatch(params: SendBatchEmailParams): Promise<EmailResult[]>;
}

export interface SendEmailParams {
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface SendBatchEmailParams {
  emails: SendEmailParams[];
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  type?: string;
  disposition?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

export class SendGridClient implements EmailProvider {
  public name = 'sendgrid';
  private apiKey: string;
  private initialized = false;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SENDGRID_API_KEY || '';
    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
      this.initialized = true;
    }
  }

  async send(params: SendEmailParams): Promise<EmailResult> {
    if (!this.initialized) {
      return {
        success: false,
        error: 'SendGrid API key not configured',
        provider: this.name,
      };
    }

    try {
      const msg: any = {
        to: params.to,
        from: params.from,
        subject: params.subject,
        html: params.html,
        text: params.text,
      };

      // Add attachments if provided
      if (params.attachments && params.attachments.length > 0) {
        msg.attachments = params.attachments.map((att) => ({
          filename: att.filename,
          content: att.content.toString('base64'),
          type: att.type || 'application/octet-stream',
          disposition: att.disposition || 'attachment',
        }));
      }

      // Add custom headers
      if (params.headers) {
        msg.headers = params.headers;
      }

      // Add categories (tags)
      if (params.tags && params.tags.length > 0) {
        msg.categories = params.tags;
      }

      // Add custom args (metadata)
      if (params.metadata) {
        msg.customArgs = params.metadata;
      }

      const [response] = await sgMail.send(msg);

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
        provider: this.name,
      };
    } catch (error: any) {
      console.error('SendGrid send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email via SendGrid',
        provider: this.name,
      };
    }
  }

  async sendBatch(params: SendBatchEmailParams): Promise<EmailResult[]> {
    if (!this.initialized) {
      return params.emails.map(() => ({
        success: false,
        error: 'SendGrid API key not configured',
        provider: this.name,
      }));
    }

    try {
      const messages = params.emails.map((email) => ({
        to: email.to,
        from: email.from,
        subject: email.subject,
        html: email.html,
        text: email.text,
        attachments: email.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content.toString('base64'),
          type: att.type || 'application/octet-stream',
          disposition: att.disposition || 'attachment',
        })),
        headers: email.headers,
        categories: email.tags,
        customArgs: email.metadata,
      }));

      const response = await sgMail.send(messages);

      return response.map((res) => ({
        success: true,
        messageId: res.headers['x-message-id'] as string,
        provider: this.name,
      }));
    } catch (error: any) {
      console.error('SendGrid batch send error:', error);
      // Return individual errors for each email
      return params.emails.map(() => ({
        success: false,
        error: error.message || 'Failed to send batch emails via SendGrid',
        provider: this.name,
      }));
    }
  }
}
