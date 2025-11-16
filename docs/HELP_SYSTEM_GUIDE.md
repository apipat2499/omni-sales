# Knowledge Base and Help System Guide

Complete documentation for the knowledge base and help system implementation.

## Overview

The knowledge base and help system provides a comprehensive solution for creating, managing, and displaying help articles, documentation, and FAQs for your users.

## Features

### Core Features

- ✅ Full-text search with PostgreSQL
- ✅ Category and tag organization
- ✅ Article versioning and history
- ✅ Feedback system (helpful/not helpful)
- ✅ View tracking and analytics
- ✅ Related articles
- ✅ Table of contents for long articles
- ✅ Breadcrumb navigation
- ✅ SEO optimization
- ✅ Markdown and HTML content support
- ✅ Draft/Published/Archived status
- ✅ Featured articles
- ✅ Admin management interface

### Database Schema

The system uses the following tables:

1. **help_categories** - Article categories
2. **help_tags** - Article tags
3. **help_articles** - Main articles table
4. **help_article_tags** - Many-to-many relationship for articles and tags
5. **help_article_feedback** - User feedback on articles
6. **help_article_versions** - Version history
7. **help_article_related** - Related articles
8. **help_article_views** - View tracking for analytics
9. **help_search_queries** - Search query tracking

## Getting Started

### 1. Run Database Migrations

```bash
# The migration file is located at:
# supabase/migrations/20250116000000_create_help_system.sql

# If using Supabase CLI:
supabase db push

# Or apply manually through your database admin tool
```

### 2. Verify Installation

Check that all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'help_%';
```

You should see 9 tables starting with `help_`.

### 3. Access the Help Center

- **Public Help Center:** `/help`
- **Article View:** `/help/articles/{slug}`
- **Category View:** `/help/category/{category-slug}`
- **Search:** `/help/search?q={query}`
- **Admin Panel:** `/admin/help-articles`

## API Reference

### Articles

#### List Articles
```
GET /api/help/articles
```

Query parameters:
- `query` - Search query
- `category_id` - Filter by category
- `tag_id` - Filter by tag
- `status` - Filter by status (draft/published/archived)
- `is_featured` - Filter featured articles (true/false)
- `limit` - Number of results (default: 20)
- `offset` - Pagination offset (default: 0)
- `order_by` - Sort field (created_at/updated_at/view_count/helpful_count/title)
- `order_direction` - Sort direction (asc/desc)

Response:
```json
{
  "articles": [...],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

#### Create Article
```
POST /api/help/articles
```

Request body:
```json
{
  "title": "Article Title",
  "slug": "article-slug",
  "description": "Brief description",
  "content": "Full article content",
  "content_type": "markdown",
  "category_id": "uuid",
  "status": "published",
  "is_featured": false,
  "meta_title": "SEO title",
  "meta_description": "SEO description",
  "tag_ids": ["uuid1", "uuid2"],
  "related_article_ids": ["uuid3", "uuid4"]
}
```

#### Get Article by Slug
```
GET /api/help/articles/{slug}
```

Response includes article with category, tags, and related articles.

#### Update Article
```
PUT /api/help/articles/{slug}
```

Request body: Same as create, all fields optional.

#### Delete Article
```
DELETE /api/help/articles/{slug}
```

#### Submit Feedback
```
POST /api/help/articles/{id}/feedback
```

Request body:
```json
{
  "is_helpful": true,
  "feedback_text": "Optional feedback text",
  "user_id": "optional-user-id",
  "user_email": "optional@email.com"
}
```

### Categories

#### List Categories
```
GET /api/help/categories
```

Query parameters:
- `include_count` - Include article counts (true/false)
- `parent_id` - Filter by parent category
- `is_active` - Filter active categories (true/false)

#### Create Category
```
POST /api/help/categories
```

Request body:
```json
{
  "name": "Category Name",
  "slug": "category-slug",
  "description": "Category description",
  "icon": "IconName",
  "display_order": 0,
  "parent_id": "optional-parent-uuid",
  "is_active": true
}
```

### Tags

#### List Tags
```
GET /api/help/tags
```

Query parameters:
- `include_count` - Include article counts (true/false)

#### Create Tag
```
POST /api/help/tags
```

Request body:
```json
{
  "name": "Tag Name",
  "slug": "tag-slug"
}
```

### Search

#### Full-text Search
```
GET /api/help/search
```

Query parameters:
- `q` or `query` - Search query (required)
- `limit` - Number of results (default: 10)
- `offset` - Pagination offset (default: 0)

## Components

### ArticleCard

Display an article as a card with metadata.

```tsx
import ArticleCard from '@/components/help/ArticleCard';

<ArticleCard
  article={article}
  showCategory={true}
  showTags={true}
  showStats={true}
/>
```

### ArticleSearch

Search input with submit handling.

```tsx
import ArticleSearch from '@/components/help/ArticleSearch';

<ArticleSearch
  onSearch={(query) => handleSearch(query)}
  placeholder="Search articles..."
/>
```

### CategoryBrowser

Display categories in a navigable list.

```tsx
import CategoryBrowser from '@/components/help/CategoryBrowser';

<CategoryBrowser
  selectedCategoryId={categoryId}
  showArticleCount={true}
/>
```

### TableOfContents

Auto-generate TOC from article headings.

```tsx
import TableOfContents from '@/components/help/TableOfContents';

<TableOfContents content={article.content} />
```

### RelatedArticles

Display related articles.

```tsx
import RelatedArticles from '@/components/help/RelatedArticles';

<RelatedArticles
  articles={relatedArticles}
  title="Related Articles"
  maxItems={5}
/>
```

### FeedbackForm

Collect article feedback.

```tsx
import FeedbackForm from '@/components/help/FeedbackForm';

<FeedbackForm
  articleId={article.id}
  onSubmit={(isHelpful, text) => handleFeedback(isHelpful, text)}
/>
```

## Admin Usage

### Creating a New Article

1. Navigate to `/admin/help-articles`
2. Click "New Article"
3. Fill in article details:
   - Title and slug
   - Category and tags
   - Content (markdown or HTML)
   - SEO metadata
   - Status (draft/published)
4. Add related articles if desired
5. Save the article

### Managing Categories

Categories can be created via the API or directly in the database:

```sql
INSERT INTO help_categories (name, slug, description, icon, display_order)
VALUES ('Getting Started', 'getting-started', 'Learn the basics', 'Rocket', 1);
```

### Managing Tags

Tags can be created via the API or directly in the database:

```sql
INSERT INTO help_tags (name, slug)
VALUES ('Quick Start', 'quick-start');
```

## Analytics

### View Tracking

Article views are automatically tracked when users visit an article. The system records:
- Article ID
- User ID (if available)
- IP address
- User agent
- Referrer
- Timestamp

### Search Tracking

Search queries are logged with:
- Query string
- Number of results
- User ID (if available)
- IP address
- Timestamp

### Feedback Analytics

Access feedback data:

```sql
SELECT
  a.title,
  a.helpful_count,
  a.not_helpful_count,
  ROUND(
    (a.helpful_count::float / NULLIF(a.helpful_count + a.not_helpful_count, 0)) * 100,
    2
  ) as helpful_percentage
FROM help_articles a
WHERE a.status = 'published'
ORDER BY helpful_percentage DESC;
```

### Most Viewed Articles

```sql
SELECT
  id,
  title,
  view_count,
  helpful_count
FROM help_articles
WHERE status = 'published'
ORDER BY view_count DESC
LIMIT 10;
```

### Popular Search Queries

```sql
SELECT
  query,
  COUNT(*) as search_count,
  AVG(results_count) as avg_results
FROM help_search_queries
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY query
ORDER BY search_count DESC
LIMIT 20;
```

## SEO Optimization

### Article SEO

Each article supports:
- Custom meta title
- Custom meta description
- Custom meta keywords
- Clean URLs (slug-based)
- Automatic sitemap generation

### Best Practices

1. **Titles:** Keep under 60 characters
2. **Descriptions:** Keep under 160 characters
3. **Keywords:** Use 5-10 relevant keywords
4. **URLs:** Use descriptive, hyphenated slugs
5. **Content:** Use proper heading hierarchy (H1, H2, H3)
6. **Internal Links:** Link to related articles

### Structured Data

Add structured data to article pages:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title",
  "description": "Article description",
  "author": {
    "@type": "Person",
    "name": "Author Name"
  },
  "datePublished": "2025-01-16",
  "dateModified": "2025-01-16"
}
```

## Customization

### Styling

All components use Tailwind CSS classes. Customize by:

1. Modifying component classes directly
2. Extending Tailwind config
3. Adding custom CSS

### Content Types

The system supports:
- **Markdown:** Converts to HTML on render
- **HTML:** Renders directly

Add support for other formats by creating a content processor.

### Custom Categories

Create categories that match your use case:

```sql
INSERT INTO help_categories (name, slug, description, icon, display_order)
VALUES
  ('Videos', 'videos', 'Video tutorials', 'Video', 9),
  ('Downloads', 'downloads', 'Downloadable resources', 'Download', 10);
```

## Troubleshooting

### Articles Not Appearing

1. Check article status is "published"
2. Verify category is active
3. Check database connection

### Search Not Working

1. Verify full-text search index exists
2. Check PostgreSQL version supports text search
3. Try fallback ILIKE search

### Feedback Not Recording

1. Check article ID is correct
2. Verify feedback table exists
3. Check API endpoint is accessible

## Performance Optimization

### Database Indexes

The migration includes indexes for:
- Article slugs
- Category IDs
- Status fields
- View counts
- Search columns

### Caching

Consider caching:
- Category lists
- Popular articles
- Search results
- Article content

Example with Redis:

```typescript
import { redis } from '@/lib/redis';

async function getArticle(slug: string) {
  const cached = await redis.get(`article:${slug}`);
  if (cached) return JSON.parse(cached);

  const article = await fetchFromDatabase(slug);
  await redis.set(`article:${slug}`, JSON.stringify(article), 'EX', 3600);

  return article;
}
```

### Pagination

Always use pagination for article lists:

```typescript
const limit = 20;
const offset = (page - 1) * limit;

const { data } = await supabase
  .from('help_articles')
  .select('*')
  .range(offset, offset + limit - 1);
```

## Security

### Input Validation

Always validate user input:

```typescript
import { z } from 'zod';

const articleSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  content: z.string().min(1),
  status: z.enum(['draft', 'published', 'archived'])
});
```

### XSS Prevention

When rendering HTML content:

```typescript
import DOMPurify from 'dompurify';

const cleanContent = DOMPurify.sanitize(article.content);
```

### Access Control

Protect admin routes:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin/help-articles')) {
    // Check user authentication and role
    const user = await getUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.redirect('/login');
    }
  }
}
```

## Migration Guide

### From Existing System

If you have existing help content:

1. Export data from current system
2. Transform to match schema
3. Import using API or SQL

Example import script:

```typescript
async function importArticles(articles: OldArticle[]) {
  for (const oldArticle of articles) {
    const newArticle = {
      title: oldArticle.title,
      slug: generateSlug(oldArticle.title),
      content: convertContent(oldArticle.body),
      status: 'published',
      category_id: await findOrCreateCategory(oldArticle.category)
    };

    await fetch('/api/help/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newArticle)
    });
  }
}
```

## Future Enhancements

Potential additions to the system:

- [ ] Multi-language support
- [ ] PDF export
- [ ] Article templates
- [ ] Workflow/approval process
- [ ] AI-powered article suggestions
- [ ] Live chat integration
- [ ] Article rating (1-5 stars)
- [ ] Comments system
- [ ] Video embeds
- [ ] Code playground integration

## Support

For questions or issues:

1. Check this documentation
2. Review article templates
3. Examine example implementations
4. Contact development team

## Changelog

### Version 1.0.0 (2025-01-16)

- Initial release
- Full CRUD operations
- Search functionality
- Category and tag management
- Analytics tracking
- Admin interface
- SEO optimization
- Component library
