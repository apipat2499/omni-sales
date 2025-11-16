import { useState, useCallback, useEffect } from 'react';
import {
  saveTemplate,
  loadTemplate,
  loadAllTemplates,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
  getTemplatesByTag,
  getAllTags,
  duplicateTemplate,
  getTemplateStats,
  OrderTemplate,
} from '@/lib/utils/order-templates';
import type { OrderItem } from '@/types';

/**
 * Hook for managing order templates
 */
export function useOrderTemplates() {
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    loadTemplatesFromStorage();
  }, []);

  const loadTemplatesFromStorage = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = loadAllTemplates();
      setTemplates(loaded);
      setTags(getAllTags());
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load templates';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveNewTemplate = useCallback(
    (
      name: string,
      items: Omit<OrderItem, 'id'>[],
      options?: {
        description?: string;
        tags?: string[];
      }
    ) => {
      try {
        const template = saveTemplate({
          name,
          items,
          description: options?.description,
          tags: options?.tags,
        });

        setTemplates((prev) => [...prev, template]);
        setTags(getAllTags());
        setError(null);

        return template;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save template';
        setError(message);
        return null;
      }
    },
    []
  );

  const loadTemplateById = useCallback((templateId: string) => {
    try {
      const template = loadTemplate(templateId);
      setError(null);
      return template;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load template';
      setError(message);
      return null;
    }
  }, []);

  const updateExistingTemplate = useCallback(
    (templateId: string, updates: Partial<Omit<OrderTemplate, 'id' | 'createdAt'>>) => {
      try {
        const updated = updateTemplate(templateId, updates);
        if (updated) {
          setTemplates((prev) =>
            prev.map((t) => (t.id === templateId ? updated : t))
          );
          setTags(getAllTags());
          setError(null);
        }
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update template';
        setError(message);
        return null;
      }
    },
    []
  );

  const deleteExistingTemplate = useCallback((templateId: string) => {
    try {
      const success = deleteTemplate(templateId);
      if (success) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
        setTags(getAllTags());
        setError(null);
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete template';
      setError(message);
      return false;
    }
  }, []);

  const search = useCallback((query: string) => {
    try {
      return searchTemplates(query);
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  }, []);

  const getByTag = useCallback((tag: string) => {
    try {
      return getTemplatesByTag(tag);
    } catch (err) {
      console.error('Get by tag error:', err);
      return [];
    }
  }, []);

  const duplicate = useCallback((templateId: string, newName?: string) => {
    try {
      const duplicated = duplicateTemplate(templateId, newName);
      if (duplicated) {
        setTemplates((prev) => [...prev, duplicated]);
        setTags(getAllTags());
        setError(null);
      }
      return duplicated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to duplicate template';
      setError(message);
      return null;
    }
  }, []);

  const getStats = useCallback(() => {
    try {
      return getTemplateStats();
    } catch (err) {
      console.error('Stats error:', err);
      return {
        total: 0,
        recentlyUsed: [],
        mostUsed: [],
        largestOrders: [],
      };
    }
  }, []);

  return {
    templates,
    tags,
    isLoading,
    error,
    saveNewTemplate,
    loadTemplateById,
    updateExistingTemplate,
    deleteExistingTemplate,
    search,
    getByTag,
    duplicate,
    getStats,
    reload: loadTemplatesFromStorage,
    clearError: () => setError(null),
  };
}

/**
 * Hook for applying templates to current order
 */
export function useApplyTemplate() {
  const [selectedTemplate, setSelectedTemplate] = useState<OrderTemplate | null>(null);
  const [mergeMode, setMergeMode] = useState<'replace' | 'merge' | 'append'>('replace');

  const applyTemplate = useCallback(
    (template: OrderTemplate, currentItems: OrderItem[] = []) => {
      let result: OrderItem[] = [];

      switch (mergeMode) {
        case 'replace':
          // Replace entire order
          result = template.items.map((item, index) => ({
            ...item,
            id: `temp-${index}-${Date.now()}`,
          }));
          break;

        case 'merge':
          // Merge with existing items (combine duplicates)
          const merged = new Map<string, OrderItem>();

          currentItems.forEach((item) => {
            merged.set(item.productId, item);
          });

          template.items.forEach((item, index) => {
            if (merged.has(item.productId)) {
              const existing = merged.get(item.productId)!;
              merged.set(item.productId, {
                ...existing,
                quantity: existing.quantity + item.quantity,
              });
            } else {
              merged.set(item.productId, {
                ...item,
                id: `temp-${index}-${Date.now()}`,
              });
            }
          });

          result = Array.from(merged.values());
          break;

        case 'append':
          // Add to existing items
          result = [
            ...currentItems,
            ...template.items.map((item, index) => ({
              ...item,
              id: `temp-${index}-${Date.now()}`,
            })),
          ];
          break;
      }

      return result;
    },
    [mergeMode]
  );

  return {
    selectedTemplate,
    setSelectedTemplate,
    mergeMode,
    setMergeMode,
    applyTemplate,
  };
}
