import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        subscription_plans (*),
        invoices (*),
        payments (*)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      // Return empty array instead of error for missing tables
      return NextResponse.json([]);
    }

    return NextResponse.json(subscriptions || []);
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    // Return empty array instead of error
    return NextResponse.json([]);
  }
}
