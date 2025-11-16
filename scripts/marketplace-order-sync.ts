#!/usr/bin/env ts-node
/**
 * Marketplace Order Sync Job
 *
 * This script runs periodically to sync orders from Shopee and Lazada marketplaces.
 * Recommended: Run every 15 minutes via cron job
 *
 * Cron schedule example (every 15 minutes):
 * *//*15 * * * * cd /path/to/omni-sales && ts-node scripts/marketplace-order-sync.ts
 *
 * Or using npm script:
 * *//*15 * * * * cd /path/to/omni-sales && npm run marketplace:sync
 */

import { OrderSyncService } from '../lib/integrations/marketplace/order-sync';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface SyncStats {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  totalConnections: number;
  successfulConnections: number;
  failedConnections: number;
  totalOrdersSynced: number;
  totalOrdersFailed: number;
  errors: string[];
}

async function main() {
  const stats: SyncStats = {
    startTime: new Date(),
    totalConnections: 0,
    successfulConnections: 0,
    failedConnections: 0,
    totalOrdersSynced: 0,
    totalOrdersFailed: 0,
    errors: [],
  };

  console.log('='.repeat(60));
  console.log('Marketplace Order Sync Job');
  console.log('Started at:', stats.startTime.toISOString());
  console.log('='.repeat(60));

  try {
    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error(
        'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY'
      );
    }

    // Initialize sync service
    const syncService = new OrderSyncService({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_KEY,
    });

    console.log('\nFetching active marketplace connections...');

    // Get active connections
    const connections = await syncService.getActiveConnections();
    stats.totalConnections = connections.length;

    if (connections.length === 0) {
      console.log('No active marketplace connections found.');
      console.log('Please connect your marketplace shops via the admin panel.');
      return;
    }

    console.log(`Found ${connections.length} active connection(s)\n`);

    // Sync each connection
    for (const connection of connections) {
      console.log('-'.repeat(60));
      console.log(
        `Syncing ${connection.marketplace_type.toUpperCase()} - Shop: ${connection.shop_name} (${connection.shop_id})`
      );
      console.log('-'.repeat(60));

      try {
        let result;

        if (connection.marketplace_type === 'shopee') {
          result = await syncService.syncShopeeOrders(connection);
        } else if (connection.marketplace_type === 'lazada') {
          result = await syncService.syncLazadaOrders(connection);
        } else {
          console.log(`Unsupported marketplace type: ${connection.marketplace_type}`);
          continue;
        }

        // Update stats
        if (result.success) {
          stats.successfulConnections++;
        } else {
          stats.failedConnections++;
        }

        stats.totalOrdersSynced += result.orders_synced;
        stats.totalOrdersFailed += result.orders_failed;

        // Display result
        console.log(`\nResult:`);
        console.log(`  - Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
        console.log(`  - Orders synced: ${result.orders_synced}`);
        console.log(`  - Orders failed: ${result.orders_failed}`);

        if (result.errors.length > 0) {
          console.log(`  - Errors:`);
          result.errors.forEach((error, index) => {
            console.log(`    ${index + 1}. ${error}`);
            stats.errors.push(`[${connection.marketplace_type}:${connection.shop_id}] ${error}`);
          });
        }

        console.log(`  - Synced at: ${result.synced_at}`);
      } catch (error) {
        stats.failedConnections++;
        const errorMsg = `Failed to sync ${connection.marketplace_type} shop ${connection.shop_id}: ${error}`;
        console.error(`\n✗ ${errorMsg}\n`);
        stats.errors.push(errorMsg);
      }
    }

    // Calculate duration
    stats.endTime = new Date();
    stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('Sync Summary');
    console.log('='.repeat(60));
    console.log(`Total connections: ${stats.totalConnections}`);
    console.log(`Successful: ${stats.successfulConnections}`);
    console.log(`Failed: ${stats.failedConnections}`);
    console.log(`Total orders synced: ${stats.totalOrdersSynced}`);
    console.log(`Total orders failed: ${stats.totalOrdersFailed}`);
    console.log(`Duration: ${(stats.duration / 1000).toFixed(2)}s`);
    console.log(`Completed at: ${stats.endTime.toISOString()}`);

    if (stats.errors.length > 0) {
      console.log(`\nErrors (${stats.errors.length}):`);
      stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    console.log('='.repeat(60));

    // Exit with appropriate code
    process.exit(stats.failedConnections > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n✗ Fatal error during sync:');
    console.error(error);

    stats.endTime = new Date();
    stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

    console.log('\n' + '='.repeat(60));
    console.log(`Duration: ${(stats.duration / 1000).toFixed(2)}s`);
    console.log(`Failed at: ${stats.endTime.toISOString()}`);
    console.log('='.repeat(60));

    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

export { main };
