/**
 * Expenses API Route
 * GET /api/financial/expenses - Get expenses with filtering
 * POST /api/financial/expenses - Create new expense
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET - Fetch expenses with filtering and aggregation
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const supabase = await createClient();

    // Get parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const categoryId = searchParams.get('categoryId');
    const vendorId = searchParams.get('vendorId');
    const paymentStatus = searchParams.get('paymentStatus');
    const isRecurring = searchParams.get('isRecurring');
    const tenantId = searchParams.get('tenantId');
    const summary = searchParams.get('summary') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // If summary is requested, use the view
    if (summary) {
      let viewQuery = supabase
        .from('expense_summary_view')
        .select('*');

      if (startDate) {
        viewQuery = viewQuery.gte('period_month', startDate);
      }
      if (endDate) {
        viewQuery = viewQuery.lte('period_month', endDate);
      }

      const { data, error } = await viewQuery;

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        data,
        metadata: {
          type: 'summary',
          generatedAt: new Date().toISOString(),
        },
      });
    }

    // Build query for detailed expenses
    let query = supabase
      .from('expenses')
      .select(`
        *,
        expense_categories (
          id,
          name,
          category_type
        ),
        vendors (
          id,
          name,
          email
        )
      `)
      .order('expense_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (startDate) {
      query = query.gte('expense_date', startDate);
    }
    if (endDate) {
      query = query.lte('expense_date', endDate);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }
    if (isRecurring !== null) {
      query = query.eq('is_recurring', isRecurring === 'true');
    }
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Calculate totals
    const totals = {
      count: data?.length || 0,
      totalAmount: data?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0,
      paidAmount: data?.filter(e => e.payment_status === 'paid')
        .reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0,
      pendingAmount: data?.filter(e => e.payment_status === 'pending')
        .reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0,
    };

    return NextResponse.json({
      success: true,
      data,
      totals,
      pagination: {
        limit,
        offset,
        total: count,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch expenses',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new expense
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    // Validate required fields
    const {
      expense_date,
      amount,
      category_id,
      description,
      currency = 'USD',
      vendor_id,
      reference_number,
      payment_method,
      payment_status = 'pending',
      paid_date,
      is_recurring = false,
      recurring_frequency,
      next_occurrence_date,
      is_tax_deductible = true,
      tax_category,
      attachments,
      notes,
      tenant_id,
    } = body;

    // Validate required fields
    if (!expense_date || !amount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: expense_date, amount, description' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Insert expense
    const { data: expense, error: insertError } = await supabase
      .from('expenses')
      .insert({
        expense_date,
        amount,
        currency,
        category_id,
        vendor_id,
        description,
        reference_number,
        payment_method,
        payment_status,
        paid_date,
        is_recurring,
        recurring_frequency,
        next_occurrence_date,
        is_tax_deductible,
        tax_category,
        attachments,
        notes,
        created_by: user.id,
        tenant_id,
      })
      .select(`
        *,
        expense_categories (
          id,
          name,
          category_type
        ),
        vendors (
          id,
          name
        )
      `)
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({
      success: true,
      data: expense,
      message: 'Expense created successfully',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create expense',
        message: error.message
      },
      { status: 500 }
    );
  }
}
