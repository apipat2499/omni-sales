import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Mock update - can be replaced with database update later
    const updatedStore = {
      name: body.name.trim(),
      description: body.description.trim(),
      logo: body.logo || null,
    };

    return NextResponse.json(
      { success: true, store: updatedStore },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating store settings:', error);
    return NextResponse.json(
      { error: 'Failed to update store settings' },
      { status: 500 }
    );
  }
}
