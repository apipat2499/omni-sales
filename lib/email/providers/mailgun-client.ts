import formData from 'form-data';
import Mailgun from 'mailgun.js';
import {
  EmailProvider,
  SendEmailParams,
  SendBatchEmailParams,
  EmailResult,
} from './sendgrid-client';

export class MailgunClient implements EmailProvider {
  public name = 'mailgun';
  private client: any;
  private domain: string;
  private initialized = false;

  constructor(apiKey?: string, domain?: string) {
    const key = apiKey || process.env.MAILGUN_API_KEY || '';
    this.domain = domain || process.env.MAILGUN_DOMAIN || '';

    if (key && this.domain) {
      const mailgun = new Mailgun(formData);
      this.client = mailgun.client({
        username: 'api',
        key: key,
      });
      this.initialized = true;
    }
  }

  async send(params: SendEmailParams): Promise<EmailResult> {
    if (!this.initialized) {
      return {
        success: false,
        error: 'Mailgun API key or domain not configured',
        provider: this.name,
      };
    }

    try {
      const messageData: any = {
        from: params.from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      };

      // Add attachments if provided
      if (params.attachments && params.attachments.length > 0) {
        messageData.attachment = params.attachments.map((att) => ({
          filename: att.filename,
          data: att.content,
        }));
      }

      // Add custom headers
      if (params.headers) {
        messageData['h:X-Custom-Headers'] = JSON.stringify(params.headers);
      }

      // Add tags
      if (params.tags && params.tags.length > 0) {
        messageData['o:tag'] = params.tags;
      }

      // Add custom variables (metadata)
      if (params.metadata) {
        Object.entries(params.metadata).forEach(([key, value]) => {
          messageData[`v:${key}`] = value;
        });
      }

      // Enable tracking
      messageData['o:tracking'] = 'yes';
      messageData['o:tracking-clicks'] = 'yes';
      messageData['o:tracking-opens'] = 'yes';

      const response = await this.client.messages.create(this.domain, messageData);

      return {
        success: true,
        messageId: response.id,
        provider: this.name,
      };
    } catch (error: any) {
      console.error('Mailgun send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email via Mailgun',
        provider: this.name,
      };
    }
  }

  async sendBatch(params: SendBatchEmailParams): Promise<EmailResult[]> {
    // Mailgun doesn't have a native batch API, so we send individually
    const results = await Promise.all(
      params.emails.map((email) => this.send(email))
    );
    return results;
  }
}
