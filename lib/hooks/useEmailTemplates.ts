/**
 * useEmailTemplates Hook
 *
 * React hook for managing notification templates (email and SMS).
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplatesByType,
  getTemplatesByCategory,
  getActiveTemplates,
  renderTemplate,
  generatePreview,
  extractVariables,
  validateTemplateVariables,
  initializeDefaultTemplates,
  type NotificationTemplate,
  type TemplateType,
  type TemplateCategory,
  type RenderOptions,
  type TemplatePreview,
  COMMON_VARIABLES,
} from '@/lib/utils/notification-templates';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TemplateState {
  templates: NotificationTemplate[];
  selectedTemplate: NotificationTemplate | null;
  preview: TemplatePreview | null;
  isLoading: boolean;
  error: string | null;
}

export interface CreateTemplateParams {
  name: string;
  type: TemplateType;
  category: TemplateCategory;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  smsBody?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useEmailTemplates() {
  const [state, setState] = useState<TemplateState>({
    templates: [],
    selectedTemplate: null,
    preview: null,
    isLoading: false,
    error: null,
  });

  /**
   * Load all templates
   */
  const loadTemplates = useCallback(() => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const templates = getAllTemplates();

      setState(prev => ({
        ...prev,
        templates,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load templates',
      }));
    }
  }, []);

  /**
   * Load templates on mount and initialize defaults
   */
  useEffect(() => {
    initializeDefaultTemplates();
    loadTemplates();
  }, [loadTemplates]);

  // ========================================================================
  // Template CRUD Functions
  // ========================================================================

  /**
   * Create a new template
   */
  const create = useCallback(
    (params: CreateTemplateParams): NotificationTemplate | null => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const template = createTemplate({
          name: params.name,
          type: params.type,
          category: params.category,
          subject: params.subject,
          htmlBody: params.htmlBody,
          textBody: params.textBody,
          smsBody: params.smsBody,
          description: params.description,
          isActive: params.isActive ?? true,
          isDefault: params.isDefault ?? false,
        });

        loadTemplates();
        return template;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to create template',
        }));
        return null;
      }
    },
    [loadTemplates]
  );

  /**
   * Update template
   */
  const update = useCallback(
    (id: string, updates: Partial<NotificationTemplate>): NotificationTemplate | null => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const template = updateTemplate(id, updates);

        if (template) {
          loadTemplates();

          // Update selected template if it's the one being updated
          setState(prev => ({
            ...prev,
            selectedTemplate: prev.selectedTemplate?.id === id ? template : prev.selectedTemplate,
          }));
        }

        return template;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to update template',
        }));
        return null;
      }
    },
    [loadTemplates]
  );

  /**
   * Delete template
   */
  const remove = useCallback(
    (id: string): boolean => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const success = deleteTemplate(id);

        if (success) {
          loadTemplates();

          // Clear selected template if it's the one being deleted
          setState(prev => ({
            ...prev,
            selectedTemplate: prev.selectedTemplate?.id === id ? null : prev.selectedTemplate,
          }));
        }

        return success;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to delete template',
        }));
        return false;
      }
    },
    [loadTemplates]
  );

  /**
   * Select template
   */
  const select = useCallback((id: string | null) => {
    if (!id) {
      setState(prev => ({ ...prev, selectedTemplate: null, preview: null }));
      return;
    }

    const template = getTemplateById(id);
    setState(prev => ({
      ...prev,
      selectedTemplate: template,
      preview: template ? generatePreview(template) : null,
    }));
  }, []);

  // ========================================================================
  // Template Filtering Functions
  // ========================================================================

  /**
   * Get templates by type
   */
  const getByType = useCallback((type: TemplateType): NotificationTemplate[] => {
    return getTemplatesByType(type);
  }, []);

  /**
   * Get templates by category
   */
  const getByCategory = useCallback((category: TemplateCategory): NotificationTemplate[] => {
    return getTemplatesByCategory(category);
  }, []);

  /**
   * Get active templates
   */
  const getActive = useCallback((type?: TemplateType): NotificationTemplate[] => {
    return getActiveTemplates(type);
  }, []);

  // ========================================================================
  // Template Rendering Functions
  // ========================================================================

  /**
   * Render template with variables
   */
  const render = useCallback(
    (templateId: string, variables: Record<string, any>): TemplatePreview | null => {
      try {
        const template = getTemplateById(templateId);
        if (!template) {
          throw new Error('Template not found');
        }

        const preview = renderTemplate(template, { variables });

        setState(prev => ({ ...prev, preview }));
        return preview;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to render template',
        }));
        return null;
      }
    },
    []
  );

  /**
   * Generate preview with sample data
   */
  const preview = useCallback((templateId: string): TemplatePreview | null => {
    try {
      const template = getTemplateById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const templatePreview = generatePreview(template);

      setState(prev => ({ ...prev, preview: templatePreview }));
      return templatePreview;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to generate preview',
      }));
      return null;
    }
  }, []);

  /**
   * Validate template variables
   */
  const validate = useCallback(
    (templateId: string, variables: Record<string, any>) => {
      try {
        const template = getTemplateById(templateId);
        if (!template) {
          throw new Error('Template not found');
        }

        return validateTemplateVariables(template, variables);
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to validate template',
        }));
        return { valid: false, missing: [], errors: [error.message] };
      }
    },
    []
  );

  // ========================================================================
  // Template Variable Functions
  // ========================================================================

  /**
   * Extract variables from template content
   */
  const extractVars = useCallback(
    (template: Pick<NotificationTemplate, 'subject' | 'htmlBody' | 'textBody' | 'smsBody'>): string[] => {
      return extractVariables(template);
    },
    []
  );

  /**
   * Get common variables
   */
  const getCommonVariables = useCallback(() => {
    return COMMON_VARIABLES;
  }, []);

  // ========================================================================
  // Utility Functions
  // ========================================================================

  /**
   * Duplicate template
   */
  const duplicate = useCallback(
    (id: string): NotificationTemplate | null => {
      try {
        const template = getTemplateById(id);
        if (!template) {
          throw new Error('Template not found');
        }

        const duplicated = createTemplate({
          name: `${template.name} (Copy)`,
          type: template.type,
          category: template.category,
          subject: template.subject,
          htmlBody: template.htmlBody,
          textBody: template.textBody,
          smsBody: template.smsBody,
          description: template.description,
          isActive: false, // Duplicates start as inactive
          isDefault: false,
        });

        loadTemplates();
        return duplicated;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to duplicate template',
        }));
        return null;
      }
    },
    [loadTemplates]
  );

  /**
   * Toggle template active status
   */
  const toggleActive = useCallback(
    (id: string): boolean => {
      try {
        const template = getTemplateById(id);
        if (!template) {
          throw new Error('Template not found');
        }

        const updated = updateTemplate(id, { isActive: !template.isActive });
        if (updated) {
          loadTemplates();
          return true;
        }

        return false;
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to toggle template status',
        }));
        return false;
      }
    },
    [loadTemplates]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Refresh templates
   */
  const refresh = useCallback(() => {
    loadTemplates();
  }, [loadTemplates]);

  /**
   * Clear preview
   */
  const clearPreview = useCallback(() => {
    setState(prev => ({ ...prev, preview: null }));
  }, []);

  return {
    // State
    templates: state.templates,
    selectedTemplate: state.selectedTemplate,
    preview: state.preview,
    isLoading: state.isLoading,
    error: state.error,

    // CRUD operations
    createTemplate: create,
    updateTemplate: update,
    deleteTemplate: remove,
    selectTemplate: select,

    // Filtering
    getTemplatesByType: getByType,
    getTemplatesByCategory: getByCategory,
    getActiveTemplates: getActive,

    // Rendering
    renderTemplate: render,
    generatePreview: preview,
    validateTemplate: validate,

    // Variables
    extractVariables: extractVars,
    getCommonVariables,

    // Utility
    duplicateTemplate: duplicate,
    toggleActiveStatus: toggleActive,
    clearError,
    refresh,
    clearPreview,
  };
}

export default useEmailTemplates;
