import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Get all WhatsApp contacts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const optedIn = searchParams.get('opted_in');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('whatsapp_contacts')
      .select(`
        *,
        customer:customers(id, name, email),
        connection:whatsapp_connections(phone_number, verified_name)
      `, { count: 'exact' })
      .order('last_message_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`phone_number.ilike.%${search}%,profile_name.ilike.%${search}%`);
    }

    if (optedIn !== null) {
      query = query.eq('is_opted_in', optedIn === 'true');
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: contacts, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Get WhatsApp contacts error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get WhatsApp contacts',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create or update WhatsApp contact
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      phoneNumber,
      customerId,
      profileName,
      isOptedIn = true,
    } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Get active WhatsApp connection
    const { data: connection, error: connectionError } = await supabase
      .from('whatsapp_connections')
      .select('id')
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'WhatsApp connection not configured' },
        { status: 500 }
      );
    }

    // Upsert contact
    const { data: contact, error } = await supabase
      .from('whatsapp_contacts')
      .upsert(
        {
          connection_id: connection.id,
          phone_number: phoneNumber,
          customer_id: customerId,
          profile_name: profileName,
          is_opted_in: isOptedIn,
          opted_in_at: isOptedIn ? new Date().toISOString() : null,
          opted_out_at: !isOptedIn ? new Date().toISOString() : null,
        },
        {
          onConflict: 'connection_id,phone_number',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    console.error('Create WhatsApp contact error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create WhatsApp contact',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update contact opt-in status
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { contactId, isOptedIn } = body;

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    const { data: contact, error } = await supabase
      .from('whatsapp_contacts')
      .update({
        is_opted_in: isOptedIn,
        opted_in_at: isOptedIn ? new Date().toISOString() : null,
        opted_out_at: !isOptedIn ? new Date().toISOString() : null,
      })
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    console.error('Update WhatsApp contact error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update WhatsApp contact',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
