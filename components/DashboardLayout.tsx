import Sidebar from './Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="lg:pl-64">
        <main className="pt-16 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
