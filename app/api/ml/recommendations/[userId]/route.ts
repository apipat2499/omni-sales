import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/ml/recommendation/collaborative-filter';

/**
 * GET /api/ml/recommendations/:userId
 * Get personalized product recommendations for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const { searchParams } = new URL(request.url);

    const topN = parseInt(searchParams.get('topN') || '10');
    const algorithm = searchParams.get('algorithm') as any || 'hybrid';
    const context = searchParams.get('context') || 'general';
    const useCache = searchParams.get('useCache') !== 'false';

    const recommendations = await getRecommendations(userId, {
      topN,
      algorithm,
      context,
      useCache,
    });

    return NextResponse.json({
      success: true,
      data: {
        userId,
        recommendations,
        algorithm,
        context,
        count: recommendations.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get recommendations',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ml/recommendations/:userId
 * Generate and cache new recommendations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();

    const { topN = 10, algorithm = 'hybrid', context = 'general' } = body;

    const recommendations = await getRecommendations(userId, {
      topN,
      algorithm,
      context,
      useCache: false, // Force regeneration
    });

    return NextResponse.json({
      success: true,
      data: {
        userId,
        recommendations,
        algorithm,
        context,
        count: recommendations.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate recommendations',
      },
      { status: 500 }
    );
  }
}
