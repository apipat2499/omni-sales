import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET /api/help/search - Full-text search articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Track search query
    const userAgent = request.headers.get('user-agent');
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

    // Use PostgreSQL full-text search
    const { data, error, count } = await supabase
      .from('help_articles')
      .select(`
        *,
        category:help_categories(id, name, slug, icon),
        tags:help_article_tags(tag:help_tags(id, name, slug))
      `, { count: 'exact' })
      .eq('status', 'published')
      .textSearch('fts', query, {
        type: 'websearch',
        config: 'english'
      })
      .order('view_count', { ascending: false })
      .range(offset, offset + limit - 1);

    // If full-text search doesn't work, fall back to ILIKE
    let articles = data;
    let total = count || 0;

    if (error || !data) {
      const { data: fallbackData, error: fallbackError, count: fallbackCount } = await supabase
        .from('help_articles')
        .select(`
          *,
          category:help_categories(id, name, slug, icon),
          tags:help_article_tags(tag:help_tags(id, name, slug))
        `, { count: 'exact' })
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
        .order('view_count', { ascending: false })
        .range(offset, offset + limit - 1);

      if (fallbackError) {
        console.error('Error searching help articles:', fallbackError);
        return NextResponse.json(
          { error: 'Failed to search help articles', details: fallbackError.message },
          { status: 500 }
        );
      }

      articles = fallbackData;
      total = fallbackCount || 0;
    }

    // Transform dates and flatten tags
    const transformedArticles = (articles || []).map(article => ({
      ...article,
      created_at: new Date(article.created_at),
      updated_at: new Date(article.updated_at),
      published_at: article.published_at ? new Date(article.published_at) : null,
      tags: article.tags?.map((t: any) => t.tag).filter(Boolean) || []
    }));

    // Log search query asynchronously
    supabase.from('help_search_queries').insert([{
      query,
      results_count: total,
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    }]).then();

    return NextResponse.json({
      articles: transformedArticles,
      total,
      limit,
      offset,
      query
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/help/search:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
