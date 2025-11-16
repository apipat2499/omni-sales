/**
 * POST /api/tickets - Create a new support ticket
 * GET /api/tickets - Get tickets with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTicketManager } from '@/lib/tickets/ticket-manager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      customerName,
      customerEmail,
      subject,
      description,
      priority,
      category,
      tags,
      conversationId,
      metadata,
    } = body;

    // Validation
    if (!customerId || !customerName || !customerEmail || !subject || !description) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: customerId, customerName, customerEmail, subject, description',
        },
        { status: 400 }
      );
    }

    const ticketManager = getTicketManager();

    let ticket;
    if (conversationId) {
      // Create from conversation
      ticket = await ticketManager.createTicketFromConversation(conversationId, {
        subject,
        description,
        priority,
        category,
        tags,
      });
    } else {
      // Create new ticket
      ticket = await ticketManager.createNewTicket({
        customerId,
        customerName,
        customerEmail,
        subject,
        description,
        priority,
        category,
        tags,
        metadata,
      });
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const assignedAgentId = searchParams.get('assignedAgentId') || undefined;
    const category = searchParams.get('category') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const ticketManager = getTicketManager();
    const tickets = await ticketManager.getTicketsList({
      status: status as any,
      priority: priority as any,
      assignedAgentId,
      category,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      tickets,
    });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
