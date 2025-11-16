import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { addCustomerToSegment } from '@/lib/customer/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const customerId = req.nextUrl.searchParams.get('customerId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Get segments
    let query = supabase
      .from('customer_segments')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    const { data: segments, error: segmentsError } = await query;

    if (segmentsError) {
      return NextResponse.json(
        { error: 'Failed to fetch segments' },
        { status: 500 }
      );
    }

    // Get members for specific customer if requested
    let memberSegments: any[] = [];
    if (customerId) {
      const { data: members, error: membersError } = await supabase
        .from('customer_segment_members')
        .select('segment_id')
        .eq('customer_id', customerId)
        .eq('user_id', userId);

      if (!membersError) {
        memberSegments = members?.map((m) => m.segment_id) || [];
      }
    }

    return NextResponse.json({
      segments: segments || [],
      customerSegments: memberSegments,
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, action, name, description, customerId, segmentId } =
      await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    if (action === 'create') {
      if (!name) {
        return NextResponse.json(
          { error: 'Missing segment name' },
          { status: 400 }
        );
      }

      const { data: segment, error } = await supabase
        .from('customer_segments')
        .insert({
          user_id: userId,
          name,
          description,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create segment' },
          { status: 500 }
        );
      }

      return NextResponse.json(segment, { status: 201 });
    } else if (action === 'add_member') {
      if (!customerId || !segmentId) {
        return NextResponse.json(
          { error: 'Missing customerId or segmentId' },
          { status: 400 }
        );
      }

      const success = await addCustomerToSegment(
        customerId,
        segmentId,
        userId
      );

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to add customer to segment' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        customerId,
        segmentId,
        action: 'added',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error managing segments:', error);
    return NextResponse.json(
      { error: 'Failed to manage segments' },
      { status: 500 }
    );
  }
}
