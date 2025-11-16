/**
 * Email Workflow Engine
 * Executes workflows automatically with triggers, conditions, and actions
 */

import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/email-service';
import { sendSMS } from '@/lib/sms/sms-service';

// Types
export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  step_type: StepType;
  step_name: string;
  step_config: any;
  next_step_id?: string;
  condition_true_step_id?: string;
  condition_false_step_id?: string;
  is_enabled: boolean;
  retry_on_failure: boolean;
  max_retries: number;
  retry_delay_seconds: number;
}

export type StepType =
  | 'send_email'
  | 'wait'
  | 'delay'
  | 'send_sms'
  | 'create_task'
  | 'add_tag'
  | 'update_field'
  | 'condition'
  | 'branch'
  | 'end';

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  trigger_id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  execution_context: any;
  current_step_id?: string;
  started_at: Date;
  completed_at?: Date;
}

export interface StepExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  nextStepId?: string;
}

/**
 * Workflow Engine Class
 */
export class WorkflowEngine {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(executionId: string): Promise<void> {
    try {
      // Get execution details
      const { data: execution, error: execError } = await this.supabase
        .from('workflow_executions')
        .select('*, email_workflows(*)')
        .eq('id', executionId)
        .single();

      if (execError || !execution) {
        throw new Error('Execution not found');
      }

      // Update status to running
      await this.updateExecutionStatus(executionId, 'running');

      // Get workflow steps
      const { data: steps, error: stepsError } = await this.supabase
        .from('workflow_steps')
        .select('*')
        .eq('workflow_id', execution.workflow_id)
        .eq('is_enabled', true)
        .order('step_order', { ascending: true });

      if (stepsError || !steps || steps.length === 0) {
        throw new Error('No steps found for workflow');
      }

      // Execute steps sequentially
      let currentStep = steps[0];
      let stepIndex = 0;

      while (currentStep && stepIndex < 100) { // Safety limit
        // Execute step
        const result = await this.executeStep(
          executionId,
          currentStep,
          execution.execution_context
        );

        if (!result.success) {
          // Handle step failure
          if (currentStep.retry_on_failure) {
            const retried = await this.retryStep(executionId, currentStep);
            if (!retried) {
              throw new Error(`Step ${currentStep.step_name} failed: ${result.error}`);
            }
          } else {
            throw new Error(`Step ${currentStep.step_name} failed: ${result.error}`);
          }
        }

        // Update execution context with result data
        if (result.data) {
          execution.execution_context = {
            ...execution.execution_context,
            ...result.data,
          };
        }

        // Determine next step
        if (result.nextStepId) {
          currentStep = steps.find((s) => s.id === result.nextStepId) || null;
        } else if (currentStep.next_step_id) {
          currentStep = steps.find((s) => s.id === currentStep.next_step_id) || null;
        } else {
          currentStep = null; // End of workflow
        }

        stepIndex++;
      }

      // Mark execution as completed
      await this.updateExecutionStatus(executionId, 'completed');
      await this.updateWorkflowStats(execution.workflow_id, true);
    } catch (error: any) {
      console.error('Workflow execution error:', error);
      await this.updateExecutionStatus(executionId, 'failed', error.message);
      await this.updateWorkflowStats(execution.workflow_id, false);
      throw error;
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    executionId: string,
    step: WorkflowStep,
    context: any
  ): Promise<StepExecutionResult> {
    // Create step execution record
    const { data: stepExecution, error: createError } = await this.supabase
      .from('workflow_step_executions')
      .insert({
        execution_id: executionId,
        step_id: step.id,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      return { success: false, error: createError.message };
    }

    try {
      let result: StepExecutionResult;

      // Execute based on step type
      switch (step.step_type) {
        case 'send_email':
          result = await this.executeSendEmail(step, context);
          break;
        case 'send_sms':
          result = await this.executeSendSMS(step, context);
          break;
        case 'wait':
        case 'delay':
          result = await this.executeDelay(step, context, stepExecution.id);
          break;
        case 'condition':
          result = await this.executeCondition(step, context);
          break;
        case 'add_tag':
          result = await this.executeAddTag(step, context);
          break;
        case 'update_field':
          result = await this.executeUpdateField(step, context);
          break;
        case 'create_task':
          result = await this.executeCreateTask(step, context);
          break;
        case 'end':
          result = { success: true };
          break;
        default:
          result = { success: false, error: 'Unknown step type' };
      }

      // Update step execution record
      await this.supabase
        .from('workflow_step_executions')
        .update({
          status: result.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          result_data: result.data || {},
          error_message: result.error,
        })
        .eq('id', stepExecution.id);

      return result;
    } catch (error: any) {
      // Update step execution as failed
      await this.supabase
        .from('workflow_step_executions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
        })
        .eq('id', stepExecution.id);

      return { success: false, error: error.message };
    }
  }

  /**
   * Execute send email action
   */
  private async executeSendEmail(
    step: WorkflowStep,
    context: any
  ): Promise<StepExecutionResult> {
    const config = step.step_config;

    // Replace variables in email content
    const to = this.replaceVariables(config.to || context.customer_email, context);
    const subject = this.replaceVariables(config.subject, context);
    const body = this.replaceVariables(config.body, context);

    try {
      await sendEmail({
        to,
        subject,
        html: body,
        templateId: config.template_id,
        templateData: context,
      });

      // Track analytics
      await this.recordAnalytics({
        workflow_id: step.workflow_id,
        event_type: 'email_sent',
        metadata: { recipient_email: to, subject },
      });

      return {
        success: true,
        data: { email_sent_to: to },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute send SMS action
   */
  private async executeSendSMS(
    step: WorkflowStep,
    context: any
  ): Promise<StepExecutionResult> {
    const config = step.step_config;

    const to = this.replaceVariables(config.to || context.customer_phone, context);
    const message = this.replaceVariables(config.message, context);

    try {
      await sendSMS({
        to,
        message,
      });

      // Track analytics
      await this.recordAnalytics({
        workflow_id: step.workflow_id,
        event_type: 'sms_sent',
        metadata: { recipient_phone: to },
      });

      return {
        success: true,
        data: { sms_sent_to: to },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute delay/wait action
   */
  private async executeDelay(
    step: WorkflowStep,
    context: any,
    stepExecutionId: string
  ): Promise<StepExecutionResult> {
    const config = step.step_config;
    const delaySeconds = config.delay_seconds || 0;
    const delayHours = config.delay_hours || 0;
    const delayDays = config.delay_days || 0;

    const totalSeconds = delaySeconds + delayHours * 3600 + delayDays * 86400;

    if (totalSeconds > 0) {
      const resumeAt = new Date(Date.now() + totalSeconds * 1000);

      // Update step execution with resume time
      await this.supabase
        .from('workflow_step_executions')
        .update({
          status: 'waiting',
          resume_at: resumeAt.toISOString(),
        })
        .eq('id', stepExecutionId);

      // In production, use a job queue (e.g., BullMQ, Temporal)
      // For now, we'll use a simple setTimeout (not recommended for long delays)
      if (totalSeconds < 3600) {
        // Only for delays < 1 hour
        await new Promise((resolve) => setTimeout(resolve, totalSeconds * 1000));
      } else {
        // For longer delays, mark as waiting and handle via cron job
        return {
          success: true,
          data: { waiting_until: resumeAt },
        };
      }
    }

    return { success: true };
  }

  /**
   * Execute condition check
   */
  private async executeCondition(
    step: WorkflowStep,
    context: any
  ): Promise<StepExecutionResult> {
    const config = step.step_config;

    // Evaluate condition
    const conditionMet = this.evaluateCondition(config.condition, context);

    // Determine next step based on condition result
    const nextStepId = conditionMet
      ? step.condition_true_step_id
      : step.condition_false_step_id;

    return {
      success: true,
      nextStepId: nextStepId || undefined,
      data: { condition_result: conditionMet },
    };
  }

  /**
   * Execute add tag action
   */
  private async executeAddTag(
    step: WorkflowStep,
    context: any
  ): Promise<StepExecutionResult> {
    const config = step.step_config;
    const customerId = context.customer_id;

    if (!customerId) {
      return { success: false, error: 'Customer ID not found in context' };
    }

    try {
      // Get current tags
      const { data: customer } = await this.supabase
        .from('customers')
        .select('tags')
        .eq('id', customerId)
        .single();

      const currentTags = customer?.tags || [];
      const newTags = [...new Set([...currentTags, config.tag])];

      // Update customer tags
      await this.supabase
        .from('customers')
        .update({ tags: newTags })
        .eq('id', customerId);

      return {
        success: true,
        data: { tag_added: config.tag },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute update field action
   */
  private async executeUpdateField(
    step: WorkflowStep,
    context: any
  ): Promise<StepExecutionResult> {
    const config = step.step_config;
    const table = config.table;
    const recordId = context[`${table}_id`];

    if (!recordId) {
      return { success: false, error: `${table} ID not found in context` };
    }

    try {
      const updates: any = {};
      updates[config.field] = this.replaceVariables(config.value, context);

      await this.supabase.from(table).update(updates).eq('id', recordId);

      return {
        success: true,
        data: { field_updated: config.field },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute create task action
   */
  private async executeCreateTask(
    step: WorkflowStep,
    context: any
  ): Promise<StepExecutionResult> {
    const config = step.step_config;

    try {
      const { data, error } = await this.supabase.from('tasks').insert({
        title: this.replaceVariables(config.title, context),
        description: this.replaceVariables(config.description, context),
        assigned_to: config.assigned_to,
        due_date: config.due_date,
        priority: config.priority || 'medium',
        status: 'pending',
      });

      if (error) throw error;

      return {
        success: true,
        data: { task_created: data },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Retry a failed step
   */
  private async retryStep(executionId: string, step: WorkflowStep): Promise<boolean> {
    // Get retry count
    const { data: stepExecutions } = await this.supabase
      .from('workflow_step_executions')
      .select('retry_count')
      .eq('execution_id', executionId)
      .eq('step_id', step.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const retryCount = stepExecutions?.[0]?.retry_count || 0;

    if (retryCount >= step.max_retries) {
      return false;
    }

    // Wait before retry
    await new Promise((resolve) =>
      setTimeout(resolve, step.retry_delay_seconds * 1000)
    );

    return true;
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(condition: any, context: any): boolean {
    const { field, operator, value } = condition;
    const fieldValue = this.getNestedValue(context, field);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'greater_than':
        return fieldValue > value;
      case 'less_than':
        return fieldValue < value;
      case 'contains':
        return String(fieldValue).includes(String(value));
      case 'not_contains':
        return !String(fieldValue).includes(String(value));
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined;
      case 'not_exists':
        return fieldValue === null || fieldValue === undefined;
      default:
        return false;
    }
  }

  /**
   * Replace variables in a string
   */
  private replaceVariables(template: string, context: any): string {
    if (!template) return '';

    return template.replace(/\{\{(\w+\.?\w*)\}\}/g, (match, variable) => {
      const value = this.getNestedValue(context, variable);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Update execution status
   */
  private async updateExecutionStatus(
    executionId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    await this.supabase.from('workflow_executions').update(updates).eq('id', executionId);
  }

  /**
   * Update workflow statistics
   */
  private async updateWorkflowStats(
    workflowId: string,
    success: boolean
  ): Promise<void> {
    const field = success ? 'successful_executions' : 'failed_executions';

    const { data: workflow } = await this.supabase
      .from('email_workflows')
      .select(field)
      .eq('id', workflowId)
      .single();

    if (workflow) {
      const updates: any = { updated_at: new Date().toISOString() };
      updates[field] = (workflow[field] || 0) + 1;

      await this.supabase.from('email_workflows').update(updates).eq('id', workflowId);
    }
  }

  /**
   * Record workflow analytics
   */
  private async recordAnalytics(data: {
    workflow_id: string;
    event_type: string;
    metadata?: any;
  }): Promise<void> {
    await this.supabase.from('workflow_analytics').insert({
      workflow_id: data.workflow_id,
      event_type: data.event_type,
      event_timestamp: new Date().toISOString(),
      metadata: data.metadata || {},
    });
  }
}

/**
 * Trigger a workflow based on an event
 */
export async function triggerWorkflow(
  workflowId: string,
  context: any
): Promise<string> {
  const supabase = createClient();

  // Create execution
  const { data, error } = await supabase.rpc('trigger_workflow_execution', {
    p_workflow_id: workflowId,
    p_trigger_id: null,
    p_context: context,
  });

  if (error) {
    throw new Error(`Failed to trigger workflow: ${error.message}`);
  }

  const executionId = data;

  // Execute workflow asynchronously
  const engine = new WorkflowEngine();
  engine.executeWorkflow(executionId).catch((error) => {
    console.error('Workflow execution failed:', error);
  });

  return executionId;
}

/**
 * Schedule workflow execution (for time-based triggers)
 */
export async function scheduleWorkflows(): Promise<void> {
  const supabase = createClient();

  // Get workflows with time-based triggers that are due
  const { data: triggers } = await supabase
    .from('workflow_triggers')
    .select('*, email_workflows(*)')
    .eq('is_active', true)
    .in('trigger_type', ['scheduled_time', 'recurring_schedule'])
    .lte('next_run_at', new Date().toISOString());

  if (!triggers || triggers.length === 0) return;

  for (const trigger of triggers) {
    try {
      // Trigger workflow
      await triggerWorkflow(trigger.workflow_id, {
        trigger_type: trigger.trigger_type,
        scheduled_at: new Date().toISOString(),
      });

      // Update next run time for recurring schedules
      if (trigger.trigger_type === 'recurring_schedule' && trigger.schedule_cron) {
        // Calculate next run time based on cron expression
        // (You'll need a cron parser library like 'cron-parser')
        const nextRunAt = calculateNextRunTime(trigger.schedule_cron);

        await supabase
          .from('workflow_triggers')
          .update({
            next_run_at: nextRunAt,
            last_run_at: new Date().toISOString(),
          })
          .eq('id', trigger.id);
      } else {
        // Deactivate one-time scheduled triggers
        await supabase
          .from('workflow_triggers')
          .update({
            is_active: false,
            last_run_at: new Date().toISOString(),
          })
          .eq('id', trigger.id);
      }
    } catch (error) {
      console.error(`Failed to trigger workflow ${trigger.workflow_id}:`, error);
    }
  }
}

/**
 * Calculate next run time based on cron expression
 */
function calculateNextRunTime(cronExpression: string): string {
  // Placeholder - implement with cron-parser library
  // For now, return 1 day from now
  return new Date(Date.now() + 86400000).toISOString();
}

/**
 * Resume waiting workflow executions
 */
export async function resumeWaitingExecutions(): Promise<void> {
  const supabase = createClient();

  // Get step executions that are waiting and ready to resume
  const { data: stepExecutions } = await supabase
    .from('workflow_step_executions')
    .select('*, workflow_executions(*)')
    .eq('status', 'waiting')
    .lte('resume_at', new Date().toISOString());

  if (!stepExecutions || stepExecutions.length === 0) return;

  for (const stepExecution of stepExecutions) {
    try {
      // Mark step as completed
      await supabase
        .from('workflow_step_executions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', stepExecution.id);

      // Resume workflow execution
      const engine = new WorkflowEngine();
      await engine.executeWorkflow(stepExecution.execution_id);
    } catch (error) {
      console.error(`Failed to resume execution ${stepExecution.execution_id}:`, error);
    }
  }
}
