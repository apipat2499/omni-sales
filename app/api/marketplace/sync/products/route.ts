/**
 * POST /api/marketplace/sync/products
 * Manually trigger product sync to marketplaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductSyncService } from '@/lib/integrations/marketplace/product-sync';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_ids, connection_id } = body;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json(
        { error: 'product_ids array is required' },
        { status: 400 }
      );
    }

    if (!connection_id) {
      return NextResponse.json(
        { error: 'connection_id is required' },
        { status: 400 }
      );
    }

    const syncService = new ProductSyncService({
      supabaseUrl,
      supabaseKey,
    });

    const result = await syncService.syncProducts(product_ids, connection_id);

    return NextResponse.json({
      success: result.success,
      message: `Synced ${result.products_synced} products, ${result.products_failed} failed`,
      result,
    });
  } catch (error) {
    console.error('Error in marketplace product sync API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: `${error}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, stock } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      );
    }

    if (stock === undefined || stock === null) {
      return NextResponse.json(
        { error: 'stock is required' },
        { status: 400 }
      );
    }

    const syncService = new ProductSyncService({
      supabaseUrl,
      supabaseKey,
    });

    const results = await syncService.updateInventoryAcrossMarketplaces(product_id, stock);

    const totalSynced = results.reduce((sum, r) => sum + r.products_synced, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.products_failed, 0);
    const allSuccessful = results.every((r) => r.success);

    return NextResponse.json({
      success: allSuccessful,
      message: `Updated inventory on ${totalSynced} marketplaces, ${totalFailed} failed`,
      results,
    });
  } catch (error) {
    console.error('Error in marketplace inventory update API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: `${error}` },
      { status: 500 }
    );
  }
}
