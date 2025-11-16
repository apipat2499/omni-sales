/**
 * PromotionManager Component
 * Manages promotional campaigns with calendar view and performance tracking
 */

'use client';

import React, { useState, useMemo } from 'react';
import { usePricingRules } from '@/lib/hooks/usePricingRules';
import type { PricingRule } from '@/lib/utils/pricing-rules';

interface Promotion {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  rule: PricingRule;
  budgetLimit?: number;
  budgetUsed: number;
  analytics: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  createdAt: Date;
}

interface PromotionManagerProps {
  className?: string;
}

export default function PromotionManager({ className = '' }: PromotionManagerProps) {
  const { rules, createRule, updateRule } = usePricingRules();
  const [view, setView] = useState<'list' | 'calendar' | 'analytics'>('list');
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock promotions data (in real app, this would come from API/storage)
  const [promotions] = useState<Promotion[]>([
    {
      id: 'promo_1',
      name: 'Black Friday Sale',
      startDate: new Date('2024-11-29'),
      endDate: new Date('2024-12-01'),
      rule: rules[0] || ({} as PricingRule),
      budgetLimit: 10000,
      budgetUsed: 3250,
      analytics: {
        impressions: 15420,
        clicks: 1234,
        conversions: 89,
        revenue: 12450,
      },
      status: 'scheduled',
      createdAt: new Date('2024-11-01'),
    },
    {
      id: 'promo_2',
      name: 'Summer Clearance',
      startDate: new Date('2024-11-01'),
      endDate: new Date('2024-11-30'),
      rule: rules[1] || ({} as PricingRule),
      budgetLimit: 5000,
      budgetUsed: 4890,
      analytics: {
        impressions: 8920,
        clicks: 654,
        conversions: 45,
        revenue: 8750,
      },
      status: 'active',
      createdAt: new Date('2024-10-15'),
    },
  ]);

  /**
   * Get promotion status
   */
  const getPromotionStatus = (promotion: Promotion): Promotion['status'] => {
    const now = new Date();
    if (promotion.startDate > now) return 'scheduled';
    if (promotion.endDate < now) return 'completed';
    return 'active';
  };

  /**
   * Filter promotions by status
   */
  const activePromotions = useMemo(
    () => promotions.filter((p) => getPromotionStatus(p) === 'active'),
    [promotions]
  );

  const scheduledPromotions = useMemo(
    () => promotions.filter((p) => getPromotionStatus(p) === 'scheduled'),
    [promotions]
  );

  const completedPromotions = useMemo(
    () => promotions.filter((p) => getPromotionStatus(p) === 'completed'),
    [promotions]
  );

  /**
   * Calculate total metrics
   */
  const totalMetrics = useMemo(() => {
    return promotions.reduce(
      (acc, promo) => ({
        impressions: acc.impressions + promo.analytics.impressions,
        clicks: acc.clicks + promo.analytics.clicks,
        conversions: acc.conversions + promo.analytics.conversions,
        revenue: acc.revenue + promo.analytics.revenue,
      }),
      { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
    );
  }, [promotions]);

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Promotion Manager</h2>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage promotional campaigns
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Promotion
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg ${
              view === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg ${
              view === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setView('analytics')}
            className={`px-4 py-2 rounded-lg ${
              view === 'analytics'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Impressions</div>
            <div className="text-2xl font-bold text-blue-600">
              {totalMetrics.impressions.toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Clicks</div>
            <div className="text-2xl font-bold text-green-600">
              {totalMetrics.clicks.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              CTR: {((totalMetrics.clicks / totalMetrics.impressions) * 100).toFixed(2)}%
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Conversions</div>
            <div className="text-2xl font-bold text-purple-600">
              {totalMetrics.conversions.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              CVR: {((totalMetrics.conversions / totalMetrics.clicks) * 100).toFixed(2)}%
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-2xl font-bold text-orange-600">
              ${totalMetrics.revenue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-6">
          {/* Active Promotions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Active Promotions ({activePromotions.length})
            </h3>
            {activePromotions.length > 0 ? (
              <div className="space-y-3">
                {activePromotions.map((promo) => (
                  <PromotionCard
                    key={promo.id}
                    promotion={promo}
                    onClick={() => setSelectedPromotion(promo)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No active promotions</p>
            )}
          </div>

          {/* Scheduled Promotions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Scheduled Promotions ({scheduledPromotions.length})
            </h3>
            {scheduledPromotions.length > 0 ? (
              <div className="space-y-3">
                {scheduledPromotions.map((promo) => (
                  <PromotionCard
                    key={promo.id}
                    promotion={promo}
                    onClick={() => setSelectedPromotion(promo)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No scheduled promotions</p>
            )}
          </div>

          {/* Completed Promotions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Completed Promotions ({completedPromotions.length})
            </h3>
            {completedPromotions.length > 0 ? (
              <div className="space-y-3">
                {completedPromotions.map((promo) => (
                  <PromotionCard
                    key={promo.id}
                    promotion={promo}
                    onClick={() => setSelectedPromotion(promo)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No completed promotions</p>
            )}
          </div>
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="mt-4">
          <CalendarView promotions={promotions} onPromotionClick={setSelectedPromotion} />
        </div>
      )}

      {/* Analytics View */}
      {view === 'analytics' && (
        <div className="mt-4">
          <AnalyticsView promotions={promotions} />
        </div>
      )}

      {/* Promotion Detail Modal */}
      {selectedPromotion && (
        <PromotionDetailModal
          promotion={selectedPromotion}
          onClose={() => setSelectedPromotion(null)}
        />
      )}

      {/* Create Promotion Modal */}
      {showCreateModal && (
        <CreatePromotionModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

/**
 * Promotion Card Component
 */
interface PromotionCardProps {
  promotion: Promotion;
  onClick: () => void;
}

function PromotionCard({ promotion, onClick }: PromotionCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    scheduled: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
    draft: 'bg-yellow-100 text-yellow-800',
    paused: 'bg-orange-100 text-orange-800',
  };

  const budgetPercentage = promotion.budgetLimit
    ? (promotion.budgetUsed / promotion.budgetLimit) * 100
    : 0;

  return (
    <div
      onClick={onClick}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{promotion.name}</h4>
          <p className="text-sm text-gray-600 mt-1">
            {promotion.startDate.toLocaleDateString()} - {promotion.endDate.toLocaleDateString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[promotion.status]}`}>
          {promotion.status}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-3">
        <div>
          <div className="text-xs text-gray-500">Impressions</div>
          <div className="text-sm font-semibold text-gray-900">
            {promotion.analytics.impressions.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Clicks</div>
          <div className="text-sm font-semibold text-gray-900">
            {promotion.analytics.clicks.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Conversions</div>
          <div className="text-sm font-semibold text-gray-900">
            {promotion.analytics.conversions.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Revenue</div>
          <div className="text-sm font-semibold text-gray-900">
            ${promotion.analytics.revenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Budget Progress */}
      {promotion.budgetLimit && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Budget Used</span>
            <span>
              ${promotion.budgetUsed.toLocaleString()} / ${promotion.budgetLimit.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                budgetPercentage > 90
                  ? 'bg-red-500'
                  : budgetPercentage > 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Calendar View Component
 */
interface CalendarViewProps {
  promotions: Promotion[];
  onPromotionClick: (promotion: Promotion) => void;
}

function CalendarView({ promotions, onPromotionClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days = [];
  const date = new Date(startDate);
  while (date <= endDate) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  const getPromotionsForDate = (date: Date) => {
    return promotions.filter(
      (promo) =>
        date >= new Date(promo.startDate.toDateString()) &&
        date <= new Date(promo.endDate.toDateString())
    );
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => {
          const dayPromotions = getPromotionsForDate(day);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`min-h-24 border rounded p-2 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'}`}
            >
              <div className="text-sm text-gray-700 mb-1">{day.getDate()}</div>
              <div className="space-y-1">
                {dayPromotions.map((promo) => (
                  <button
                    key={promo.id}
                    onClick={() => onPromotionClick(promo)}
                    className="w-full text-left text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 truncate"
                  >
                    {promo.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Analytics View Component
 */
interface AnalyticsViewProps {
  promotions: Promotion[];
}

function AnalyticsView({ promotions }: AnalyticsViewProps) {
  const topPerformers = useMemo(() => {
    return [...promotions]
      .sort((a, b) => b.analytics.revenue - a.analytics.revenue)
      .slice(0, 5);
  }, [promotions]);

  return (
    <div className="space-y-6">
      {/* Top Performers */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Promotions</h3>
        <div className="space-y-3">
          {topPerformers.map((promo, index) => (
            <div key={promo.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{promo.name}</h4>
                <div className="grid grid-cols-4 gap-4 mt-2">
                  <div>
                    <div className="text-xs text-gray-500">Revenue</div>
                    <div className="text-sm font-semibold text-green-600">
                      ${promo.analytics.revenue.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Conversions</div>
                    <div className="text-sm font-semibold text-blue-600">
                      {promo.analytics.conversions}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">CTR</div>
                    <div className="text-sm font-semibold text-purple-600">
                      {((promo.analytics.clicks / promo.analytics.impressions) * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">CVR</div>
                    <div className="text-sm font-semibold text-orange-600">
                      {((promo.analytics.conversions / promo.analytics.clicks) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p className="text-gray-500">Chart visualization would go here</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Promotion Detail Modal
 */
interface PromotionDetailModalProps {
  promotion: Promotion;
  onClose: () => void;
}

function PromotionDetailModal({ promotion, onClose }: PromotionDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{promotion.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Date Range */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Campaign Period</h3>
              <p className="text-gray-900">
                {promotion.startDate.toLocaleDateString()} - {promotion.endDate.toLocaleDateString()}
              </p>
            </div>

            {/* Analytics */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Impressions</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {promotion.analytics.impressions.toLocaleString()}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Clicks</div>
                  <div className="text-2xl font-bold text-green-600">
                    {promotion.analytics.clicks.toLocaleString()}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Conversions</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {promotion.analytics.conversions.toLocaleString()}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Revenue</div>
                  <div className="text-2xl font-bold text-orange-600">
                    ${promotion.analytics.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Budget */}
            {promotion.budgetLimit && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Budget</h3>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Spent: ${promotion.budgetUsed.toLocaleString()}</span>
                  <span>Limit: ${promotion.budgetLimit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{
                      width: `${Math.min((promotion.budgetUsed / promotion.budgetLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Create Promotion Modal
 */
interface CreatePromotionModalProps {
  onClose: () => void;
}

function CreatePromotionModal({ onClose }: CreatePromotionModalProps) {
  const { rules } = usePricingRules();
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    ruleId: '',
    budgetLimit: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle creation logic
    alert('Promotion created!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Promotion</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Promotion Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pricing Rule
              </label>
              <select
                value={formData.ruleId}
                onChange={(e) => setFormData({ ...formData, ruleId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a rule...</option>
                {rules.map((rule) => (
                  <option key={rule.id} value={rule.id}>
                    {rule.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Limit (optional)
              </label>
              <input
                type="number"
                value={formData.budgetLimit}
                onChange={(e) => setFormData({ ...formData, budgetLimit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="No limit"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
