import { NextRequest, NextResponse } from 'next/server';
import { recordInteraction, getInteractionHistory } from '@/lib/crm/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const customerId = req.nextUrl.searchParams.get('customerId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

    if (!userId || !customerId) {
      return NextResponse.json({ error: 'Missing userId or customerId' }, { status: 400 });
    }

    const interactions = await getInteractionHistory(userId, customerId, limit);

    return NextResponse.json({
      data: interactions,
      total: interactions.length,
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, interactionData } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const interaction = await recordInteraction(userId, interactionData);

    if (!interaction) {
      return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
    }

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    console.error('Error recording interaction:', error);
    return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
  }
}
