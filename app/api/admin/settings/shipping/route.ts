import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock data - can be replaced with database query later
    const shippingSettings = {
      methods: [
        { id: '1', method: 'Standard', cost: 50, days: '2-3' },
        { id: '2', method: 'Express', cost: 100, days: '1-2' },
      ],
      freeShippingThreshold: 1000,
    };

    return NextResponse.json(shippingSettings, { status: 200 });
  } catch (error) {
    console.error('Error fetching shipping settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.methods || !Array.isArray(body.methods)) {
      return NextResponse.json(
        { error: 'Shipping methods are required' },
        { status: 400 }
      );
    }

    // Mock update - can be replaced with database update later
    const updatedShipping = {
      methods: body.methods,
      freeShippingThreshold: body.freeShippingThreshold ?? 0,
    };

    return NextResponse.json(
      { success: true, shipping: updatedShipping },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating shipping settings:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping settings' },
      { status: 500 }
    );
  }
}
