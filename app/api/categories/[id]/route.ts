import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/categories/[id] - Get a single category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: category, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get product count for this category
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category', category.name);

    return NextResponse.json({
      ...category,
      productCount: count || 0,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category with same name already exists (excluding current)
    const { data: existing } = await supabase
      .from('product_categories')
      .select('id')
      .eq('name', name)
      .neq('id', params.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from('product_categories')
      .update({
        name,
        description,
        parent_id: parentId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get category to check if it has products
    const { data: category } = await supabase
      .from('product_categories')
      .select('name')
      .eq('id', params.id)
      .single();

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has products
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category', category.name);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${count} products. Please reassign or delete products first.` },
        { status: 400 }
      );
    }

    // Check if category has subcategories
    const { count: subCount } = await supabase
      .from('product_categories')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', params.id);

    if (subCount && subCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${subCount} subcategories. Please delete subcategories first.` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
