import { NextRequest, NextResponse } from 'next/server';
import { generateRecommendations, recordRecommendationImpression } from '@/lib/recommendations/service';

export async function POST(req: NextRequest) {
  try {
    const { userId, customerId, context, maxRecommendations } = await req.json();

    if (!userId || !customerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const recommendations = await generateRecommendations(
      userId,
      customerId,
      context || 'product_page',
      maxRecommendations || 5
    );

    // Mark recommendations as shown
    for (const rec of recommendations) {
      await recordRecommendationImpression(rec.id);
    }

    return NextResponse.json(
      { data: recommendations, total: recommendations.length },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const customerId = req.nextUrl.searchParams.get('customerId');
    const context = req.nextUrl.searchParams.get('context');

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
    }

    // Import service function for getting recommendations
    const { getRecommendations } = await import('@/lib/recommendations/service');
    const recommendations = await getRecommendations(customerId, context || undefined);

    return NextResponse.json({ data: recommendations, total: recommendations.length });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
