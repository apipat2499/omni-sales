import { SendGridClient } from './sendgrid-client';
import { MailgunClient } from './mailgun-client';
import { NodemailerClient } from './nodemailer-client';
import type {
  EmailProvider,
  SendEmailParams,
  SendBatchEmailParams,
  EmailResult,
} from './sendgrid-client';

export type ProviderType = 'sendgrid' | 'mailgun' | 'nodemailer';

export interface ProviderConfig {
  primary: ProviderType;
  fallbacks?: ProviderType[];
  retryAttempts?: number;
  retryDelay?: number; // in milliseconds
}

export class EmailProviderManager {
  private providers: Map<ProviderType, EmailProvider>;
  private config: ProviderConfig;

  constructor(config?: ProviderConfig) {
    this.config = config || {
      primary: (process.env.EMAIL_PROVIDER as ProviderType) || 'sendgrid',
      fallbacks: ['mailgun', 'nodemailer'],
      retryAttempts: 3,
      retryDelay: 1000,
    };

    // Initialize all providers
    this.providers = new Map();
    this.providers.set('sendgrid', new SendGridClient());
    this.providers.set('mailgun', new MailgunClient());
    this.providers.set('nodemailer', new NodemailerClient());
  }

  /**
   * Send email with automatic failover to backup providers
   */
  async send(params: SendEmailParams): Promise<EmailResult> {
    const providerOrder = [
      this.config.primary,
      ...(this.config.fallbacks || []),
    ];

    let lastError: string = '';

    for (const providerType of providerOrder) {
      const provider = this.providers.get(providerType);
      if (!provider) continue;

      // Try sending with retry logic
      for (let attempt = 0; attempt < (this.config.retryAttempts || 1); attempt++) {
        const result = await provider.send(params);

        if (result.success) {
          // Log successful send
          console.log(
            `Email sent successfully via ${providerType} (attempt ${attempt + 1})`
          );
          return result;
        }

        lastError = result.error || 'Unknown error';
        console.warn(
          `Failed to send via ${providerType} (attempt ${attempt + 1}/${
            this.config.retryAttempts
          }): ${lastError}`
        );

        // Wait before retry (exponential backoff)
        if (attempt < (this.config.retryAttempts || 1) - 1) {
          const delay = (this.config.retryDelay || 1000) * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }

      // If we get here, all retries failed for this provider
      console.error(
        `All retry attempts failed for ${providerType}, trying next provider`
      );
    }

    // All providers failed
    return {
      success: false,
      error: `All email providers failed. Last error: ${lastError}`,
    };
  }

  /**
   * Send batch emails with automatic failover
   */
  async sendBatch(params: SendBatchEmailParams): Promise<EmailResult[]> {
    const providerOrder = [
      this.config.primary,
      ...(this.config.fallbacks || []),
    ];

    let lastError: string = '';

    for (const providerType of providerOrder) {
      const provider = this.providers.get(providerType);
      if (!provider) continue;

      const result = await provider.sendBatch(params);

      // Check if at least some emails were sent successfully
      const successCount = result.filter((r) => r.success).length;

      if (successCount === params.emails.length) {
        console.log(`All ${successCount} emails sent successfully via ${providerType}`);
        return result;
      } else if (successCount > 0) {
        console.warn(
          `Partial success via ${providerType}: ${successCount}/${params.emails.length} sent`
        );
        return result;
      }

      lastError = result[0]?.error || 'Unknown error';
      console.error(`Failed to send batch via ${providerType}: ${lastError}`);
    }

    // All providers failed
    return params.emails.map(() => ({
      success: false,
      error: `All email providers failed. Last error: ${lastError}`,
    }));
  }

  /**
   * Get the current primary provider
   */
  getPrimaryProvider(): EmailProvider | undefined {
    return this.providers.get(this.config.primary);
  }

  /**
   * Set the primary provider
   */
  setPrimaryProvider(provider: ProviderType): void {
    this.config.primary = provider;
  }

  /**
   * Get all available providers
   */
  getProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
let managerInstance: EmailProviderManager | null = null;

export function getEmailProviderManager(config?: ProviderConfig): EmailProviderManager {
  if (!managerInstance) {
    managerInstance = new EmailProviderManager(config);
  }
  return managerInstance;
}
