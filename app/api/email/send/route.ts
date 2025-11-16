import { NextRequest, NextResponse } from 'next/server';
import { getEmailProviderManager } from '@/lib/email/providers/provider-manager';
import { getEmailTemplateManager } from '@/lib/email/templates/template-manager';
import { getEmailRateLimiter } from '@/lib/email/deliverability/rate-limiter';
import { getBounceHandler } from '@/lib/email/deliverability/bounce-handler';

/**
 * POST /api/email/send
 * Send a single email with multi-provider support
 */
export async function POST(request: NextRequest) {
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
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        provider: result.provider,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in /api/email/send:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
