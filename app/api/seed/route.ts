import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

const userId = 'user-1';

async function seedOrders() {
  const orders = [
    {
      user_id: userId,
      customer_id: 'cust-001',
      customer_name: 'John Smith',
      subtotal: '150.00',
      tax: '15.00',
      shipping: '10.00',
      total: '175.00',
      status: 'delivered',
      channel: 'online',
      payment_method: 'credit_card',
      shipping_address: JSON.stringify({
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      }),
      notes: 'Please leave at front door',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      delivered_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: userId,
      customer_id: 'cust-002',
      customer_name: 'Sarah Johnson',
      subtotal: '250.00',
      tax: '25.00',
      shipping: '15.00',
      total: '290.00',
      status: 'delivered',
      channel: 'online',
      payment_method: 'paypal',
      shipping_address: JSON.stringify({
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
      }),
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      delivered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: userId,
      customer_id: 'cust-003',
      customer_name: 'Mike Wilson',
      subtotal: '320.00',
      tax: '32.00',
      shipping: '20.00',
      total: '372.00',
      status: 'in_transit',
      channel: 'in_store',
      payment_method: 'credit_card',
      shipping_address: JSON.stringify({
        street: '789 Pine Rd',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
      }),
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: userId,
      customer_id: 'cust-004',
      customer_name: 'Emily Brown',
      subtotal: '180.00',
      tax: '18.00',
      shipping: '12.00',
      total: '210.00',
      status: 'pending',
      channel: 'online',
      payment_method: 'debit_card',
      shipping_address: JSON.stringify({
        street: '321 Elm St',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
      }),
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  const { error } = await supabase.from('orders').insert(orders);
  if (error) console.error('Seed orders error:', error);
  return !error;
}

async function seedSupportTickets() {
  const tickets = [
    {
      user_id: userId,
      customer_name: 'John Smith',
      customer_email: 'john@example.com',
      customer_phone: '555-0001',
      subject: 'Unable to reset password',
      description: 'I tried to reset my password but received no email',
      category: 'technical',
      priority: 'high',
      status: 'resolved',
      first_response_time: 1800,
      resolution_time: 7200,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      resolved_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: userId,
      customer_name: 'Sarah Johnson',
      customer_email: 'sarah@example.com',
      customer_phone: '555-0002',
      subject: 'Invoice not received',
      description: 'I completed a purchase but did not receive an invoice',
      category: 'billing',
      priority: 'medium',
      status: 'resolved',
      first_response_time: 900,
      resolution_time: 3600,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      resolved_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: userId,
      customer_name: 'Mike Wilson',
      customer_email: 'mike@example.com',
      customer_phone: '555-0003',
      subject: 'Feature request: Dark mode',
      description: 'Would love to see a dark mode option in the application',
      category: 'feature_request',
      priority: 'low',
      status: 'open',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: userId,
      customer_name: 'Emily Brown',
      customer_email: 'emily@example.com',
      customer_phone: '555-0004',
      subject: 'Shipping delay on order #12345',
      description: 'My order shows processing for 5 days now. When will it ship?',
      category: 'general',
      priority: 'urgent',
      status: 'in_progress',
      first_response_time: 600,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  ];

  const { error } = await supabase.from('support_tickets').insert(tickets);
  if (error) console.error('Seed support tickets error:', error);
  return !error;
}

async function seedSupportAgents() {
  const agents = [
    {
      user_id: userId,
      agent_name: 'Alice Garcia',
      agent_email: 'alice@support.com',
      department: 'Technical Support',
      skills: ['technical', 'troubleshooting', 'billing'],
      status: 'available',
      current_chats: 2,
      max_concurrent_chats: 5,
      total_tickets_resolved: 234,
      average_resolution_time: 5400,
      average_rating: 4.8,
      response_time_average: 720,
      created_at: new Date('2024-01-15'),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      agent_name: 'Bob Martinez',
      agent_email: 'bob@support.com',
      department: 'Billing Support',
      skills: ['billing', 'invoicing', 'refunds'],
      status: 'busy',
      current_chats: 5,
      max_concurrent_chats: 5,
      total_tickets_resolved: 189,
      average_resolution_time: 4800,
      average_rating: 4.6,
      response_time_average: 600,
      created_at: new Date('2024-02-01'),
      updated_at: new Date(),
    },
    {
      user_id: userId,
      agent_name: 'Carol Davis',
      agent_email: 'carol@support.com',
      department: 'General Support',
      skills: ['general', 'accounts', 'features'],
      status: 'available',
      current_chats: 1,
      max_concurrent_chats: 8,
      total_tickets_resolved: 312,
      average_resolution_time: 6000,
      average_rating: 4.9,
      response_time_average: 840,
      created_at: new Date('2024-01-20'),
      updated_at: new Date(),
    },
  ];

  const { error } = await supabase.from('support_agents').insert(agents);
  if (error) console.error('Seed support agents error:', error);
  return !error;
}

async function seedLiveChatSessions() {
  const sessions = [
    {
      user_id: userId,
      visitor_id: 'visitor-001',
      visitor_name: 'Anonymous User 1',
      status: 'closed',
      session_start_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      session_end_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
      message_count: 8,
      total_messages: 8,
      duration: 900,
      rating: 5,
      feedback: 'Very helpful support!',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: userId,
      visitor_id: 'visitor-002',
      visitor_name: 'Anonymous User 2',
      status: 'closed',
      session_start_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      session_end_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
      message_count: 5,
      total_messages: 5,
      duration: 600,
      rating: 4,
      feedback: 'Good response time',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: userId,
      visitor_id: 'visitor-003',
      visitor_name: 'Anonymous User 3',
      status: 'closed',
      session_start_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      session_end_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
      message_count: 12,
      total_messages: 12,
      duration: 1200,
      rating: 5,
      feedback: 'Resolved my issue quickly',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  const { error } = await supabase.from('live_chat_sessions').insert(sessions);
  if (error) console.error('Seed chat sessions error:', error);
  return !error;
}

async function seedLoyaltyProgram() {
  const programs = [
    {
      user_id: userId,
      program_name: 'Gold Rewards',
      description: 'Earn points on every purchase',
      program_type: 'points_based',
      status: 'active',
      points_per_dollar: 1,
      created_at: new Date('2024-01-01'),
      updated_at: new Date(),
    },
  ];

  const { data: programResult } = await supabase
    .from('loyalty_programs')
    .insert(programs)
    .select();

  if (!programResult?.[0]) return false;

  const programId = programResult[0].id;

  const members = [
    {
      program_id: programId,
      user_id: userId,
      customer_id: 'cust-001',
      customer_name: 'John Smith',
      customer_email: 'john@example.com',
      status: 'active',
      current_tier: 'gold',
      total_points: 5200,
      redeemed_points: 800,
      outstanding_points: 4400,
      lifetime_spending: 5200.00,
      enrollment_date: new Date('2023-06-15'),
      last_activity_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      created_at: new Date('2023-06-15'),
      updated_at: new Date(),
    },
    {
      program_id: programId,
      user_id: userId,
      customer_id: 'cust-002',
      customer_name: 'Sarah Johnson',
      customer_email: 'sarah@example.com',
      status: 'active',
      current_tier: 'silver',
      total_points: 2100,
      redeemed_points: 300,
      outstanding_points: 1800,
      lifetime_spending: 2100.00,
      enrollment_date: new Date('2024-01-20'),
      last_activity_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      created_at: new Date('2024-01-20'),
      updated_at: new Date(),
    },
    {
      program_id: programId,
      user_id: userId,
      customer_id: 'cust-003',
      customer_name: 'Mike Wilson',
      customer_email: 'mike@example.com',
      status: 'active',
      current_tier: 'bronze',
      total_points: 850,
      redeemed_points: 150,
      outstanding_points: 700,
      lifetime_spending: 850.00,
      enrollment_date: new Date('2024-03-01'),
      last_activity_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      created_at: new Date('2024-03-01'),
      updated_at: new Date(),
    },
  ];

  const { error } = await supabase.from('loyalty_members').insert(members);
  if (error) console.error('Seed loyalty members error:', error);
  return !error;
}

async function seedEmailCampaigns() {
  const campaigns = [
    {
      user_id: userId,
      campaign_name: 'Spring Sale 2024',
      description: 'Exclusive discounts on selected items',
      status: 'completed',
      template_id: 'tpl-001',
      scheduled_send_time: new Date('2024-03-15'),
      sent_at: new Date('2024-03-15'),
      created_at: new Date('2024-03-10'),
      updated_at: new Date('2024-03-15'),
    },
    {
      user_id: userId,
      campaign_name: 'Weekly Newsletter',
      description: 'Your weekly update',
      status: 'active',
      template_id: 'tpl-002',
      created_at: new Date('2024-04-01'),
      updated_at: new Date(),
    },
  ];

  const { error } = await supabase.from('email_campaigns').insert(campaigns);
  if (error) console.error('Seed email campaigns error:', error);
  return !error;
}

async function seedSMSCampaigns() {
  const campaigns = [
    {
      user_id: userId,
      campaign_name: 'Flash Sale Alert',
      description: 'Alert customers about flash sale',
      status: 'completed',
      provider_type: 'twilio',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ];

  const { error } = await supabase.from('sms_campaigns').insert(campaigns);
  if (error) console.error('Seed SMS campaigns error:', error);
  return !error;
}

export async function POST(req: NextRequest) {
  try {
    const results = await Promise.all([
      seedOrders(),
      seedSupportTickets(),
      seedSupportAgents(),
      seedLiveChatSessions(),
      seedLoyaltyProgram(),
      seedEmailCampaigns(),
      seedSMSCampaigns(),
    ]);

    const allSuccess = results.every((r) => r);

    return NextResponse.json({
      success: allSuccess,
      message: allSuccess
        ? 'All seed data created successfully'
        : 'Some seed data creation failed',
      results: {
        orders: results[0],
        supportTickets: results[1],
        supportAgents: results[2],
        liveChatSessions: results[3],
        loyaltyProgram: results[4],
        emailCampaigns: results[5],
        smsCampaigns: results[6],
      },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Seed failed', details: String(error) },
      { status: 500 }
    );
  }
}
