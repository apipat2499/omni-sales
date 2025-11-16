import nodemailer from 'nodemailer';
import {
  EmailProvider,
  SendEmailParams,
  SendBatchEmailParams,
  EmailResult,
} from './sendgrid-client';

export class NodemailerClient implements EmailProvider {
  public name = 'nodemailer';
  private transporter: any;
  private initialized = false;

  constructor(config?: any) {
    const transportConfig = config || {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    if (transportConfig.auth.user && transportConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(transportConfig);
      this.initialized = true;
    }
  }

  async send(params: SendEmailParams): Promise<EmailResult> {
    if (!this.initialized) {
      return {
        success: false,
        error: 'Nodemailer SMTP credentials not configured',
        provider: this.name,
      };
    }

    try {
      const mailOptions: any = {
        from: params.from,
        to: Array.isArray(params.to) ? params.to.join(', ') : params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      };

      // Add attachments if provided
      if (params.attachments && params.attachments.length > 0) {
        mailOptions.attachments = params.attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.type,
        }));
      }

      // Add custom headers
      if (params.headers) {
        mailOptions.headers = params.headers;
      }

      // Add metadata as custom headers
      if (params.metadata) {
        mailOptions.headers = {
          ...mailOptions.headers,
          'X-Metadata': JSON.stringify(params.metadata),
        };
      }

      if (params.tags && params.tags.length > 0) {
        mailOptions.headers = {
          ...mailOptions.headers,
          'X-Tags': params.tags.join(','),
        };
      }

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        provider: this.name,
      };
    } catch (error: any) {
      console.error('Nodemailer send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email via Nodemailer',
        provider: this.name,
      };
    }
  }

  async sendBatch(params: SendBatchEmailParams): Promise<EmailResult[]> {
    // Send emails individually
    const results = await Promise.all(
      params.emails.map((email) => this.send(email))
    );
    return results;
  }

  // Verify connection
  async verify(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Nodemailer verification error:', error);
      return false;
    }
  }
}
