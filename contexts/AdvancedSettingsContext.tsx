'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface StorefrontCustomization {
  // Colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  button_color: string;
  button_hover_color: string;
  link_color: string;
  success_color: string;
  error_color: string;

  // Typography
  font_family: string;
  heading_font: string;
  body_font: string;
  font_size_base: number;

  // Banner & Hero
  hero_banner_url?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_cta_text: string;
  hero_cta_link: string;

  // Messages
  welcome_message?: string;
  promotion_banner?: string;
  announcement_text?: string;
  announcement_enabled: boolean;
  announcement_type: 'info' | 'warning' | 'success';

  // Footer
  footer_text?: string;
  footer_links: Array<{ label: string; url: string }>;

  // Social Media
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  line_url?: string;
  tiktok_url?: string;

  // SEO
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;

  // Custom Code
  custom_css?: string;
  custom_js?: string;
}

export interface TaxRule {
  id: string;
  name: string;
  description?: string;
  tax_type: 'percentage' | 'fixed';
  tax_rate: number;
  apply_to: 'all' | 'category' | 'product' | 'location';
  category_ids: string[];
  product_ids: string[];
  provinces: string[];
  is_active: boolean;
  is_default: boolean;
  priority: number;
}

export interface OrderNumberSettings {
  prefix: string;
  suffix?: string;
  padding: number;
  separator: string;
  include_year: boolean;
  include_month: boolean;
  include_day: boolean;
  date_format: string;
  current_counter: number;
  reset_counter: 'never' | 'yearly' | 'monthly' | 'daily';
  example_format: string;
}

export interface OrderStatusCustom {
  id: string;
  status_key: string;
  status_label_th: string;
  status_label_en: string;
  status_color: string;
  status_icon?: string;
  display_order: number;
  is_active: boolean;
  can_transition_to: string[];
  notify_customer: boolean;
  notify_admin: boolean;
}

export interface InvoiceSettings {
  company_name: string;
  company_name_en?: string;
  tax_id?: string;
  branch?: string;
  address: string;
  address_en?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  logo_width: number;
  logo_height: number;
  invoice_prefix: string;
  receipt_prefix: string;
  quotation_prefix: string;
  terms_and_conditions?: string;
  payment_terms: string;
  notes?: string;
  footer_text?: string;
  bank_details?: string;
  tax_invoice_text: string;
  tax_receipt_number?: string;
  show_tax_breakdown: boolean;
  show_payment_method: boolean;
  show_shipping_cost: boolean;
  show_discount: boolean;
  default_language: string;
  show_bilingual: boolean;
}

export interface ShippingZone {
  id: string;
  zone_name: string;
  description?: string;
  zone_type: 'province' | 'city' | 'postal_code' | 'country';
  locations: string[];
  is_metro: boolean;
  is_remote: boolean;
  is_active: boolean;
}

export interface ShippingProvider {
  id: string;
  provider_name: string;
  provider_code: string;
  pricing_type: 'flat' | 'weight-based' | 'zone-based' | 'weight-zone';
  base_cost: number;
  cost_per_kg: number;
  free_shipping_threshold: number;
  zone_pricing: Record<string, number>;
  weight_zone_pricing: Record<string, any>;
  estimated_days_min: number;
  estimated_days_max: number;
  tracking_url_template?: string;
  supports_cod: boolean;
  api_enabled: boolean;
  api_key?: string;
  api_endpoint?: string;
  display_order: number;
  icon_url?: string;
  is_active: boolean;
}

export interface ProductDisplaySettings {
  products_per_page: number;
  grid_columns_desktop: number;
  grid_columns_tablet: number;
  grid_columns_mobile: number;
  default_sort: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'name_asc';
  show_quick_view: boolean;
  show_add_to_cart: boolean;
  show_wishlist: boolean;
  show_compare: boolean;
  show_rating: boolean;
  show_stock_status: boolean;
  show_out_of_stock: boolean;
  out_of_stock_message: string;
  allow_backorder: boolean;
  sku_prefix: string;
  sku_auto_generate: boolean;
  sku_format: string;
  image_aspect_ratio: string;
  enable_image_zoom: boolean;
  enable_image_gallery: boolean;
  enable_price_filter: boolean;
  enable_category_filter: boolean;
  enable_brand_filter: boolean;
  enable_color_filter: boolean;
  enable_size_filter: boolean;
}

export interface EmailTemplateCustomization {
  id: string;
  template_key: string;
  template_name: string;
  subject_th: string;
  subject_en?: string;
  body_html: string;
  body_text?: string;
  available_variables: string[];
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  cc_emails: string[];
  bcc_emails: string[];
  attach_invoice: boolean;
  attach_receipt: boolean;
  trigger_on: string;
  delay_minutes: number;
  is_active: boolean;
}

export interface LanguageSetting {
  id: string;
  language_code: string;
  language_name: string;
  is_default: boolean;
  is_enabled: boolean;
  translations: Record<string, string>;
  is_rtl: boolean;
}

export interface CurrencySetting {
  id: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  symbol_position: 'before' | 'after';
  exchange_rate: number;
  auto_update_rate: boolean;
  last_rate_update?: string;
  decimal_places: number;
  thousands_separator: string;
  decimal_separator: string;
  is_default: boolean;
  is_enabled: boolean;
}

export interface AutomationSettings {
  auto_backup_enabled: boolean;
  backup_frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  backup_time: string;
  backup_retention_days: number;
  backup_location?: string;
  archive_old_orders_enabled: boolean;
  archive_after_days: number;
  auto_sync_inventory: boolean;
  sync_interval_minutes: number;
  notify_on_backup_success: boolean;
  notify_on_backup_failure: boolean;
  notification_emails: string[];
}

export interface IntegrationConfig {
  id: string;
  integration_type: 'line' | 'facebook' | 'shopee' | 'lazada' | 'tiktok';
  integration_name: string;
  webhook_url?: string;
  webhook_secret?: string;
  webhook_events: string[];
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  settings: Record<string, any>;
  sync_products: boolean;
  sync_orders: boolean;
  sync_inventory: boolean;
  is_active: boolean;
  last_sync_at?: string;
  last_error?: string;
}

export interface AIAgentSettings {
  is_enabled: boolean;
  widget_position: 'bottom-right' | 'bottom-left';
  widget_color: string;
  greeting_message: string;
  auto_open_after_seconds: number;
  show_on_pages: string[];
  hide_on_pages: string[];
  business_hours_enabled: boolean;
  business_hours: Record<string, any>;
  offline_message: string;
  ai_provider: 'openai' | 'anthropic' | 'google';
  ai_model: string;
  api_key?: string;
  max_tokens: number;
  temperature: number;
  knowledge_base_enabled: boolean;
  knowledge_sources: string[];
  escalate_to_human: boolean;
  escalation_keywords: string[];
  collect_analytics: boolean;
  track_user_satisfaction: boolean;
}

// ============================================================================
// CONTEXT DEFINITION
// ============================================================================

interface AdvancedSettingsState {
  storefront: StorefrontCustomization;
  taxRules: TaxRule[];
  orderNumberSettings: OrderNumberSettings;
  orderStatuses: OrderStatusCustom[];
  invoiceSettings: InvoiceSettings;
  shippingZones: ShippingZone[];
  shippingProviders: ShippingProvider[];
  productSettings: ProductDisplaySettings;
  emailTemplates: EmailTemplateCustomization[];
  languages: LanguageSetting[];
  currencies: CurrencySetting[];
  automation: AutomationSettings;
  integrations: IntegrationConfig[];
  aiAgent: AIAgentSettings;
}

interface AdvancedSettingsContextType {
  settings: AdvancedSettingsState;
  loading: boolean;

  // Storefront
  updateStorefront: (data: Partial<StorefrontCustomization>) => Promise<void>;

  // Tax
  addTaxRule: (rule: Omit<TaxRule, 'id'>) => Promise<void>;
  updateTaxRule: (id: string, data: Partial<TaxRule>) => Promise<void>;
  deleteTaxRule: (id: string) => Promise<void>;

  // Order
  updateOrderNumberSettings: (data: Partial<OrderNumberSettings>) => Promise<void>;
  addOrderStatus: (status: Omit<OrderStatusCustom, 'id'>) => Promise<void>;
  updateOrderStatus: (id: string, data: Partial<OrderStatusCustom>) => Promise<void>;
  deleteOrderStatus: (id: string) => Promise<void>;

  // Invoice
  updateInvoiceSettings: (data: Partial<InvoiceSettings>) => Promise<void>;

  // Shipping
  addShippingZone: (zone: Omit<ShippingZone, 'id'>) => Promise<void>;
  updateShippingZone: (id: string, data: Partial<ShippingZone>) => Promise<void>;
  deleteShippingZone: (id: string) => Promise<void>;
  addShippingProvider: (provider: Omit<ShippingProvider, 'id'>) => Promise<void>;
  updateShippingProvider: (id: string, data: Partial<ShippingProvider>) => Promise<void>;
  deleteShippingProvider: (id: string) => Promise<void>;

  // Product
  updateProductSettings: (data: Partial<ProductDisplaySettings>) => Promise<void>;

  // Email
  addEmailTemplate: (template: Omit<EmailTemplateCustomization, 'id'>) => Promise<void>;
  updateEmailTemplate: (id: string, data: Partial<EmailTemplateCustomization>) => Promise<void>;
  deleteEmailTemplate: (id: string) => Promise<void>;

  // Language & Currency
  addLanguage: (language: Omit<LanguageSetting, 'id'>) => Promise<void>;
  updateLanguage: (id: string, data: Partial<LanguageSetting>) => Promise<void>;
  deleteLanguage: (id: string) => Promise<void>;
  addCurrency: (currency: Omit<CurrencySetting, 'id'>) => Promise<void>;
  updateCurrency: (id: string, data: Partial<CurrencySetting>) => Promise<void>;
  deleteCurrency: (id: string) => Promise<void>;

  // Automation
  updateAutomationSettings: (data: Partial<AutomationSettings>) => Promise<void>;

  // Integrations
  addIntegration: (integration: Omit<IntegrationConfig, 'id'>) => Promise<void>;
  updateIntegration: (id: string, data: Partial<IntegrationConfig>) => Promise<void>;
  deleteIntegration: (id: string) => Promise<void>;

  // AI Agent
  updateAIAgentSettings: (data: Partial<AIAgentSettings>) => Promise<void>;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultSettings: AdvancedSettingsState = {
  storefront: {
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    accent_color: '#F59E0B',
    button_color: '#3B82F6',
    button_hover_color: '#2563EB',
    link_color: '#3B82F6',
    success_color: '#10B981',
    error_color: '#EF4444',
    font_family: 'Inter, system-ui, sans-serif',
    heading_font: 'Inter, system-ui, sans-serif',
    body_font: 'Inter, system-ui, sans-serif',
    font_size_base: 16,
    hero_cta_text: 'Shop Now',
    hero_cta_link: '/products',
    announcement_enabled: false,
    announcement_type: 'info',
    footer_links: [],
  },
  taxRules: [
    {
      id: '1',
      name: 'VAT 7%',
      description: 'ภาษีมูลค่าเพิ่ม 7%',
      tax_type: 'percentage',
      tax_rate: 7.0,
      apply_to: 'all',
      category_ids: [],
      product_ids: [],
      provinces: [],
      is_active: true,
      is_default: true,
      priority: 0,
    },
  ],
  orderNumberSettings: {
    prefix: 'ORD',
    padding: 8,
    separator: '-',
    include_year: true,
    include_month: false,
    include_day: false,
    date_format: 'YYYY',
    current_counter: 0,
    reset_counter: 'never',
    example_format: 'ORD-2025-00000001',
  },
  orderStatuses: [],
  invoiceSettings: {
    company_name: 'Omni Sales Co., Ltd.',
    address: '123 ถนนพระราม 4 กรุงเทพมหานคร 10110',
    phone: '02-123-4567',
    logo_width: 150,
    logo_height: 50,
    invoice_prefix: 'INV',
    receipt_prefix: 'REC',
    quotation_prefix: 'QUO',
    payment_terms: 'Payment due within 30 days',
    tax_invoice_text: 'ใบกำกับภาษี / Tax Invoice',
    show_tax_breakdown: true,
    show_payment_method: true,
    show_shipping_cost: true,
    show_discount: true,
    default_language: 'th',
    show_bilingual: false,
  },
  shippingZones: [],
  shippingProviders: [],
  productSettings: {
    products_per_page: 20,
    grid_columns_desktop: 4,
    grid_columns_tablet: 3,
    grid_columns_mobile: 2,
    default_sort: 'newest',
    show_quick_view: true,
    show_add_to_cart: true,
    show_wishlist: true,
    show_compare: false,
    show_rating: true,
    show_stock_status: true,
    show_out_of_stock: true,
    out_of_stock_message: 'สินค้าหมด',
    allow_backorder: false,
    sku_prefix: 'SKU',
    sku_auto_generate: true,
    sku_format: 'PREFIX-RANDOM8',
    image_aspect_ratio: '1:1',
    enable_image_zoom: true,
    enable_image_gallery: true,
    enable_price_filter: true,
    enable_category_filter: true,
    enable_brand_filter: true,
    enable_color_filter: false,
    enable_size_filter: false,
  },
  emailTemplates: [],
  languages: [
    {
      id: '1',
      language_code: 'th',
      language_name: 'ไทย',
      is_default: true,
      is_enabled: true,
      translations: {},
      is_rtl: false,
    },
    {
      id: '2',
      language_code: 'en',
      language_name: 'English',
      is_default: false,
      is_enabled: true,
      translations: {},
      is_rtl: false,
    },
  ],
  currencies: [
    {
      id: '1',
      currency_code: 'THB',
      currency_name: 'บาทไทย',
      currency_symbol: '฿',
      symbol_position: 'before',
      exchange_rate: 1.0,
      auto_update_rate: false,
      decimal_places: 2,
      thousands_separator: ',',
      decimal_separator: '.',
      is_default: true,
      is_enabled: true,
    },
  ],
  automation: {
    auto_backup_enabled: false,
    backup_frequency: 'daily',
    backup_time: '02:00:00',
    backup_retention_days: 30,
    archive_old_orders_enabled: false,
    archive_after_days: 365,
    auto_sync_inventory: false,
    sync_interval_minutes: 30,
    notify_on_backup_success: false,
    notify_on_backup_failure: true,
    notification_emails: [],
  },
  integrations: [],
  aiAgent: {
    is_enabled: true,
    widget_position: 'bottom-right',
    widget_color: '#3B82F6',
    greeting_message: 'สวัสดีครับ! มีอะไรให้ช่วยไหมครับ?',
    auto_open_after_seconds: 0,
    show_on_pages: ['all'],
    hide_on_pages: [],
    business_hours_enabled: false,
    business_hours: {},
    offline_message: 'ขณะนี้อยู่นอกเวลาทำการ กรุณาฝากข้อความไว้',
    ai_provider: 'openai',
    ai_model: 'gpt-4',
    max_tokens: 1000,
    temperature: 0.7,
    knowledge_base_enabled: true,
    knowledge_sources: [],
    escalate_to_human: true,
    escalation_keywords: ['พูดคุยกับคน', 'ติดต่อเจ้าหน้าที่'],
    collect_analytics: true,
    track_user_satisfaction: true,
  },
};

const AdvancedSettingsContext = createContext<AdvancedSettingsContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function AdvancedSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AdvancedSettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage or API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try to load from localStorage first
        const stored = localStorage.getItem('omni-sales-advanced-settings');
        if (stored) {
          setSettings(JSON.parse(stored));
        }

        // TODO: Load from API
        // const response = await fetch('/api/admin/settings/advanced');
        // const data = await response.json();
        // setSettings(data);
      } catch (error) {
        console.error('Error loading advanced settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings helper
  const saveSettings = (newSettings: AdvancedSettingsState) => {
    try {
      localStorage.setItem('omni-sales-advanced-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  // Storefront
  const updateStorefront = async (data: Partial<StorefrontCustomization>) => {
    const newSettings = {
      ...settings,
      storefront: { ...settings.storefront, ...data },
    };
    saveSettings(newSettings);
  };

  // Tax Rules
  const addTaxRule = async (rule: Omit<TaxRule, 'id'>) => {
    const newRule: TaxRule = { ...rule, id: Date.now().toString() };
    const newSettings = {
      ...settings,
      taxRules: [...settings.taxRules, newRule],
    };
    saveSettings(newSettings);
  };

  const updateTaxRule = async (id: string, data: Partial<TaxRule>) => {
    const newSettings = {
      ...settings,
      taxRules: settings.taxRules.map((rule) =>
        rule.id === id ? { ...rule, ...data } : rule
      ),
    };
    saveSettings(newSettings);
  };

  const deleteTaxRule = async (id: string) => {
    const newSettings = {
      ...settings,
      taxRules: settings.taxRules.filter((rule) => rule.id !== id),
    };
    saveSettings(newSettings);
  };

  // Order Settings
  const updateOrderNumberSettings = async (data: Partial<OrderNumberSettings>) => {
    const newSettings = {
      ...settings,
      orderNumberSettings: { ...settings.orderNumberSettings, ...data },
    };
    saveSettings(newSettings);
  };

  const addOrderStatus = async (status: Omit<OrderStatusCustom, 'id'>) => {
    const newStatus: OrderStatusCustom = { ...status, id: Date.now().toString() };
    const newSettings = {
      ...settings,
      orderStatuses: [...settings.orderStatuses, newStatus],
    };
    saveSettings(newSettings);
  };

  const updateOrderStatus = async (id: string, data: Partial<OrderStatusCustom>) => {
    const newSettings = {
      ...settings,
      orderStatuses: settings.orderStatuses.map((status) =>
        status.id === id ? { ...status, ...data } : status
      ),
    };
    saveSettings(newSettings);
  };

  const deleteOrderStatus = async (id: string) => {
    const newSettings = {
      ...settings,
      orderStatuses: settings.orderStatuses.filter((status) => status.id !== id),
    };
    saveSettings(newSettings);
  };

  // Invoice Settings
  const updateInvoiceSettings = async (data: Partial<InvoiceSettings>) => {
    const newSettings = {
      ...settings,
      invoiceSettings: { ...settings.invoiceSettings, ...data },
    };
    saveSettings(newSettings);
  };

  // Shipping Zones
  const addShippingZone = async (zone: Omit<ShippingZone, 'id'>) => {
    const newZone: ShippingZone = { ...zone, id: Date.now().toString() };
    const newSettings = {
      ...settings,
      shippingZones: [...settings.shippingZones, newZone],
    };
    saveSettings(newSettings);
  };

  const updateShippingZone = async (id: string, data: Partial<ShippingZone>) => {
    const newSettings = {
      ...settings,
      shippingZones: settings.shippingZones.map((zone) =>
        zone.id === id ? { ...zone, ...data } : zone
      ),
    };
    saveSettings(newSettings);
  };

  const deleteShippingZone = async (id: string) => {
    const newSettings = {
      ...settings,
      shippingZones: settings.shippingZones.filter((zone) => zone.id !== id),
    };
    saveSettings(newSettings);
  };

  // Shipping Providers
  const addShippingProvider = async (provider: Omit<ShippingProvider, 'id'>) => {
    const newProvider: ShippingProvider = { ...provider, id: Date.now().toString() };
    const newSettings = {
      ...settings,
      shippingProviders: [...settings.shippingProviders, newProvider],
    };
    saveSettings(newSettings);
  };

  const updateShippingProvider = async (id: string, data: Partial<ShippingProvider>) => {
    const newSettings = {
      ...settings,
      shippingProviders: settings.shippingProviders.map((provider) =>
        provider.id === id ? { ...provider, ...data } : provider
      ),
    };
    saveSettings(newSettings);
  };

  const deleteShippingProvider = async (id: string) => {
    const newSettings = {
      ...settings,
      shippingProviders: settings.shippingProviders.filter((provider) => provider.id !== id),
    };
    saveSettings(newSettings);
  };

  // Product Settings
  const updateProductSettings = async (data: Partial<ProductDisplaySettings>) => {
    const newSettings = {
      ...settings,
      productSettings: { ...settings.productSettings, ...data },
    };
    saveSettings(newSettings);
  };

  // Email Templates
  const addEmailTemplate = async (template: Omit<EmailTemplateCustomization, 'id'>) => {
    const newTemplate: EmailTemplateCustomization = { ...template, id: Date.now().toString() };
    const newSettings = {
      ...settings,
      emailTemplates: [...settings.emailTemplates, newTemplate],
    };
    saveSettings(newSettings);
  };

  const updateEmailTemplate = async (id: string, data: Partial<EmailTemplateCustomization>) => {
    const newSettings = {
      ...settings,
      emailTemplates: settings.emailTemplates.map((template) =>
        template.id === id ? { ...template, ...data } : template
      ),
    };
    saveSettings(newSettings);
  };

  const deleteEmailTemplate = async (id: string) => {
    const newSettings = {
      ...settings,
      emailTemplates: settings.emailTemplates.filter((template) => template.id !== id),
    };
    saveSettings(newSettings);
  };

  // Languages
  const addLanguage = async (language: Omit<LanguageSetting, 'id'>) => {
    const newLanguage: LanguageSetting = { ...language, id: Date.now().toString() };
    const newSettings = {
      ...settings,
      languages: [...settings.languages, newLanguage],
    };
    saveSettings(newSettings);
  };

  const updateLanguage = async (id: string, data: Partial<LanguageSetting>) => {
    const newSettings = {
      ...settings,
      languages: settings.languages.map((lang) =>
        lang.id === id ? { ...lang, ...data } : lang
      ),
    };
    saveSettings(newSettings);
  };

  const deleteLanguage = async (id: string) => {
    const newSettings = {
      ...settings,
      languages: settings.languages.filter((lang) => lang.id !== id),
    };
    saveSettings(newSettings);
  };

  // Currencies
  const addCurrency = async (currency: Omit<CurrencySetting, 'id'>) => {
    const newCurrency: CurrencySetting = { ...currency, id: Date.now().toString() };
    const newSettings = {
      ...settings,
      currencies: [...settings.currencies, newCurrency],
    };
    saveSettings(newSettings);
  };

  const updateCurrency = async (id: string, data: Partial<CurrencySetting>) => {
    const newSettings = {
      ...settings,
      currencies: settings.currencies.map((curr) =>
        curr.id === id ? { ...curr, ...data } : curr
      ),
    };
    saveSettings(newSettings);
  };

  const deleteCurrency = async (id: string) => {
    const newSettings = {
      ...settings,
      currencies: settings.currencies.filter((curr) => curr.id !== id),
    };
    saveSettings(newSettings);
  };

  // Automation
  const updateAutomationSettings = async (data: Partial<AutomationSettings>) => {
    const newSettings = {
      ...settings,
      automation: { ...settings.automation, ...data },
    };
    saveSettings(newSettings);
  };

  // Integrations
  const addIntegration = async (integration: Omit<IntegrationConfig, 'id'>) => {
    const newIntegration: IntegrationConfig = { ...integration, id: Date.now().toString() };
    const newSettings = {
      ...settings,
      integrations: [...settings.integrations, newIntegration],
    };
    saveSettings(newSettings);
  };

  const updateIntegration = async (id: string, data: Partial<IntegrationConfig>) => {
    const newSettings = {
      ...settings,
      integrations: settings.integrations.map((integration) =>
        integration.id === id ? { ...integration, ...data } : integration
      ),
    };
    saveSettings(newSettings);
  };

  const deleteIntegration = async (id: string) => {
    const newSettings = {
      ...settings,
      integrations: settings.integrations.filter((integration) => integration.id !== id),
    };
    saveSettings(newSettings);
  };

  // AI Agent
  const updateAIAgentSettings = async (data: Partial<AIAgentSettings>) => {
    const newSettings = {
      ...settings,
      aiAgent: { ...settings.aiAgent, ...data },
    };
    saveSettings(newSettings);
  };

  return (
    <AdvancedSettingsContext.Provider
      value={{
        settings,
        loading,
        updateStorefront,
        addTaxRule,
        updateTaxRule,
        deleteTaxRule,
        updateOrderNumberSettings,
        addOrderStatus,
        updateOrderStatus,
        deleteOrderStatus,
        updateInvoiceSettings,
        addShippingZone,
        updateShippingZone,
        deleteShippingZone,
        addShippingProvider,
        updateShippingProvider,
        deleteShippingProvider,
        updateProductSettings,
        addEmailTemplate,
        updateEmailTemplate,
        deleteEmailTemplate,
        addLanguage,
        updateLanguage,
        deleteLanguage,
        addCurrency,
        updateCurrency,
        deleteCurrency,
        updateAutomationSettings,
        addIntegration,
        updateIntegration,
        deleteIntegration,
        updateAIAgentSettings,
      }}
    >
      {children}
    </AdvancedSettingsContext.Provider>
  );
}

export function useAdvancedSettings() {
  const context = useContext(AdvancedSettingsContext);
  if (context === undefined) {
    throw new Error('useAdvancedSettings must be used within an AdvancedSettingsProvider');
  }
  return context;
}
