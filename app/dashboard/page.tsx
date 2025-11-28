import DashboardLayout from '@/components/DashboardLayout';
import { AuthGuard } from '@/components/RouteGuard';
import StatsCards from '@/components/dashboard/StatsCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import CategoryChart from '@/components/dashboard/CategoryChart';
import RecentOrders from '@/components/dashboard/RecentOrders';
import ActiveDiscounts from '@/components/dashboard/ActiveDiscounts';
import RecentNotifications from '@/components/dashboard/RecentNotifications';
import QuickActions from '@/components/dashboard/QuickActions';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">ภาพรวมธุรกิจของคุณ</p>
        </div>

        <StatsCards />

        <QuickActions />

        <div className="grid lg:grid-cols-2 gap-6">
          <RevenueChart />
          <CategoryChart />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ActiveDiscounts />
          <RecentNotifications />
        </div>

        <RecentOrders />
      </div>
    </DashboardLayout>
    </AuthGuard>
  );
}
