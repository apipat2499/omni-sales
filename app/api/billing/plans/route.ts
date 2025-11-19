import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('amount_cents', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      // Return empty array instead of error for missing tables
      return NextResponse.json([]);
    }

    return NextResponse.json(plans || []);
  } catch (error) {
    console.error('Error fetching plans:', error);
    // Return empty array instead of error
    return NextResponse.json([]);
  }
}
