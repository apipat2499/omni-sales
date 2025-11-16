/**
 * Workflows API Routes
 * POST /api/workflows - Create workflow
 * GET /api/workflows - List workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/workflows
 * List all workflows
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const triggerType = searchParams.get('trigger_type');
    const isTemplate = searchParams.get('is_template') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('email_workflows')
      .select('*, workflow_triggers(*), workflow_steps(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (triggerType) {
      query = query.eq('trigger_type', triggerType);
    }

    if (isTemplate) {
      query = query.eq('is_template', true);
    }

    const { data: workflows, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      workflows,
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

/**
 * POST /api/workflows
 * Create new workflow
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      name,
      description,
      trigger_type,
      trigger_config,
      steps,
      triggers,
      is_template,
      template_category,
    } = body;

    // Validate required fields
    if (!name || !trigger_type) {
      return NextResponse.json(
        { error: 'Name and trigger type are required' },
        { status: 400 }
      );
    }

    // Create workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('email_workflows')
      .insert({
        name,
        description,
        trigger_type,
        trigger_config: trigger_config || {},
        status: 'draft',
        is_template,
        template_category,
      })
      .select()
      .single();

    if (workflowError) {
      return NextResponse.json({ error: workflowError.message }, { status: 500 });
    }

    // Create workflow steps if provided
    if (steps && steps.length > 0) {
      const stepsData = steps.map((step: any, index: number) => ({
        workflow_id: workflow.id,
        step_order: index + 1,
        step_type: step.step_type,
        step_name: step.step_name,
        step_config: step.step_config || {},
        position_x: step.position_x,
        position_y: step.position_y,
        next_step_id: step.next_step_id,
        condition_true_step_id: step.condition_true_step_id,
        condition_false_step_id: step.condition_false_step_id,
        is_enabled: step.is_enabled !== false,
        retry_on_failure: step.retry_on_failure !== false,
        max_retries: step.max_retries || 3,
        retry_delay_seconds: step.retry_delay_seconds || 300,
      }));

      const { error: stepsError } = await supabase
        .from('workflow_steps')
        .insert(stepsData);

      if (stepsError) {
        // Rollback workflow creation
        await supabase.from('email_workflows').delete().eq('id', workflow.id);
        return NextResponse.json({ error: stepsError.message }, { status: 500 });
      }
    }

    // Create workflow triggers if provided
    if (triggers && triggers.length > 0) {
      const triggersData = triggers.map((trigger: any) => ({
        workflow_id: workflow.id,
        trigger_type: trigger.trigger_type,
        trigger_config: trigger.trigger_config || {},
        filter_conditions: trigger.filter_conditions || {},
        schedule_cron: trigger.schedule_cron,
        schedule_timezone: trigger.schedule_timezone || 'UTC',
        next_run_at: trigger.next_run_at,
        is_active: trigger.is_active !== false,
      }));

      const { error: triggersError } = await supabase
        .from('workflow_triggers')
        .insert(triggersData);

      if (triggersError) {
        console.error('Failed to create triggers:', triggersError);
      }
    }

    // Fetch complete workflow with steps and triggers
    const { data: completeWorkflow } = await supabase
      .from('email_workflows')
      .select('*, workflow_steps(*), workflow_triggers(*)')
      .eq('id', workflow.id)
      .single();

    return NextResponse.json(completeWorkflow, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
