// Help System Types

export interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  parent_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  article_count?: number;
  subcategories?: HelpCategory[];
}

export interface HelpTag {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
  article_count?: number;
}

export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  content_type: 'markdown' | 'html';
  category_id: string | null;
  category?: HelpCategory;
  author_id: string | null;
  author_name: string | null;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
  tags?: HelpTag[];
  related_articles?: HelpArticle[];
}

export interface HelpArticleTag {
  id: string;
  article_id: string;
  tag_id: string;
  created_at: Date;
}

export interface HelpArticleFeedback {
  id: string;
  article_id: string;
  is_helpful: boolean;
  feedback_text: string | null;
  user_id: string | null;
  user_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface HelpArticleVersion {
  id: string;
  article_id: string;
  version_number: number;
  title: string;
  content: string;
  content_type: 'markdown' | 'html';
  changed_by: string | null;
  changed_by_name: string | null;
  change_summary: string | null;
  created_at: Date;
}

export interface HelpArticleRelated {
  id: string;
  article_id: string;
  related_article_id: string;
  display_order: number;
  created_at: Date;
}

export interface HelpArticleView {
  id: string;
  article_id: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  created_at: Date;
}

export interface HelpSearchQuery {
  id: string;
  query: string;
  results_count: number;
  user_id: string | null;
  ip_address: string | null;
  created_at: Date;
}

// DTOs (Data Transfer Objects)

export interface CreateHelpArticleDTO {
  title: string;
  slug: string;
  description?: string;
  content: string;
  content_type?: 'markdown' | 'html';
  category_id?: string;
  author_id?: string;
  author_name?: string;
  status?: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  tag_ids?: string[];
  related_article_ids?: string[];
}

export interface UpdateHelpArticleDTO {
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  content_type?: 'markdown' | 'html';
  category_id?: string;
  author_id?: string;
  author_name?: string;
  status?: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  tag_ids?: string[];
  related_article_ids?: string[];
}

export interface CreateHelpCategoryDTO {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order?: number;
  parent_id?: string;
  is_active?: boolean;
}

export interface UpdateHelpCategoryDTO {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  display_order?: number;
  parent_id?: string;
  is_active?: boolean;
}

export interface CreateHelpTagDTO {
  name: string;
  slug: string;
}

export interface SubmitFeedbackDTO {
  article_id: string;
  is_helpful: boolean;
  feedback_text?: string;
  user_id?: string;
  user_email?: string;
}

export interface HelpSearchParams {
  query?: string;
  category_id?: string;
  tag_id?: string;
  status?: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
  limit?: number;
  offset?: number;
  order_by?: 'created_at' | 'updated_at' | 'view_count' | 'helpful_count' | 'title';
  order_direction?: 'asc' | 'desc';
}

export interface HelpSearchResult {
  articles: HelpArticle[];
  total: number;
  limit: number;
  offset: number;
}

export interface HelpArticleWithRelations extends HelpArticle {
  category: HelpCategory | null;
  tags: HelpTag[];
  related_articles: HelpArticle[];
  table_of_contents?: TableOfContentsItem[];
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
  children?: TableOfContentsItem[];
}

export interface HelpStats {
  total_articles: number;
  total_categories: number;
  total_tags: number;
  total_views: number;
  total_feedback: number;
  helpful_percentage: number;
  most_viewed_articles: HelpArticle[];
  most_helpful_articles: HelpArticle[];
  recent_articles: HelpArticle[];
}

export interface CategoryWithArticles extends HelpCategory {
  articles: HelpArticle[];
  subcategories: CategoryWithArticles[];
}
