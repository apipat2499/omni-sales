import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock data - can be replaced with database queries later
    const settings = {
      store: {
        name: 'My Store',
        description: 'Quality clothing and accessories',
        logo: null,
      },
      bankAccount: {
        bankName: 'Bangkok Bank',
        accountNumber: '1234567890',
        accountHolder: 'Your Name Here',
        showInCheckout: true,
      },
      categories: [
        { id: '1', name: 'shirts' },
        { id: '2', name: 'pants' },
        { id: '3', name: 'shoes' },
        { id: '4', name: 'accessories' },
      ],
      shipping: {
        methods: [
          { id: '1', method: 'Standard', cost: 50, days: '2-3' },
          { id: '2', method: 'Express', cost: 100, days: '1-2' },
        ],
        freeShippingThreshold: 1000,
      },
    };

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
