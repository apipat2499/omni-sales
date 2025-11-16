import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data: platforms, error } = await supabase
      .from('marketplace_platforms')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch platforms' },
        { status: 500 }
      );
    }

    return NextResponse.json(platforms);
  } catch (error) {
    console.error('Error fetching platforms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    );
  }
}
