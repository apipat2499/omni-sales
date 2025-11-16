'use client';

/**
 * Email Workflow Builder
 * Visual drag-drop workflow designer with triggers, conditions, and actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { Plus, Play, Pause, Trash2, Save, Eye, Mail, Clock, MessageSquare, Tag, Edit3, GitBranch, CheckCircle } from 'lucide-react';

// Types
interface WorkflowStep {
  id: string;
  step_type: string;
  step_name: string;
  step_config: any;
  position_x: number;
  position_y: number;
  next_step_id?: string;
  condition_true_step_id?: string;
  condition_false_step_id?: string;
}

interface Workflow {
  id?: string;
  name: string;
  description: string;
  status: string;
  trigger_type: string;
  steps: WorkflowStep[];
}

// Step Types Configuration
const STEP_TYPES = [
  {
    type: 'send_email',
    name: 'Send Email',
    icon: Mail,
    color: 'bg-blue-500',
    description: 'Send an email to customer',
  },
  {
    type: 'wait',
    name: 'Wait/Delay',
    icon: Clock,
    color: 'bg-purple-500',
    description: 'Wait for a specific time',
  },
  {
    type: 'send_sms',
    name: 'Send SMS',
    icon: MessageSquare,
    color: 'bg-green-500',
    description: 'Send SMS message',
  },
  {
    type: 'condition',
    name: 'Condition',
    icon: GitBranch,
    color: 'bg-orange-500',
    description: 'If/then logic branching',
  },
  {
    type: 'add_tag',
    name: 'Add Tag',
    icon: Tag,
    color: 'bg-pink-500',
    description: 'Add tag to customer',
  },
  {
    type: 'update_field',
    name: 'Update Field',
    icon: Edit3,
    color: 'bg-indigo-500',
    description: 'Update customer field',
  },
];

// Triggers
const TRIGGERS = [
  { value: 'order_created', label: 'Order Created' },
  { value: 'order_paid', label: 'Order Paid' },
  { value: 'order_shipped', label: 'Order Shipped' },
  { value: 'order_completed', label: 'Order Completed' },
  { value: 'customer_signup', label: 'Customer Signup' },
  { value: 'customer_birthday', label: 'Customer Birthday' },
  { value: 'cart_abandoned', label: 'Cart Abandoned' },
  { value: 'wishlist_viewed', label: 'Wishlist Viewed' },
  { value: 'price_drop', label: 'Price Drop' },
  { value: 'scheduled_time', label: 'Scheduled Time' },
  { value: 'manual_trigger', label: 'Manual Trigger' },
];

// Draggable Step Component
function DraggableStep({ stepType }: { stepType: any }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: stepType.type,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const Icon = stepType.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-shadow"
    >
      <div className={`p-2 ${stepType.color} text-white rounded`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">{stepType.name}</div>
        <div className="text-xs text-gray-500">{stepType.description}</div>
      </div>
    </div>
  );
}

// Workflow Canvas
function WorkflowCanvas({
  steps,
  onAddStep,
  onSelectStep,
  selectedStepId,
}: {
  steps: WorkflowStep[];
  onAddStep: (stepType: string, x: number, y: number) => void;
  onSelectStep: (stepId: string) => void;
  selectedStepId?: string;
}) {
  const { setNodeRef } = useDroppable({
    id: 'workflow-canvas',
  });

  return (
    <div
      ref={setNodeRef}
      className="relative w-full h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-auto"
      style={{ minHeight: '600px' }}
    >
      {steps.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <GitBranch className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Drag and drop steps here to build your workflow</p>
          </div>
        </div>
      ) : (
        <div className="p-8">
          {steps.map((step) => {
            const stepType = STEP_TYPES.find((t) => t.type === step.step_type);
            const Icon = stepType?.icon || Mail;
            const isSelected = step.id === selectedStepId;

            return (
              <div
                key={step.id}
                onClick={() => onSelectStep(step.id)}
                className={`absolute cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
                }`}
                style={{
                  left: step.position_x,
                  top: step.position_y,
                }}
              >
                <div className="bg-white border border-gray-300 rounded-lg p-4 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 ${stepType?.color} text-white rounded`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{step.step_name}</div>
                      <div className="text-xs text-gray-500">{stepType?.name}</div>
                    </div>
                  </div>
                  {step.step_config && Object.keys(step.step_config).length > 0 && (
                    <div className="text-xs text-gray-600 mt-2 pt-2 border-t">
                      {step.step_type === 'send_email' && (
                        <div>Subject: {step.step_config.subject}</div>
                      )}
                      {step.step_type === 'wait' && (
                        <div>
                          Delay: {step.step_config.delay_days || 0}d{' '}
                          {step.step_config.delay_hours || 0}h
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Connector line to next step */}
                {step.next_step_id && (
                  <div className="absolute top-1/2 left-full w-8 h-0.5 bg-gray-400" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Step Configuration Panel
function StepConfigPanel({
  step,
  onUpdate,
  onDelete,
}: {
  step?: WorkflowStep;
  onUpdate: (config: any) => void;
  onDelete: () => void;
}) {
  const [config, setConfig] = useState(step?.step_config || {});

  useEffect(() => {
    setConfig(step?.step_config || {});
  }, [step]);

  if (!step) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <Edit3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Select a step to configure</p>
        </div>
      </div>
    );
  }

  const handleUpdate = () => {
    onUpdate(config);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Configure Step</h3>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Step Name</label>
        <input
          type="text"
          value={step.step_name}
          onChange={(e) => {
            step.step_name = e.target.value;
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Email Configuration */}
      {step.step_type === 'send_email' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={config.subject || ''}
              onChange={(e) => setConfig({ ...config, subject: e.target.value })}
              placeholder="Email subject"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input
              type="text"
              value={config.to || '{{customer_email}}'}
              onChange={(e) => setConfig({ ...config, to: e.target.value })}
              placeholder="{{customer_email}}"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Use {"{{variable}}"} for dynamic values</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Body</label>
            <textarea
              value={config.body || ''}
              onChange={(e) => setConfig({ ...config, body: e.target.value })}
              rows={6}
              placeholder="Email body content"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {/* Wait/Delay Configuration */}
      {step.step_type === 'wait' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Days</label>
            <input
              type="number"
              value={config.delay_days || 0}
              onChange={(e) => setConfig({ ...config, delay_days: parseInt(e.target.value) })}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hours</label>
            <input
              type="number"
              value={config.delay_hours || 0}
              onChange={(e) => setConfig({ ...config, delay_hours: parseInt(e.target.value) })}
              min="0"
              max="23"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {/* SMS Configuration */}
      {step.step_type === 'send_sms' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input
              type="text"
              value={config.to || '{{customer_phone}}'}
              onChange={(e) => setConfig({ ...config, to: e.target.value })}
              placeholder="{{customer_phone}}"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              value={config.message || ''}
              onChange={(e) => setConfig({ ...config, message: e.target.value })}
              rows={4}
              placeholder="SMS message"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {/* Condition Configuration */}
      {step.step_type === 'condition' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Field</label>
            <input
              type="text"
              value={config.condition?.field || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  condition: { ...config.condition, field: e.target.value },
                })
              }
              placeholder="order.total"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Operator</label>
            <select
              value={config.condition?.operator || 'equals'}
              onChange={(e) =>
                setConfig({
                  ...config,
                  condition: { ...config.condition, operator: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="equals">Equals</option>
              <option value="not_equals">Not Equals</option>
              <option value="greater_than">Greater Than</option>
              <option value="less_than">Less Than</option>
              <option value="contains">Contains</option>
              <option value="not_contains">Not Contains</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Value</label>
            <input
              type="text"
              value={config.condition?.value || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  condition: { ...config.condition, value: e.target.value },
                })
              }
              placeholder="Comparison value"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {/* Add Tag Configuration */}
      {step.step_type === 'add_tag' && (
        <div>
          <label className="block text-sm font-medium mb-1">Tag Name</label>
          <input
            type="text"
            value={config.tag || ''}
            onChange={(e) => setConfig({ ...config, tag: e.target.value })}
            placeholder="vip-customer"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Update Field Configuration */}
      {step.step_type === 'update_field' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Table</label>
            <input
              type="text"
              value={config.table || 'customers'}
              onChange={(e) => setConfig({ ...config, table: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Field</label>
            <input
              type="text"
              value={config.field || ''}
              onChange={(e) => setConfig({ ...config, field: e.target.value })}
              placeholder="Field name"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Value</label>
            <input
              type="text"
              value={config.value || ''}
              onChange={(e) => setConfig({ ...config, value: e.target.value })}
              placeholder="New value"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      <button
        onClick={handleUpdate}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
      >
        Update Configuration
      </button>
    </div>
  );
}

// Main Workflow Builder Component
export default function EmailWorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow>({
    name: 'New Workflow',
    description: '',
    status: 'draft',
    trigger_type: 'order_created',
    steps: [],
  });
  const [selectedStepId, setSelectedStepId] = useState<string>();
  const [loading, setLoading] = useState(false);

  // Load workflows
  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over?.id === 'workflow-canvas') {
      const stepType = active.id as string;
      // Add step at dropped position
      // For simplicity, using fixed position
      handleAddStep(stepType, 100, currentWorkflow.steps.length * 150 + 50);
    }
  };

  const handleAddStep = (stepType: string, x: number, y: number) => {
    const stepConfig = STEP_TYPES.find((t) => t.type === stepType);
    if (!stepConfig) return;

    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      step_type: stepType,
      step_name: stepConfig.name,
      step_config: {},
      position_x: x,
      position_y: y,
    };

    // Link to previous step
    if (currentWorkflow.steps.length > 0) {
      const lastStep = currentWorkflow.steps[currentWorkflow.steps.length - 1];
      lastStep.next_step_id = newStep.id;
    }

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: [...currentWorkflow.steps, newStep],
    });
  };

  const handleUpdateStep = (config: any) => {
    if (!selectedStepId) return;

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: currentWorkflow.steps.map((step) =>
        step.id === selectedStepId ? { ...step, step_config: config } : step
      ),
    });
  };

  const handleDeleteStep = () => {
    if (!selectedStepId) return;

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: currentWorkflow.steps.filter((step) => step.id !== selectedStepId),
    });
    setSelectedStepId(undefined);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const method = currentWorkflow.id ? 'PUT' : 'POST';
      const url = currentWorkflow.id
        ? `/api/workflows/${currentWorkflow.id}`
        : '/api/workflows';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentWorkflow),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentWorkflow(data);
        loadWorkflows();
        alert('Workflow saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      alert('Failed to save workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!currentWorkflow.id) {
      alert('Please save the workflow first');
      return;
    }

    try {
      const response = await fetch(`/api/workflows/${currentWorkflow.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: currentWorkflow.status !== 'active' }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentWorkflow(data.workflow);
        loadWorkflows();
      }
    } catch (error) {
      console.error('Failed to activate workflow:', error);
    }
  };

  const selectedStep = currentWorkflow.steps.find((s) => s.id === selectedStepId);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Email Workflow Builder</h1>
            <p className="text-gray-600">Create automated email workflows with visual designer</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleActivate}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                currentWorkflow.status === 'active'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {currentWorkflow.status === 'active' ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Activate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Workflow Settings */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Workflow Name</label>
            <input
              type="text"
              value={currentWorkflow.name}
              onChange={(e) =>
                setCurrentWorkflow({ ...currentWorkflow, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Trigger</label>
            <select
              value={currentWorkflow.trigger_type}
              onChange={(e) =>
                setCurrentWorkflow({ ...currentWorkflow, trigger_type: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              {TRIGGERS.map((trigger) => (
                <option key={trigger.value} value={trigger.value}>
                  {trigger.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={currentWorkflow.description}
              onChange={(e) =>
                setCurrentWorkflow({ ...currentWorkflow, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-200px)]">
        {/* Left Sidebar - Step Palette */}
        <div className="w-64 bg-white border-r p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Available Actions</h3>
          <DndContext onDragEnd={handleDragEnd}>
            <div className="space-y-2">
              {STEP_TYPES.map((stepType) => (
                <DraggableStep key={stepType.type} stepType={stepType} />
              ))}
            </div>
          </DndContext>
        </div>

        {/* Center - Workflow Canvas */}
        <div className="flex-1 p-6">
          <WorkflowCanvas
            steps={currentWorkflow.steps}
            onAddStep={handleAddStep}
            onSelectStep={setSelectedStepId}
            selectedStepId={selectedStepId}
          />
        </div>

        {/* Right Sidebar - Step Configuration */}
        <div className="w-96 bg-white border-l overflow-y-auto">
          <StepConfigPanel
            step={selectedStep}
            onUpdate={handleUpdateStep}
            onDelete={handleDeleteStep}
          />
        </div>
      </div>
    </div>
  );
}
