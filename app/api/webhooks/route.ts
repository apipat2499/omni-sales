import { NextRequest, NextResponse } from 'next/server';
import { WebhookManager } from '@/lib/webhooks/webhook-manager';
import { sanitizeWebhookUrl } from '@/lib/webhooks/webhook-helpers';
import { CreateWebhookRequest } from '@/lib/webhooks/types';

/**
 * GET /api/webhooks
 * List all webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenant_id') || undefined;

    const webhooks = await WebhookManager.getWebhooks(tenantId);

    return NextResponse.json({
      success: true,
      data: webhooks,
      count: webhooks.length,
    });
  } catch (error) {
    console.error('GET /api/webhooks error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get webhooks',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks
 * Create a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.url || !body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, url, events',
        },
        { status: 400 }
      );
    }

    // Validate events array is not empty
    if (body.events.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one event must be specified',
        },
        { status: 400 }
      );
    }

    // Sanitize and validate URL
    try {
      body.url = sanitizeWebhookUrl(body.url);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid webhook URL',
        },
        { status: 400 }
      );
    }

    const webhookData: CreateWebhookRequest = {
      name: body.name,
      description: body.description,
      url: body.url,
      events: body.events,
      headers: body.headers,
      retry_enabled: body.retry_enabled,
      max_retries: body.max_retries,
      timeout_seconds: body.timeout_seconds,
      api_key: body.api_key,
      ip_whitelist: body.ip_whitelist,
    };

    // Get user ID and tenant ID from headers or session
    // In a real app, you'd get these from your auth middleware
    const userId = request.headers.get('x-user-id') || undefined;
    const tenantId = request.headers.get('x-tenant-id') || body.tenant_id || undefined;

    const webhook = await WebhookManager.createWebhook(webhookData, userId, tenantId);

    return NextResponse.json(
      {
        success: true,
        data: webhook,
        message: 'Webhook created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/webhooks error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create webhook',
      },
      { status: 500 }
    );
  }
}
