import { NextRequest, NextResponse } from 'next/server';
import { WebhookManager } from '@/lib/webhooks/webhook-manager';
import { sanitizeWebhookUrl } from '@/lib/webhooks/webhook-helpers';
import { UpdateWebhookRequest } from '@/lib/webhooks/types';

/**
 * GET /api/webhooks/:id
 * Get a single webhook by ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || undefined;
    const webhook = await WebhookManager.getWebhook(params.id, tenantId);

    if (!webhook) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    console.error(`GET /api/webhooks/${params.id} error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get webhook',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/webhooks/:id
 * Update a webhook
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const tenantId = request.headers.get('x-tenant-id') || undefined;

    // Sanitize URL if provided
    if (body.url) {
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
    }

    // Validate events array if provided
    if (body.events && (!Array.isArray(body.events) || body.events.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Events must be a non-empty array',
        },
        { status: 400 }
      );
    }

    const updateData: UpdateWebhookRequest = {
      name: body.name,
      description: body.description,
      url: body.url,
      events: body.events,
      headers: body.headers,
      is_active: body.is_active,
      retry_enabled: body.retry_enabled,
      max_retries: body.max_retries,
      timeout_seconds: body.timeout_seconds,
      api_key: body.api_key,
      ip_whitelist: body.ip_whitelist,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof UpdateWebhookRequest] === undefined) {
        delete updateData[key as keyof UpdateWebhookRequest];
      }
    });

    const webhook = await WebhookManager.updateWebhook(params.id, updateData, tenantId);

    return NextResponse.json({
      success: true,
      data: webhook,
      message: 'Webhook updated successfully',
    });
  } catch (error) {
    console.error(`PUT /api/webhooks/${params.id} error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update webhook',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || undefined;
    await WebhookManager.deleteWebhook(params.id, tenantId);

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error(`DELETE /api/webhooks/${params.id} error:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete webhook',
      },
      { status: 500 }
    );
  }
}
