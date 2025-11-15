import { NextRequest, NextResponse } from 'next/server';
import { createPricingStrategy, getPricingStrategies, updatePricingStrategy } from '@/lib/pricing/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const strategies = await getPricingStrategies(userId);
    return NextResponse.json({ data: strategies, total: strategies.length });
  } catch (error) {
    console.error('Error fetching pricing strategies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing strategies' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, strategyName, strategyType, description, priority } = await req.json();

    if (!userId || !strategyName || !strategyType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const strategy = await createPricingStrategy(userId, {
      strategyName,
      strategyType,
      description,
      priority: priority || 0,
    });

    if (!strategy) {
      return NextResponse.json({ error: 'Failed to create strategy' }, { status: 500 });
    }

    return NextResponse.json(strategy, { status: 201 });
  } catch (error) {
    console.error('Error creating pricing strategy:', error);
    return NextResponse.json(
      { error: 'Failed to create pricing strategy' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { strategyId, ...updates } = await req.json();

    if (!strategyId) {
      return NextResponse.json({ error: 'Missing strategyId' }, { status: 400 });
    }

    const success = await updatePricingStrategy(strategyId, updates);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update strategy' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Strategy updated' });
  } catch (error) {
    console.error('Error updating pricing strategy:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing strategy' },
      { status: 500 }
    );
  }
}
