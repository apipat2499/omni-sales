-- =============================================
-- File Management System Migration
-- =============================================
-- Creates tables for cloud file management with:
-- - File metadata storage
-- - File sharing and public links
-- - Version history tracking
-- - Download tracking
-- - Storage quota management
-- - Multi-tenant support
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Files Table
-- =============================================
-- Stores metadata for all uploaded files
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Tenant & User Information
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  -- File Information
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  storage_provider VARCHAR(50) NOT NULL DEFAULT 'supabase', -- 'supabase' or 's3'

  -- File Metadata
  size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  file_extension VARCHAR(50),

  -- Organization
  folder_path TEXT DEFAULT '/',
  parent_folder_id UUID REFERENCES files(id) ON DELETE CASCADE,
  is_folder BOOLEAN DEFAULT FALSE,

  -- Access Control
  is_public BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,

  -- Tags and Labels
  tags TEXT[] DEFAULT '{}',
  labels JSONB DEFAULT '{}',

  -- Additional Metadata
  metadata JSONB DEFAULT '{}',
  description TEXT,

  -- URLs
  public_url TEXT,
  thumbnail_url TEXT,

  -- Checksums for integrity
  md5_hash VARCHAR(32),
  sha256_hash VARCHAR(64),

  -- Version Control
  version_number INTEGER DEFAULT 1,
  is_latest_version BOOLEAN DEFAULT TRUE,
  previous_version_id UUID REFERENCES files(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,

  -- Constraints
  CHECK (size_bytes >= 0),
  CHECK (version_number > 0)
);

-- =============================================
-- File Shares Table
-- =============================================
-- Tracks public/private file sharing links
CREATE TABLE IF NOT EXISTS file_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- File Reference
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Share Information
  share_token VARCHAR(100) NOT NULL UNIQUE,
  share_type VARCHAR(50) NOT NULL DEFAULT 'link', -- 'link', 'email', 'public'

  -- Access Control
  password_hash VARCHAR(255), -- Optional password protection
  allowed_emails TEXT[], -- Email whitelist
  max_downloads INTEGER, -- NULL for unlimited
  download_count INTEGER DEFAULT 0,

  -- Permissions
  can_download BOOLEAN DEFAULT TRUE,
  can_preview BOOLEAN DEFAULT TRUE,

  -- Expiry
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,

  -- Creator
  created_by UUID NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,

  -- Constraints
  CHECK (download_count >= 0),
  CHECK (max_downloads IS NULL OR max_downloads > 0)
);

-- =============================================
-- File Versions Table
-- =============================================
-- Tracks version history for files
CREATE TABLE IF NOT EXISTS file_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- File Reference
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Version Information
  version_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,

  -- File Metadata (snapshot at version time)
  name VARCHAR(255) NOT NULL,
  size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  md5_hash VARCHAR(32),
  sha256_hash VARCHAR(64),

  -- Change Tracking
  change_description TEXT,
  created_by UUID NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CHECK (size_bytes >= 0),
  CHECK (version_number > 0),
  UNIQUE (file_id, version_number)
);

-- =============================================
-- File Downloads Table
-- =============================================
-- Tracks file download history
CREATE TABLE IF NOT EXISTS file_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- File Reference
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  file_share_id UUID REFERENCES file_shares(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Download Information
  downloaded_by UUID, -- NULL for anonymous downloads
  ip_address INET,
  user_agent TEXT,

  -- Location Data
  country_code VARCHAR(2),
  city VARCHAR(100),

  -- Download Metadata
  download_method VARCHAR(50) DEFAULT 'direct', -- 'direct', 'share_link', 'api'
  file_size_bytes BIGINT,

  -- Timestamps
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CHECK (file_size_bytes >= 0)
);

-- =============================================
-- File Storage Usage Table
-- =============================================
-- Tracks storage quota usage per user/tenant
CREATE TABLE IF NOT EXISTS file_storage_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Reference
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID,

  -- Usage Statistics
  total_files INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,

  -- Quotas
  quota_bytes BIGINT DEFAULT 10737418240, -- Default 10GB
  quota_files INTEGER DEFAULT 10000,

  -- Breakdown by Type
  documents_count INTEGER DEFAULT 0,
  documents_size_bytes BIGINT DEFAULT 0,
  images_count INTEGER DEFAULT 0,
  images_size_bytes BIGINT DEFAULT 0,
  videos_count INTEGER DEFAULT 0,
  videos_size_bytes BIGINT DEFAULT 0,
  archives_count INTEGER DEFAULT 0,
  archives_size_bytes BIGINT DEFAULT 0,
  other_count INTEGER DEFAULT 0,
  other_size_bytes BIGINT DEFAULT 0,

  -- Timestamps
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CHECK (total_files >= 0),
  CHECK (total_size_bytes >= 0),
  CHECK (quota_bytes > 0),
  CHECK (quota_files > 0),
  UNIQUE (tenant_id, user_id)
);

-- =============================================
-- Indexes for Performance
-- =============================================

-- Files table indexes
CREATE INDEX idx_files_tenant_id ON files(tenant_id);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_folder_path ON files(folder_path);
CREATE INDEX idx_files_parent_folder_id ON files(parent_folder_id);
CREATE INDEX idx_files_is_deleted ON files(is_deleted);
CREATE INDEX idx_files_created_at ON files(created_at DESC);
CREATE INDEX idx_files_mime_type ON files(mime_type);
CREATE INDEX idx_files_tags ON files USING GIN(tags);
CREATE INDEX idx_files_is_public ON files(is_public);
CREATE INDEX idx_files_name_search ON files USING GIN(to_tsvector('english', name));

-- File shares indexes
CREATE INDEX idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX idx_file_shares_tenant_id ON file_shares(tenant_id);
CREATE INDEX idx_file_shares_share_token ON file_shares(share_token);
CREATE INDEX idx_file_shares_expires_at ON file_shares(expires_at);
CREATE INDEX idx_file_shares_is_active ON file_shares(is_active);
CREATE INDEX idx_file_shares_created_by ON file_shares(created_by);

-- File versions indexes
CREATE INDEX idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX idx_file_versions_tenant_id ON file_versions(tenant_id);
CREATE INDEX idx_file_versions_created_at ON file_versions(created_at DESC);

-- File downloads indexes
CREATE INDEX idx_file_downloads_file_id ON file_downloads(file_id);
CREATE INDEX idx_file_downloads_tenant_id ON file_downloads(tenant_id);
CREATE INDEX idx_file_downloads_downloaded_by ON file_downloads(downloaded_by);
CREATE INDEX idx_file_downloads_downloaded_at ON file_downloads(downloaded_at DESC);
CREATE INDEX idx_file_downloads_file_share_id ON file_downloads(file_share_id);

-- Storage usage indexes
CREATE INDEX idx_storage_usage_tenant_id ON file_storage_usage(tenant_id);
CREATE INDEX idx_storage_usage_user_id ON file_storage_usage(user_id);

-- =============================================
-- Functions and Triggers
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_file_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for files table
CREATE TRIGGER trigger_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_file_updated_at();

-- Trigger for file_shares table
CREATE TRIGGER trigger_file_shares_updated_at
  BEFORE UPDATE ON file_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_file_updated_at();

-- Trigger for file_storage_usage table
CREATE TRIGGER trigger_storage_usage_updated_at
  BEFORE UPDATE ON file_storage_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_file_updated_at();

-- Function to update storage usage
CREATE OR REPLACE FUNCTION update_storage_usage()
RETURNS TRIGGER AS $$
DECLARE
  v_file_category VARCHAR(50);
BEGIN
  -- Determine file category based on mime_type
  v_file_category := CASE
    WHEN NEW.mime_type LIKE 'image/%' THEN 'images'
    WHEN NEW.mime_type LIKE 'video/%' THEN 'videos'
    WHEN NEW.mime_type IN ('application/pdf', 'application/msword',
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            'application/vnd.ms-excel',
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            'text/plain', 'text/csv') THEN 'documents'
    WHEN NEW.mime_type IN ('application/zip', 'application/x-rar-compressed',
                            'application/x-7z-compressed') THEN 'archives'
    ELSE 'other'
  END;

  IF (TG_OP = 'INSERT') THEN
    -- Update or insert storage usage
    INSERT INTO file_storage_usage (tenant_id, user_id, total_files, total_size_bytes,
      documents_count, documents_size_bytes,
      images_count, images_size_bytes,
      videos_count, videos_size_bytes,
      archives_count, archives_size_bytes,
      other_count, other_size_bytes,
      last_calculated_at)
    VALUES (
      NEW.tenant_id,
      NEW.user_id,
      1,
      NEW.size_bytes,
      CASE WHEN v_file_category = 'documents' THEN 1 ELSE 0 END,
      CASE WHEN v_file_category = 'documents' THEN NEW.size_bytes ELSE 0 END,
      CASE WHEN v_file_category = 'images' THEN 1 ELSE 0 END,
      CASE WHEN v_file_category = 'images' THEN NEW.size_bytes ELSE 0 END,
      CASE WHEN v_file_category = 'videos' THEN 1 ELSE 0 END,
      CASE WHEN v_file_category = 'videos' THEN NEW.size_bytes ELSE 0 END,
      CASE WHEN v_file_category = 'archives' THEN 1 ELSE 0 END,
      CASE WHEN v_file_category = 'archives' THEN NEW.size_bytes ELSE 0 END,
      CASE WHEN v_file_category = 'other' THEN 1 ELSE 0 END,
      CASE WHEN v_file_category = 'other' THEN NEW.size_bytes ELSE 0 END,
      NOW()
    )
    ON CONFLICT (tenant_id, user_id)
    DO UPDATE SET
      total_files = file_storage_usage.total_files + 1,
      total_size_bytes = file_storage_usage.total_size_bytes + NEW.size_bytes,
      documents_count = file_storage_usage.documents_count + CASE WHEN v_file_category = 'documents' THEN 1 ELSE 0 END,
      documents_size_bytes = file_storage_usage.documents_size_bytes + CASE WHEN v_file_category = 'documents' THEN NEW.size_bytes ELSE 0 END,
      images_count = file_storage_usage.images_count + CASE WHEN v_file_category = 'images' THEN 1 ELSE 0 END,
      images_size_bytes = file_storage_usage.images_size_bytes + CASE WHEN v_file_category = 'images' THEN NEW.size_bytes ELSE 0 END,
      videos_count = file_storage_usage.videos_count + CASE WHEN v_file_category = 'videos' THEN 1 ELSE 0 END,
      videos_size_bytes = file_storage_usage.videos_size_bytes + CASE WHEN v_file_category = 'videos' THEN NEW.size_bytes ELSE 0 END,
      archives_count = file_storage_usage.archives_count + CASE WHEN v_file_category = 'archives' THEN 1 ELSE 0 END,
      archives_size_bytes = file_storage_usage.archives_size_bytes + CASE WHEN v_file_category = 'archives' THEN NEW.size_bytes ELSE 0 END,
      other_count = file_storage_usage.other_count + CASE WHEN v_file_category = 'other' THEN 1 ELSE 0 END,
      other_size_bytes = file_storage_usage.other_size_bytes + CASE WHEN v_file_category = 'other' THEN NEW.size_bytes ELSE 0 END,
      last_calculated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update storage usage on file insert
CREATE TRIGGER trigger_update_storage_usage
  AFTER INSERT ON files
  FOR EACH ROW
  WHEN (NEW.is_deleted = FALSE)
  EXECUTE FUNCTION update_storage_usage();

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_share_download_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.file_share_id IS NOT NULL THEN
    UPDATE file_shares
    SET download_count = download_count + 1,
        last_accessed_at = NOW()
    WHERE id = NEW.file_share_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment download count
CREATE TRIGGER trigger_increment_download_count
  AFTER INSERT ON file_downloads
  FOR EACH ROW
  EXECUTE FUNCTION increment_share_download_count();

-- =============================================
-- Row-Level Security (RLS) Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_storage_usage ENABLE ROW LEVEL SECURITY;

-- Files table policies
CREATE POLICY files_tenant_isolation ON files
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY files_user_access ON files
  USING (
    user_id = current_setting('app.current_user_id', TRUE)::UUID
    OR is_public = TRUE
  );

-- File shares table policies
CREATE POLICY file_shares_tenant_isolation ON file_shares
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY file_shares_creator_access ON file_shares
  USING (created_by = current_setting('app.current_user_id', TRUE)::UUID);

-- File versions table policies
CREATE POLICY file_versions_tenant_isolation ON file_versions
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- File downloads table policies
CREATE POLICY file_downloads_tenant_isolation ON file_downloads
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Storage usage table policies
CREATE POLICY storage_usage_tenant_isolation ON file_storage_usage
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY storage_usage_user_access ON file_storage_usage
  USING (user_id = current_setting('app.current_user_id', TRUE)::UUID);

-- =============================================
-- Sample Data / Initial Setup
-- =============================================

-- Create default storage bucket configuration
-- This would be done in Supabase UI or via Supabase CLI
-- COMMENT: Create a bucket named 'files' in Supabase Storage with public access disabled

-- =============================================
-- Views for Reporting
-- =============================================

-- View for file statistics by tenant
CREATE OR REPLACE VIEW file_statistics_by_tenant AS
SELECT
  f.tenant_id,
  COUNT(*) as total_files,
  SUM(f.size_bytes) as total_size_bytes,
  COUNT(DISTINCT f.user_id) as unique_users,
  COUNT(*) FILTER (WHERE f.is_public = TRUE) as public_files,
  COUNT(*) FILTER (WHERE f.mime_type LIKE 'image/%') as image_files,
  COUNT(*) FILTER (WHERE f.mime_type LIKE 'video/%') as video_files,
  COUNT(*) FILTER (WHERE f.mime_type LIKE 'application/pdf') as pdf_files,
  MAX(f.created_at) as latest_upload
FROM files f
WHERE f.is_deleted = FALSE
GROUP BY f.tenant_id;

-- View for popular files (most downloaded)
CREATE OR REPLACE VIEW popular_files AS
SELECT
  f.id,
  f.name,
  f.mime_type,
  f.size_bytes,
  COUNT(fd.id) as download_count,
  f.created_at,
  f.user_id
FROM files f
LEFT JOIN file_downloads fd ON f.id = fd.file_id
WHERE f.is_deleted = FALSE
GROUP BY f.id, f.name, f.mime_type, f.size_bytes, f.created_at, f.user_id
ORDER BY download_count DESC;

-- =============================================
-- Comments
-- =============================================

COMMENT ON TABLE files IS 'Stores metadata for all uploaded files with version control and multi-tenant support';
COMMENT ON TABLE file_shares IS 'Tracks public and private file sharing links with access control';
COMMENT ON TABLE file_versions IS 'Maintains version history for files';
COMMENT ON TABLE file_downloads IS 'Records all file download events for analytics';
COMMENT ON TABLE file_storage_usage IS 'Tracks storage quota usage per user/tenant';

-- =============================================
-- Migration Complete
-- =============================================
