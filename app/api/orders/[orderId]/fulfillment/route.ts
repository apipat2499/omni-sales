import { NextRequest, NextResponse } from 'next/server';
import {
  createFulfillmentTask,
  updateFulfillmentTask,
} from '@/lib/order/service';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    const { data: tasks, error } = await supabase
      .from('fulfillment_tasks')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch fulfillment tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json(tasks || []);
  } catch (error) {
    console.error('Error fetching fulfillment tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fulfillment tasks' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;
    const { taskType, priority, assignedTo, notes } = await req.json();

    if (!orderId || !taskType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const task = await createFulfillmentTask(orderId, {
      taskType,
      priority,
      assignedTo,
      notes,
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Failed to create fulfillment task' },
        { status: 500 }
      );
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating fulfillment task:', error);
    return NextResponse.json(
      { error: 'Failed to create fulfillment task' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { taskId, status, notes } = await req.json();

    if (!taskId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await updateFulfillmentTask(taskId, status, notes);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update fulfillment task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      taskId,
      status,
    });
  } catch (error) {
    console.error('Error updating fulfillment task:', error);
    return NextResponse.json(
      { error: 'Failed to update fulfillment task' },
      { status: 500 }
    );
  }
}
