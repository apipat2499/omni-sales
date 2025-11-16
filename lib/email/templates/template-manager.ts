import { createClient } from '@supabase/supabase-js';

export interface EmailTemplate {
  id?: string;
  user_id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables?: string[]; // e.g., ['customer_name', 'order_id']
  category?: string; // 'transactional', 'marketing', 'notification'
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TemplateRenderParams {
  templateId?: string;
  templateName?: string;
  variables: Record<string, any>;
}

export class EmailTemplateManager {
  private supabase: any;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  /**
   * Create a new email template
   */
  async createTemplate(template: EmailTemplate): Promise<EmailTemplate | null> {
    if (!this.supabase) return null;

    try {
      // Extract variables from template content
      const variables = this.extractVariables(template.html_content);

      const { data, error } = await this.supabase
        .from('email_templates')
        .insert([
          {
            ...template,
            variables,
            is_active: template.is_active !== undefined ? template.is_active : true,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      return null;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(id: string): Promise<EmailTemplate | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting template:', error);
      return null;
    }
  }

  /**
   * Get template by name
   */
  async getTemplateByName(name: string, userId: string): Promise<EmailTemplate | null> {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('email_templates')
        .select('*')
        .eq('name', name)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting template by name:', error);
      return null;
    }
  }

  /**
   * List all templates for a user
   */
  async listTemplates(userId: string, category?: string): Promise<EmailTemplate[]> {
    if (!this.supabase) return [];

    try {
      let query = this.supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', userId);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error listing templates:', error);
      return [];
    }
  }

  /**
   * Update a template
   */
  async updateTemplate(
    id: string,
    userId: string,
    updates: Partial<EmailTemplate>
  ): Promise<EmailTemplate | null> {
    if (!this.supabase) return null;

    try {
      // Extract variables if html_content is being updated
      if (updates.html_content) {
        updates.variables = this.extractVariables(updates.html_content);
      }

      const { data, error } = await this.supabase
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating template:', error);
      return null;
    }
  }

  /**
   * Delete a template (soft delete by setting is_active to false)
   */
  async deleteTemplate(id: string, userId: string): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      const { error } = await this.supabase
        .from('email_templates')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }

  /**
   * Render a template with variables
   */
  async renderTemplate(params: TemplateRenderParams): Promise<{
    subject: string;
    html: string;
    text?: string;
  } | null> {
    if (!this.supabase) return null;

    try {
      let template: EmailTemplate | null = null;

      if (params.templateId) {
        template = await this.getTemplate(params.templateId);
      } else if (params.templateName) {
        // Need userId - this should be passed in params
        // For now, we'll skip this scenario
        return null;
      }

      if (!template) {
        throw new Error('Template not found');
      }

      // Replace variables in subject and content
      const subject = this.replaceVariables(template.subject, params.variables);
      const html = this.replaceVariables(template.html_content, params.variables);
      const text = template.text_content
        ? this.replaceVariables(template.text_content, params.variables)
        : undefined;

      return { subject, html, text };
    } catch (error) {
      console.error('Error rendering template:', error);
      return null;
    }
  }

  /**
   * Extract variables from template content (e.g., {{customer_name}})
   */
  private extractVariables(content: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1].trim());
    }

    return Array.from(variables);
  }

  /**
   * Replace variables in content (e.g., {{customer_name}} -> John Doe)
   */
  private replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, String(value || ''));
    });

    return result;
  }

  /**
   * Validate template variables
   */
  validateTemplate(template: EmailTemplate, variables: Record<string, any>): {
    valid: boolean;
    missingVariables: string[];
  } {
    const requiredVars = this.extractVariables(template.html_content);
    const providedVars = Object.keys(variables);
    const missingVariables = requiredVars.filter((v) => !providedVars.includes(v));

    return {
      valid: missingVariables.length === 0,
      missingVariables,
    };
  }
}

// Singleton instance
let templateManagerInstance: EmailTemplateManager | null = null;

export function getEmailTemplateManager(): EmailTemplateManager {
  if (!templateManagerInstance) {
    templateManagerInstance = new EmailTemplateManager();
  }
  return templateManagerInstance;
}
