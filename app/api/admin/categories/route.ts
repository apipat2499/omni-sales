import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock data - can be replaced with database query later
    const categories = [
      { id: '1', name: 'shirts' },
      { id: '2', name: 'pants' },
      { id: '3', name: 'shoes' },
      { id: '4', name: 'accessories' },
    ];

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Mock create - can be replaced with database insert later
    const newCategory = {
      id: body.id || Date.now().toString(),
      name: body.name.trim(),
    };

    return NextResponse.json(
      { success: true, category: newCategory },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
