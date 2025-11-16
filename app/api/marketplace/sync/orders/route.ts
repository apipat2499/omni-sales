/**
 * POST /api/marketplace/sync/orders
 * Manually trigger order sync from marketplaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { OrderSyncService } from '@/lib/integrations/marketplace/order-sync';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connection_id, marketplace_type } = body;

    const syncService = new OrderSyncService({
      supabaseUrl,
      supabaseKey,
    });

    let results;

    if (connection_id) {
      // Sync specific connection
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: connection, error } = await supabase
        .from('marketplace_connections')
        .select('*')
        .eq('id', connection_id)
        .single();

      if (error || !connection) {
        return NextResponse.json(
          { error: 'Marketplace connection not found' },
          { status: 404 }
        );
      }

      let result;
      if (connection.marketplace_type === 'shopee') {
        result = await syncService.syncShopeeOrders(connection);
      } else if (connection.marketplace_type === 'lazada') {
        result = await syncService.syncLazadaOrders(connection);
      } else {
        return NextResponse.json(
          { error: 'Unsupported marketplace type' },
          { status: 400 }
        );
      }

      results = [result];
    } else if (marketplace_type) {
      // Sync all connections of specific marketplace type
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: connections, error } = await supabase
        .from('marketplace_connections')
        .select('*')
        .eq('marketplace_type', marketplace_type)
        .eq('is_active', true);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch marketplace connections' },
          { status: 500 }
        );
      }

      results = [];
      for (const connection of connections || []) {
        let result;
        if (connection.marketplace_type === 'shopee') {
          result = await syncService.syncShopeeOrders(connection);
        } else if (connection.marketplace_type === 'lazada') {
          result = await syncService.syncLazadaOrders(connection);
        } else {
          continue;
        }
        results.push(result);
      }
    } else {
      // Sync all marketplaces
      results = await syncService.syncAllMarketplaces();
    }

    const totalSynced = results.reduce((sum, r) => sum + r.orders_synced, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.orders_failed, 0);
    const allSuccessful = results.every((r) => r.success);

    return NextResponse.json({
      success: allSuccessful,
      message: `Synced ${totalSynced} orders, ${totalFailed} failed`,
      results,
      summary: {
        total_synced: totalSynced,
        total_failed: totalFailed,
        connections_synced: results.length,
      },
    });
  } catch (error) {
    console.error('Error in marketplace order sync API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: `${error}` },
      { status: 500 }
    );
  }
}
