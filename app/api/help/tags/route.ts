import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { CreateHelpTagDTO } from '@/types/help';

// GET /api/help/tags - List all tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeArticleCount = searchParams.get('include_count') === 'true';

    const { data: tags, error } = await supabase
      .from('help_tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching help tags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch help tags', details: error.message },
        { status: 500 }
      );
    }

    // Get article counts if requested
    let tagsWithCounts = tags;
    if (includeArticleCount) {
      const counts = await Promise.all(
        tags.map(async (tag) => {
          const { count } = await supabase
            .from('help_article_tags')
            .select('article_id', { count: 'exact', head: true })
            .eq('tag_id', tag.id);

          return { id: tag.id, article_count: count || 0 };
        })
      );

      tagsWithCounts = tags.map(tag => ({
        ...tag,
        created_at: new Date(tag.created_at),
        article_count: counts.find(c => c.id === tag.id)?.article_count || 0
      }));
    } else {
      tagsWithCounts = tags.map(tag => ({
        ...tag,
        created_at: new Date(tag.created_at),
      }));
    }

    return NextResponse.json(tagsWithCounts);
  } catch (error) {
    console.error('Unexpected error in GET /api/help/tags:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/help/tags - Create new tag
export async function POST(request: NextRequest) {
  try {
    const body: CreateHelpTagDTO = await request.json();

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name and slug are required' },
        { status: 400 }
      );
    }

    // Prepare tag data
    const tagData = {
      name: body.name,
      slug: body.slug,
      created_at: new Date().toISOString(),
    };

    // Insert tag
    const { data: tag, error: tagError } = await supabase
      .from('help_tags')
      .insert([tagData])
      .select()
      .single();

    if (tagError) {
      console.error('Error creating help tag:', tagError);

      if (tagError.code === '23505') {
        return NextResponse.json(
          { error: 'A tag with this slug already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create help tag', details: tagError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/help/tags:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
