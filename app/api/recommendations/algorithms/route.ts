import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Fetch recommendation algorithms from database
    const { data, error } = await supabase
      .from('recommendation_algorithms')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch algorithms' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching algorithms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch algorithms' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, algorithmName, algorithmType, description } = body;

    if (!userId || !algorithmName) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, algorithmName' },
        { status: 400 }
      );
    }

    // Create new recommendation algorithm
    const { data, error } = await supabase
      .from('recommendation_algorithms')
      .insert({
        user_id: userId,
        algorithm_name: algorithmName,
        algorithm_type: algorithmType || 'collaborative',
        description: description || null,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create algorithm' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: data?.[0], message: 'Algorithm created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating algorithm:', error);
    return NextResponse.json(
      { error: 'Failed to create algorithm' },
      { status: 500 }
    );
  }
}
