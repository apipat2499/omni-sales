import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { PurchaseOrder } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('purchase_orders')
      .select('*, suppliers(name)', { count: 'exact' });

    // Apply filters
    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching purchase orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch purchase orders', details: error.message },
        { status: 500 }
      );
    }

    const purchaseOrders: PurchaseOrder[] = (data || []).map((po: any) => ({
      ...po,
      supplierName: po.suppliers?.name,
      expectedDate: po.expected_date ? new Date(po.expected_date) : undefined,
      receivedDate: po.received_date ? new Date(po.received_date) : undefined,
      createdAt: new Date(po.created_at),
      updatedAt: new Date(po.updated_at),
    }));

    return NextResponse.json({
      data: purchaseOrders,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/purchase-orders:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['supplierId', 'items'];
    const missingFields = requiredFields.filter((field) => !(field in body));

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Items array is required and cannot be empty' }, { status: 400 });
    }

    // Generate PO number
    const poNumber = `PO-${Date.now()}`;

    // Calculate totals
    const subtotal = body.items.reduce((sum: number, item: any) => sum + (item.quantity * item.cost), 0);
    const tax = body.tax || 0;
    const shipping = body.shipping || 0;
    const total = subtotal + tax + shipping;

    const now = new Date().toISOString();
    const poData = {
      po_number: poNumber,
      supplier_id: body.supplierId,
      status: body.status || 'draft',
      subtotal,
      tax,
      shipping,
      total,
      expected_date: body.expectedDate || null,
      notes: body.notes || null,
      created_at: now,
      updated_at: now,
    };

    // Insert PO
    const { data: poResult, error: poError } = await supabase
      .from('purchase_orders')
      .insert([poData])
      .select()
      .single();

    if (poError) {
      console.error('Error creating purchase order:', poError);
      return NextResponse.json(
        { error: 'Failed to create purchase order', details: poError.message },
        { status: 500 }
      );
    }

    // Insert PO items
    const poItems = body.items.map((item: any) => ({
      po_id: poResult.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      cost: item.cost,
      total: item.quantity * item.cost,
      received_quantity: 0,
      created_at: now,
    }));

    const { error: itemsError } = await supabase.from('po_items').insert(poItems);

    if (itemsError) {
      console.error('Error creating PO items:', itemsError);
      // Rollback: delete the PO
      await supabase.from('purchase_orders').delete().eq('id', poResult.id);
      return NextResponse.json(
        { error: 'Failed to create PO items', details: itemsError.message },
        { status: 500 }
      );
    }

    const purchaseOrder: PurchaseOrder = {
      ...poResult,
      expectedDate: poResult.expected_date ? new Date(poResult.expected_date) : undefined,
      receivedDate: poResult.received_date ? new Date(poResult.received_date) : undefined,
      createdAt: new Date(poResult.created_at),
      updatedAt: new Date(poResult.updated_at),
    };

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/purchase-orders:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
