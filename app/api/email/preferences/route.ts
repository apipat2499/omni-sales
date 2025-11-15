import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const { data: preferences, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Return defaults if not found
      return NextResponse.json({
        userId,
        dailySummaryEnabled: true,
        dailySummaryTime: '08:00',
        newOrderNotification: true,
        paymentConfirmation: true,
        lowStockAlert: true,
        lowStockThreshold: 10,
        customerEmailsEnabled: true,
        marketingEmails: false,
        weeklyAnalytics: true,
        monthlyReport: true,
        promotionalEmails: false,
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId, ...preferences } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('email_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
