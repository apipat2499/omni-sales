/**
 * GET /api/tickets/:ticketId - Get ticket details
 * PUT /api/tickets/:ticketId - Update ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTicketManager } from '@/lib/tickets/ticket-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { ticketId } = params;
    const ticketManager = getTicketManager();

    const ticket = await ticketManager.getTicketById(ticketId);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  try {
    const { ticketId } = params;
    const body = await request.json();
    const { status, priority, agentId, teamId, teamName, tags, addTags, removeTags } = body;

    const ticketManager = getTicketManager();

    let ticket;

    if (status) {
      ticket = await ticketManager.updateTicketStatus(ticketId, status);
    } else if (priority) {
      ticket = await ticketManager.updateTicketPriority(ticketId, priority);
    } else if (agentId) {
      ticket = await ticketManager.assignTicketToAgent(ticketId, agentId);
    } else if (teamId && teamName) {
      ticket = await ticketManager.assignTicketToTeam(ticketId, teamId, teamName);
    } else if (addTags) {
      ticket = await ticketManager.addTicketTags(ticketId, addTags);
    } else if (removeTags) {
      ticket = await ticketManager.removeTicketTags(ticketId, removeTags);
    } else {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ticket,
    });
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
