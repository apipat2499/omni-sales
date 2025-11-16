/**
 * Workflow Test API
 * POST /api/workflows/:id/test - Send test workflow execution
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { triggerWorkflow } from '@/lib/automation/workflow-engine';

/**
 * POST /api/workflows/:id/test
 * Execute a test run of the workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;
    const body = await request.json();

    // Validate workflow exists
    const { data: workflow, error: workflowError } = await supabase
      .from('email_workflows')
      .select('*, workflow_steps(*)')
      .eq('id', id)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (!workflow.workflow_steps || workflow.workflow_steps.length === 0) {
      return NextResponse.json(
        { error: 'Workflow has no steps to test' },
        { status: 400 }
      );
    }

    // Create test context
    const testContext = {
      ...body,
      test_mode: true,
      test_timestamp: new Date().toISOString(),
      // Default test data if not provided
      customer_email: body.customer_email || 'test@example.com',
      customer_name: body.customer_name || 'Test Customer',
      customer_phone: body.customer_phone || '+66812345678',
    };

    // Trigger workflow with test context
    const executionId = await triggerWorkflow(id, testContext);

    return NextResponse.json({
      message: 'Test workflow triggered successfully',
      execution_id: executionId,
      test_context: testContext,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
