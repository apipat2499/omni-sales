'use client';

/**
 * CustomerList Component
 *
 * Sortable, filterable table displaying customer list
 * with selection, pagination, and quick actions
 */

import React from 'react';
import {
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  Mail,
  MessageSquare,
  MoreVertical,
  Check,
} from 'lucide-react';
import { ExtendedCustomer, CustomerSortOptions } from '@/lib/utils/customer-management';
import { useI18n } from '@/lib/hooks/useI18n';
import { formatDate, formatCurrency } from '@/lib/utils/i18n';

interface CustomerListProps {
  customers: ExtendedCustomer[];
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  onView: (customer: ExtendedCustomer) => void;
  onEdit: (customer: ExtendedCustomer) => void;
  onDelete: (customerId: string) => void;
  sortOptions: CustomerSortOptions;
  onSort: (options: CustomerSortOptions) => void;
}

export default function CustomerList({
  customers,
  selectedIds,
  onSelectIds,
  onView,
  onEdit,
  onDelete,
  sortOptions,
  onSort,
}: CustomerListProps) {
  const { t } = useI18n();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectIds(customers.map((c) => c.id));
    } else {
      onSelectIds([]);
    }
  };

  const handleSelectOne = (customerId: string, checked: boolean) => {
    if (checked) {
      onSelectIds([...selectedIds, customerId]);
    } else {
      onSelectIds(selectedIds.filter((id) => id !== customerId));
    }
  };

  const handleSort = (field: CustomerSortOptions['field']) => {
    if (sortOptions.field === field) {
      onSort({
        field,
        direction: sortOptions.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onSort({ field, direction: 'asc' });
    }
  };

  const getSortIcon = (field: CustomerSortOptions['field']) => {
    if (sortOptions.field !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return (
      <ArrowUpDown
        className={`h-4 w-4 ${sortOptions.direction === 'asc' ? 'rotate-180' : ''} text-blue-600 dark:text-blue-400`}
      />
    );
  };

  const getSegmentBadgeColor = (segment: string) => {
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

  const getDaysSinceLastOrder = (date: Date | null) => {
    if (!date) return null;
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return t('customer.today');
    if (days === 1) return t('customer.yesterday');
    if (days < 7) return t('customer.daysAgo', { days });
    if (days < 30) return t('customer.weeksAgo', { weeks: Math.floor(days / 7) });
    if (days < 365) return t('customer.monthsAgo', { months: Math.floor(days / 30) });
    return t('customer.yearsAgo', { years: Math.floor(days / 365) });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={customers.length > 0 && selectedIds.length === customers.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {t('customer.name')}
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {t('customer.email')}
                  {getSortIcon('email')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('customer.phone')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('customer.segment')}
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('total_orders')}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {t('customer.totalOrders')}
                  {getSortIcon('total_orders')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('lifetime_value')}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {t('customer.lifetimeValue')}
                  {getSortIcon('lifetime_value')}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('last_order_date')}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {t('customer.lastOrder')}
                  {getSortIcon('last_order_date')}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('common.status')}
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  {t('customer.noCustomersFound')}
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(customer.id)}
                      onChange={(e) => handleSelectOne(customer.id, e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onView(customer)}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      {customer.name}
                    </button>
                    {customer.company && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{customer.company}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{customer.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{customer.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSegmentBadgeColor(customer.segment)}`}>
                      {customer.segment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                    {customer.total_orders}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                    {formatCurrency(customer.lifetime_value)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {customer.last_order_date ? getDaysSinceLastOrder(customer.last_order_date) : t('customer.never')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                        customer.isActive
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                      }`}
                    >
                      {customer.isActive && <Check className="h-3 w-3" />}
                      {customer.isActive ? t('customer.active') : t('customer.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onView(customer)}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        title={t('common.view')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit(customer)}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        title={t('common.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(customer.id)}
                        className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <a
                        href={`mailto:${customer.email}`}
                        className="p-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                        title={t('customer.sendEmail')}
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
