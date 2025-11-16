import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initWhatsAppClient } from '@/lib/integrations/whatsapp';

/**
 * GET - Get all campaigns
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('whatsapp_campaigns')
      .select(`
        *,
        template:whatsapp_templates(name, language, category),
        connection:whatsapp_connections(verified_name, phone_number)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: campaigns, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: campaigns,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Get WhatsApp campaigns error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get WhatsApp campaigns',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create and send WhatsApp campaign
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      name,
      templateName,
      templateComponents,
      targetAudience,
      scheduledAt,
      sendNow = false,
    } = body;

    if (!name || !templateName) {
      return NextResponse.json(
        { error: 'Campaign name and template name are required' },
        { status: 400 }
      );
    }

    // Get active WhatsApp connection
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

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('connection_id', connection.id)
      .eq('name', templateName)
      .eq('status', 'APPROVED')
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found or not approved' },
        { status: 404 }
      );
    }

    // Get target contacts
    let contactsQuery = supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('connection_id', connection.id)
      .eq('is_opted_in', true);

    // Apply audience filters if provided
    if (targetAudience?.customTags) {
      // Filter by customer tags
      contactsQuery = contactsQuery.in('customer_id',
        await supabase
          .from('customers')
          .select('id')
          .contains('tags', targetAudience.customTags)
          .then(({ data }) => data?.map(c => c.id) || [])
      );
    }

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) {
      throw contactsError;
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts found for target audience' },
        { status: 400 }
      );
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('whatsapp_campaigns')
      .insert({
        connection_id: connection.id,
        name,
        template_id: template.id,
        template_name: templateName,
        target_audience: targetAudience,
        recipient_count: contacts.length,
        status: sendNow ? 'sending' : scheduledAt ? 'scheduled' : 'draft',
        scheduled_at: scheduledAt,
        started_at: sendNow ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (campaignError) {
      throw campaignError;
    }

    // Create campaign recipients
    const recipients = contacts.map(contact => ({
      campaign_id: campaign.id,
      contact_id: contact.id,
      phone_number: contact.phone_number,
      status: 'pending',
    }));

    const { error: recipientsError } = await supabase
      .from('whatsapp_campaign_recipients')
      .insert(recipients);

    if (recipientsError) {
      throw recipientsError;
    }

    // Send messages if sendNow is true
    if (sendNow) {
      // Initialize WhatsApp client
      const client = initWhatsAppClient({
        businessAccountId: connection.business_account_id,
        phoneNumberId: connection.phone_number_id,
        accessToken: connection.access_token,
      });

      let sentCount = 0;
      let deliveredCount = 0;
      let failedCount = 0;

      // Send messages to all recipients
      for (const contact of contacts) {
        try {
          const result = await client.sendTemplateMessage(
            contact.phone_number,
            templateName,
            template.language,
            templateComponents
          );

          if (result.messages && result.messages.length > 0) {
            const messageId = result.messages[0].id;

            // Log message
            const { data: message } = await supabase
              .from('whatsapp_messages')
              .insert({
                connection_id: connection.id,
                waba_message_id: messageId,
                from_number: connection.phone_number,
                to_number: contact.phone_number,
                direction: 'outbound',
                message_type: 'template',
                content: { templateName, templateComponents },
                template_name: templateName,
                template_language: template.language,
                status: 'sent',
                sent_at: new Date().toISOString(),
              })
              .select()
              .single();

            // Update campaign recipient
            await supabase
              .from('whatsapp_campaign_recipients')
              .update({
                message_id: message?.id,
                status: 'sent',
                sent_at: new Date().toISOString(),
              })
              .eq('campaign_id', campaign.id)
              .eq('contact_id', contact.id);

            sentCount++;
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error: any) {
          console.error(`Failed to send to ${contact.phone_number}:`, error);

          // Update campaign recipient with error
          await supabase
            .from('whatsapp_campaign_recipients')
            .update({
              status: 'failed',
              error_message: error.message,
            })
            .eq('campaign_id', campaign.id)
            .eq('contact_id', contact.id);

          failedCount++;
        }
      }

      // Update campaign status
      await supabase
        .from('whatsapp_campaigns')
        .update({
          status: 'completed',
          sent_count: sentCount,
          failed_count: failedCount,
          completed_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);
    }

    return NextResponse.json({
      success: true,
      data: campaign,
    });
  } catch (error: any) {
    console.error('Create WhatsApp campaign error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create WhatsApp campaign',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
