import { NextRequest, NextResponse } from 'next/server';
import { recordCompetitorPrice, getCompetitorPrices } from '@/lib/pricing/service';

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    const competitors = await getCompetitorPrices(productId);
    return NextResponse.json({ data: competitors, total: competitors.length });
  } catch (error) {
    console.error('Error fetching competitor prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitor prices' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      productId,
      competitorName,
      competitorPrice,
      ourPrice,
      competitorSku,
    } = await req.json();

    if (
      !userId ||
      !productId ||
      !competitorName ||
      competitorPrice === undefined ||
      ourPrice === undefined
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const competitor = await recordCompetitorPrice(
      userId,
      productId,
      competitorName,
      competitorPrice,
      ourPrice,
      competitorSku
    );

    if (!competitor) {
      return NextResponse.json({ error: 'Failed to record competitor price' }, { status: 500 });
    }

    return NextResponse.json(competitor, { status: 201 });
  } catch (error) {
    console.error('Error recording competitor price:', error);
    return NextResponse.json(
      { error: 'Failed to record competitor price' },
      { status: 500 }
    );
  }
}
