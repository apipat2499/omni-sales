import { useState, useCallback } from 'react';
import {
  getAuditLogs,
  createAuditLog,
  logAuditAction,
  getAuditStatistics,
  type AuditAction,
  type AuditLog,
} from '@/lib/utils/audit-logging';

export function useAuditLogging(userId?: string) {
  const [logs, setLogs] = useState<AuditLog[]>(() => getAuditLogs());
  const [stats, setStats] = useState(getAuditStatistics());

  const recordAction = useCallback(
    (
      action: AuditAction,
      entityId: string,
      description: string,
      changes?: any
    ) => {
      try {
        const log = createAuditLog(action, entityId, description, userId, changes);
        logAuditAction(log);
        setLogs((prev) => [...prev, log]);
        setStats(getAuditStatistics());
        return log;
      } catch (err) {
        console.error('Failed to record audit action:', err);
        return null;
      }
    },
    [userId]
  );

  const refreshLogs = useCallback(() => {
    setLogs(getAuditLogs());
    setStats(getAuditStatistics());
  }, []);

  return {
    logs,
    stats,
    recordAction,
    refreshLogs,
  };
}
