/**
 * Chat System Integrations
 * Email, SMS, and CRM integration handlers
 */

import type { Conversation, Message, Ticket } from './types';
import { sendEmail } from '../email/service';
import { sendSMS } from '../sms/service';

/**
 * Email Integration
 */
export class EmailIntegration {
  /**
   * Send new message notification via email
   */
  async notifyNewMessage(
    conversation: Conversation,
    message: Message,
    recipientEmail: string
  ): Promise<void> {
    try {
      const subject = `New message in conversation: ${conversation.subject || 'Customer Support'}`;
      const body = `
You have a new message from ${message.senderName}:

${message.content}

Conversation ID: ${conversation.id}
Customer: ${conversation.customerName}
Channel: ${conversation.channel}

Please reply to continue the conversation.
      `.trim();

      await sendEmail({
        to: recipientEmail,
        subject,
        body,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">New Message</h2>
            <p>You have a new message from <strong>${message.senderName}</strong>:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;">${message.content}</p>
            </div>
            <div style="margin-top: 20px; font-size: 14px; color: #6b7280;">
              <p><strong>Conversation ID:</strong> ${conversation.id}</p>
              <p><strong>Customer:</strong> ${conversation.customerName}</p>
              <p><strong>Channel:</strong> ${conversation.channel}</p>
            </div>
            <p style="margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/chat/${conversation.id}"
                 style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Conversation
              </a>
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  /**
   * Send conversation summary via email
   */
  async sendConversationSummary(
    conversation: Conversation,
    messages: Message[],
    recipientEmail: string
  ): Promise<void> {
    try {
      const subject = `Conversation Summary: ${conversation.subject || 'Customer Support'}`;

      const messageList = messages
        .map(
          (msg) => `
[${msg.createdAt.toLocaleString()}] ${msg.senderName}:
${msg.content}
      `
        )
        .join('\n\n');

      const body = `
Conversation Summary

Customer: ${conversation.customerName}
${conversation.customerEmail ? `Email: ${conversation.customerEmail}` : ''}
${conversation.agentName ? `Agent: ${conversation.agentName}` : ''}
Status: ${conversation.status}
Started: ${conversation.startedAt.toLocaleString()}
${conversation.resolvedAt ? `Resolved: ${conversation.resolvedAt.toLocaleString()}` : ''}

Messages:
${messageList}
      `.trim();

      await sendEmail({
        to: recipientEmail,
        subject,
        body,
        html: body.replace(/\n/g, '<br>'),
      });
    } catch (error) {
      console.error('Error sending conversation summary:', error);
    }
  }

  /**
   * Send ticket assignment notification
   */
  async notifyTicketAssignment(ticket: Ticket, agentEmail: string): Promise<void> {
    try {
      const subject = `New Ticket Assigned: ${ticket.subject}`;
      const body = `
A new support ticket has been assigned to you.

Ticket ID: ${ticket.id}
Subject: ${ticket.subject}
Priority: ${ticket.priority}
Customer: ${ticket.customerName} (${ticket.customerEmail})

Description:
${ticket.description}

${ticket.slaDueAt ? `SLA Due: ${new Date(ticket.slaDueAt).toLocaleString()}` : ''}

Please review and respond to this ticket.
      `.trim();

      await sendEmail({
        to: agentEmail,
        subject,
        body,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1f2937;">New Ticket Assigned</h2>
            <div style="background-color: ${
              ticket.priority === 'urgent' ? '#fee2e2' : '#f3f4f6'
            }; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Ticket ID:</strong> ${ticket.id}</p>
              <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
              <p style="margin: 0 0 10px 0;">
                <strong>Priority:</strong>
                <span style="padding: 2px 8px; background-color: ${
                  ticket.priority === 'urgent'
                    ? '#dc2626'
                    : ticket.priority === 'high'
                    ? '#f59e0b'
                    : '#10b981'
                }; color: white; border-radius: 4px;">${ticket.priority}</span>
              </p>
              <p style="margin: 0;"><strong>Customer:</strong> ${ticket.customerName} (${
          ticket.customerEmail
        })</p>
            </div>
            <div style="margin-top: 20px;">
              <p><strong>Description:</strong></p>
              <p>${ticket.description}</p>
            </div>
            ${
              ticket.slaDueAt
                ? `<p style="color: #dc2626; margin-top: 20px;"><strong>SLA Due:</strong> ${new Date(
                    ticket.slaDueAt
                  ).toLocaleString()}</p>`
                : ''
            }
            <p style="margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticket.id}"
                 style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Ticket
              </a>
            </p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Error sending ticket assignment notification:', error);
    }
  }
}

/**
 * SMS Integration
 */
export class SMSIntegration {
  /**
   * Send urgent notification via SMS
   */
  async sendUrgentNotification(
    phoneNumber: string,
    message: string
  ): Promise<void> {
    try {
      await sendSMS({
        to: phoneNumber,
        message: message.substring(0, 160), // SMS character limit
      });
    } catch (error) {
      console.error('Error sending SMS notification:', error);
    }
  }

  /**
   * Notify agent of high priority ticket via SMS
   */
  async notifyHighPriorityTicket(
    phoneNumber: string,
    ticket: Ticket
  ): Promise<void> {
    try {
      const message = `URGENT: New ${ticket.priority} priority ticket #${ticket.id}: ${ticket.subject}. Check your email for details.`;
      await this.sendUrgentNotification(phoneNumber, message);
    } catch (error) {
      console.error('Error sending high priority ticket SMS:', error);
    }
  }

  /**
   * Send SLA breach warning via SMS
   */
  async sendSLABreachWarning(
    phoneNumber: string,
    ticket: Ticket,
    minutesRemaining: number
  ): Promise<void> {
    try {
      const message = `SLA WARNING: Ticket #${ticket.id} breaches in ${minutesRemaining} minutes. Please respond urgently.`;
      await this.sendUrgentNotification(phoneNumber, message);
    } catch (error) {
      console.error('Error sending SLA breach warning SMS:', error);
    }
  }
}

/**
 * CRM Integration
 */
export class CRMIntegration {
  /**
   * Sync conversation to CRM
   */
  async syncConversationToCRM(conversation: Conversation): Promise<void> {
    try {
      // This would integrate with your CRM system (Salesforce, HubSpot, etc.)
      // For now, we'll just log it
      console.log('Syncing conversation to CRM:', {
        conversationId: conversation.id,
        customerId: conversation.customerId,
        customerName: conversation.customerName,
        status: conversation.status,
        channel: conversation.channel,
      });

      // Example: POST to CRM API
      /*
      await fetch('https://crm-api.example.com/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          external_id: conversation.id,
          customer_id: conversation.customerId,
          customer_name: conversation.customerName,
          customer_email: conversation.customerEmail,
          status: conversation.status,
          channel: conversation.channel,
          subject: conversation.subject,
          started_at: conversation.startedAt,
          agent_id: conversation.agentId,
          agent_name: conversation.agentName,
        }),
      });
      */
    } catch (error) {
      console.error('Error syncing conversation to CRM:', error);
    }
  }

  /**
   * Sync ticket to CRM
   */
  async syncTicketToCRM(ticket: Ticket): Promise<void> {
    try {
      console.log('Syncing ticket to CRM:', {
        ticketId: ticket.id,
        customerId: ticket.customerId,
        subject: ticket.subject,
        priority: ticket.priority,
        status: ticket.status,
      });

      // Example: POST to CRM API
      // Similar to syncConversationToCRM
    } catch (error) {
      console.error('Error syncing ticket to CRM:', error);
    }
  }

  /**
   * Get customer context from CRM
   */
  async getCustomerContext(customerId: string): Promise<{
    totalOrders?: number;
    totalSpent?: number;
    lastOrderDate?: Date;
    lifetimeValue?: number;
    tags?: string[];
    notes?: string;
  }> {
    try {
      // This would fetch customer data from CRM
      // For now, return placeholder data
      return {
        totalOrders: 0,
        totalSpent: 0,
        tags: [],
      };

      // Example: GET from CRM API
      /*
      const response = await fetch(`https://crm-api.example.com/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CRM_API_KEY}`,
        },
      });
      const data = await response.json();
      return data;
      */
    } catch (error) {
      console.error('Error fetching customer context from CRM:', error);
      return {};
    }
  }

  /**
   * Create or update customer in CRM
   */
  async upsertCustomer(customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      console.log('Upserting customer in CRM:', customer);
      // Example: PUT to CRM API
    } catch (error) {
      console.error('Error upserting customer in CRM:', error);
    }
  }
}

// Singleton instances
let emailIntegrationInstance: EmailIntegration | null = null;
let smsIntegrationInstance: SMSIntegration | null = null;
let crmIntegrationInstance: CRMIntegration | null = null;

export function getEmailIntegration(): EmailIntegration {
  if (!emailIntegrationInstance) {
    emailIntegrationInstance = new EmailIntegration();
  }
  return emailIntegrationInstance;
}

export function getSMSIntegration(): SMSIntegration {
  if (!smsIntegrationInstance) {
    smsIntegrationInstance = new SMSIntegration();
  }
  return smsIntegrationInstance;
}

export function getCRMIntegration(): CRMIntegration {
  if (!crmIntegrationInstance) {
    crmIntegrationInstance = new CRMIntegration();
  }
  return crmIntegrationInstance;
}
