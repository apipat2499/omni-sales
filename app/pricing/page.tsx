"use client";

import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Zap, Plus, Edit2, Trash2, TrendingDown } from "lucide-react";
import { AdminGuard } from '@/components/RouteGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import DashboardLayout from "@/components/DashboardLayout";

interface Strategy {
  id: string;
  strategyName: string;
  strategyType: string;
  description?: string;
  isActive: boolean;
  priority: number;
}

interface Analytics {
  date: string;
  totalProductsAffected: number;
  totalPriceChanges: number;
  averagePriceChange: number;
  revenueImpact: number;
  marginImpact: number;
}

export default function PricingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [isCreatingStrategy, setIsCreatingStrategy] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchData(user.id);
    }
  }, [user]);

  const fetchData = async (userId: string) => {
    try {
      setIsLoading(true);
      const strategiesRes = await fetch(`/api/pricing/strategies?userId=` + userId);
      const strategiesData = await strategiesRes.json();
      setStrategies(strategiesData.data || []);

      const analyticsRes = await fetch(`/api/pricing/analytics?userId=` + userId);
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><div>Loading...</div></div>;
  }

  const avgChange = analytics.length
    ? analytics.reduce((sum, a) => sum + (a.averagePriceChange || 0), 0) / analytics.length
    : 0;
  const totalRevenue = analytics.reduce((sum, a) => sum + (a.revenueImpact || 0), 0);

  return (
    <AdminGuard>
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-4xl font-bold dark:text-white">Dynamic Pricing</h1>
              <button className="rounded-lg bg-blue-500 px-4 py-2 text-white">New Strategy</button>
            </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <p className="text-sm text-gray-600">Avg Price Change</p>
            <p className="mt-2 text-3xl font-bold dark:text-white">{avgChange.toFixed(2)}%</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <p className="text-sm text-gray-600">Revenue Impact</p>
            <p className="mt-2 text-3xl font-bold dark:text-white">$${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <p className="text-sm text-gray-600">Strategies</p>
            <p className="mt-2 text-3xl font-bold dark:text-white">{strategies.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
            <p className="text-sm text-gray-600">Data Points</p>
            <p className="mt-2 text-3xl font-bold dark:text-white">{analytics.length}</p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-bold">Strategies ({strategies.length})</h2>
          {strategies.length > 0 ? (
            <div className="space-y-4">
              {strategies.map((s) => (
                <div key={s.id} className="rounded-lg border p-4">
                  <h3 className="text-lg font-semibold">{s.strategyName}</h3>
                  <p className="text-sm text-gray-600">Type: {s.strategyType}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No strategies yet</p>
          )}
        </div>
      </div>
    </div>
      </DashboardLayout>
    </AdminGuard>
  );
}
