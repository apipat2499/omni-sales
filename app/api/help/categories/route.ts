import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { CreateHelpCategoryDTO, UpdateHelpCategoryDTO } from '@/types/help';

// GET /api/help/categories - List all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeArticleCount = searchParams.get('include_count') === 'true';
    const parentId = searchParams.get('parent_id');
    const isActive = searchParams.get('is_active');

    let query = supabase
      .from('help_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error('Error fetching help categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch help categories', details: error.message },
        { status: 500 }
      );
    }

    // Get article counts if requested
    let categoriesWithCounts = categories;
    if (includeArticleCount) {
      const counts = await Promise.all(
        categories.map(async (category) => {
          const { count } = await supabase
            .from('help_articles')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'published');

          return { id: category.id, article_count: count || 0 };
        })
      );

      categoriesWithCounts = categories.map(category => ({
        ...category,
        created_at: new Date(category.created_at),
        updated_at: new Date(category.updated_at),
        article_count: counts.find(c => c.id === category.id)?.article_count || 0
      }));
    } else {
      categoriesWithCounts = categories.map(category => ({
        ...category,
        created_at: new Date(category.created_at),
        updated_at: new Date(category.updated_at),
      }));
    }

    return NextResponse.json(categoriesWithCounts);
  } catch (error) {
    console.error('Unexpected error in GET /api/help/categories:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/help/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body: CreateHelpCategoryDTO = await request.json();

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name and slug are required' },
        { status: 400 }
      );
    }

    // Prepare category data
    const categoryData = {
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      icon: body.icon || null,
      display_order: body.display_order || 0,
      parent_id: body.parent_id || null,
      is_active: body.is_active !== undefined ? body.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert category
    const { data: category, error: categoryError } = await supabase
      .from('help_categories')
      .insert([categoryData])
      .select()
      .single();

    if (categoryError) {
      console.error('Error creating help category:', categoryError);

      if (categoryError.code === '23505') {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create help category', details: categoryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/help/categories:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
