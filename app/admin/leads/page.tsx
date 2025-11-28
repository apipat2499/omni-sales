"use client";

import useSWR from "swr";
import { useState } from "react";
import { AdminGuard } from '@/components/RouteGuard';
import { BadgeCheck, Phone, Mail, Building2, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

interface LeadRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  budget_tier?: string;
  preferred_channel?: string;
  status?: string;
  score?: number;
  owner_email?: string;
  assigned_at?: string;
  created_at: string;
}

interface LeadResponse {
  success: boolean;
  leads: LeadRecord[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const budgetScoreMap: Record<string, number> = {
  ">100k": 90,
  "50-100k": 75,
  "10-50k": 60,
  "<10k": 40,
};

const statusColumns = ["new", "contacted", "qualified", "won"];

function computeScore(lead: LeadRecord) {
  let base = budgetScoreMap[lead.budget_tier || ""] || 30;
  if (lead.company && lead.company.length > 5) base += 5;
  if (lead.phone) base += 5;
  return Math.min(100, base);
}

export default function LeadsAdminPage() {
  const { data, isLoading, mutate } = useSWR<LeadResponse>("/api/leads", fetcher, {
    refreshInterval: 60000,
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const { user } = useAuth();

  const leadsWithScore = (data?.leads || []).map((lead) => ({
    ...lead,
    score: computeScore(lead),
  }));

  const owners = Array.from(
    new Set(leadsWithScore.map((lead) => lead.owner_email).filter(Boolean))
  );

  const pipeline = statusColumns.map((status) => ({
    status,
    leads: leadsWithScore.filter((lead) => {
      const ownerMatches = selectedOwner ? lead.owner_email === selectedOwner : true;
      return ownerMatches && (lead.status || "new") === status;
    }),
  }));

  const handleStatusChange = async (leadId: string, nextStatus: string, ownerEmail?: string) => {
    try {
      setUpdatingId(leadId);
      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, ownerEmail: ownerEmail || user?.email }),
      });
      if (!response.ok) {
        throw new Error("อัปเดตสถานะไม่ได้");
      }
      await mutate();
    } catch (error) {
      alert(error instanceof Error ? error.message : "อัปเดตสถานะไม่ได้");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold">Sales</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lead Pipeline</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">ภาพรวม Lead ล่าสุดพร้อมคะแนนความสำคัญ</p>
        </header>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรชข้อมูล
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-300">เจ้าของ</span>
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5"
            >
              <option value="">ทุกคน</option>
              {owners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statusColumns.map((status) => (
            <div key={status} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">{status}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {leadsWithScore.filter((lead) => (lead.status || "new") === status).length}
              </p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-4">
            {pipeline.map((column) => (
              <div key={column.status} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{column.status}</p>
                  <span className="text-xs text-gray-500">{column.leads.length} รายการ</span>
                </div>
                <div className="space-y-3">
                  {column.leads.map((lead) => (
                    <div key={lead.id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{lead.name}</p>
                          <p className="text-xs text-gray-500">{new Date(lead.created_at).toLocaleString('th-TH')}</p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                          Score {lead.score}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                        <p className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {lead.email}
                        </p>
                        {lead.phone && (
                          <p className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {lead.phone}
                          </p>
                        )}
                        {lead.company && (
                          <p className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {lead.company}
                          </p>
                        )}
                        {lead.budget_tier && (
                          <p className="text-indigo-600 dark:text-indigo-300">งบ: {lead.budget_tier}</p>
                        )}
                        {lead.preferred_channel && (
                          <p className="text-emerald-600 dark:text-emerald-300">ช่องทาง: {lead.preferred_channel}</p>
                        )}
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <select
                            value={lead.owner_email || ''}
                            onChange={(e) => handleStatusChange(lead.id, lead.status || "new", e.target.value)}
                            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                          >
                            <option value="">ไม่ระบุผู้รับผิดชอบ</option>
                            {[lead.owner_email, user?.email, ...owners].filter(Boolean).map((owner) => (
                              <option key={`${lead.id}-${owner}`} value={owner}>
                                {owner}
                              </option>
                            ))}
                          </select>
                          {lead.assigned_at && (
                            <span className="text-[11px]">
                              อัปเดต {new Date(lead.assigned_at).toLocaleString('th-TH')}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        disabled={updatingId === lead.id}
                        onClick={() => {
                          const order = statusColumns.indexOf(lead.status || "new");
                          const nextStatus = statusColumns[Math.min(order + 1, statusColumns.length - 1)];
                          handleStatusChange(lead.id, nextStatus, lead.owner_email || user?.email);
                        }}
                        className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs py-2 flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {updatingId === lead.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            กำลังอัปเดต...
                          </>
                        ) : (
                          <>
                            <BadgeCheck className="w-4 h-4" />
                            ขยับสถานะ
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                  {column.leads.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">ยังไม่มีข้อมูล</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </AdminGuard>
  );
}
