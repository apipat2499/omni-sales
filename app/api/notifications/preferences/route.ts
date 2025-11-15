import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { NotificationPreferences } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Get system-wide preferences (user_id is null)
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .is('user_id', null)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notification preferences', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      // Create default preferences if none exist
      const defaultPrefs = {
        user_id: null,
        email_enabled: true,
        email_on_order_created: true,
        email_on_order_shipped: true,
        email_on_order_delivered: true,
        email_on_low_stock: true,
        email_on_out_of_stock: true,
        low_stock_threshold: 10,
      };

      const { data: newData, error: createError } = await supabase
        .from('notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single();

      if (createError) {
        console.error('Error creating notification preferences:', createError);
        return NextResponse.json(
          { error: 'Failed to create notification preferences', details: createError.message },
          { status: 500 }
        );
      }

      const preferences: NotificationPreferences = {
        id: newData.id,
        userId: newData.user_id,
        emailEnabled: newData.email_enabled,
        emailOnOrderCreated: newData.email_on_order_created,
        emailOnOrderShipped: newData.email_on_order_shipped,
        emailOnOrderDelivered: newData.email_on_order_delivered,
        emailOnLowStock: newData.email_on_low_stock,
        emailOnOutOfStock: newData.email_on_out_of_stock,
        lowStockThreshold: newData.low_stock_threshold,
        createdAt: new Date(newData.created_at),
        updatedAt: new Date(newData.updated_at),
      };

      return NextResponse.json(preferences, { status: 200 });
    }

    const preferences: NotificationPreferences = {
      id: data.id,
      userId: data.user_id,
      emailEnabled: data.email_enabled,
      emailOnOrderCreated: data.email_on_order_created,
      emailOnOrderShipped: data.email_on_order_shipped,
      emailOnOrderDelivered: data.email_on_order_delivered,
      emailOnLowStock: data.email_on_low_stock,
      emailOnOutOfStock: data.email_on_out_of_stock,
      lowStockThreshold: data.low_stock_threshold,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json(preferences, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/notifications/preferences:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const updateData: Record<string, any> = {};

    if (body.emailEnabled !== undefined) updateData.email_enabled = body.emailEnabled;
    if (body.emailOnOrderCreated !== undefined) updateData.email_on_order_created = body.emailOnOrderCreated;
    if (body.emailOnOrderShipped !== undefined) updateData.email_on_order_shipped = body.emailOnOrderShipped;
    if (body.emailOnOrderDelivered !== undefined) updateData.email_on_order_delivered = body.emailOnOrderDelivered;
    if (body.emailOnLowStock !== undefined) updateData.email_on_low_stock = body.emailOnLowStock;
    if (body.emailOnOutOfStock !== undefined) updateData.email_on_out_of_stock = body.emailOnOutOfStock;
    if (body.lowStockThreshold !== undefined) updateData.low_stock_threshold = body.lowStockThreshold;

    const { data, error } = await supabase
      .from('notification_preferences')
      .update(updateData)
      .is('user_id', null)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification preferences:', error);
      return NextResponse.json(
        { error: 'Failed to update notification preferences', details: error.message },
        { status: 500 }
      );
    }

    const preferences: NotificationPreferences = {
      id: data.id,
      userId: data.user_id,
      emailEnabled: data.email_enabled,
      emailOnOrderCreated: data.email_on_order_created,
      emailOnOrderShipped: data.email_on_order_shipped,
      emailOnOrderDelivered: data.email_on_order_delivered,
      emailOnLowStock: data.email_on_low_stock,
      emailOnOutOfStock: data.email_on_out_of_stock,
      lowStockThreshold: data.low_stock_threshold,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    return NextResponse.json(preferences, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/notifications/preferences:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
