'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  useAnalyticsOverview,
  useRFMAnalysis,
  useProductAnalytics,
  useSalesForecast,
} from '@/lib/hooks/useAnalytics';
import OverviewStats from '@/components/analytics/OverviewStats';
import RevenueChart from '@/components/analytics/RevenueChart';
import RFMSegments from '@/components/analytics/RFMSegments';
import ProductPerformance from '@/components/analytics/ProductPerformance';
import ForecastChart from '@/components/analytics/ForecastChart';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { Calendar, TrendingUp, Users, Package, BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'products' | 'forecast'>('overview');

  const { data: overviewData, isLoading: overviewLoading } = useAnalyticsOverview(period);
  const { data: rfmData, isLoading: rfmLoading } = useRFMAnalysis();
  const { data: productData, isLoading: productLoading } = useProductAnalytics(period);
  const { data: forecastData, isLoading: forecastLoading } = useSalesForecast(period, 7);

  const tabs = [
    { id: 'overview', name: 'ภาพรวม', icon: TrendingUp },
    { id: 'customers', name: 'ลูกค้า (RFM)', icon: Users },
    { id: 'products', name: 'สินค้า', icon: Package },
    { id: 'forecast', name: 'คาดการณ์', icon: BarChart3 },
  ];

  const periods = [
    { value: '7', label: '7 วัน' },
    { value: '30', label: '30 วัน' },
    { value: '90', label: '90 วัน' },
    { value: '365', label: '1 ปี' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              วิเคราะห์ข้อมูลธุรกิจแบบละเอียด
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            <Calendar className="h-5 w-5 text-gray-400 ml-2" />
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {overviewLoading ? (
                <SkeletonLoader type="card" count={4} />
              ) : overviewData ? (
                <>
                  <OverviewStats data={overviewData.overview} />
                  <RevenueChart data={overviewData.chartData} />

                  {overviewData.lowStockProducts.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-3">
                        ⚠️ สินค้าใกล้หมด
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {overviewData.lowStockProducts.map((product: any) => (
                          <div
                            key={product.id}
                            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-700"
                          >
                            <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{product.sku}</p>
                            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-2">
                              เหลือ {product.stock} ชิ้น
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">ไม่สามารถโหลดข้อมูลได้</div>
              )}
            </div>
          )}

          {activeTab === 'customers' && (
            <div>
              {rfmLoading ? (
                <SkeletonLoader type="list" count={3} />
              ) : rfmData ? (
                <RFMSegments segments={rfmData.segments} summary={rfmData.summary} />
              ) : (
                <div className="text-center py-12 text-gray-500">ไม่สามารถโหลดข้อมูลได้</div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              {productLoading ? (
                <SkeletonLoader type="list" count={3} />
              ) : productData ? (
                <ProductPerformance
                  topProducts={productData.topProducts}
                  categoryPerformance={productData.categoryPerformance}
                  summary={productData.summary}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">ไม่สามารถโหลดข้อมูลได้</div>
              )}
            </div>
          )}

          {activeTab === 'forecast' && (
            <div>
              {forecastLoading ? (
                <SkeletonLoader type="card" count={3} />
              ) : forecastData ? (
                <ForecastChart
                  historical={forecastData.historical}
                  forecast={forecastData.forecast}
                  trends={forecastData.trends}
                  projections={forecastData.projections}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">ไม่สามารถโหลดข้อมูลได้</div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
