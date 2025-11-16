'use client';

/**
 * CustomerDetailView Component
 *
 * Displays complete customer profile with purchase history,
 * communication history, preferences, notes, and insights
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Edit,
  Trash2,
  Plus,
  X,
  Tag,
  MessageSquare,
  Bell,
  Clock,
  BarChart3,
  Package,
} from 'lucide-react';
import { ExtendedCustomer, CustomerInsights, PurchaseHistory } from '@/lib/utils/customer-management';
import { useCustomerManagement } from '@/lib/hooks/useCustomerManagement';
import { useI18n } from '@/lib/hooks/useI18n';
import { formatDate, formatCurrency } from '@/lib/utils/i18n';

interface CustomerDetailViewProps {
  customer: ExtendedCustomer;
  onBack: () => void;
}

export default function CustomerDetailView({ customer, onBack }: CustomerDetailViewProps) {
  const { t } = useI18n();
  const {
    getPurchaseHistory,
    getInsights,
    notes,
    loadNotes,
    addNote,
    deleteNote,
    addTag,
    removeTag,
    updatePreferences,
  } = useCustomerManagement();

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'notes' | 'preferences'>('overview');
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadNotes(customer.id);
    const history = getPurchaseHistory(customer.id);
    const customerInsights = getInsights(customer.id);
    setPurchaseHistory(history);
    setInsights(customerInsights);
  }, [customer.id]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addNote(customer.id, newNote, 'Current User');
      setNewNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    try {
      await addTag(customer.id, newTag);
      setNewTag('');
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    try {
      await removeTag(customer.id, tag);
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'VIP':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
      case 'Regular':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
      case 'Occasional':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
      case 'New':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'At Risk':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100';
      case 'Inactive':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
    }
  };

  const getChurnRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-orange-600 dark:text-orange-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          {t('common.back')}
        </button>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSegmentColor(customer.segment)}`}>
            {customer.segment}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              customer.isActive
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
            }`}
          >
            {customer.isActive ? t('customer.active') : t('customer.inactive')}
          </span>
        </div>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{customer.name}</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Mail className="h-5 w-5" />
              <a href={`mailto:${customer.email}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                {customer.email}
              </a>
            </div>

            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Phone className="h-5 w-5" />
              <a href={`tel:${customer.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                {customer.phone}
              </a>
            </div>

            {customer.company && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Building className="h-5 w-5" />
                <span>{customer.company}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="h-5 w-5" />
              <span>
                {t('customer.customerSince')}: {formatDate(customer.createdAt)}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              {customer.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-600 dark:hover:text-red-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder={t('customer.addTag')}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <button
                  onClick={handleAddTag}
                  className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('customer.lifetimeValue')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(customer.lifetime_value)}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-green-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('customer.totalOrders')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{customer.total_orders}</p>
          </div>
          <ShoppingCart className="h-8 w-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('customer.avgOrderValue')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(customer.average_order_value)}
            </p>
          </div>
          <BarChart3 className="h-8 w-8 text-purple-500" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('customer.lastOrder')}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {customer.last_order_date ? formatDate(customer.last_order_date) : t('customer.noOrders')}
            </p>
          </div>
          <Calendar className="h-8 w-8 text-orange-500" />
        </div>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {[
            { key: 'overview', label: t('customer.overview'), icon: BarChart3 },
            { key: 'history', label: t('customer.purchaseHistory'), icon: ShoppingCart },
            { key: 'notes', label: t('customer.notes'), icon: MessageSquare },
            { key: 'preferences', label: t('customer.preferences'), icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'notes' && renderNotes()}
        {activeTab === 'preferences' && renderPreferences()}
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Customer Insights */}
      {insights && (
        <>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('customer.insights')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('customer.purchaseFrequency')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {insights.purchaseFrequency > 0
                    ? `${insights.purchaseFrequency.toFixed(1)} ${t('customer.days')}`
                    : t('customer.noData')}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('customer.churnRisk')}</p>
                <p className={`text-xl font-bold ${getChurnRiskColor(insights.churnRisk)}`}>
                  {insights.churnRisk.toUpperCase()}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('customer.reorderLikelihood')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {insights.reorderLikelihood.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          {/* Top Products */}
          {insights.topProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('customer.topProducts')}
              </h3>
              <div className="space-y-2">
                {insights.topProducts.map((product, index) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400 dark:text-gray-500">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.productName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {product.quantity} {t('customer.units')}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(product.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderHistory = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('customer.purchaseHistory')} ({purchaseHistory.length})
      </h3>

      {purchaseHistory.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">{t('customer.noPurchaseHistory')}</p>
      ) : (
        <div className="space-y-3">
          {purchaseHistory.map((order) => (
            <div key={order.orderId} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t('customer.order')} #{order.orderId.slice(0, 8)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(order.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{order.items.length} items</p>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {order.items.map((item) => item.productName).join(', ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderNotes = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('customer.notes')} ({notes.length})
      </h3>

      <div className="mb-4">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={t('customer.addNote')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={3}
        />
        <button
          onClick={handleAddNote}
          disabled={!newNote.trim()}
          className="mt-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('customer.addNote')}
        </button>
      </div>

      <div className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white">{note.content}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {note.author} • {formatDate(note.createdAt)}
                </p>
              </div>
              <button
                onClick={() => deleteNote(note.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('customer.communicationPreferences')}
      </h3>

      <div className="space-y-4">
        {(['newsletter', 'email', 'sms', 'push'] as const).map((channel) => (
          <div key={channel} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t(`customer.${channel}`)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(`customer.${channel}Description`)}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={customer.preferences[channel]}
                onChange={(e) => updatePreferences(customer.id, { [channel]: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{t('customer.quietHours')}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('customer.startTime')}
              </label>
              <input
                type="time"
                value={customer.preferences.quietHours.start}
                onChange={(e) =>
                  updatePreferences(customer.id, {
                    quietHours: { ...customer.preferences.quietHours, start: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('customer.endTime')}
              </label>
              <input
                type="time"
                value={customer.preferences.quietHours.end}
                onChange={(e) =>
                  updatePreferences(customer.id, {
                    quietHours: { ...customer.preferences.quietHours, end: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {renderHeader()}
      {renderQuickStats()}
      {renderTabs()}
    </div>
  );
}
