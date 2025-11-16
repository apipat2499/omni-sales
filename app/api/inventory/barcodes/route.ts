import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { createBarcode, getProductByBarcode } from '@/lib/inventory/service';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    const barcode = req.nextUrl.searchParams.get('barcode');
    const productId = req.nextUrl.searchParams.get('productId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // If barcode is provided, lookup product
    if (barcode) {
      const result = await getProductByBarcode(userId, barcode);
      if (!result) {
        return NextResponse.json(
          { error: 'Barcode not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(result);
    }

    // Otherwise fetch all barcodes for user, optionally filtered by product
    let query = supabase
      .from('barcodes')
      .select(
        `
        *,
        products (
          id,
          name,
          sku,
          category
        )
      `
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: barcodes, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch barcodes' },
        { status: 500 }
      );
    }

    return NextResponse.json(barcodes || []);
  } catch (error) {
    console.error('Error fetching barcodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch barcodes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, productId, barcode, barcodeType } = await req.json();

    if (!userId || !productId || !barcode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if barcode already exists
    const { data: existing } = await supabase
      .from('barcodes')
      .select('id')
      .eq('user_id', userId)
      .eq('barcode', barcode)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Barcode already exists' },
        { status: 409 }
      );
    }

    const success = await createBarcode(
      userId,
      barcode,
      productId,
      barcodeType || 'ean13'
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to create barcode' },
        { status: 500 }
      );
    }

    const { data: newBarcode } = await supabase
      .from('barcodes')
      .select(
        `
        *,
        products (
          id,
          name,
          sku
        )
      `
      )
      .eq('barcode', barcode)
      .eq('user_id', userId)
      .single();

    return NextResponse.json(newBarcode, { status: 201 });
  } catch (error) {
    console.error('Error creating barcode:', error);
    return NextResponse.json(
      { error: 'Failed to create barcode' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const barcodeId = req.nextUrl.searchParams.get('barcodeId');
    const userId = req.nextUrl.searchParams.get('userId');

    if (!barcodeId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Soft delete by marking inactive
    const { data, error } = await supabase
      .from('barcodes')
      .update({ is_active: false })
      .eq('id', barcodeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete barcode' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting barcode:', error);
    return NextResponse.json(
      { error: 'Failed to delete barcode' },
      { status: 500 }
    );
  }
}
