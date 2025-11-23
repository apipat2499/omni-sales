import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.bankName || !body.accountNumber || !body.accountHolder) {
      return NextResponse.json(
        { error: 'Bank name, account number, and account holder are required' },
        { status: 400 }
      );
    }

    // Mock update - can be replaced with database update later
    const updatedBankAccount = {
      bankName: body.bankName,
      accountNumber: body.accountNumber.trim(),
      accountHolder: body.accountHolder.trim(),
      showInCheckout: body.showInCheckout ?? true,
    };

    return NextResponse.json(
      { success: true, bankAccount: updatedBankAccount },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to update payment settings' },
      { status: 500 }
    );
  }
}
