import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import {
  getCustomerLoyaltyPoints,
  addLoyaltyPoints,
  redeemLoyaltyPoints,
} from '@/lib/customer/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const customerId = req.nextUrl.searchParams.get('customerId');
    const loyaltyProgramId = req.nextUrl.searchParams.get('loyaltyProgramId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('customer_loyalty_points')
      .select(
        `
        *,
        loyalty_programs (
          id,
          name,
          program_type,
          point_multiplier,
          rewards
        )
      `
      )
      .eq('user_id', userId);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (loyaltyProgramId) {
      query = query.eq('loyalty_program_id', loyaltyProgramId);
    }

    const { data: points, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch loyalty points' },
        { status: 500 }
      );
    }

    return NextResponse.json(points || []);
  } catch (error) {
    console.error('Error fetching loyalty points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty points' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      customerId,
      loyaltyProgramId,
      action,
      points,
    } = await req.json();

    if (!userId || !customerId || !loyaltyProgramId || !action || !points) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (action === 'add') {
      const success = await addLoyaltyPoints(
        customerId,
        points,
        loyaltyProgramId,
        userId
      );

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to add loyalty points' },
          { status: 500 }
        );
      }
    } else if (action === 'redeem') {
      const success = await redeemLoyaltyPoints(
        customerId,
        loyaltyProgramId,
        points
      );

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to redeem loyalty points or insufficient points' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Fetch updated points
    const currentPoints = await getCustomerLoyaltyPoints(
      customerId,
      loyaltyProgramId
    );

    return NextResponse.json({
      customerId,
      loyaltyProgramId,
      availablePoints: currentPoints,
      action,
    });
  } catch (error) {
    console.error('Error managing loyalty points:', error);
    return NextResponse.json(
      { error: 'Failed to manage loyalty points' },
      { status: 500 }
    );
  }
}
