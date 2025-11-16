import { createClient } from '@supabase/supabase-js';
import { tenantManager, TenantConfig } from './tenant-manager';

export interface BrandingConfig {
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  accentColor: string;
  companyName: string;
  customNavLabels: Record<string, string>;
  customPageTitles: Record<string, string>;
  customFonts: {
    heading: string;
    body: string;
  };
  removeBranding: boolean;
}

export interface EmailBranding {
  senderName: string;
  replyTo: string;
  customTemplates: boolean;
  footerText: string;
}

/**
 * Branding Service
 * Manages white-label branding for tenants
 */
export class BrandingService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    this.supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  }

  /**
   * Get tenant branding
   */
  public async getBranding(tenantId: string): Promise<BrandingConfig> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { data, error } = await supabase
      .from('tenants')
      .select('branding')
      .eq('id', tenantId)
      .single();

    if (error || !data) {
      throw new Error('Failed to fetch branding');
    }

    return data.branding as BrandingConfig;
  }

  /**
   * Update tenant branding
   */
  public async updateBranding(
    tenantId: string,
    branding: Partial<BrandingConfig>
  ): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Get current branding
    const current = await this.getBranding(tenantId);

    // Merge with new branding
    const updated = { ...current, ...branding };

    const { error } = await supabase
      .from('tenants')
      .update({ branding: updated })
      .eq('id', tenantId);

    if (error) {
      throw new Error(`Failed to update branding: ${error.message}`);
    }
  }

  /**
   * Upload logo
   */
  public async uploadLogo(
    tenantId: string,
    file: File
  ): Promise<string> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      throw new Error('File size must be less than 2MB');
    }

    // Upload to storage
    const fileName = `${tenantId}/logo-${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage
      .from('tenant-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload logo: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('tenant-assets')
      .getPublicUrl(data.path);

    // Update branding
    await this.updateBranding(tenantId, { logo: publicUrl });

    return publicUrl;
  }

  /**
   * Upload favicon
   */
  public async uploadFavicon(
    tenantId: string,
    file: File
  ): Promise<string> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Validate file
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    if (file.size > 512 * 1024) { // 512KB limit
      throw new Error('File size must be less than 512KB');
    }

    // Upload to storage
    const fileName = `${tenantId}/favicon-${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage
      .from('tenant-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload favicon: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('tenant-assets')
      .getPublicUrl(data.path);

    // Update branding
    await this.updateBranding(tenantId, { favicon: publicUrl });

    return publicUrl;
  }

  /**
   * Update color scheme
   */
  public async updateColors(
    tenantId: string,
    colors: {
      primaryColor?: string;
      accentColor?: string;
    }
  ): Promise<void> {
    // Validate colors
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    if (colors.primaryColor && !hexColorRegex.test(colors.primaryColor)) {
      throw new Error('Invalid primary color format. Use hex format (e.g., #3b82f6)');
    }

    if (colors.accentColor && !hexColorRegex.test(colors.accentColor)) {
      throw new Error('Invalid accent color format. Use hex format (e.g., #8b5cf6)');
    }

    await this.updateBranding(tenantId, colors);
  }

  /**
   * Update custom navigation labels
   */
  public async updateNavLabels(
    tenantId: string,
    labels: Record<string, string>
  ): Promise<void> {
    await this.updateBranding(tenantId, { customNavLabels: labels });
  }

  /**
   * Update custom page titles
   */
  public async updatePageTitles(
    tenantId: string,
    titles: Record<string, string>
  ): Promise<void> {
    await this.updateBranding(tenantId, { customPageTitles: titles });
  }

  /**
   * Update custom fonts
   */
  public async updateFonts(
    tenantId: string,
    fonts: {
      heading?: string;
      body?: string;
    }
  ): Promise<void> {
    const current = await this.getBranding(tenantId);
    const updatedFonts = { ...current.customFonts, ...fonts };

    await this.updateBranding(tenantId, { customFonts: updatedFonts });
  }

  /**
   * Toggle "Powered by" branding
   */
  public async togglePoweredByBranding(
    tenantId: string,
    remove: boolean
  ): Promise<void> {
    // Check if tenant has white-label feature
    const tenant = tenantManager.getTenant();
    if (!tenant?.features.whiteLabel && remove) {
      throw new Error('White-label feature not available in your plan');
    }

    await this.updateBranding(tenantId, { removeBranding: remove });
  }

  /**
   * Get email branding
   */
  public async getEmailBranding(tenantId: string): Promise<EmailBranding> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { data, error } = await supabase
      .from('tenants')
      .select('email_branding')
      .eq('id', tenantId)
      .single();

    if (error || !data) {
      throw new Error('Failed to fetch email branding');
    }

    return data.email_branding as EmailBranding;
  }

  /**
   * Update email branding
   */
  public async updateEmailBranding(
    tenantId: string,
    emailBranding: Partial<EmailBranding>
  ): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    // Get current email branding
    const current = await this.getEmailBranding(tenantId);

    // Merge with new branding
    const updated = { ...current, ...emailBranding };

    const { error } = await supabase
      .from('tenants')
      .update({ email_branding: updated })
      .eq('id', tenantId);

    if (error) {
      throw new Error(`Failed to update email branding: ${error.message}`);
    }
  }

  /**
   * Generate CSS variables from branding
   */
  public generateCSSVariables(branding: BrandingConfig): string {
    return `
      :root {
        --brand-primary: ${branding.primaryColor};
        --brand-accent: ${branding.accentColor};
        --font-heading: ${branding.customFonts.heading}, sans-serif;
        --font-body: ${branding.customFonts.body}, sans-serif;
      }
    `;
  }

  /**
   * Generate branded email template
   */
  public generateEmailTemplate(
    emailBranding: EmailBranding,
    branding: BrandingConfig,
    content: string
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: ${branding.customFonts.body}, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid ${branding.primaryColor};
    }
    .header img {
      max-width: 200px;
      height: auto;
    }
    .content {
      padding: 30px 0;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
    }
    .button {
      background-color: ${branding.primaryColor};
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="header">
    ${branding.logo ? `<img src="${branding.logo}" alt="${branding.companyName}">` : `<h1>${branding.companyName}</h1>`}
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>${emailBranding.footerText}</p>
    ${!branding.removeBranding ? '<p style="margin-top: 10px;"><small>Powered by Omni-Sales</small></p>' : ''}
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Reset branding to defaults
   */
  public async resetBranding(tenantId: string): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const defaultBranding: BrandingConfig = {
      logo: null,
      favicon: null,
      primaryColor: '#3b82f6',
      accentColor: '#8b5cf6',
      companyName: tenant.name,
      customNavLabels: {},
      customPageTitles: {},
      customFonts: {
        heading: 'Inter',
        body: 'Inter',
      },
      removeBranding: false,
    };

    await this.updateBranding(tenantId, defaultBranding);
  }
}

// Export singleton instance
export const brandingService = new BrandingService();
