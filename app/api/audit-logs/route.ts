import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getPaginationParams, createPaginatedResponse, getOffsetLimit } from '@/lib/utils/pagination';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, sortBy, sortOrder } = getPaginationParams(searchParams);

    // Filters
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    // Build count query
    let countQuery = supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    if (action) countQuery = countQuery.eq('action', action);
    if (entityType) countQuery = countQuery.eq('entity_type', entityType);
    if (entityId) countQuery = countQuery.eq('entity_id', entityId);

    const { count } = await countQuery;
    const total = count || 0;

    // Build data query
    let query = supabase.from('audit_logs').select('*');

    if (action) query = query.eq('action', action);
    if (entityType) query = query.eq('entity_type', entityType);
    if (entityId) query = query.eq('entity_id', entityId);

    // Sorting
    const orderColumn = sortBy || 'created_at';
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // Pagination
    const { from, to } = getOffsetLimit(page, limit);
    query = query.range(from, to);

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs', details: error.message },
        { status: 500 }
      );
    }

    const response = createPaginatedResponse(logs || [], total, page, limit);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in audit logs API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const {
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      metadata,
    } = body;

    if (!action || !entity_type) {
      return NextResponse.json(
        { error: 'Missing required fields: action, entity_type' },
        { status: 400 }
      );
    }

    // Get IP address from request
    const ip_address = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';

    const user_agent = request.headers.get('user-agent') || 'unknown';

    const { data: log, error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        user_agent,
        metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating audit log:', error);
      return NextResponse.json(
        { error: 'Failed to create audit log', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: log }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in audit logs POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
