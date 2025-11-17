import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

interface ValidatePromotionRequest {
  code?: string;
  promotionId?: string;
  customerId?: string;
  subtotal: number;
  items?: Array<{ productId: string; category: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidatePromotionRequest = await request.json();

    if (!body.subtotal || body.subtotal < 0) {
      return NextResponse.json(
        { error: 'Invalid subtotal' },
        { status: 400 }
      );
    }

    let promotion: any;

    // Find promotion by code or promotionId
    if (body.code) {
      // Find by coupon code
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*, promotions(*)')
        .eq('code', body.code)
        .eq('is_active', true)
        .single();

      if (couponError || !coupon) {
        return NextResponse.json(
          { error: 'รหัสคูปองไม่ถูกต้องหรือหมดอายุ', valid: false },
          { status: 404 }
        );
      }

      // Check coupon usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return NextResponse.json(
          { error: 'คูปองนี้ถูกใช้งานหมดแล้ว', valid: false },
          { status: 400 }
        );
      }

      promotion = coupon.promotions;
    } else if (body.promotionId) {
      // Find by promotion ID
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('id', body.promotionId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'ไม่พบโปรโมชั่น', valid: false },
          { status: 404 }
        );
      }

      promotion = data;
    } else {
      return NextResponse.json(
        { error: 'กรุณาระบุรหัสคูปองหรือ promotionId', valid: false },
        { status: 400 }
      );
    }

    // Check if promotion is active
    if (!promotion.is_active) {
      return NextResponse.json(
        { error: 'โปรโมชั่นนี้ไม่เปิดใช้งาน', valid: false },
        { status: 400 }
      );
    }

    // Check promotion dates
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    if (now < startDate) {
      return NextResponse.json(
        { error: 'โปรโมชั่นนี้ยังไม่เริ่ม', valid: false },
        { status: 400 }
      );
    }

    if (now > endDate) {
      return NextResponse.json(
        { error: 'โปรโมชั่นนี้หมดอายุแล้ว', valid: false },
        { status: 400 }
      );
    }

    // Check usage limit
    if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
      return NextResponse.json(
        { error: 'โปรโมชั่นนี้ถูกใช้งานครบจำนวนแล้ว', valid: false },
        { status: 400 }
      );
    }

    // Check minimum purchase
    if (promotion.min_purchase && body.subtotal < promotion.min_purchase) {
      return NextResponse.json(
        {
          error: `ยอดซื้อขั้นต่ำ ${promotion.min_purchase} บาท`,
          valid: false,
          minPurchase: promotion.min_purchase,
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount = 0;

    if (promotion.type === 'percentage') {
      discountAmount = (body.subtotal * promotion.value) / 100;
    } else if (promotion.type === 'fixed_amount') {
      discountAmount = promotion.value;
    } else if (promotion.type === 'free_shipping') {
      // Free shipping - discount amount will be calculated based on shipping cost
      discountAmount = 0; // Will be applied separately
    }

    // Apply max discount limit
    if (promotion.max_discount && discountAmount > promotion.max_discount) {
      discountAmount = promotion.max_discount;
    }

    // Ensure discount doesn't exceed subtotal
    if (discountAmount > body.subtotal) {
      discountAmount = body.subtotal;
    }

    return NextResponse.json({
      valid: true,
      promotionId: promotion.id,
      promotionName: promotion.name,
      promotionType: promotion.type,
      discountAmount: Math.round(discountAmount * 100) / 100,
      finalTotal: Math.round((body.subtotal - discountAmount) * 100) / 100,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/promotions/validate:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการตรวจสอบโปรโมชั่น', valid: false },
      { status: 500 }
    );
  }
}
