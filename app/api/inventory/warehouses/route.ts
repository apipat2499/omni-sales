import { NextRequest, NextResponse } from 'next/server';
import { createWarehouse, getWarehouses } from '@/lib/inventory/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const warehouses = await getWarehouses(userId);
    return NextResponse.json({ data: warehouses, total: warehouses.length });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, warehouseName, warehouseCode, location, city, country } = await req.json();
    if (!userId || !warehouseName) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const warehouse = await createWarehouse(userId, { warehouseName, warehouseCode, location, city, country });
    if (!warehouse) return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 });

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 });
  }
}
