-- ============================================================================
-- Comprehensive Advanced Settings System for Omni Sales
-- Created: 2025-11-25
-- ============================================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS ai_agent_sessions CASCADE;
DROP TABLE IF EXISTS ai_agent_conversations CASCADE;
DROP TABLE IF EXISTS integration_configs CASCADE;
DROP TABLE IF EXISTS automation_settings CASCADE;
DROP TABLE IF EXISTS email_template_customizations CASCADE;
DROP TABLE IF EXISTS product_display_settings CASCADE;
DROP TABLE IF EXISTS shipping_zones CASCADE;
DROP TABLE IF EXISTS shipping_providers CASCADE;
DROP TABLE IF EXISTS invoice_settings CASCADE;
DROP TABLE IF EXISTS order_number_settings CASCADE;
DROP TABLE IF EXISTS tax_rules CASCADE;
DROP TABLE IF EXISTS storefront_customization CASCADE;
DROP TABLE IF EXISTS currency_settings CASCADE;
DROP TABLE IF EXISTS language_settings CASCADE;

-- ============================================================================
-- 1. STOREFRONT CUSTOMIZATION
-- ============================================================================

CREATE TABLE storefront_customization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Colors
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#10B981',
    accent_color VARCHAR(7) DEFAULT '#F59E0B',
    button_color VARCHAR(7) DEFAULT '#3B82F6',
    button_hover_color VARCHAR(7) DEFAULT '#2563EB',
    link_color VARCHAR(7) DEFAULT '#3B82F6',
    success_color VARCHAR(7) DEFAULT '#10B981',
    error_color VARCHAR(7) DEFAULT '#EF4444',

    -- Typography
    font_family VARCHAR(100) DEFAULT 'Inter, system-ui, sans-serif',
    heading_font VARCHAR(100) DEFAULT 'Inter, system-ui, sans-serif',
    body_font VARCHAR(100) DEFAULT 'Inter, system-ui, sans-serif',
    font_size_base INTEGER DEFAULT 16,

    -- Banner & Hero
    hero_banner_url TEXT,
    hero_title VARCHAR(200),
    hero_subtitle VARCHAR(300),
    hero_cta_text VARCHAR(50) DEFAULT 'Shop Now',
    hero_cta_link VARCHAR(200) DEFAULT '/products',

    -- Welcome Messages
    welcome_message TEXT,
    promotion_banner TEXT,
    announcement_text TEXT,
    announcement_enabled BOOLEAN DEFAULT FALSE,
    announcement_type VARCHAR(20) DEFAULT 'info', -- info, warning, success

    -- Footer
    footer_text TEXT,
    footer_links JSONB DEFAULT '[]',

    -- Social Media
    facebook_url VARCHAR(200),
    instagram_url VARCHAR(200),
    twitter_url VARCHAR(200),
    line_url VARCHAR(200),
    tiktok_url VARCHAR(200),

    -- SEO
    meta_title VARCHAR(100),
    meta_description VARCHAR(200),
    meta_keywords TEXT,

    -- Custom CSS
    custom_css TEXT,
    custom_js TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. TAX SETTINGS
-- ============================================================================

CREATE TABLE tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Tax Configuration
    tax_type VARCHAR(50) DEFAULT 'percentage', -- percentage, fixed
    tax_rate DECIMAL(10, 4) NOT NULL, -- 7.00 for 7% VAT

    -- Applicability
    apply_to VARCHAR(50) DEFAULT 'all', -- all, category, product, location
    category_ids JSONB DEFAULT '[]',
    product_ids JSONB DEFAULT '[]',

    -- Location-based
    provinces JSONB DEFAULT '[]', -- Thai provinces

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,

    -- Priority (higher number = higher priority)
    priority INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. ORDER SETTINGS
-- ============================================================================

CREATE TABLE order_number_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Order Number Format
    prefix VARCHAR(10) DEFAULT 'ORD',
    suffix VARCHAR(10),
    padding INTEGER DEFAULT 8, -- ORD-00000001
    separator VARCHAR(5) DEFAULT '-',

    -- Include date in order number
    include_year BOOLEAN DEFAULT TRUE,
    include_month BOOLEAN DEFAULT FALSE,
    include_day BOOLEAN DEFAULT FALSE,
    date_format VARCHAR(20) DEFAULT 'YYYY', -- YYYY, YYYYMM, YYYYMMDD

    -- Counter
    current_counter INTEGER DEFAULT 0,
    reset_counter VARCHAR(20) DEFAULT 'never', -- never, yearly, monthly, daily

    -- Example: ORD-2025-00000001 or INV-202501-0001
    example_format VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Workflow Settings
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS payment_pending_minutes INTEGER DEFAULT 60;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS auto_cancel_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS auto_cancel_message TEXT DEFAULT 'Order automatically cancelled due to payment timeout';

-- Custom Order Statuses
CREATE TABLE IF NOT EXISTS order_status_custom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    status_key VARCHAR(50) NOT NULL,
    status_label_th VARCHAR(100) NOT NULL,
    status_label_en VARCHAR(100) NOT NULL,
    status_color VARCHAR(7) DEFAULT '#6B7280',
    status_icon VARCHAR(50),

    -- Order in display
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,

    -- Workflow
    can_transition_to JSONB DEFAULT '[]', -- Array of status keys
    notify_customer BOOLEAN DEFAULT TRUE,
    notify_admin BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. INVOICE SETTINGS
-- ============================================================================

CREATE TABLE invoice_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Company Information
    company_name VARCHAR(200) NOT NULL,
    company_name_en VARCHAR(200),
    tax_id VARCHAR(20),
    branch VARCHAR(100),

    -- Address
    address TEXT NOT NULL,
    address_en TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),

    -- Logo
    logo_url TEXT,
    logo_width INTEGER DEFAULT 150,
    logo_height INTEGER DEFAULT 50,

    -- Invoice Format
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    receipt_prefix VARCHAR(10) DEFAULT 'REC',
    quotation_prefix VARCHAR(10) DEFAULT 'QUO',

    -- Terms & Conditions
    terms_and_conditions TEXT,
    payment_terms TEXT DEFAULT 'Payment due within 30 days',
    notes TEXT,

    -- Footer
    footer_text TEXT,
    bank_details TEXT,

    -- Tax Receipt Info
    tax_invoice_text TEXT DEFAULT 'ใบกำกับภาษี / Tax Invoice',
    tax_receipt_number VARCHAR(50),

    -- Format Options
    show_tax_breakdown BOOLEAN DEFAULT TRUE,
    show_payment_method BOOLEAN DEFAULT TRUE,
    show_shipping_cost BOOLEAN DEFAULT TRUE,
    show_discount BOOLEAN DEFAULT TRUE,

    -- Language
    default_language VARCHAR(10) DEFAULT 'th',
    show_bilingual BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. ADVANCED SHIPPING
-- ============================================================================

CREATE TABLE shipping_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    zone_name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Zone Type
    zone_type VARCHAR(50) DEFAULT 'province', -- province, city, postal_code, country

    -- Locations (array of province/city names or postal codes)
    locations JSONB DEFAULT '[]',

    -- Bangkok, ปริมณฑล, ต่างจังหวัด
    is_metro BOOLEAN DEFAULT FALSE,
    is_remote BOOLEAN DEFAULT FALSE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shipping_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    provider_name VARCHAR(100) NOT NULL, -- Kerry, Flash, Thailand Post, EMS
    provider_code VARCHAR(50) NOT NULL,

    -- Pricing
    pricing_type VARCHAR(50) DEFAULT 'flat', -- flat, weight-based, zone-based, weight-zone
    base_cost DECIMAL(10, 2) DEFAULT 0,

    -- Weight-based pricing
    cost_per_kg DECIMAL(10, 2) DEFAULT 0,
    free_shipping_threshold DECIMAL(10, 2) DEFAULT 0,

    -- Zone-based pricing (JSON object mapping zone_id to cost)
    zone_pricing JSONB DEFAULT '{}',

    -- Weight & Zone combination pricing
    weight_zone_pricing JSONB DEFAULT '{}',

    -- Delivery Time
    estimated_days_min INTEGER DEFAULT 1,
    estimated_days_max INTEGER DEFAULT 3,

    -- Tracking
    tracking_url_template VARCHAR(300), -- e.g., https://track.kerry.com/?tracking={TRACKING_NUMBER}
    supports_cod BOOLEAN DEFAULT FALSE,

    -- API Integration
    api_enabled BOOLEAN DEFAULT FALSE,
    api_key VARCHAR(200),
    api_endpoint VARCHAR(300),

    -- Display
    display_order INTEGER DEFAULT 0,
    icon_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. PRODUCT DISPLAY SETTINGS
-- ============================================================================

CREATE TABLE product_display_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Display Options
    products_per_page INTEGER DEFAULT 20,
    grid_columns_desktop INTEGER DEFAULT 4,
    grid_columns_tablet INTEGER DEFAULT 3,
    grid_columns_mobile INTEGER DEFAULT 2,

    -- Default Sorting
    default_sort VARCHAR(50) DEFAULT 'newest', -- newest, price_asc, price_desc, popular, name_asc

    -- Product Card Display
    show_quick_view BOOLEAN DEFAULT TRUE,
    show_add_to_cart BOOLEAN DEFAULT TRUE,
    show_wishlist BOOLEAN DEFAULT TRUE,
    show_compare BOOLEAN DEFAULT FALSE,
    show_rating BOOLEAN DEFAULT TRUE,
    show_stock_status BOOLEAN DEFAULT TRUE,

    -- Out of Stock
    show_out_of_stock BOOLEAN DEFAULT TRUE,
    out_of_stock_message VARCHAR(100) DEFAULT 'สินค้าหมด',
    allow_backorder BOOLEAN DEFAULT FALSE,

    -- SKU Format
    sku_prefix VARCHAR(10) DEFAULT 'SKU',
    sku_auto_generate BOOLEAN DEFAULT TRUE,
    sku_format VARCHAR(50) DEFAULT 'PREFIX-RANDOM8', -- PREFIX-RANDOM8, PREFIX-SEQUENTIAL, CATEGORY-SEQUENTIAL

    -- Image Settings
    image_aspect_ratio VARCHAR(20) DEFAULT '1:1', -- 1:1, 4:3, 16:9
    enable_image_zoom BOOLEAN DEFAULT TRUE,
    enable_image_gallery BOOLEAN DEFAULT TRUE,

    -- Filters
    enable_price_filter BOOLEAN DEFAULT TRUE,
    enable_category_filter BOOLEAN DEFAULT TRUE,
    enable_brand_filter BOOLEAN DEFAULT TRUE,
    enable_color_filter BOOLEAN DEFAULT FALSE,
    enable_size_filter BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. EMAIL TEMPLATE CUSTOMIZATIONS
-- ============================================================================

CREATE TABLE email_template_customizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    template_key VARCHAR(100) NOT NULL, -- order_confirmation, shipping_notification, welcome, review_request
    template_name VARCHAR(200) NOT NULL,

    -- Subject Lines
    subject_th VARCHAR(200) NOT NULL,
    subject_en VARCHAR(200),

    -- Email Content (HTML supported)
    body_html TEXT NOT NULL,
    body_text TEXT,

    -- Variables available: {{customer_name}}, {{order_number}}, {{total}}, etc.
    available_variables JSONB DEFAULT '[]',

    -- Sending Options
    from_name VARCHAR(100),
    from_email VARCHAR(100),
    reply_to VARCHAR(100),
    cc_emails JSONB DEFAULT '[]',
    bcc_emails JSONB DEFAULT '[]',

    -- Attachments
    attach_invoice BOOLEAN DEFAULT FALSE,
    attach_receipt BOOLEAN DEFAULT FALSE,

    -- Trigger Conditions
    trigger_on VARCHAR(50), -- order_created, order_shipped, order_delivered, user_registered
    delay_minutes INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Preview
    preview_html TEXT,
    last_test_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, template_key)
);

-- ============================================================================
-- 8. MULTI-LANGUAGE & CURRENCY
-- ============================================================================

CREATE TABLE language_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    language_code VARCHAR(10) NOT NULL, -- th, en, zh
    language_name VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_enabled BOOLEAN DEFAULT TRUE,

    -- Translations (JSON object with keys)
    translations JSONB DEFAULT '{}',

    -- RTL Support
    is_rtl BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, language_code)
);

CREATE TABLE currency_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    currency_code VARCHAR(3) NOT NULL, -- THB, USD, EUR
    currency_name VARCHAR(50) NOT NULL,
    currency_symbol VARCHAR(10) NOT NULL, -- ฿, $, €

    -- Position
    symbol_position VARCHAR(20) DEFAULT 'before', -- before, after

    -- Exchange Rate (relative to base currency THB)
    exchange_rate DECIMAL(18, 6) DEFAULT 1.000000,

    -- Auto Update Exchange Rate
    auto_update_rate BOOLEAN DEFAULT FALSE,
    last_rate_update TIMESTAMPTZ,

    -- Formatting
    decimal_places INTEGER DEFAULT 2,
    thousands_separator VARCHAR(5) DEFAULT ',',
    decimal_separator VARCHAR(5) DEFAULT '.',

    -- Status
    is_default BOOLEAN DEFAULT FALSE,
    is_enabled BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, currency_code)
);

-- ============================================================================
-- 9. AUTOMATION & INTEGRATIONS
-- ============================================================================

CREATE TABLE automation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Backup Settings
    auto_backup_enabled BOOLEAN DEFAULT FALSE,
    backup_frequency VARCHAR(20) DEFAULT 'daily', -- hourly, daily, weekly, monthly
    backup_time TIME DEFAULT '02:00:00',
    backup_retention_days INTEGER DEFAULT 30,
    backup_location VARCHAR(200), -- S3, Google Drive, etc.

    -- Data Retention
    archive_old_orders_enabled BOOLEAN DEFAULT FALSE,
    archive_after_days INTEGER DEFAULT 365,

    -- Auto-sync
    auto_sync_inventory BOOLEAN DEFAULT FALSE,
    sync_interval_minutes INTEGER DEFAULT 30,

    -- Notifications
    notify_on_backup_success BOOLEAN DEFAULT FALSE,
    notify_on_backup_failure BOOLEAN DEFAULT TRUE,
    notification_emails JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE integration_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    integration_type VARCHAR(50) NOT NULL, -- line, facebook, shopee, lazada, tiktok
    integration_name VARCHAR(100) NOT NULL,

    -- Webhook Configuration
    webhook_url TEXT,
    webhook_secret VARCHAR(200),
    webhook_events JSONB DEFAULT '[]', -- Array of events to listen to

    -- API Keys
    api_key VARCHAR(200),
    api_secret VARCHAR(200),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Settings (JSON for flexibility)
    settings JSONB DEFAULT '{}',

    -- Sync Settings
    sync_products BOOLEAN DEFAULT FALSE,
    sync_orders BOOLEAN DEFAULT FALSE,
    sync_inventory BOOLEAN DEFAULT FALSE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, integration_type)
);

-- ============================================================================
-- 10. AI AGENT SYSTEM
-- ============================================================================

CREATE TABLE ai_agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,

    -- Conversation Details
    session_id VARCHAR(100) NOT NULL,
    conversation_title VARCHAR(200),

    -- Messages (Array of message objects)
    messages JSONB DEFAULT '[]',

    -- Context
    context_type VARCHAR(50), -- product_inquiry, order_status, general_help
    context_data JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, resolved, escalated
    resolved_at TIMESTAMPTZ,

    -- AI Model Info
    model_used VARCHAR(50) DEFAULT 'gpt-4',
    total_tokens_used INTEGER DEFAULT 0,

    -- Sentiment Analysis
    sentiment VARCHAR(20), -- positive, neutral, negative
    satisfaction_rating INTEGER, -- 1-5

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_conversations_session ON ai_agent_conversations(session_id);
CREATE INDEX idx_ai_conversations_tenant ON ai_agent_conversations(tenant_id);
CREATE INDEX idx_ai_conversations_status ON ai_agent_conversations(status);

-- AI Agent Settings
CREATE TABLE ai_agent_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Enable/Disable
    is_enabled BOOLEAN DEFAULT TRUE,

    -- Appearance
    widget_position VARCHAR(20) DEFAULT 'bottom-right', -- bottom-right, bottom-left
    widget_color VARCHAR(7) DEFAULT '#3B82F6',
    greeting_message TEXT DEFAULT 'สวัสดีครับ! มีอะไรให้ช่วยไหมครับ?',

    -- Behavior
    auto_open_after_seconds INTEGER DEFAULT 0, -- 0 = disabled
    show_on_pages JSONB DEFAULT '["all"]',
    hide_on_pages JSONB DEFAULT '[]',

    -- Business Hours
    business_hours_enabled BOOLEAN DEFAULT FALSE,
    business_hours JSONB DEFAULT '{}',
    offline_message TEXT DEFAULT 'ขณะนี้อยู่นอกเวลาทำการ กรุณาฝากข้อความไว้',

    -- AI Configuration
    ai_provider VARCHAR(50) DEFAULT 'openai', -- openai, anthropic, google
    ai_model VARCHAR(50) DEFAULT 'gpt-4',
    api_key VARCHAR(200),
    max_tokens INTEGER DEFAULT 1000,
    temperature DECIMAL(3, 2) DEFAULT 0.7,

    -- Knowledge Base
    knowledge_base_enabled BOOLEAN DEFAULT TRUE,
    knowledge_sources JSONB DEFAULT '[]', -- Array of URLs or document IDs

    -- Escalation
    escalate_to_human BOOLEAN DEFAULT TRUE,
    escalation_keywords JSONB DEFAULT '["พูดคุยกับคน", "ติดต่อเจ้าหน้าที่"]',

    -- Analytics
    collect_analytics BOOLEAN DEFAULT TRUE,
    track_user_satisfaction BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_storefront_tenant ON storefront_customization(tenant_id);
CREATE INDEX idx_tax_rules_tenant ON tax_rules(tenant_id);
CREATE INDEX idx_tax_rules_active ON tax_rules(is_active);
CREATE INDEX idx_order_settings_tenant ON order_number_settings(tenant_id);
CREATE INDEX idx_invoice_settings_tenant ON invoice_settings(tenant_id);
CREATE INDEX idx_shipping_zones_tenant ON shipping_zones(tenant_id);
CREATE INDEX idx_shipping_providers_tenant ON shipping_providers(tenant_id);
CREATE INDEX idx_product_settings_tenant ON product_display_settings(tenant_id);
CREATE INDEX idx_email_templates_tenant ON email_template_customizations(tenant_id);
CREATE INDEX idx_email_templates_key ON email_template_customizations(template_key);
CREATE INDEX idx_languages_tenant ON language_settings(tenant_id);
CREATE INDEX idx_currencies_tenant ON currency_settings(tenant_id);
CREATE INDEX idx_automation_tenant ON automation_settings(tenant_id);
CREATE INDEX idx_integrations_tenant ON integration_configs(tenant_id);
CREATE INDEX idx_integrations_type ON integration_configs(integration_type);
CREATE INDEX idx_ai_settings_tenant ON ai_agent_settings(tenant_id);

-- ============================================================================
-- DEFAULT DATA FOR DEMO
-- ============================================================================

-- Insert default storefront customization
INSERT INTO storefront_customization (tenant_id, hero_title, hero_subtitle, welcome_message)
SELECT id, 'ยินดีต้อนรับสู่ Omni Sales', 'ระบบจัดการร้านค้าออนไลน์ที่ครบครัน', 'เลือกซื้อสินค้าคุณภาพดี ส่งไว ราคาถูก'
FROM tenants
WHERE name = 'Demo Store'
LIMIT 1;

-- Insert default tax rule (VAT 7%)
INSERT INTO tax_rules (tenant_id, name, description, tax_rate, is_default)
SELECT id, 'VAT 7%', 'ภาษีมูลค่าเพิ่ม 7%', 7.0000, TRUE
FROM tenants
WHERE name = 'Demo Store'
LIMIT 1;

-- Insert default order number settings
INSERT INTO order_number_settings (tenant_id, prefix, example_format)
SELECT id, 'ORD', 'ORD-2025-00000001'
FROM tenants
WHERE name = 'Demo Store'
LIMIT 1;

-- Insert default invoice settings
INSERT INTO invoice_settings (tenant_id, company_name, address, phone)
SELECT id, 'Omni Sales Co., Ltd.', '123 ถนนพระราม 4 กรุงเทพมหานคร 10110', '02-123-4567'
FROM tenants
WHERE name = 'Demo Store'
LIMIT 1;

-- Insert default shipping zones
INSERT INTO shipping_zones (tenant_id, zone_name, zone_type, locations, is_metro)
SELECT id, 'กรุงเทพและปริมณฑล', 'province',
    '["กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "สมุทรสาคร", "นครปฐม"]'::jsonb,
    TRUE
FROM tenants
WHERE name = 'Demo Store'
LIMIT 1;

-- Insert default shipping providers
INSERT INTO shipping_providers (tenant_id, provider_name, provider_code, base_cost, estimated_days_min, estimated_days_max)
SELECT id, 'Kerry Express', 'KERRY', 50.00, 1, 2
FROM tenants
WHERE name = 'Demo Store'
LIMIT 1;

INSERT INTO shipping_providers (tenant_id, provider_name, provider_code, base_cost, estimated_days_min, estimated_days_max)
SELECT id, 'Thailand Post', 'THPOST', 30.00, 3, 5
FROM tenants
WHERE name = 'Demo Store'
LIMIT 1;

-- Insert default product display settings
INSERT INTO product_display_settings (tenant_id)
SELECT id FROM tenants WHERE name = 'Demo Store' LIMIT 1;

-- Insert default email templates
INSERT INTO email_template_customizations (tenant_id, template_key, template_name, subject_th, body_html, trigger_on)
SELECT id, 'order_confirmation', 'ยืนยันคำสั่งซื้อ', 'ขอบคุณสำหรับคำสั่งซื้อ #{{order_number}}',
'<p>เรียน {{customer_name}}</p><p>ขอบคุณที่สั่งซื้อสินค้ากับเรา</p><p>หมายเลขคำสั่งซื้อ: {{order_number}}</p>',
'order_created'
FROM tenants WHERE name = 'Demo Store' LIMIT 1;

-- Insert default language settings
INSERT INTO language_settings (tenant_id, language_code, language_name, is_default)
SELECT id, 'th', 'ไทย', TRUE FROM tenants WHERE name = 'Demo Store' LIMIT 1;

INSERT INTO language_settings (tenant_id, language_code, language_name, is_default)
SELECT id, 'en', 'English', FALSE FROM tenants WHERE name = 'Demo Store' LIMIT 1;

-- Insert default currency settings
INSERT INTO currency_settings (tenant_id, currency_code, currency_name, currency_symbol, is_default)
SELECT id, 'THB', 'บาทไทย', '฿', TRUE FROM tenants WHERE name = 'Demo Store' LIMIT 1;

INSERT INTO currency_settings (tenant_id, currency_code, currency_name, currency_symbol, exchange_rate)
SELECT id, 'USD', 'US Dollar', '$', 0.028000 FROM tenants WHERE name = 'Demo Store' LIMIT 1;

-- Insert default automation settings
INSERT INTO automation_settings (tenant_id)
SELECT id FROM tenants WHERE name = 'Demo Store' LIMIT 1;

-- Insert default AI agent settings
INSERT INTO ai_agent_settings (tenant_id)
SELECT id FROM tenants WHERE name = 'Demo Store' LIMIT 1;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_storefront_customization_updated_at BEFORE UPDATE ON storefront_customization FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_rules_updated_at BEFORE UPDATE ON tax_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_number_settings_updated_at BEFORE UPDATE ON order_number_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_settings_updated_at BEFORE UPDATE ON invoice_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipping_zones_updated_at BEFORE UPDATE ON shipping_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipping_providers_updated_at BEFORE UPDATE ON shipping_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_display_settings_updated_at BEFORE UPDATE ON product_display_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_template_customizations_updated_at BEFORE UPDATE ON email_template_customizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_language_settings_updated_at BEFORE UPDATE ON language_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_currency_settings_updated_at BEFORE UPDATE ON currency_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_settings_updated_at BEFORE UPDATE ON automation_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integration_configs_updated_at BEFORE UPDATE ON integration_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_agent_conversations_updated_at BEFORE UPDATE ON ai_agent_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_agent_settings_updated_at BEFORE UPDATE ON ai_agent_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETED
-- ============================================================================

COMMENT ON TABLE storefront_customization IS 'Customizable storefront appearance and branding';
COMMENT ON TABLE tax_rules IS 'Flexible tax configuration for VAT and location-based taxes';
COMMENT ON TABLE order_number_settings IS 'Configurable order number formatting';
COMMENT ON TABLE invoice_settings IS 'Invoice and receipt configuration';
COMMENT ON TABLE shipping_zones IS 'Geographic shipping zones';
COMMENT ON TABLE shipping_providers IS 'Shipping provider configurations';
COMMENT ON TABLE product_display_settings IS 'Product display and catalog settings';
COMMENT ON TABLE email_template_customizations IS 'Customizable email templates';
COMMENT ON TABLE language_settings IS 'Multi-language support';
COMMENT ON TABLE currency_settings IS 'Multi-currency support';
COMMENT ON TABLE automation_settings IS 'Automation and backup settings';
COMMENT ON TABLE integration_configs IS 'Third-party integration configurations';
COMMENT ON TABLE ai_agent_conversations IS 'AI chatbot conversation history';
COMMENT ON TABLE ai_agent_settings IS 'AI agent configuration';
