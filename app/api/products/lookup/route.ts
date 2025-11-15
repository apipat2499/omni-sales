import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Product } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'กรุณาระบุรหัสสินค้า' },
        { status: 400 }
      );
    }

    // Search by SKU or barcode
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`sku.eq.${code},barcode.eq.${code}`)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'ไม่พบสินค้าจากรหัสนี้' },
        { status: 404 }
      );
    }

    // Transform to Product type
    const product: Product = {
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    // Increment view count (optional - for analytics)
    await supabase
      .from('products')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id);

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/products/lookup:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการค้นหาสินค้า' },
      { status: 500 }
    );
  }
}
