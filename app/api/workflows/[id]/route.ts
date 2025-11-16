/**
 * Individual Workflow API Routes
 * GET /api/workflows/:id - Get workflow details
 * PUT /api/workflows/:id - Update workflow
 * DELETE /api/workflows/:id - Delete workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/workflows/:id
 * Get workflow details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    const { data: workflow, error } = await supabase
      .from('email_workflows')
      .select('*, workflow_steps(*), workflow_triggers(*)')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/workflows/:id
 * Update workflow
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    const {
      name,
      description,
      status,
      trigger_type,
      trigger_config,
      steps,
      triggers,
    } = body;

    // Update workflow
    const updateData: any = { updated_at: new Date().toISOString() };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (trigger_type !== undefined) updateData.trigger_type = trigger_type;
    if (trigger_config !== undefined) updateData.trigger_config = trigger_config;

    if (status === 'active') {
      updateData.activated_at = new Date().toISOString();
    }

    const { data: workflow, error: workflowError } = await supabase
      .from('email_workflows')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (workflowError) {
      return NextResponse.json({ error: workflowError.message }, { status: 500 });
    }

    // Update workflow steps if provided
    if (steps !== undefined) {
      // Delete existing steps
      await supabase.from('workflow_steps').delete().eq('workflow_id', id);

      // Insert new steps
      if (steps.length > 0) {
        const stepsData = steps.map((step: any, index: number) => ({
          workflow_id: id,
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

        await supabase.from('workflow_steps').insert(stepsData);
      }
    }

    // Update workflow triggers if provided
    if (triggers !== undefined) {
      // Delete existing triggers
      await supabase.from('workflow_triggers').delete().eq('workflow_id', id);

      // Insert new triggers
      if (triggers.length > 0) {
        const triggersData = triggers.map((trigger: any) => ({
          workflow_id: id,
          trigger_type: trigger.trigger_type,
          trigger_config: trigger.trigger_config || {},
          filter_conditions: trigger.filter_conditions || {},
          schedule_cron: trigger.schedule_cron,
          schedule_timezone: trigger.schedule_timezone || 'UTC',
          next_run_at: trigger.next_run_at,
          is_active: trigger.is_active !== false,
        }));

        await supabase.from('workflow_triggers').insert(triggersData);
      }
    }

    // Fetch updated workflow
    const { data: updatedWorkflow } = await supabase
      .from('email_workflows')
      .select('*, workflow_steps(*), workflow_triggers(*)')
      .eq('id', id)
      .single();

    return NextResponse.json(updatedWorkflow);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/workflows/:id
 * Delete workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Check if workflow has active executions
    const { data: activeExecutions } = await supabase
      .from('workflow_executions')
      .select('id')
      .eq('workflow_id', id)
      .in('status', ['pending', 'running']);

    if (activeExecutions && activeExecutions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete workflow with active executions' },
        { status: 400 }
      );
    }

    // Delete workflow (cascading deletes will handle related records)
    const { error } = await supabase.from('email_workflows').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Workflow deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
