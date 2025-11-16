# Knowledge Base and Help System

A comprehensive knowledge base and help system with search functionality, categories, tags, and analytics.

## Features

### Core Functionality
- **Full-text search** - PostgreSQL-powered search with fallback
- **Category organization** - Hierarchical category structure
- **Tag system** - Flexible article tagging
- **Article versioning** - Automatic version history tracking
- **Feedback system** - Was this helpful? with optional comments
- **View analytics** - Track article views and popular content
- **Related articles** - Automatic and manual article relationships
- **SEO optimization** - Meta tags, structured data, clean URLs

### Content Management
- **Rich content support** - Markdown and HTML
- **Draft/Published/Archived** - Status workflow
- **Featured articles** - Highlight important content
- **Table of contents** - Auto-generated for long articles
- **Breadcrumb navigation** - Easy content discovery
- **Author attribution** - Track content creators

### Admin Features
- **Full CRUD operations** - Create, read, update, delete articles
- **Category management** - Organize content hierarchically
- **Tag management** - Flexible content classification
- **Search filtering** - Filter by category, tag, status
- **Analytics dashboard** - View counts, feedback, popular content

## Quick Start

### 1. Database Setup

Run the migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually execute:
# supabase/migrations/20250116000000_create_help_system.sql
```

### 2. Access Points

- **Help Center**: `/help`
- **Article View**: `/help/articles/{slug}`
- **Category View**: `/help/category/{slug}`
- **Search**: `/help/search?q={query}`
- **Admin Panel**: `/admin/help-articles`

### 3. API Endpoints

```
GET    /api/help/articles           - List articles
POST   /api/help/articles           - Create article
GET    /api/help/articles/:slug     - Get article
PUT    /api/help/articles/:slug     - Update article
DELETE /api/help/articles/:slug     - Delete article

POST   /api/help/articles/:id/feedback - Submit feedback

GET    /api/help/categories         - List categories
POST   /api/help/categories         - Create category

GET    /api/help/tags               - List tags
POST   /api/help/tags               - Create tag

GET    /api/help/search             - Search articles
```

## Database Schema

### Tables

1. **help_categories** - Article categories
2. **help_tags** - Article tags
3. **help_articles** - Main articles
4. **help_article_tags** - Article-tag relationships
5. **help_article_feedback** - User feedback
6. **help_article_versions** - Version history
7. **help_article_related** - Related articles
8. **help_article_views** - View tracking
9. **help_search_queries** - Search analytics

### Default Categories

- Getting Started
- Account & Settings
- Orders & Shipping
- Products & Inventory
- Payments & Billing
- Reports & Analytics
- Integration
- Troubleshooting

## Components

### ArticleCard
Display article with metadata
```tsx
<ArticleCard article={article} showCategory showTags showStats />
```

### ArticleSearch
Search input component
```tsx
<ArticleSearch onSearch={handleSearch} placeholder="Search..." />
```

### CategoryBrowser
Category navigation
```tsx
<CategoryBrowser selectedCategoryId={id} showArticleCount />
```

### TableOfContents
Auto-generated TOC
```tsx
<TableOfContents content={article.content} />
```

### RelatedArticles
Display related content
```tsx
<RelatedArticles articles={related} maxItems={5} />
```

### FeedbackForm
Collect user feedback
```tsx
<FeedbackForm articleId={id} onSubmit={handleFeedback} />
```

## Creating Articles

### Using the Admin Panel

1. Go to `/admin/help-articles`
2. Click "New Article"
3. Fill in:
   - Title and slug
   - Category
   - Tags
   - Content (Markdown or HTML)
   - SEO metadata
   - Status
4. Save

### Using the API

```javascript
const response = await fetch('/api/help/articles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Getting Started Guide',
    slug: 'getting-started-guide',
    description: 'Learn the basics',
    content: '# Welcome\n\nThis is your guide...',
    content_type: 'markdown',
    category_id: 'uuid-here',
    status: 'published',
    tag_ids: ['tag-uuid-1', 'tag-uuid-2']
  })
});
```

## Article Templates

See `docs/HELP_ARTICLE_TEMPLATES.md` for:
- Getting Started template
- How-To Guide template
- Troubleshooting template
- API Documentation template
- FAQ template

## Analytics

### Most Viewed Articles

```sql
SELECT title, view_count, helpful_count
FROM help_articles
WHERE status = 'published'
ORDER BY view_count DESC
LIMIT 10;
```

### Helpful Percentage

```sql
SELECT
  title,
  ROUND(
    helpful_count::float / NULLIF(helpful_count + not_helpful_count, 0) * 100,
    2
  ) as helpful_pct
FROM help_articles
WHERE status = 'published'
  AND (helpful_count + not_helpful_count) > 0
ORDER BY helpful_pct DESC;
```

### Popular Searches

```sql
SELECT query, COUNT(*) as count
FROM help_search_queries
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY query
ORDER BY count DESC
LIMIT 20;
```

## SEO Optimization

### Meta Tags

Each article supports:
- Custom meta title
- Custom meta description
- Custom meta keywords

### Structured Data

Add to article pages:

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

### Clean URLs

Articles use SEO-friendly slugs:
- `/help/articles/getting-started-guide`
- `/help/category/troubleshooting`
- `/help/tag/quick-start`

## Documentation

- **System Guide**: `docs/HELP_SYSTEM_GUIDE.md` - Complete implementation guide
- **Article Templates**: `docs/HELP_ARTICLE_TEMPLATES.md` - Content templates and examples

## Type Definitions

TypeScript types available in `types/help.ts`:

- `HelpArticle`
- `HelpCategory`
- `HelpTag`
- `HelpArticleFeedback`
- `HelpArticleVersion`
- `CreateHelpArticleDTO`
- `UpdateHelpArticleDTO`
- And more...

## Performance

### Indexes

The system includes optimized indexes for:
- Article slugs
- Category relationships
- Status fields
- View counts
- Full-text search

### Caching Recommendations

Consider caching:
- Category lists (rarely change)
- Popular articles (update hourly)
- Search results (5-minute TTL)

### Pagination

Always use pagination for large result sets:

```typescript
const limit = 20;
const offset = (page - 1) * limit;
```

## Security

### Input Validation

All endpoints validate:
- Required fields
- Data types
- String lengths
- URL slugs

### XSS Prevention

HTML content is sanitized before rendering.

### Access Control

Admin routes should be protected with authentication middleware.

## Troubleshooting

### Search not working

- Verify PostgreSQL full-text search is enabled
- Check index creation
- Try fallback ILIKE search

### Articles not appearing

- Check status is "published"
- Verify category is active
- Check date filters

### Feedback not recording

- Verify article ID is correct
- Check feedback table exists
- Ensure API endpoint is accessible

## Contributing

When adding new features:

1. Update database schema if needed
2. Add TypeScript types
3. Update API endpoints
4. Update components
5. Update documentation
6. Add tests

## License

Part of the Omni-Sales platform.

---

For detailed implementation guide, see `docs/HELP_SYSTEM_GUIDE.md`
