/**
 * Email Queue Processor
 * Background worker to process queued emails
 */

import { getEmailDatabaseService } from './database';
import { getEmailProviderManager } from './providers/provider-manager';
import type { EmailQueueEntry } from './database';

export interface QueueProcessorConfig {
  batchSize?: number; // Number of emails to process per batch
  intervalMs?: number; // Interval between batches in milliseconds
  maxRetries?: number; // Maximum retry attempts
  concurrency?: number; // Number of emails to send concurrently
}

export class EmailQueueProcessor {
  private dbService = getEmailDatabaseService();
  private providerManager = getEmailProviderManager();
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private config: Required<QueueProcessorConfig>;

  constructor(config?: QueueProcessorConfig) {
    this.config = {
      batchSize: config?.batchSize || 100,
      intervalMs: config?.intervalMs || 5000, // 5 seconds
      maxRetries: config?.maxRetries || 3,
      concurrency: config?.concurrency || 10,
    };
  }

  /**
   * Start processing queue
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Email queue processor is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting email queue processor...');

    // Process immediately
    this.processBatch();

    // Set up interval for continuous processing
    this.intervalId = setInterval(() => {
      this.processBatch();
    }, this.config.intervalMs);
  }

  /**
   * Stop processing queue
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('Email queue processor is not running');
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('Stopped email queue processor');
  }

  /**
   * Process a batch of queued emails
   */
  private async processBatch(): Promise<void> {
    try {
      // Get pending emails from queue
      const pendingEmails = await this.dbService.getPendingEmails(
        this.config.batchSize,
        this.config.maxRetries
      );

      if (pendingEmails.length === 0) {
        return; // No emails to process
      }

      console.log(`Processing ${pendingEmails.length} queued emails...`);

      // Process emails in parallel batches
      const chunks = this.chunkArray(pendingEmails, this.config.concurrency);

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map((email) => this.processEmail(email))
        );
      }

      console.log(`Finished processing batch of ${pendingEmails.length} emails`);
    } catch (error) {
      console.error('Error processing email batch:', error);
    }
  }

  /**
   * Process a single email from queue
   */
  private async processEmail(email: EmailQueueEntry): Promise<void> {
    const queueId = email.id!;

    try {
      // Validate email data
      if (!email.subject || !email.html_content || !email.recipient_email) {
        throw new Error('Invalid email data: missing required fields');
      }

      // Create email log entry
      const logId = await this.dbService.createEmailLog({
        user_id: email.user_id,
        recipient_email: email.recipient_email,
        recipient_name: email.recipient_name,
        subject: email.subject,
        template_id: email.template_id,
        campaign_id: email.campaign_id,
        status: 'pending',
        related_order_id: email.related_order_id,
        related_customer_id: email.related_customer_id,
        metadata: email.metadata,
        html_content: email.html_content,
        text_content: email.text_content,
      });

      // Send email
      const result = await this.providerManager.send({
        to: email.recipient_email,
        from: process.env.EMAIL_FROM || 'noreply@omni-sales.com',
        subject: email.subject,
        html: email.html_content,
        text: email.text_content || '',
        metadata: {
          ...email.metadata,
          queue_id: queueId,
          campaign_id: email.campaign_id,
        },
      });

      if (result.success) {
        // Update queue status to 'sent'
        await this.dbService.updateEmailQueueStatus(
          queueId,
          'sent',
          undefined,
          result.messageId
        );

        // Update log status to 'sent'
        if (logId) {
          await this.dbService.updateEmailLogStatus(logId, 'sent');
        }

        console.log(`Successfully sent email ${queueId} to ${email.recipient_email}`);
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error: any) {
      console.error(`Error processing email ${queueId}:`, error);

      // Update queue status to 'failed'
      await this.dbService.updateEmailQueueStatus(
        queueId,
        'failed',
        error.message
      );

      // Check if we should retry
      const retryCount = (email.retry_count || 0) + 1;
      if (retryCount < this.config.maxRetries) {
        console.log(`Will retry email ${queueId} (attempt ${retryCount}/${this.config.maxRetries})`);
      } else {
        console.error(`Email ${queueId} failed after ${this.config.maxRetries} attempts`);
      }
    }
  }

  /**
   * Process queue once (useful for manual/cron trigger)
   */
  async processOnce(): Promise<{ processed: number; failed: number }> {
    try {
      const pendingEmails = await this.dbService.getPendingEmails(
        this.config.batchSize,
        this.config.maxRetries
      );

      if (pendingEmails.length === 0) {
        return { processed: 0, failed: 0 };
      }

      let processed = 0;
      let failed = 0;

      // Process emails in parallel batches
      const chunks = this.chunkArray(pendingEmails, this.config.concurrency);

      for (const chunk of chunks) {
        const results = await Promise.allSettled(
          chunk.map((email) => this.processEmail(email))
        );

        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            processed++;
          } else {
            failed++;
          }
        });
      }

      return { processed, failed };
    } catch (error) {
      console.error('Error in processOnce:', error);
      return { processed: 0, failed: 0 };
    }
  }

  /**
   * Get processor status
   */
  getStatus(): {
    running: boolean;
    config: Required<QueueProcessorConfig>;
  } {
    return {
      running: this.isRunning,
      config: this.config,
    };
  }

  /**
   * Utility: Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Singleton instance
let processorInstance: EmailQueueProcessor | null = null;

export function getEmailQueueProcessor(config?: QueueProcessorConfig): EmailQueueProcessor {
  if (!processorInstance) {
    processorInstance = new EmailQueueProcessor(config);
  }
  return processorInstance;
}

/**
 * Start the queue processor (call this in your app initialization)
 */
export function startEmailQueueProcessor(config?: QueueProcessorConfig): void {
  const processor = getEmailQueueProcessor(config);
  processor.start();
}

/**
 * Stop the queue processor
 */
export function stopEmailQueueProcessor(): void {
  if (processorInstance) {
    processorInstance.stop();
  }
}
