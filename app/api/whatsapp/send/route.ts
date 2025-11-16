import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initWhatsAppClient } from '@/lib/integrations/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      to,
      type = 'text',
      message,
      templateName,
      templateLanguage = 'th',
      templateComponents,
      mediaUrl,
      caption,
      buttons,
    } = body;

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { error: 'Recipient phone number is required' },
        { status: 400 }
      );
    }

    // Get WhatsApp connection from database
    const { data: connection, error: connectionError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'WhatsApp connection not configured' },
        { status: 500 }
      );
    }

    // Initialize WhatsApp client
    const client = initWhatsAppClient({
      businessAccountId: connection.business_account_id,
      phoneNumberId: connection.phone_number_id,
      accessToken: connection.access_token,
    });

    let result;

    // Send message based on type
    switch (type) {
      case 'text':
        if (!message) {
          return NextResponse.json(
            { error: 'Message text is required' },
            { status: 400 }
          );
        }
        result = await client.sendTextMessage(to, message);
        break;

      case 'image':
        if (!mediaUrl) {
          return NextResponse.json(
            { error: 'Image URL is required' },
            { status: 400 }
          );
        }
        result = await client.sendImageByUrl(to, mediaUrl, caption);
        break;

      case 'document':
        if (!mediaUrl) {
          return NextResponse.json(
            { error: 'Document URL is required' },
            { status: 400 }
          );
        }
        result = await client.sendDocumentByUrl(to, mediaUrl, caption);
        break;

      case 'template':
        if (!templateName) {
          return NextResponse.json(
            { error: 'Template name is required' },
            { status: 400 }
          );
        }
        result = await client.sendTemplateMessage(
          to,
          templateName,
          templateLanguage,
          templateComponents
        );
        break;

      case 'buttons':
        if (!message || !buttons) {
          return NextResponse.json(
            { error: 'Message text and buttons are required' },
            { status: 400 }
          );
        }
        result = await client.sendInteractiveButtons(to, message, buttons);
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported message type: ${type}` },
          { status: 400 }
        );
    }

    // Log message to database
    if (result.messages && result.messages.length > 0) {
      const messageId = result.messages[0].id;
      const waId = result.contacts[0]?.wa_id;

      await supabase.from('whatsapp_messages').insert({
        connection_id: connection.id,
        waba_message_id: messageId,
        from_number: connection.phone_number,
        to_number: waId || to,
        direction: 'outbound',
        message_type: type,
        content: {
          message,
          mediaUrl,
          caption,
          buttons,
          templateName,
          templateComponents,
        },
        template_name: templateName,
        template_language: templateLanguage,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('WhatsApp send message error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send WhatsApp message',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
