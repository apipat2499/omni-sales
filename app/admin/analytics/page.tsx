'use client';

import { Suspense } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          }
        >
          <AnalyticsDashboard />
        </Suspense>
      </div>
    </AdminLayout>
  );
}
