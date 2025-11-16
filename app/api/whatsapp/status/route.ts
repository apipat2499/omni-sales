import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Get message delivery status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const messageId = searchParams.get('message_id');
    const wabaMessageId = searchParams.get('waba_message_id');
    const phoneNumber = searchParams.get('phone_number');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('whatsapp_messages')
      .select(`
        *,
        connection:whatsapp_connections(verified_name, phone_number)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (messageId) {
      query = query.eq('id', messageId);
    }

    if (wabaMessageId) {
      query = query.eq('waba_message_id', wabaMessageId);
    }

    if (phoneNumber) {
      query = query.or(`from_number.eq.${phoneNumber},to_number.eq.${phoneNumber}`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: messages, error, count } = await query;

    if (error) {
      throw error;
    }

    // Calculate statistics
    const stats = {
      total: count || 0,
      sent: messages?.filter(m => m.status === 'sent').length || 0,
      delivered: messages?.filter(m => m.status === 'delivered').length || 0,
      read: messages?.filter(m => m.status === 'read').length || 0,
      failed: messages?.filter(m => m.status === 'failed').length || 0,
    };

    return NextResponse.json({
      success: true,
      data: messages,
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Get WhatsApp message status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get message status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Get campaign status
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('whatsapp_campaigns')
      .select(`
        *,
        template:whatsapp_templates(name, language, category),
        connection:whatsapp_connections(verified_name, phone_number)
      `)
      .eq('id', campaignId)
      .single();

    if (campaignError) {
      throw campaignError;
    }

    // Get campaign recipients with status
    const { data: recipients, error: recipientsError } = await supabase
      .from('whatsapp_campaign_recipients')
      .select(`
        *,
        contact:whatsapp_contacts(phone_number, profile_name),
        message:whatsapp_messages(status, sent_at, delivered_at, read_at, error_message)
      `)
      .eq('campaign_id', campaignId);

    if (recipientsError) {
      throw recipientsError;
    }

    // Calculate detailed statistics
    const stats = {
      total: recipients?.length || 0,
      pending: recipients?.filter(r => r.status === 'pending').length || 0,
      sent: recipients?.filter(r => r.status === 'sent').length || 0,
      delivered: recipients?.filter(r => r.status === 'delivered').length || 0,
      read: recipients?.filter(r => r.status === 'read').length || 0,
      failed: recipients?.filter(r => r.status === 'failed').length || 0,
    };

    // Calculate delivery rate
    const deliveryRate = stats.total > 0
      ? ((stats.delivered + stats.read) / stats.total * 100).toFixed(2)
      : '0.00';

    // Calculate read rate
    const readRate = stats.delivered > 0
      ? (stats.read / stats.delivered * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        recipients,
        stats,
        metrics: {
          deliveryRate: `${deliveryRate}%`,
          readRate: `${readRate}%`,
        },
      },
    });
  } catch (error: any) {
    console.error('Get campaign status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get campaign status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
