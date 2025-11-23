import { NextRequest, NextResponse } from 'next/server';
import { getEmailProviderManager } from '@/lib/email/providers/provider-manager';
import { getEmailTemplateManager } from '@/lib/email/templates/template-manager';
import { getEmailRateLimiter } from '@/lib/email/deliverability/rate-limiter';
import { getBounceHandler } from '@/lib/email/deliverability/bounce-handler';
import { getEmailDatabaseService } from '@/lib/email/database';

/**
 * POST /api/email/send
 * Send a single email with multi-provider support and database logging
 */
export async function POST(request: NextRequest) {
  const dbService = getEmailDatabaseService();
  let logId: string | null = null;

  try {
    const body = await request.json();

    const {
      to,
      from,
      subject,
      html,
      text,
      templateId,
      templateVariables,
      attachments,
      tags,
      metadata,
      userId,
      campaignId,
      relatedOrderId,
      relatedCustomerId,
      useQueue = false, // Option to queue instead of sending immediately
    } = body;

    // Validate required fields
    if (!to || !from) {
      return NextResponse.json(
        { error: 'Missing required fields: to, from' },
        { status: 400 }
      );
    }

    // Check if recipient is safe to send to
    const bounceHandler = getBounceHandler();
    const isSafe = await bounceHandler.isSafeToSend(to);

    if (!isSafe) {
      return NextResponse.json(
        { error: 'Cannot send to this email address (bounced, complained, or unsubscribed)' },
        { status: 400 }
      );
    }

    // Rate limiting
    const rateLimiter = getEmailRateLimiter();
    await rateLimiter.consume(1);

    // Prepare email content
    let emailContent: any = { subject, html, text };

    // If template is specified, render it
    if (templateId) {
      const templateManager = getEmailTemplateManager();
      const rendered = await templateManager.renderTemplate({
        templateId,
        variables: templateVariables || {},
      });

      if (!rendered) {
        return NextResponse.json(
          { error: 'Failed to render template' },
          { status: 400 }
        );
      }

      emailContent = rendered;
    }

    // Validate email content
    if (!emailContent.subject || !emailContent.html) {
      return NextResponse.json(
        { error: 'Missing email content: subject and html are required' },
        { status: 400 }
      );
    }

    // If useQueue is true, add to queue instead of sending immediately
    if (useQueue && userId) {
      const queueId = await dbService.createEmailQueue({
        user_id: userId,
        recipient_email: to,
        subject: emailContent.subject,
        html_content: emailContent.html,
        text_content: emailContent.text || '',
        template_id: templateId,
        campaign_id: campaignId,
        related_order_id: relatedOrderId,
        related_customer_id: relatedCustomerId,
        metadata: { ...metadata, tags },
      });

      if (!queueId) {
        return NextResponse.json(
          { error: 'Failed to queue email' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        queued: true,
        queueId,
      });
    }

    // Create email log entry for tracking
    if (userId) {
      logId = await dbService.createEmailLog({
        user_id: userId,
        recipient_email: to,
        subject: emailContent.subject,
        template_id: templateId,
        campaign_id: campaignId,
        status: 'pending',
        related_order_id: relatedOrderId,
        related_customer_id: relatedCustomerId,
        metadata: { ...metadata, tags },
        html_content: emailContent.html,
        text_content: emailContent.text || '',
      });
    }

    // Send email
    const providerManager = getEmailProviderManager();
    const result = await providerManager.send({
      to,
      from,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      attachments,
      tags,
      metadata,
    });

    if (result.success) {
      // Update email log to 'sent' status
      if (logId) {
        await dbService.updateEmailLogStatus(logId, 'sent');
      }

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        provider: result.provider,
        logId,
      });
    } else {
      // Update email log to 'failed' status
      if (logId) {
        await dbService.updateEmailLogStatus(logId, 'failed', result.error);
      }

      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in /api/email/send:', error);

    // Update email log to 'failed' status
    if (logId) {
      await dbService.updateEmailLogStatus(logId, 'failed', error.message);
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
