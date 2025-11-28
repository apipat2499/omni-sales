'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AuthGuard } from '@/components/RouteGuard';
import CustomerModal from '@/components/customers/CustomerModal';
import {
  Users,
  User,
  TrendingUp,
  AlertCircle,
  Gift,
  Plus,
  Search,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { CustomerProfile, CustomerRFMScore, CustomerAnalytics } from '@/types';

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [rfmScores, setRfmScores] = useState<Record<string, CustomerRFMScore>>({});
  const [analytics, setAnalytics] = useState<Record<string, CustomerAnalytics>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [rfmSegmentFilter, setRfmSegmentFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'demo-user';
    fetchCustomers(userId);
  }, []);

  const fetchCustomers = async (userId: string) => {
    try {
      setIsLoading(true);
      // Use /api/customers instead of /api/customers/profiles
      const response = await fetch(`/api/customers?limit=100`);
      const data = await response.json();

      // Transform customers data to match CustomerProfile type
      const transformedCustomers: CustomerProfile[] = (data.data || []).map((customer: any) => {
        // Determine status from tags
        let status = 'active';
        if (customer.tags?.includes('vip')) status = 'vip';
        else if (customer.tags?.includes('at_risk')) status = 'at_risk';

        return {
          id: customer.id,
          userId: userId,
          customerId: customer.id,
          firstName: customer.name?.split(' ')[0] || '',
          lastName: customer.name?.split(' ').slice(1).join(' ') || '',
          email: customer.email,
          phone: customer.phone,
          companyName: '',
          industry: '',
          customerType: customer.tags?.includes('wholesale') ? 'wholesale' : 'individual',
          source: 'direct',
          status: status,
          lifetimeValue: customer.totalSpent || 0,
          totalOrders: customer.totalOrders || 0,
          totalSpent: customer.totalSpent || 0,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        };
      });

      setCustomers(transformedCustomers);

      const rfmResponse = await fetch(`/api/customers/rfm?userId=${userId}`);
      const rfmData = await rfmResponse.json();
      const rfmMap: Record<string, CustomerRFMScore> = {};
      rfmData.scores?.forEach((score: CustomerRFMScore) => {
        rfmMap[score.customerId] = score;
      });
      setRfmScores(rfmMap);

      const analyticsResponse = await fetch(`/api/customers/analytics?userId=${userId}`);
      const analyticsData = await analyticsResponse.json();
      const analyticsMap: Record<string, CustomerAnalytics> = {};
      analyticsData.forEach((a: CustomerAnalytics) => {
        analyticsMap[a.customerId] = a;
      });
      setAnalytics(analyticsMap);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    const customerRfm = rfmScores[customer.customerId];
    const matchesRfm = rfmSegmentFilter === 'all' || customerRfm?.rfmSegment === rfmSegmentFilter;
    return matchesSearch && matchesStatus && matchesRfm;
  });

  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter((c) => c.status === 'active').length,
    vipCustomers: customers.filter((c) => c.status === 'vip').length,
    atRiskCustomers: customers.filter((c) => c.status === 'at_risk').length,
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <div className="text-gray-600 dark:text-gray-400">Loading customers...</div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  // Export functionality - to be implemented
  // const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
  //   console.log('Export to', format);
  // };

  return (
    <AuthGuard>
      <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold dark:text-white">Customers</h1>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Customer
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 p-6 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">All registered</p>
              </div>
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-3">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800 p-6 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.activeCustomers}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Currently active</p>
              </div>
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800 p-6 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">VIP</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.vipCustomers}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Premium members</p>
              </div>
              <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-3">
                <Gift className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 p-6 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">At Risk</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.atRiskCustomers}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Need attention</p>
              </div>
              <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-3">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap">
              <button onClick={() => setActiveTab('list')} className={`px-6 py-4 font-medium transition-colors ${activeTab === 'list' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}>Customer List</button>
              <button onClick={() => setActiveTab('segments')} className={`px-6 py-4 font-medium transition-colors ${activeTab === 'segments' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}>Segments</button>
              <button onClick={() => setActiveTab('loyalty')} className={`px-6 py-4 font-medium transition-colors ${activeTab === 'loyalty' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}>Loyalty Programs</button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'list' && (
              <div>
                <div className="mb-6 flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    </div>
                  </div>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="vip">VIP</option>
                    <option value="at_risk">At Risk</option>
                  </select>
                </div>

                <div className="space-y-3">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => {
                      const rfm = rfmScores[customer.customerId];
                      return (
                        <div key={customer.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="font-semibold dark:text-white">{customer.firstName} {customer.lastName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
                              </div>
                            </div>
                          </div>

                          <div className="mr-6 text-right">
                            <p className="text-sm font-medium dark:text-white">{customer.totalOrders} orders</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">${customer.totalSpent.toFixed(2)}</p>
                          </div>

                          <div className="mr-6 text-center">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${rfm?.rfmSegment === 'Champions' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900' : rfm?.rfmSegment === 'Loyal Customers' ? 'bg-green-100 text-green-700 dark:bg-green-900' : 'bg-gray-100 text-gray-700 dark:bg-gray-700'}`}>{rfm?.rfmSegment || 'Unscored'}</span>
                          </div>

                          <button onClick={() => setSelectedCustomer(customer)} className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-600 dark:text-gray-400">No customers found</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'segments' && (
              <div>
                <button className="mb-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Create Segment</button>
                <p className="text-gray-600 dark:text-gray-400">Customer segmentation feature coming soon</p>
              </div>
            )}

            {activeTab === 'loyalty' && (
              <div>
                <button className="mb-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Create Program</button>
                <p className="text-gray-600 dark:text-gray-400">Loyalty program management coming soon</p>
              </div>
            )}
          </div>
        </div>

        {selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="max-h-96 w-full max-w-md overflow-auto rounded-lg bg-white p-6 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold dark:text-white">{selectedCustomer.firstName} {selectedCustomer.lastName}</h2>
                <button onClick={() => setSelectedCustomer(null)} className="text-gray-600 hover:text-gray-900 dark:text-gray-400">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-medium dark:text-white">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-medium dark:text-white">{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lifetime Value</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">${selectedCustomer.lifetimeValue.toFixed(2)}</p>
                </div>
              </div>

              <button onClick={() => setSelectedCustomer(null)} className="mt-6 w-full rounded-lg bg-gray-200 px-4 py-2 font-medium dark:bg-gray-700">Close</button>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        <CustomerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            const userId = localStorage.getItem('userId') || 'demo-user';
            fetchCustomers(userId);
          }}
        />
      </div>
    </DashboardLayout>
    </AuthGuard>
  );
}
