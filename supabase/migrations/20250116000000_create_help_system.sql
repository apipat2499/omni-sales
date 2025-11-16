-- ============================================
-- KNOWLEDGE BASE AND HELP SYSTEM
-- ============================================

-- Help Categories Table
CREATE TABLE IF NOT EXISTS help_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  parent_id UUID REFERENCES help_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Help Tags Table
CREATE TABLE IF NOT EXISTS help_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Help Articles Table
CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  content_type VARCHAR(20) DEFAULT 'markdown', -- markdown or html
  category_id UUID REFERENCES help_categories(id) ON DELETE SET NULL,
  author_id UUID,
  author_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Help Article Tags (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS help_article_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES help_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, tag_id)
);

-- Help Article Feedback (Was this helpful?)
CREATE TABLE IF NOT EXISTS help_article_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  user_id UUID,
  user_email VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Help Article Versions (Version History)
CREATE TABLE IF NOT EXISTS help_article_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(20) DEFAULT 'markdown',
  changed_by UUID,
  changed_by_name VARCHAR(255),
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, version_number)
);

-- Help Article Related Articles (Many-to-Many self-reference)
CREATE TABLE IF NOT EXISTS help_article_related (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
  related_article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(article_id, related_article_id),
  CHECK (article_id != related_article_id)
);

-- Help Article Views (Analytics)
CREATE TABLE IF NOT EXISTS help_article_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
  user_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Help Search Queries (Analytics)
CREATE TABLE IF NOT EXISTS help_search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query VARCHAR(500) NOT NULL,
  results_count INTEGER DEFAULT 0,
  user_id UUID,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Help Articles indexes
CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON help_articles(slug);
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_help_articles_status ON help_articles(status);
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_help_articles_view_count ON help_articles(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_help_articles_helpful ON help_articles(helpful_count DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_help_articles_search ON help_articles
  USING gin(to_tsvector('english', title || ' ' || description || ' ' || content));

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_help_categories_slug ON help_categories(slug);
CREATE INDEX IF NOT EXISTS idx_help_categories_parent ON help_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_help_categories_order ON help_categories(display_order);

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_help_tags_slug ON help_tags(slug);

-- Article tags indexes
CREATE INDEX IF NOT EXISTS idx_help_article_tags_article ON help_article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_help_article_tags_tag ON help_article_tags(tag_id);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_help_feedback_article ON help_article_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_help_feedback_created ON help_article_feedback(created_at);

-- Versions indexes
CREATE INDEX IF NOT EXISTS idx_help_versions_article ON help_article_versions(article_id);
CREATE INDEX IF NOT EXISTS idx_help_versions_number ON help_article_versions(article_id, version_number);

-- Views indexes
CREATE INDEX IF NOT EXISTS idx_help_views_article ON help_article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_help_views_created ON help_article_views(created_at);

-- Search queries indexes
CREATE INDEX IF NOT EXISTS idx_help_search_query ON help_search_queries(query);
CREATE INDEX IF NOT EXISTS idx_help_search_created ON help_search_queries(created_at);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_help_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for help_categories
CREATE TRIGGER update_help_categories_updated_at
  BEFORE UPDATE ON help_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_help_updated_at();

-- Trigger for help_articles
CREATE TRIGGER update_help_articles_updated_at
  BEFORE UPDATE ON help_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_help_updated_at();

-- ============================================
-- TRIGGER FOR ARTICLE VERSION HISTORY
-- ============================================

CREATE OR REPLACE FUNCTION create_article_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if content or title changed
  IF (OLD.title IS DISTINCT FROM NEW.title) OR (OLD.content IS DISTINCT FROM NEW.content) THEN
    INSERT INTO help_article_versions (
      article_id,
      version_number,
      title,
      content,
      content_type,
      changed_by,
      changed_by_name
    )
    SELECT
      NEW.id,
      COALESCE(MAX(version_number), 0) + 1,
      OLD.title,
      OLD.content,
      OLD.content_type,
      NEW.author_id,
      NEW.author_name
    FROM help_article_versions
    WHERE article_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_article_version_trigger
  AFTER UPDATE ON help_articles
  FOR EACH ROW
  EXECUTE FUNCTION create_article_version();

-- ============================================
-- FUNCTION TO INCREMENT VIEW COUNT
-- ============================================

CREATE OR REPLACE FUNCTION increment_article_view(article_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE help_articles
  SET view_count = view_count + 1
  WHERE id = article_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED INITIAL CATEGORIES
-- ============================================

INSERT INTO help_categories (name, slug, description, icon, display_order) VALUES
  ('Getting Started', 'getting-started', 'Learn the basics of using the platform', 'Rocket', 1),
  ('Account & Settings', 'account-settings', 'Manage your account and preferences', 'Settings', 2),
  ('Orders & Shipping', 'orders-shipping', 'Everything about orders and shipping', 'Package', 3),
  ('Products & Inventory', 'products-inventory', 'Product and inventory management', 'Box', 4),
  ('Payments & Billing', 'payments-billing', 'Payment methods and billing information', 'CreditCard', 5),
  ('Reports & Analytics', 'reports-analytics', 'Understanding your data and reports', 'BarChart', 6),
  ('Integration', 'integration', 'Third-party integrations and APIs', 'Plug', 7),
  ('Troubleshooting', 'troubleshooting', 'Common issues and how to fix them', 'AlertCircle', 8)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SEED INITIAL TAGS
-- ============================================

INSERT INTO help_tags (name, slug) VALUES
  ('Quick Start', 'quick-start'),
  ('Tutorial', 'tutorial'),
  ('Video', 'video'),
  ('FAQ', 'faq'),
  ('Advanced', 'advanced'),
  ('API', 'api'),
  ('Mobile', 'mobile'),
  ('Desktop', 'desktop'),
  ('Common Issue', 'common-issue'),
  ('Best Practice', 'best-practice')
ON CONFLICT (slug) DO NOTHING;
