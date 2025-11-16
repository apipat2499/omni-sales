/**
 * Workflow Executions API
 * GET /api/workflows/:id/executions - Get workflow execution history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/workflows/:id/executions
 * Get workflow execution history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('workflow_executions')
      .select(
        `
        *,
        workflow_triggers(trigger_type),
        workflow_step_executions(count)
      `,
        { count: 'exact' }
      )
      .eq('workflow_id', id)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: executions, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get metrics using the database function
    const { data: metrics } = await supabase.rpc('get_workflow_metrics', {
      p_workflow_id: id,
      p_days: 30,
    });

    return NextResponse.json({
      executions,
      metrics: metrics?.[0] || {},
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
