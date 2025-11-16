'use client';

import { useState, useEffect } from 'react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  status: string;
  usage: {
    currentUsers: number;
    currentStorage: number;
    currentOrders: number;
  };
  features: {
    maxUsers: number;
    maxStorage: number;
    maxOrders: number;
  };
  createdAt: string;
}

export default function TenantsAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'suspended'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tenants');
      const data = await response.json();

      if (data.success) {
        setTenants(data.tenants || []);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTenants();
      }
    } catch (error) {
      console.error('Error updating tenant status:', error);
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesFilter = filter === 'all' ||
      (filter === 'active' && tenant.status === 'active') ||
      (filter === 'trial' && tenant.subscriptionStatus === 'trial') ||
      (filter === 'suspended' && tenant.status === 'suspended');

    const matchesSearch = !searchQuery ||
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  const getPlanBadge = (plan: string) => {
    const styles = {
      starter: 'bg-blue-100 text-blue-800',
      professional: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-yellow-100 text-yellow-800',
    };
    return styles[plan as keyof typeof styles] || styles.starter;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tenant Management</h1>
        <p className="text-gray-600">Manage all tenants, subscriptions, and usage</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search tenants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg ${filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('trial')}
              className={`px-4 py-2 rounded-lg ${filter === 'trial' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Trial
            </button>
            <button
              onClick={() => setFilter('suspended')}
              className={`px-4 py-2 rounded-lg ${filter === 'suspended' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Suspended
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Total Tenants</div>
          <div className="text-3xl font-bold text-gray-900">{tenants.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Active</div>
          <div className="text-3xl font-bold text-green-600">
            {tenants.filter(t => t.status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">On Trial</div>
          <div className="text-3xl font-bold text-blue-600">
            {tenants.filter(t => t.subscriptionStatus === 'trial').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Suspended</div>
          <div className="text-3xl font-bold text-red-600">
            {tenants.filter(t => t.status === 'suspended').length}
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Domain
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                  <div className="text-sm text-gray-500">{tenant.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {tenant.customDomain || `${tenant.subdomain}.app.com`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadge(tenant.subscriptionPlan)}`}>
                    {tenant.subscriptionPlan}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(tenant.status)}`}>
                    {tenant.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>Users: {tenant.usage.currentUsers}/{tenant.features.maxUsers === -1 ? '∞' : tenant.features.maxUsers}</div>
                  <div>Storage: {(tenant.usage.currentStorage / 1024).toFixed(1)}GB/{tenant.features.maxStorage === -1 ? '∞' : (tenant.features.maxStorage / 1024).toFixed(1)}GB</div>
                  <div>Orders: {tenant.usage.currentOrders}/{tenant.features.maxOrders === -1 ? '∞' : tenant.features.maxOrders}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => toggleTenantStatus(tenant.id, tenant.status)}
                    className={`mr-3 ${tenant.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                  >
                    {tenant.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                  <a
                    href={`/admin/tenants/${tenant.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTenants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No tenants found</p>
          </div>
        )}
      </div>
    </div>
  );
}
