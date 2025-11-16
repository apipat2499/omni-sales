/**
 * Audit logging system
 */

import type { OrderItem } from "@/types";

export type AuditAction = 
  | "CREATE" | "READ" | "UPDATE" | "DELETE"
  | "BULK_UPDATE" | "REPORT_GENERATE";

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityId: string;
  timestamp: Date;
  userId?: string;
  description: string;
  status: "success" | "failed";
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
}

export function createAuditLog(
  action: AuditAction,
  entityId: string,
  description: string,
  userId?: string,
  changes?: any
): AuditLog {
  return {
    id: `audit_${Date.now()}`,
    action,
    entityId,
    timestamp: new Date(),
    userId,
    description,
    status: "success",
    changes,
  };
}

export function logAuditAction(log: AuditLog): void {
  try {
    const logs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
    logs.push(log);
    if (logs.length > 10000) logs.shift();
    localStorage.setItem("audit_logs", JSON.stringify(logs));
  } catch {
    console.error("Failed to save audit log");
  }
}

export function getAuditLogs(): AuditLog[] {
  try {
    const stored = localStorage.getItem("audit_logs");
    if (\!stored) return [];
    const logs = JSON.parse(stored) as AuditLog[];
    return logs.map((log) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));
  } catch {
    return [];
  }
}

export function getAuditStatistics() {
  const logs = getAuditLogs();
  const successCount = logs.filter((l) => l.status === "success").length;
  return {
    totalLogs: logs.length,
    successCount,
    failureCount: logs.length - successCount,
  };
}

