/**
 * Workflow Activation API
 * POST /api/workflows/:id/activate - Activate/deactivate workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/workflows/:id/activate
 * Activate or deactivate a workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();
    const { active } = body;

    // Validate workflow exists and has steps
    const { data: workflow, error: workflowError } = await supabase
      .from('email_workflows')
      .select('*, workflow_steps(count)')
      .eq('id', id)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (active && (!workflow.workflow_steps || workflow.workflow_steps.length === 0)) {
      return NextResponse.json(
        { error: 'Cannot activate workflow without steps' },
        { status: 400 }
      );
    }

    // Update workflow status
    const newStatus = active ? 'active' : 'paused';
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (active && !workflow.activated_at) {
      updateData.activated_at = new Date().toISOString();
    }

    const { data: updatedWorkflow, error: updateError } = await supabase
      .from('email_workflows')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update triggers active status
    await supabase
      .from('workflow_triggers')
      .update({ is_active: active })
      .eq('workflow_id', id);

    return NextResponse.json({
      message: `Workflow ${active ? 'activated' : 'deactivated'} successfully`,
      workflow: updatedWorkflow,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
