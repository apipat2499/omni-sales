import DashboardLayout from '@/components/DashboardLayout';
import StatsCards from '@/components/dashboard/StatsCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import CategoryChart from '@/components/dashboard/CategoryChart';
import RecentOrders from '@/components/dashboard/RecentOrders';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">ภาพรวมธุรกิจของคุณ</p>
        </div>

        <StatsCards />

        <div className="grid lg:grid-cols-2 gap-6">
          <RevenueChart />
          <CategoryChart />
        </div>

        <RecentOrders />
      </div>
    </DashboardLayout>
  );
}
