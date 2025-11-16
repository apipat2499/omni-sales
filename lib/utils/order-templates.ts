/**
 * Order templates for saving and loading order configurations
 */

import type { OrderItem } from '@/types';

export interface OrderTemplate {
  id: string;
  name: string;
  description?: string;
  items: Omit<OrderItem, 'id'>[];
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  totalPrice?: number;
  itemCount?: number;
}

export interface OrderTemplateStorage {
  templates: OrderTemplate[];
  lastModified: Date;
}

const STORAGE_KEY = 'order_templates';
const MAX_TEMPLATES = 100;

/**
 * Save template to localStorage
 */
export function saveTemplate(template: Omit<OrderTemplate, 'id' | 'createdAt' | 'updatedAt'>): OrderTemplate {
  try {
    const templates = loadAllTemplates();

    const newTemplate: OrderTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      description: template.description,
      items: template.items,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: template.tags,
      totalPrice: template.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      itemCount: template.items.length,
    };

    templates.push(newTemplate);

    // Limit templates
    if (templates.length > MAX_TEMPLATES) {
      templates.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      templates.splice(MAX_TEMPLATES);
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        templates,
        lastModified: new Date().toISOString(),
      })
    );

    return newTemplate;
  } catch (err) {
    console.error('Error saving template:', err);
    throw err;
  }
}

/**
 * Load template by ID
 */
export function loadTemplate(templateId: string): OrderTemplate | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const storage: OrderTemplateStorage = JSON.parse(data);
    const template = storage.templates.find((t) => t.id === templateId);

    if (template) {
      return {
        ...template,
        createdAt: new Date(template.createdAt),
        updatedAt: new Date(template.updatedAt),
      };
    }

    return null;
  } catch (err) {
    console.error('Error loading template:', err);
    return null;
  }
}

/**
 * Load all templates
 */
export function loadAllTemplates(): OrderTemplate[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const storage: OrderTemplateStorage = JSON.parse(data);
    return storage.templates.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
    }));
  } catch (err) {
    console.error('Error loading templates:', err);
    return [];
  }
}

/**
 * Update template
 */
export function updateTemplate(templateId: string, updates: Partial<Omit<OrderTemplate, 'id' | 'createdAt'>>): OrderTemplate | null {
  try {
    const templates = loadAllTemplates();
    const index = templates.findIndex((t) => t.id === templateId);

    if (index === -1) return null;

    const updated: OrderTemplate = {
      ...templates[index],
      ...updates,
      updatedAt: new Date(),
    };

    templates[index] = updated;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        templates,
        lastModified: new Date().toISOString(),
      })
    );

    return updated;
  } catch (err) {
    console.error('Error updating template:', err);
    return null;
  }
}

/**
 * Delete template
 */
export function deleteTemplate(templateId: string): boolean {
  try {
    const templates = loadAllTemplates();
    const filtered = templates.filter((t) => t.id !== templateId);

    if (filtered.length === templates.length) return false;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        templates: filtered,
        lastModified: new Date().toISOString(),
      })
    );

    return true;
  } catch (err) {
    console.error('Error deleting template:', err);
    return false;
  }
}

/**
 * Search templates by name or tags
 */
export function searchTemplates(query: string): OrderTemplate[] {
  try {
    const templates = loadAllTemplates();
    const lowerQuery = query.toLowerCase();

    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description?.toLowerCase().includes(lowerQuery) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  } catch (err) {
    console.error('Error searching templates:', err);
    return [];
  }
}

/**
 * Get templates by tag
 */
export function getTemplatesByTag(tag: string): OrderTemplate[] {
  try {
    const templates = loadAllTemplates();
    return templates.filter((t) => t.tags?.includes(tag));
  } catch (err) {
    console.error('Error getting templates by tag:', err);
    return [];
  }
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  try {
    const templates = loadAllTemplates();
    const tags = new Set<string>();

    templates.forEach((t) => {
      t.tags?.forEach((tag) => tags.add(tag));
    });

    return Array.from(tags).sort();
  } catch (err) {
    console.error('Error getting tags:', err);
    return [];
  }
}

/**
 * Duplicate template
 */
export function duplicateTemplate(templateId: string, newName?: string): OrderTemplate | null {
  try {
    const template = loadTemplate(templateId);
    if (!template) return null;

    return saveTemplate({
      name: newName || `${template.name} (copy)`,
      description: template.description,
      items: template.items,
      tags: template.tags,
    });
  } catch (err) {
    console.error('Error duplicating template:', err);
    return null;
  }
}

/**
 * Export templates to JSON
 */
export function exportTemplates(): string {
  try {
    const templates = loadAllTemplates();
    return JSON.stringify(
      {
        templates,
        exportDate: new Date().toISOString(),
        version: '1.0',
      },
      null,
      2
    );
  } catch (err) {
    console.error('Error exporting templates:', err);
    throw err;
  }
}

/**
 * Import templates from JSON
 */
export function importTemplates(jsonString: string): { success: number; failed: number } {
  try {
    const data = JSON.parse(jsonString);
    const importedTemplates = data.templates || [];

    let success = 0;
    let failed = 0;

    importedTemplates.forEach((template: any) => {
      try {
        saveTemplate({
          name: template.name,
          description: template.description,
          items: template.items,
          tags: template.tags,
        });
        success++;
      } catch (err) {
        failed++;
        console.error('Error importing template:', err);
      }
    });

    return { success, failed };
  } catch (err) {
    console.error('Error parsing import data:', err);
    throw err;
  }
}

/**
 * Clear all templates
 */
export function clearAllTemplates(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing templates:', err);
  }
}

/**
 * Get template statistics
 */
export function getTemplateStats(): {
  total: number;
  recentlyUsed: OrderTemplate[];
  mostUsed: OrderTemplate[];
  largestOrders: OrderTemplate[];
} {
  try {
    const templates = loadAllTemplates();

    return {
      total: templates.length,
      recentlyUsed: templates.slice(-5).reverse(),
      mostUsed: templates.slice(0, 5),
      largestOrders: [...templates]
        .sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0))
        .slice(0, 5),
    };
  } catch (err) {
    console.error('Error getting stats:', err);
    return {
      total: 0,
      recentlyUsed: [],
      mostUsed: [],
      largestOrders: [],
    };
  }
}
