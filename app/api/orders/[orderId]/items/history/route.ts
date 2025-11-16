import { NextRequest, NextResponse } from 'next/server';
import { getItemHistory } from '@/lib/order/item-history';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing orderId' },
        { status: 400 }
      );
    }

    const history = await getItemHistory(orderId);

    const transformedHistory = history.map((item: any) => ({
      id: item.id,
      orderId: item.orderId,
      itemId: item.itemId,
      action: item.action,
      productId: item.productId,
      productName: item.productName,
      oldQuantity: item.oldQuantity,
      newQuantity: item.newQuantity,
      oldPrice: item.oldPrice,
      newPrice: item.newPrice,
      changedAt: item.changedAt,
      changedBy: item.changedBy,
      notes: item.notes,
    }));

    return NextResponse.json(transformedHistory);
  } catch (error) {
    console.error('Error fetching item history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item history' },
      { status: 500 }
    );
  }
}
