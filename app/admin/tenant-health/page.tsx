"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CloudOff, RefreshCw } from "lucide-react";

interface HealthResponse {
  success: boolean;
  tenants: {
    id: string;
    name: string;
    subdomain: string;
    plan: string;
    status: string;
    subscriptionStatus: string;
    envReady: boolean;
    trialEndsInDays: number | null;
    lastActivityAt: string | null;
    health: "healthy" | "warning" | "critical";
    issues: string[];
    usageSummary: {
      users: { current: number; limit: number; percent: number };
      storage: { current: number; limit: number; percent: number };
      orders: { current: number; limit: number; percent: number };
      apiUsagePercent: number | null;
    };
    billingStatus: "current" | "trial" | "overdue" | "suspended";
  }[];
  summary: {
    total: number;
    healthy: number;
    warning: number;
    critical: number;
    envIssues: number;
  };
  generatedAt: string;
  offline: boolean;
}

type ActionKind = "status" | "trial" | "usage";

export default function TenantHealthPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<{ tenantId: string; type: ActionKind } | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const summary = data?.summary;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/tenants/health");
      if (!response.ok) {
        throw new Error("Failed to load tenant health");
      }
      const payload = (await response.json()) as HealthResponse;
      setData(payload);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const isActionBusy = (tenantId: string, type: ActionKind) =>
    actionState?.tenantId === tenantId && actionState.type === type;

  const handleTenantAction = async (tenantId: string, action: "suspend" | "reactivate") => {
    try {
      setActionState({ tenantId, type: "status" });
      setActionMsg(null);
      const response = await fetch(`/api/tenants/${tenantId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "อัปเดตสถานะไม่สำเร็จ");
      }

      setActionMsg(
        action === "suspend"
          ? "พักการใช้งาน tenant แล้ว"
          : "เปิดใช้งาน tenant สำเร็จ"
      );
      await loadData();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาดขณะอัปเดตสถานะ");
    } finally {
      setActionState(null);
    }
  };

  const handleExtendTrial = async (tenantId: string, days: number = 14) => {
    try {
      setActionState({ tenantId, type: "trial" });
      setActionMsg(null);
      const response = await fetch(`/api/tenants/${tenantId}/trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "ไม่สามารถต่ออายุ Trial");
      }
      setActionMsg(`ต่ออายุ Trial เพิ่ม ${payload.trialEndsInDays ?? days} วันแล้ว`);
      await loadData();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "ไม่สามารถต่ออายุ Trial");
    } finally {
      setActionState(null);
    }
  };

  const handleRefreshUsage = async (tenantId: string) => {
    try {
      setActionState({ tenantId, type: "usage" });
      setActionMsg(null);
      const response = await fetch(`/api/tenants/${tenantId}/refresh-usage`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "ไม่สามารถรีเฟรช usage");
      }
      setActionMsg(payload.message || "รีเฟรช usage แล้ว");
      await loadData();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "ไม่สามารถรีเฟรช usage");
    } finally {
      setActionState(null);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">Monitoring</p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tenant Health Monitor</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              ตรวจสอบสถานะลูกค้า ปัญหาสิ่งแวดล้อม และทดลองระบบได้จากหน้าจอนี้
            </p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรชข้อมูล
          </button>
        </div>

        {data?.offline && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 px-5 py-4 flex items-start gap-3">
            <CloudOff className="w-5 h-5 mt-1" />
            <div>
              <p className="font-semibold">โหมดออฟไลน์</p>
              <p className="text-sm">กำลังใช้ข้อมูลตัวอย่างเพราะ Supabase ยังไม่พร้อมใช้งาน</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 text-red-800 px-5 py-4">
            เกิดข้อผิดพลาดในการโหลดข้อมูล: {error}
          </div>
        )}

        {actionMsg && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 text-blue-900 px-5 py-3">
            {actionMsg}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Tenant ทั้งหมด" value={summary?.total ?? 0} tone="default" />
          <SummaryCard label="พร้อมใช้งาน" value={summary?.healthy ?? 0} tone="success" />
          <SummaryCard label="ต้องการความสนใจ" value={(summary?.warning ?? 0) + (summary?.critical ?? 0)} tone="warning" />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">สถานะล่าสุด</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                อัปเดตเมื่อ {data?.generatedAt ? new Date(data.generatedAt).toLocaleString('th-TH') : '-'}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {loading ? 'กำลังโหลด...' : `Env Alerts: ${summary?.envIssues ?? 0}`}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
              <thead className="text-left text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Tenant</th>
                  <th className="px-6 py-3 font-medium">แผน</th>
                  <th className="px-6 py-3 font-medium">สถานะ</th>
                  <th className="px-6 py-3 font-medium">Trial</th>
                  <th className="px-6 py-3 font-medium">Environment</th>
                  <th className="px-6 py-3 font-medium">Usage</th>
                  <th className="px-6 py-3 font-medium">Issues</th>
                  <th className="px-6 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {data?.tenants?.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50/60 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{tenant.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tenant.subdomain}.omni-sales.app</p>
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-700 dark:text-gray-300">{tenant.plan}</td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={tenant.health}
                        text={`${tenant.subscriptionStatus} / ${tenant.status}`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      {tenant.trialEndsInDays !== null ? (
                        <span className="text-gray-900 dark:text-gray-100">
                          {tenant.trialEndsInDays > 0 ? `เหลือ ${tenant.trialEndsInDays} วัน` : 'หมดแล้ว'}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {tenant.envReady ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          พร้อมใช้งาน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          Missing ENV
                        </span>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        สถานะบิล: {tenant.billingStatus}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <UsageBar label="Users" current={tenant.usageSummary.users.current} limit={tenant.usageSummary.users.limit} percent={tenant.usageSummary.users.percent} />
                      <UsageBar label="Storage (GB)" current={tenant.usageSummary.storage.current} limit={tenant.usageSummary.storage.limit} percent={tenant.usageSummary.storage.percent} />
                      <UsageBar label="Orders" current={tenant.usageSummary.orders.current} limit={tenant.usageSummary.orders.limit} percent={tenant.usageSummary.orders.percent} />
                      {tenant.usageSummary.apiUsagePercent !== null && (
                        <UsageBar
                          label="API"
                          current={Math.round((tenant.usageSummary.apiUsagePercent || 0) * 100)}
                          limit={100}
                          percent={tenant.usageSummary.apiUsagePercent}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {tenant.issues.length ? (
                        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                          {tenant.issues.map((issue, idx) => (
                            <li key={`${tenant.id}-issue-${idx}`}>• {issue}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 text-xs">ไม่มี</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2 items-center">
                        <button
                          onClick={() => handleTenantAction(tenant.id, tenant.status === "suspended" ? "reactivate" : "suspend")}
                          disabled={isActionBusy(tenant.id, "status") || data?.offline}
                          className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 w-full"
                        >
                          {tenant.status === "suspended" ? "เปิดใช้งาน" : "พักการใช้งาน"}
                        </button>
                        <button
                          onClick={() => handleExtendTrial(tenant.id)}
                          disabled={isActionBusy(tenant.id, "trial") || data?.offline}
                          className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 w-full"
                        >
                          ต่อ Trial +14 วัน
                        </button>
                        <button
                          onClick={() => handleRefreshUsage(tenant.id)}
                          disabled={isActionBusy(tenant.id, "usage") || data?.offline}
                          className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 w-full"
                        >
                          รีเฟรช Usage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!data?.tenants?.length && !loading && !error && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      ไม่พบข้อมูล tenant
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, text }: { status: "healthy" | "warning" | "critical"; text: string }) {
  const styles = {
    healthy: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    critical: "bg-red-50 text-red-700 border-red-100",
  }[status];

  return (
    <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-semibold ${styles}`}>
      {text}
    </span>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  tone: "default" | "success" | "warning";
}

function SummaryCard({ label, value, tone }: SummaryCardProps) {
  const colors = {
    default: "from-gray-900 to-gray-700 text-white",
    success: "from-emerald-500 to-emerald-600 text-white",
    warning: "from-amber-500 to-amber-600 text-white",
  }[tone];

  return (
    <div className={`rounded-2xl p-6 bg-gradient-to-br ${colors} shadow-lg`}>
      <p className="text-sm uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  );
}

function UsageBar({
  label,
  current,
  limit,
  percent,
}: {
  label: string;
  current: number;
  limit: number;
  percent: number;
}) {
  const percentage = Math.min(Math.round(percent * 100), 100);
  const tone =
    percent >= 1 ? "bg-red-500" : percent >= 0.8 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span>
          {current}
          {limit ? ` / ${limit}` : ''}
        </span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
