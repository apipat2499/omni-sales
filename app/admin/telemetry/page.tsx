"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { AdminGuard } from '@/components/RouteGuard';
import { AlertTriangle, CheckCircle2, Loader2, Satellite } from "lucide-react";

type TelemetryLevel = "info" | "warning" | "error";

export default function TelemetryPage() {
  const [message, setMessage] = useState("ส่งข้อความทดสอบจาก Telemetry Console");
  const [type, setType] = useState("telemetry_manual_test");
  const [level, setLevel] = useState<TelemetryLevel>("info");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: "success" | "error"; text: string } | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message,
          level,
          context: { triggeredFrom: "Telemetry Console" },
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "ส่งข้อความไม่สำเร็จ");
      }

      setResult({ status: "success", text: "ส่งข้อความสำเร็จ — ตรวจสอบ Slack/Sentry ได้เลย" });
    } catch (error) {
      setResult({
        status: "error",
        text: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Satellite className="w-6 h-6 text-indigo-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Telemetry Console</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ส่งข้อความทดสอบไปยัง Slack/Sentry ได้จากหน้านี้ เพื่อเช็กการตั้งค่าระบบแจ้งเตือน
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  placeholder="telemetry_manual_test"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Level</label>
                <div className="mt-2 flex gap-3">
                  {(["info", "warning", "error"] as TelemetryLevel[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => setLevel(option)}
                      className={`px-3 py-1.5 rounded-full text-sm border ${
                        level === option
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>

              <button
                onClick={handleSend}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    ส่งข้อความ...
                  </>
                ) : (
                  "ส่ง Telemetry"
                )}
              </button>

              {result && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
                    result.status === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                  {result.status === "success" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  {result.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </DashboardLayout>
    </AdminGuard>
  );
}
