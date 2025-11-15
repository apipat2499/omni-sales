import { NextRequest, NextResponse } from 'next/server';
import { createPricingRule, getPricingRules, updatePricingRule } from '@/lib/pricing/service';

export async function GET(req: NextRequest) {
  try {
    const strategyId = req.nextUrl.searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ error: 'Missing strategyId' }, { status: 400 });
    }

    const rules = await getPricingRules(strategyId);
    return NextResponse.json({ data: rules, total: rules.length });
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing rules' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      strategyId,
      ruleName,
      ruleType,
      priceAdjustmentType,
      priceAdjustmentValue,
      minPrice,
      maxPrice,
      priority,
    } = await req.json();

    if (!userId || !strategyId || !ruleName || !ruleType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rule = await createPricingRule(userId, {
      strategyId,
      ruleName,
      ruleType,
      priceAdjustmentType,
      priceAdjustmentValue,
      minPrice,
      maxPrice,
      priority: priority || 0,
    });

    if (!rule) {
      return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
    }

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    return NextResponse.json(
      { error: 'Failed to create pricing rule' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { ruleId, ...updates } = await req.json();

    if (!ruleId) {
      return NextResponse.json({ error: 'Missing ruleId' }, { status: 400 });
    }

    const success = await updatePricingRule(ruleId, updates);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Rule updated' });
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    return NextResponse.json(
      { error: 'Failed to update pricing rule' },
      { status: 500 }
    );
  }
}
