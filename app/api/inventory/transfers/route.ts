import { NextRequest, NextResponse } from 'next/server';
import { createStockTransfer, getStockTransfers, completeStockTransfer } from '@/lib/inventory/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const transfers = await getStockTransfers(userId);
    return NextResponse.json({ data: transfers, total: transfers.length });
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, productId, fromWarehouseId, toWarehouseId, quantity, notes } = await req.json();
    if (!userId || !productId || !fromWarehouseId || !toWarehouseId || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const transfer = await createStockTransfer(userId, { productId, fromWarehouseId, toWarehouseId, quantity, notes });
    if (!transfer) return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
  }
}
