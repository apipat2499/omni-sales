import { NextRequest, NextResponse } from 'next/server';
import { getReturnItems, addReturnItem, createReturnInspection, getReturnInspections } from '@/lib/returns/service';

export async function GET(req: NextRequest) {
  try {
    const returnId = req.nextUrl.searchParams.get('returnId');
    const itemId = req.nextUrl.searchParams.get('itemId');

    if (!returnId && !itemId) {
      return NextResponse.json({ error: 'Missing returnId or itemId' }, { status: 400 });
    }

    if (returnId) {
      const items = await getReturnItems(returnId);
      return NextResponse.json({
        data: items,
        total: items.length,
      });
    }

    if (itemId) {
      const inspections = await getReturnInspections(itemId);
      return NextResponse.json({
        data: inspections,
        total: inspections.length,
      });
    }
  } catch (error) {
    console.error('Error fetching return items:', error);
    return NextResponse.json({ error: 'Failed to fetch return items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { returnId, orderItemId, productId, productName, quantityReturned, inspectionData } = body;

    if (!returnId || !orderItemId || !productId || !productName || !quantityReturned) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add return item
    const returnItem = await addReturnItem(returnId, {
      orderItemId,
      productId,
      productName,
      quantityReturned,
    });

    if (!returnItem) {
      return NextResponse.json({ error: 'Failed to add return item' }, { status: 500 });
    }

    // Optionally create inspection
    if (inspectionData) {
      const inspection = await createReturnInspection(returnItem.id, inspectionData);
      if (!inspection) {
        console.error('Warning: Failed to create inspection for item');
      }
    }

    return NextResponse.json(returnItem, { status: 201 });
  } catch (error) {
    console.error('Error adding return item:', error);
    return NextResponse.json({ error: 'Failed to add return item' }, { status: 500 });
  }
}
