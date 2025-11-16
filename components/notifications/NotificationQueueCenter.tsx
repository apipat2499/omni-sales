/**
 * Notification Queue Center Component
 *
 * Displays email and SMS notification queue, delivery status,
 * analytics, and management features.
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Mail,
  MessageSquare,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Eye,
  BarChart3,
  Filter,
  Search,
} from 'lucide-react';
import { useNotificationService } from '@/lib/hooks/useNotificationService';
import { useI18n } from '@/lib/hooks/useI18n';
import type { EmailMessage, EmailStatus } from '@/lib/utils/email-service';
import type { SMSMessage, SMSStatus } from '@/lib/utils/sms-service';

// ============================================================================
// Type Definitions
// ============================================================================

type TabType = 'email' | 'sms' | 'analytics';
type FilterStatus = 'all' | EmailStatus | SMSStatus;

// ============================================================================
// Main Component
// ============================================================================

export default function NotificationQueueCenter() {
  const i18n = useI18n();
  const {
    emails,
    sms,
    emailStats,
    smsStats,
    isLoading,
    error,
    retryEmail,
    retrySMS,
    deleteEmail,
    deleteSMS,
    processEmailQueue,
    processSMSQueue,
    refresh,
  } = useNotificationService();

  const [activeTab, setActiveTab] = useState<TabType>('email');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<EmailMessage | SMSMessage | null>(null);

  // Filter and search
  const filteredEmails = useMemo(() => {
    let filtered = emails;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(e => {
        const to = Array.isArray(e.to) ? e.to.join(' ') : e.to;
        return (
          to.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [emails, filterStatus, searchQuery]);

  const filteredSMS = useMemo(() => {
    let filtered = sms;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [sms, filterStatus, searchQuery]);

  // Actions
  const handleRetry = async (id: string, type: 'email' | 'sms') => {
    try {
      if (type === 'email') {
        await retryEmail(id);
      } else {
        await retrySMS(id);
      }
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const handleDelete = (id: string, type: 'email' | 'sms') => {
    if (type === 'email') {
      deleteEmail(id);
    } else {
      deleteSMS(id);
    }
    setSelectedItem(null);
  };

  const handleProcessQueue = async () => {
    try {
      if (activeTab === 'email') {
        await processEmailQueue();
      } else {
        await processSMSQueue();
      }
    } catch (error) {
      console.error('Process queue failed:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold dark:text-white">
            {i18n.t('notifications.queueCenter')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleProcessQueue}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {i18n.t('notifications.processQueue')}
            </button>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'email'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Mail className="h-4 w-4" />
            {i18n.t('notifications.emails')} ({emails.length})
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'sms'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            {i18n.t('notifications.sms')} ({sms.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            {i18n.t('notifications.analytics')}
          </button>
        </div>

        {/* Filters */}
        {activeTab !== 'analytics' && (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={i18n.t('common.search')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="all">{i18n.t('common.all')}</option>
              <option value="pending">{i18n.t('notifications.status.pending')}</option>
              <option value="sending">{i18n.t('notifications.status.sending')}</option>
              <option value="sent">{i18n.t('notifications.status.sent')}</option>
              <option value="failed">{i18n.t('notifications.status.failed')}</option>
              {activeTab === 'email' && (
                <>
                  <option value="bounced">{i18n.t('notifications.status.bounced')}</option>
                  <option value="opened">{i18n.t('notifications.status.opened')}</option>
                  <option value="clicked">{i18n.t('notifications.status.clicked')}</option>
                </>
              )}
              {activeTab === 'sms' && (
                <>
                  <option value="delivered">{i18n.t('notifications.status.delivered')}</option>
                  <option value="optout">{i18n.t('notifications.status.optout')}</option>
                </>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {activeTab === 'email' && (
          <EmailList
            emails={filteredEmails}
            onRetry={id => handleRetry(id, 'email')}
            onDelete={id => handleDelete(id, 'email')}
            onView={setSelectedItem}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'sms' && (
          <SMSList
            messages={filteredSMS}
            onRetry={id => handleRetry(id, 'sms')}
            onDelete={id => handleDelete(id, 'sms')}
            onView={setSelectedItem}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView emailStats={emailStats} smsStats={smsStats} />
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onRetry={() => handleRetry(selectedItem.id, 'templateId' in selectedItem ? 'sms' : 'email')}
          onDelete={() => handleDelete(selectedItem.id, 'templateId' in selectedItem ? 'sms' : 'email')}
        />
      )}
    </div>
  );
}

// ============================================================================
// Email List Component
// ============================================================================

function EmailList({
  emails,
  onRetry,
  onDelete,
  onView,
  isLoading,
}: {
  emails: EmailMessage[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (email: EmailMessage) => void;
  isLoading: boolean;
}) {
  const i18n = useI18n();

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">{i18n.t('common.loading')}</div>;
  }

  if (emails.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {i18n.t('notifications.noEmails')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {emails.map(email => (
        <div
          key={email.id}
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={email.status} type="email" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(email.createdAt)}
                </span>
              </div>
              <h4 className="font-medium dark:text-white truncate mb-1">{email.subject}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                To: {Array.isArray(email.to) ? email.to.join(', ') : email.to}
              </p>
              {email.failureReason && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Error: {email.failureReason}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onView(email)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </button>
              {email.status === 'failed' && email.retryCount < email.maxRetries && (
                <button
                  onClick={() => onRetry(email.id)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  title="Retry"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => onDelete(email.id)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// SMS List Component
// ============================================================================

function SMSList({
  messages,
  onRetry,
  onDelete,
  onView,
  isLoading,
}: {
  messages: SMSMessage[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (sms: SMSMessage) => void;
  isLoading: boolean;
}) {
  const i18n = useI18n();

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">{i18n.t('common.loading')}</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {i18n.t('notifications.noSMS')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map(sms => (
        <div
          key={sms.id}
          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={sms.status} type="sms" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(sms.createdAt)}
                </span>
              </div>
              <p className="text-sm dark:text-white mb-1 line-clamp-2">{sms.body}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">To: {sms.to}</p>
              {sms.failureReason && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Error: {sms.failureReason}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onView(sms)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </button>
              {sms.status === 'failed' && sms.retryCount < sms.maxRetries && (
                <button
                  onClick={() => onRetry(sms.id)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  title="Retry"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => onDelete(sms.id)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Analytics View Component
// ============================================================================

function AnalyticsView({ emailStats, smsStats }: { emailStats: any; smsStats: any }) {
  const i18n = useI18n();

  return (
    <div className="space-y-6">
      {/* Email Analytics */}
      <div>
        <h3 className="text-lg font-semibold dark:text-white mb-4">
          {i18n.t('notifications.emailAnalytics')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label={i18n.t('notifications.total')}
            value={emailStats.total}
            icon={Mail}
            color="blue"
          />
          <StatCard
            label={i18n.t('notifications.sent')}
            value={emailStats.sent}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label={i18n.t('notifications.failed')}
            value={emailStats.failed}
            icon={XCircle}
            color="red"
          />
          <StatCard
            label={i18n.t('notifications.pending')}
            value={emailStats.pending}
            icon={Clock}
            color="yellow"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <StatCard
            label={i18n.t('notifications.openRate')}
            value={`${emailStats.openRate.toFixed(1)}%`}
            icon={Eye}
            color="purple"
          />
          <StatCard
            label={i18n.t('notifications.clickRate')}
            value={`${emailStats.clickRate.toFixed(1)}%`}
            icon={CheckCircle}
            color="indigo"
          />
        </div>
      </div>

      {/* SMS Analytics */}
      <div>
        <h3 className="text-lg font-semibold dark:text-white mb-4">
          {i18n.t('notifications.smsAnalytics')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label={i18n.t('notifications.total')}
            value={smsStats.total}
            icon={MessageSquare}
            color="blue"
          />
          <StatCard
            label={i18n.t('notifications.sent')}
            value={smsStats.sent}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label={i18n.t('notifications.failed')}
            value={smsStats.failed}
            icon={XCircle}
            color="red"
          />
          <StatCard
            label={i18n.t('notifications.pending')}
            value={smsStats.pending}
            icon={Clock}
            color="yellow"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <StatCard
            label={i18n.t('notifications.deliveryRate')}
            value={`${smsStats.deliveryRate.toFixed(1)}%`}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label={i18n.t('notifications.optedOut')}
            value={smsStats.optedOut}
            icon={AlertCircle}
            color="red"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function StatusBadge({ status, type }: { status: string; type: 'email' | 'sms' }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    sending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    sent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    bounced: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    opened: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    clicked: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    optout: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        <div className={`p-2 rounded ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold dark:text-white">{value}</div>
    </div>
  );
}

function DetailModal({
  item,
  onClose,
  onRetry,
  onDelete,
}: {
  item: EmailMessage | SMSMessage;
  onClose: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const i18n = useI18n();
  const isEmail = 'subject' in item;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-bold dark:text-white">
            {isEmail ? i18n.t('notifications.emailDetails') : i18n.t('notifications.smsDetails')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {i18n.t('common.status')}
            </label>
            <div className="mt-1">
              <StatusBadge status={item.status} type={isEmail ? 'email' : 'sms'} />
            </div>
          </div>

          {isEmail && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {i18n.t('notifications.subject')}
                </label>
                <p className="mt-1 dark:text-white">{(item as EmailMessage).subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {i18n.t('notifications.to')}
                </label>
                <p className="mt-1 dark:text-white">
                  {Array.isArray((item as EmailMessage).to)
                    ? (item as EmailMessage).to.join(', ')
                    : (item as EmailMessage).to}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {i18n.t('notifications.htmlContent')}
                </label>
                <div
                  className="mt-1 p-4 border border-gray-200 dark:border-gray-700 rounded max-h-64 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: (item as EmailMessage).htmlContent }}
                />
              </div>
            </>
          )}

          {!isEmail && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {i18n.t('notifications.to')}
                </label>
                <p className="mt-1 dark:text-white">{(item as SMSMessage).to}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {i18n.t('notifications.message')}
                </label>
                <p className="mt-1 dark:text-white whitespace-pre-wrap">{(item as SMSMessage).body}</p>
              </div>
            </>
          )}

          {item.failureReason && (
            <div>
              <label className="text-sm font-medium text-red-600 dark:text-red-400">
                {i18n.t('notifications.error')}
              </label>
              <p className="mt-1 text-red-600 dark:text-red-400">{item.failureReason}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-gray-600 dark:text-gray-400">
                {i18n.t('notifications.created')}
              </label>
              <p className="dark:text-white">{formatDate(item.createdAt)}</p>
            </div>
            {item.sentAt && (
              <div>
                <label className="text-gray-600 dark:text-gray-400">
                  {i18n.t('notifications.sent')}
                </label>
                <p className="dark:text-white">{formatDate(item.sentAt)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
          {item.status === 'failed' && item.retryCount < item.maxRetries && (
            <button
              onClick={() => {
                onRetry();
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {i18n.t('notifications.retry')}
            </button>
          )}
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {i18n.t('common.delete')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {i18n.t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
