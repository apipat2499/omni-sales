import { useState, useCallback, useEffect } from 'react';
import {
  getAllWebhooks,
  getWebhookById,
  getEnabledWebhooks,
  getWebhooksByEvent,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  toggleWebhook,
  getAllDeliveries,
  getDeliveriesByWebhook,
  getRecentDeliveries,
  getFailedDeliveries,
  getPendingRetries,
  triggerWebhook,
  triggerWebhooksForEvent,
  retryDelivery,
  processPendingRetries,
  testWebhook,
  getWebhookStats,
  clearOldDeliveries,
  clearAllDeliveries,
  exportWebhooks,
  importWebhooks,
  getDeliveryStats,
  WebhookConfig,
  WebhookDelivery,
  WebhookEventType,
} from '@/lib/utils/webhooks';

/**
 * Hook for managing webhooks
 */
export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);

  // Load webhooks and deliveries
  const loadWebhooks = useCallback(() => {
    try {
      const allWebhooks = getAllWebhooks();
      const allDeliveries = getRecentDeliveries(100);
      setWebhooks(allWebhooks);
      setDeliveries(allDeliveries);
    } catch (err) {
      console.error('Failed to load webhooks:', err);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  // Create new webhook
  const create = useCallback(
    (config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setLoading(true);
        const webhook = createWebhook(config);
        loadWebhooks();
        return webhook;
      } catch (err) {
        console.error('Failed to create webhook:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loadWebhooks]
  );

  // Update webhook
  const update = useCallback(
    (id: string, updates: Partial<Omit<WebhookConfig, 'id' | 'createdAt'>>) => {
      try {
        setLoading(true);
        const webhook = updateWebhook(id, updates);
        if (webhook) {
          loadWebhooks();
        }
        return webhook;
      } catch (err) {
        console.error('Failed to update webhook:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loadWebhooks]
  );

  // Delete webhook
  const remove = useCallback(
    (id: string) => {
      try {
        setLoading(true);
        const success = deleteWebhook(id);
        if (success) {
          loadWebhooks();
        }
        return success;
      } catch (err) {
        console.error('Failed to delete webhook:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadWebhooks]
  );

  // Toggle webhook
  const toggle = useCallback(
    (id: string) => {
      try {
        const webhook = toggleWebhook(id);
        if (webhook) {
          loadWebhooks();
        }
        return webhook;
      } catch (err) {
        console.error('Failed to toggle webhook:', err);
        return null;
      }
    },
    [loadWebhooks]
  );

  // Test webhook
  const test = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        const delivery = await testWebhook(id);
        loadWebhooks();
        return delivery;
      } catch (err) {
        console.error('Failed to test webhook:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loadWebhooks]
  );

  // Retry delivery
  const retry = useCallback(
    async (deliveryId: string) => {
      try {
        setLoading(true);
        const delivery = await retryDelivery(deliveryId);
        loadWebhooks();
        return delivery;
      } catch (err) {
        console.error('Failed to retry delivery:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loadWebhooks]
  );

  // Process pending retries
  const processRetries = useCallback(async () => {
    try {
      const count = await processPendingRetries();
      loadWebhooks();
      return count;
    } catch (err) {
      console.error('Failed to process retries:', err);
      return 0;
    }
  }, [loadWebhooks]);

  // Clear old deliveries
  const clearOld = useCallback(
    (days: number = 30) => {
      try {
        const count = clearOldDeliveries(days);
        loadWebhooks();
        return count;
      } catch (err) {
        console.error('Failed to clear old deliveries:', err);
        return 0;
      }
    },
    [loadWebhooks]
  );

  // Clear all deliveries
  const clearAll = useCallback(() => {
    try {
      clearAllDeliveries();
      loadWebhooks();
    } catch (err) {
      console.error('Failed to clear deliveries:', err);
    }
  }, [loadWebhooks]);

  // Export configuration
  const exportConfig = useCallback(() => {
    try {
      return exportWebhooks();
    } catch (err) {
      console.error('Failed to export webhooks:', err);
      return '';
    }
  }, []);

  // Import configuration
  const importConfig = useCallback(
    (json: string) => {
      try {
        const count = importWebhooks(json);
        loadWebhooks();
        return count;
      } catch (err) {
        console.error('Failed to import webhooks:', err);
        return 0;
      }
    },
    [loadWebhooks]
  );

  return {
    webhooks,
    deliveries,
    loading,
    enabledWebhooks: getEnabledWebhooks(),
    failedDeliveries: getFailedDeliveries(),
    pendingRetries: getPendingRetries(),
    stats: getDeliveryStats(),
    create,
    update,
    remove,
    toggle,
    test,
    retry,
    processRetries,
    clearOld,
    clearAll,
    exportConfig,
    importConfig,
    refresh: loadWebhooks,
  };
}

/**
 * Hook for webhook details
 */
export function useWebhookDetails(webhookId: string | null) {
  const [webhook, setWebhook] = useState<WebhookConfig | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof getWebhookStats> | null>(null);

  useEffect(() => {
    if (!webhookId) {
      setWebhook(null);
      setDeliveries([]);
      setStats(null);
      return;
    }

    const loadDetails = () => {
      const wh = getWebhookById(webhookId);
      const del = getDeliveriesByWebhook(webhookId);
      const st = getWebhookStats(webhookId);

      setWebhook(wh);
      setDeliveries(del);
      setStats(st);
    };

    loadDetails();
  }, [webhookId]);

  return {
    webhook,
    deliveries,
    stats,
  };
}

/**
 * Hook for triggering webhooks
 */
export function useWebhookTrigger() {
  const [triggering, setTriggering] = useState(false);

  const trigger = useCallback(
    async <T = any>(
      eventType: WebhookEventType,
      data: T,
      metadata?: Record<string, any>
    ): Promise<WebhookDelivery[]> => {
      try {
        setTriggering(true);
        return await triggerWebhooksForEvent(eventType, data, metadata);
      } catch (err) {
        console.error('Failed to trigger webhooks:', err);
        return [];
      } finally {
        setTriggering(false);
      }
    },
    []
  );

  const triggerSingle = useCallback(
    async <T = any>(
      webhookId: string,
      eventType: WebhookEventType,
      data: T,
      metadata?: Record<string, any>
    ): Promise<WebhookDelivery | null> => {
      try {
        setTriggering(true);
        const webhook = getWebhookById(webhookId);
        if (!webhook) return null;

        return await triggerWebhook(webhook, eventType, data, metadata);
      } catch (err) {
        console.error('Failed to trigger webhook:', err);
        return null;
      } finally {
        setTriggering(false);
      }
    },
    []
  );

  return {
    triggering,
    trigger,
    triggerSingle,
  };
}

/**
 * Hook for webhook event listeners
 */
export function useWebhookEvents() {
  const { trigger } = useWebhookTrigger();

  // Register event listener
  const on = useCallback(
    <T = any>(eventType: WebhookEventType, data: T, metadata?: Record<string, any>) => {
      return trigger(eventType, data, metadata);
    },
    [trigger]
  );

  // Convenience methods for common events
  const onCreate = useCallback(
    <T = any>(data: T, metadata?: Record<string, any>) => {
      return on('onCreate', data, metadata);
    },
    [on]
  );

  const onUpdate = useCallback(
    <T = any>(data: T, metadata?: Record<string, any>) => {
      return on('onUpdate', data, metadata);
    },
    [on]
  );

  const onDelete = useCallback(
    <T = any>(data: T, metadata?: Record<string, any>) => {
      return on('onDelete', data, metadata);
    },
    [on]
  );

  const onBulkOperation = useCallback(
    <T = any>(data: T, metadata?: Record<string, any>) => {
      return on('onBulkOperation', data, metadata);
    },
    [on]
  );

  const onStatusChange = useCallback(
    <T = any>(data: T, metadata?: Record<string, any>) => {
      return on('onStatusChange', data, metadata);
    },
    [on]
  );

  const onPayment = useCallback(
    <T = any>(data: T, metadata?: Record<string, any>) => {
      return on('onPayment', data, metadata);
    },
    [on]
  );

  const onInventoryChange = useCallback(
    <T = any>(data: T, metadata?: Record<string, any>) => {
      return on('onInventoryChange', data, metadata);
    },
    [on]
  );

  return {
    on,
    onCreate,
    onUpdate,
    onDelete,
    onBulkOperation,
    onStatusChange,
    onPayment,
    onInventoryChange,
  };
}

/**
 * Hook for automatic retry processing
 */
export function useWebhookRetryProcessor(intervalMs: number = 60000) {
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const process = async () => {
      if (processing) return;

      setProcessing(true);
      try {
        await processPendingRetries();
      } catch (err) {
        console.error('Failed to process retries:', err);
      } finally {
        setProcessing(false);
      }
    };

    // Initial process
    process();

    // Set up interval
    const interval = setInterval(process, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, processing]);

  return { processing };
}
