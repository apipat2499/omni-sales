import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Notification } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');
    const limit = searchParams.get('limit');

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications', details: error.message },
        { status: 500 }
      );
    }

    const notifications: Notification[] = (data || []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      severity: n.severity,
      relatedId: n.related_id,
      relatedType: n.related_type,
      isRead: n.is_read,
      createdAt: new Date(n.created_at),
    }));

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/notifications:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.type || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message' },
        { status: 400 }
      );
    }

    const notificationData = {
      type: body.type,
      title: body.title,
      message: body.message,
      severity: body.severity || 'info',
      related_id: body.relatedId || null,
      related_type: body.relatedType || null,
      is_read: false,
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json(
        { error: 'Failed to create notification', details: error.message },
        { status: 500 }
      );
    }

    const notification: Notification = {
      id: data.id,
      type: data.type,
      title: data.title,
      message: data.message,
      severity: data.severity,
      relatedId: data.related_id,
      relatedType: data.related_type,
      isRead: data.is_read,
      createdAt: new Date(data.created_at),
    };

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/notifications:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
