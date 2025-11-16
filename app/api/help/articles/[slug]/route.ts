import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { UpdateHelpArticleDTO } from '@/types/help';

// GET /api/help/articles/:slug - Get article by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    const { data: article, error } = await supabase
      .from('help_articles')
      .select(`
        *,
        category:help_categories(id, name, slug, icon),
        tags:help_article_tags(tag:help_tags(id, name, slug)),
        related_articles:help_article_related(
          related_article:help_articles(id, title, slug, description, view_count)
        )
      `)
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        );
      }

      console.error('Error fetching help article:', error);
      return NextResponse.json(
        { error: 'Failed to fetch help article', details: error.message },
        { status: 500 }
      );
    }

    // Transform data
    const transformedArticle = {
      ...article,
      created_at: new Date(article.created_at),
      updated_at: new Date(article.updated_at),
      published_at: article.published_at ? new Date(article.published_at) : null,
      tags: article.tags?.map((t: any) => t.tag).filter(Boolean) || [],
      related_articles: article.related_articles?.map((r: any) => r.related_article).filter(Boolean) || []
    };

    // Increment view count asynchronously (don't wait for it)
    supabase.rpc('increment_article_view', { article_uuid: article.id }).then();

    // Track view
    const userAgent = request.headers.get('user-agent');
    const referrer = request.headers.get('referer');
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');

    supabase.from('help_article_views').insert([{
      article_id: article.id,
      ip_address: ipAddress,
      user_agent: userAgent,
      referrer: referrer,
    }]).then();

    return NextResponse.json(transformedArticle);
  } catch (error) {
    console.error('Unexpected error in GET /api/help/articles/:slug:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PUT /api/help/articles/:slug - Update article
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const body: UpdateHelpArticleDTO = await request.json();

    // Get existing article
    const { data: existingArticle, error: fetchError } = await supabase
      .from('help_articles')
      .select('id')
      .eq('slug', slug)
      .single();

    if (fetchError || !existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.content_type !== undefined) updateData.content_type = body.content_type;
    if (body.category_id !== undefined) updateData.category_id = body.category_id;
    if (body.author_id !== undefined) updateData.author_id = body.author_id;
    if (body.author_name !== undefined) updateData.author_name = body.author_name;
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'published' && !existingArticle.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;
    if (body.meta_title !== undefined) updateData.meta_title = body.meta_title;
    if (body.meta_description !== undefined) updateData.meta_description = body.meta_description;
    if (body.meta_keywords !== undefined) updateData.meta_keywords = body.meta_keywords;

    // Update article
    const { data: article, error: updateError } = await supabase
      .from('help_articles')
      .update(updateData)
      .eq('id', existingArticle.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating help article:', updateError);

      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'An article with this slug already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update help article', details: updateError.message },
        { status: 500 }
      );
    }

    // Update tags if provided
    if (body.tag_ids !== undefined) {
      // Delete existing tags
      await supabase
        .from('help_article_tags')
        .delete()
        .eq('article_id', existingArticle.id);

      // Insert new tags
      if (body.tag_ids.length > 0) {
        const tagData = body.tag_ids.map(tag_id => ({
          article_id: existingArticle.id,
          tag_id
        }));
        await supabase.from('help_article_tags').insert(tagData);
      }
    }

    // Update related articles if provided
    if (body.related_article_ids !== undefined) {
      // Delete existing relations
      await supabase
        .from('help_article_related')
        .delete()
        .eq('article_id', existingArticle.id);

      // Insert new relations
      if (body.related_article_ids.length > 0) {
        const relatedData = body.related_article_ids.map((related_id, index) => ({
          article_id: existingArticle.id,
          related_article_id: related_id,
          display_order: index
        }));
        await supabase.from('help_article_related').insert(relatedData);
      }
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Unexpected error in PUT /api/help/articles/:slug:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/help/articles/:slug - Delete article
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    const { error } = await supabase
      .from('help_articles')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.error('Error deleting help article:', error);
      return NextResponse.json(
        { error: 'Failed to delete help article', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/help/articles/:slug:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
