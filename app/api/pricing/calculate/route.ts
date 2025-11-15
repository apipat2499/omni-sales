import { NextRequest, NextResponse } from 'next/server';
import {
  calculateDynamicPrice,
  updateProductPrice,
  getPricingAnalytics,
  getPricingHistory,
} from '@/lib/pricing/service';

export async function POST(req: NextRequest) {
  try {
    const { userId, productId, basePrice } = await req.json();

    if (!userId || !productId || basePrice === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const dynamicPrice = await calculateDynamicPrice(userId, productId, basePrice);

    return NextResponse.json({
      basePrice,
      dynamicPrice,
      priceChange: dynamicPrice - basePrice,
      priceChangePercentage: ((dynamicPrice - basePrice) / basePrice) * 100,
    });
  } catch (error) {
    console.error('Error calculating dynamic price:', error);
    return NextResponse.json(
      { error: 'Failed to calculate dynamic price' },
      { status: 500 }
    );
  }
}
