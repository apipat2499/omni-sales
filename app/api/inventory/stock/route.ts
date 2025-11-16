import { NextRequest, NextResponse } from 'next/server';
import { getStockLevel, getProductStock, updateStockLevel } from '@/lib/inventory/service';

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get('productId');
    const warehouseId = req.nextUrl.searchParams.get('warehouseId');

    if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

    if (warehouseId) {
      const stock = await getStockLevel(productId, warehouseId);
      return NextResponse.json({ data: stock });
    } else {
      const stocks = await getProductStock(productId);
      return NextResponse.json({ data: stocks, total: stocks.length });
    }
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json({ error: 'Failed to fetch stock' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, productId, warehouseId, quantityChange, reason } = await req.json();
    if (!userId || !productId || !warehouseId || quantityChange === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const success = await updateStockLevel(userId, productId, warehouseId, quantityChange, reason);
    if (!success) return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });

    return NextResponse.json({ success: true, message: 'Stock updated' }, { status: 201 });
  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
  }
}
