import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { HelpArticle, CreateHelpArticleDTO, HelpSearchParams } from '@/types/help';

// GET /api/help/articles - List articles with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('query');
    const category_id = searchParams.get('category_id');
    const tag_id = searchParams.get('tag_id');
    const status = searchParams.get('status') || 'published';
    const is_featured = searchParams.get('is_featured');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const order_by = searchParams.get('order_by') || 'created_at';
    const order_direction = searchParams.get('order_direction') || 'desc';

    let articleQuery = supabase
      .from('help_articles')
      .select(`
        *,
        category:help_categories(id, name, slug, icon),
        tags:help_article_tags(tag:help_tags(id, name, slug))
      `);

    // Apply filters
    if (status) {
      articleQuery = articleQuery.eq('status', status);
    }

    if (category_id) {
      articleQuery = articleQuery.eq('category_id', category_id);
    }

    if (is_featured === 'true') {
      articleQuery = articleQuery.eq('is_featured', true);
    }

    // Text search
    if (query) {
      articleQuery = articleQuery.or(
        `title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`
      );
    }

    // Tag filter (requires join)
    if (tag_id) {
      const { data: articleIds } = await supabase
        .from('help_article_tags')
        .select('article_id')
        .eq('tag_id', tag_id);

      if (articleIds && articleIds.length > 0) {
        const ids = articleIds.map(item => item.article_id);
        articleQuery = articleQuery.in('id', ids);
      } else {
        return NextResponse.json({
          articles: [],
          total: 0,
          limit,
          offset
        });
      }
    }

    // Get total count
    const { count } = await articleQuery;

    // Apply ordering and pagination
    articleQuery = articleQuery
      .order(order_by, { ascending: order_direction === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error } = await articleQuery;

    if (error) {
      console.error('Error fetching help articles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch help articles', details: error.message },
        { status: 500 }
      );
    }

    // Transform dates and flatten tags
    const articles = (data || []).map(article => ({
      ...article,
      created_at: new Date(article.created_at),
      updated_at: new Date(article.updated_at),
      published_at: article.published_at ? new Date(article.published_at) : null,
      tags: article.tags?.map((t: any) => t.tag).filter(Boolean) || []
    }));

    return NextResponse.json({
      articles,
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/help/articles:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/help/articles - Create new article
export async function POST(request: NextRequest) {
  try {
    const body: CreateHelpArticleDTO = await request.json();

    // Validate required fields
    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Prepare article data
    const now = new Date().toISOString();
    const articleData = {
      title: body.title,
      slug: body.slug,
      description: body.description || null,
      content: body.content,
      content_type: body.content_type || 'markdown',
      category_id: body.category_id || null,
      author_id: body.author_id || null,
      author_name: body.author_name || null,
      status: body.status || 'draft',
      is_featured: body.is_featured || false,
      meta_title: body.meta_title || body.title,
      meta_description: body.meta_description || body.description || null,
      meta_keywords: body.meta_keywords || null,
      published_at: body.status === 'published' ? now : null,
      created_at: now,
      updated_at: now,
    };

    // Insert article
    const { data: article, error: articleError } = await supabase
      .from('help_articles')
      .insert([articleData])
      .select()
      .single();

    if (articleError) {
      console.error('Error creating help article:', articleError);

      if (articleError.code === '23505') {
        return NextResponse.json(
          { error: 'An article with this slug already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create help article', details: articleError.message },
        { status: 500 }
      );
    }

    // Add tags if provided
    if (body.tag_ids && body.tag_ids.length > 0) {
      const tagData = body.tag_ids.map(tag_id => ({
        article_id: article.id,
        tag_id
      }));

      await supabase.from('help_article_tags').insert(tagData);
    }

    // Add related articles if provided
    if (body.related_article_ids && body.related_article_ids.length > 0) {
      const relatedData = body.related_article_ids.map((related_id, index) => ({
        article_id: article.id,
        related_article_id: related_id,
        display_order: index
      }));

      await supabase.from('help_article_related').insert(relatedData);
    }

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/help/articles:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
