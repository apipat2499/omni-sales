'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/RouteGuard';
import {
  Tag,
  Plus,
  Search,
  Eye,
  Trash2,
  Edit,
  RefreshCw,
  TrendingUp,
  Gift,
} from 'lucide-react';
import {
  DiscountCode,
  PromotionalCampaign,
  CouponRedemption,
} from '@/types';

export default function DiscountsPage() {
  const [activeTab, setActiveTab] = useState<'codes' | 'campaigns' | 'redemptions'>('codes');
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [campaigns, setCampaigns] = useState<PromotionalCampaign[]>([]);
  const [redemptions, setRedemptions] = useState<CouponRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCode, setSelectedCode] = useState<DiscountCode | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'demo-user';
    fetchData(userId);
  }, []);

  const fetchData = async (userId: string) => {
    try {
      setIsLoading(true);
      const [codesRes, campaignsRes, redemptionsRes] = await Promise.all([
        fetch(`/api/discounts/codes?userId=${userId}&limit=100`),
        fetch(`/api/discounts/campaigns?userId=${userId}&limit=100`),
        fetch(`/api/discounts/redeem?userId=${userId}&limit=100`),
      ]);

      const codesData = await codesRes.json();
      const campaignsData = await campaignsRes.json();
      const redemptionsData = await redemptionsRes.json();

      setDiscountCodes(codesData.data || []);
      setCampaigns(campaignsData.data || []);
      setRedemptions(redemptionsData.data || []);
    } catch (error) {
      console.error('Error fetching discount data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700';
      case 'expired':
        return 'bg-red-100 text-red-700 dark:bg-red-900';
      case 'archived':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700';
    }
  };

  const filteredCodes = discountCodes.filter((code) => {
    const matchesSearch =
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || code.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalCodes: discountCodes.length,
    activeCodes: discountCodes.filter((c) => c.status === 'active').length,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
    totalRedemptions: redemptions.length,
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex h-screen items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold dark:text-white">Discounts & Coupons</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            <Plus className="h-5 w-5" />
            New Discount
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Codes</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.totalCodes}</p>
              </div>
              <Tag className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.activeCodes}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Campaigns</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.totalCampaigns}</p>
              </div>
              <Gift className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.activeCampaigns}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Redemptions</p>
                <p className="mt-2 text-3xl font-bold dark:text-white">{stats.totalRedemptions}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-pink-500" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('codes')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'codes'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Discount Codes
              </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'campaigns'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Campaigns
              </button>
              <button
                onClick={() => setActiveTab('redemptions')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'redemptions'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Redemptions
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'codes' && (
              <div>
                <div className="mb-6 flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search codes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-3">
                  {filteredCodes.length > 0 ? (
                    filteredCodes.map((code) => (
                      <div
                        key={code.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <p className="font-semibold dark:text-white">{code.code}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {code.description}
                          </p>
                        </div>

                        <div className="mr-6 text-right">
                          <p className="text-sm font-medium dark:text-white">
                            {code.discount_type === 'percentage'
                              ? `${code.discount_value}%`
                              : `$${code.discount_value}`}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Used: {code.current_usage_count}
                            {code.usage_limit && `/${code.usage_limit}`}
                          </p>
                        </div>

                        <div className="mr-6 text-center">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                              code.status
                            )}`}
                          >
                            {code.status}
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedCode(code)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-600 dark:text-gray-400">
                      No discount codes found
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div>
                <div className="mb-6 flex justify-between items-center">
                  <h3 className="text-lg font-semibold dark:text-white">Promotional Campaigns</h3>
                  <button
                    onClick={() => alert('Create Campaign feature coming soon!')}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    New Campaign
                  </button>
                </div>

                <div className="space-y-3">
                  {campaigns.length > 0 ? (
                    campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold text-lg dark:text-white">{campaign.campaign_name}</p>
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                campaign.status
                              )}`}
                            >
                              {campaign.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {campaign.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Type: {campaign.campaign_type}</span>
                            {campaign.start_date && (
                              <span>
                                Start: {new Date(campaign.start_date).toLocaleDateString('th-TH')}
                              </span>
                            )}
                            {campaign.end_date && (
                              <span>
                                End: {new Date(campaign.end_date).toLocaleDateString('th-TH')}
                              </span>
                            )}
                            {campaign.budget_limit && (
                              <span>Budget: ฿{campaign.budget_limit.toLocaleString()}</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => alert(`Campaign details: ${campaign.campaign_name}`)}
                          className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Gift className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No campaigns found</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Create your first campaign to start promoting your products
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'redemptions' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold dark:text-white">Redemption History</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Track how customers are using discount codes
                  </p>
                </div>

                <div className="space-y-3">
                  {redemptions.length > 0 ? (
                    redemptions.map((redemption) => (
                      <div
                        key={redemption.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Tag className="h-5 w-5 text-blue-500" />
                            <p className="font-semibold dark:text-white">{redemption.code}</p>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {redemption.customer_id && (
                              <p>Customer ID: {redemption.customer_id}</p>
                            )}
                            {redemption.order_id && (
                              <p>Order ID: #{redemption.order_id.slice(0, 8).toUpperCase()}</p>
                            )}
                            {redemption.discount_amount && (
                              <p className="text-green-600 dark:text-green-400 font-medium">
                                Saved: ฿{redemption.discount_amount.toLocaleString()}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Redeemed: {new Date(redemption.redeemed_at).toLocaleString('th-TH')}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            redemption.status === 'success'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900'
                              : 'bg-red-100 text-red-700 dark:bg-red-900'
                          }`}
                        >
                          {redemption.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <RefreshCw className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No redemptions yet</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Redemption history will appear here when customers use discount codes
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="max-h-96 w-full max-w-md overflow-auto rounded-lg bg-white p-6 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold dark:text-white">{selectedCode.code}</h2>
                <button
                  onClick={() => setSelectedCode(null)}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                  <p className="font-medium dark:text-white">{selectedCode.description || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Discount Type</p>
                    <p className="font-medium dark:text-white">{selectedCode.discount_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Discount Value</p>
                    <p className="font-medium dark:text-white">{selectedCode.discount_value}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                    <p className="font-medium dark:text-white">{selectedCode.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Usage</p>
                    <p className="font-medium dark:text-white">
                      {selectedCode.current_usage_count}
                      {selectedCode.usage_limit && `/${selectedCode.usage_limit}`}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCode(null)}
                className="mt-6 w-full rounded-lg bg-gray-200 px-4 py-2 font-medium dark:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}
