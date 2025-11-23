import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// TEMPORARY MIGRATION ENDPOINT - DELETE AFTER USE
export async function POST(req: NextRequest) {
  try {
    // Security: Check for admin token
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running migration: Update order customer names...');

    // Update orders with customer names from customers table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        UPDATE orders o
        SET
          customer_name = c.name,
          customer_email = c.email
        FROM customers c
        WHERE o.customer_id = c.id
          AND (o.customer_name IS NULL OR o.customer_name = '');
      `
    });

    if (error) {
      console.error('Migration error:', error);

      // Try alternative method using raw SQL through Supabase client
      const { data: orders } = await supabase
        .from('orders')
        .select('id, customer_id')
        .is('customer_name', null);

      if (orders) {
        // Update each order individually
        for (const order of orders) {
          if (order.customer_id) {
            const { data: customer } = await supabase
              .from('customers')
              .select('name, email')
              .eq('id', order.customer_id)
              .single();

            if (customer) {
              await supabase
                .from('orders')
                .update({
                  customer_name: customer.name,
                  customer_email: customer.email,
                })
                .eq('id', order.id);
            }
          }
        }

        return NextResponse.json({
          success: true,
          message: `Updated ${orders.length} orders with customer names`,
          updated: orders.length
        });
      }

      return NextResponse.json({ error: 'Migration failed', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      data
    });
  } catch (error) {
    console.error('Unexpected error during migration:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint for status check
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, customer_name, customer_id')
      .limit(10);

    if (error) throw error;

    const withNames = data?.filter(o => o.customer_name).length || 0;
    const withoutNames = data?.filter(o => !o.customer_name && o.customer_id).length || 0;

    return NextResponse.json({
      total: data?.length || 0,
      withCustomerNames: withNames,
      needsUpdate: withoutNames,
      sample: data?.slice(0, 3)
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}
