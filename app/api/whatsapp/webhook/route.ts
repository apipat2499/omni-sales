import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initWebhookHandler, getEventEmitter } from '@/lib/integrations/whatsapp';
import type { WebhookPayload } from '@/lib/integrations/whatsapp/types';

/**
 * GET handler for webhook verification
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const supabase = await createClient();

    // Get webhook configuration
    const { data: connection } = await supabase
      .from('whatsapp_connections')
      .select('webhook_verify_token')
      .eq('is_active', true)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: 'WhatsApp connection not configured' },
        { status: 500 }
      );
    }

    // Initialize webhook handler
    const { handler } = initWebhookHandler({
      verifyToken: connection.webhook_verify_token || process.env.WHATSAPP_WEBHOOK_SECRET || '',
    });

    // Verify webhook
    const verificationResult = handler.verifyWebhook({
      'hub.mode': mode || undefined,
      'hub.verify_token': token || undefined,
      'hub.challenge': challenge || undefined,
    });

    if (verificationResult) {
      return new NextResponse(verificationResult, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 403 }
    );
  } catch (error: any) {
    console.error('Webhook verification error:', error);
    return NextResponse.json(
      { error: 'Webhook verification error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST handler for receiving webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';

    // Get webhook configuration
    const { data: connection } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: 'WhatsApp connection not configured' },
        { status: 500 }
      );
    }

    // Initialize webhook handler
    const { handler, emitter } = initWebhookHandler({
      verifyToken: connection.webhook_verify_token || '',
      appSecret: connection.webhook_secret,
    });

    // Verify signature
    if (connection.webhook_secret && signature) {
      const isValid = handler.verifySignature(body, signature);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 403 }
        );
      }
    }

    // Parse webhook payload
    const payload: WebhookPayload = JSON.parse(body);

    // Log webhook to database
    await supabase.from('whatsapp_webhooks').insert({
      connection_id: connection.id,
      event_type: payload.entry[0]?.changes[0]?.field || 'unknown',
      payload: payload,
      processed: false,
    });

    // Process webhook
    const processed = handler.processWebhook(payload);

    // Handle incoming messages
    for (const message of processed.messages) {
      // Log incoming message to database
      await supabase.from('whatsapp_messages').insert({
        connection_id: connection.id,
        waba_message_id: message.messageId,
        from_number: message.from,
        to_number: connection.phone_number,
        direction: 'inbound',
        message_type: message.type,
        content: message.content,
        context: message.context,
        status: 'received',
        sent_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      });

      // Update or create contact
      await supabase
        .from('whatsapp_contacts')
        .upsert(
          {
            connection_id: connection.id,
            phone_number: message.from,
            wa_id: message.from,
            last_message_at: new Date().toISOString(),
          },
          {
            onConflict: 'connection_id,phone_number',
            ignoreDuplicates: false,
          }
        );

      // Increment message count
      await supabase.rpc('increment_whatsapp_message_count', {
        p_connection_id: connection.id,
        p_phone_number: message.from,
      }).catch(() => {
        // If RPC doesn't exist, just skip
      });
    }

    // Handle message statuses (delivered, read, etc.)
    for (const status of processed.statuses) {
      // Update message status in database
      await supabase
        .from('whatsapp_messages')
        .update({
          status: status.status,
          delivered_at: status.status === 'delivered' ? new Date().toISOString() : undefined,
          read_at: status.status === 'read' ? new Date().toISOString() : undefined,
          failed_at: status.status === 'failed' ? new Date().toISOString() : undefined,
          error_code: status.errors?.[0]?.code?.toString(),
          error_message: status.errors?.[0]?.message,
        })
        .eq('waba_message_id', status.id);

      // Update campaign recipient status if applicable
      await supabase
        .from('whatsapp_campaign_recipients')
        .update({
          status: status.status,
          delivered_at: status.status === 'delivered' ? new Date().toISOString() : undefined,
          read_at: status.status === 'read' ? new Date().toISOString() : undefined,
          error_message: status.errors?.[0]?.message,
        })
        .eq('message_id', status.id);
    }

    // Handle errors
    for (const error of processed.errors) {
      console.error('WhatsApp webhook error:', error);
    }

    // Emit events for real-time processing
    await emitter.processWebhookEvents(processed);

    // Mark webhook as processed
    await supabase
      .from('whatsapp_webhooks')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('payload', payload);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);

    // Log error to database
    const supabase = await createClient();
    await supabase
      .from('whatsapp_webhooks')
      .update({
        processed: false,
        processing_error: error.message,
      })
      .eq('processed', false)
      .order('created_at', { ascending: false })
      .limit(1);

    return NextResponse.json(
      { error: 'Webhook processing error', details: error.message },
      { status: 500 }
    );
  }
}
