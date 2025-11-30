'use client';

import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/RouteGuard';
import StatusBadge from '@/components/admin/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { useOrdersSWR } from '@/lib/hooks/useOrdersSWR';
import { useRealtimeOrders } from '@/lib/hooks/useRealtimeOrders';
import { useAdvancedSearch } from '@/lib/hooks/useAdvancedSearch';
import { useBulkSelect } from '@/lib/hooks/useBulkSelect';
import type { Order } from '@/types';
import {
  Search,
  Eye,
  Check,
  ArrowUpDown,
  Filter,
  RefreshCw,
  Loader2,
  Trash2,
  Download,
  Edit as EditIcon,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import Pagination from '@/components/Pagination';
import SearchInput from '@/components/SearchInput';
import AdvancedFilter, { FilterField, FilterValues } from '@/components/AdvancedFilter';
import ExportButton from '@/components/ExportButton';
import Checkbox from '@/components/Checkbox';
import BulkActionBar, { BulkAction } from '@/components/BulkActionBar';
import { bulkDeleteOrders, bulkUpdateOrderStatus, bulkExportToCSV } from '@/lib/utils/bulk-operations';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'new';
type SortField = 'id' | 'customerName' | 'total' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function AdminOrdersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Use SWR for caching and performance
  const { orders: swrOrders, loading, error, refresh, mutate } = useOrdersSWR();

  // Use Realtime for live updates
  const { orders: realtimeOrders, setOrders: setRealtimeOrders } = useRealtimeOrders(swrOrders);

  // Sync realtime orders back to SWR cache
  useEffect(() => {
    if (realtimeOrders.length > 0 && realtimeOrders !== swrOrders) {
      mutate(realtimeOrders, false); // Update cache without revalidation
    }
  }, [realtimeOrders, swrOrders, mutate]);

  // Use realtime orders for display
  const allOrders = realtimeOrders.length > 0 ? realtimeOrders : swrOrders;

  // Advanced Search & Filter
  const {
    searchTerm,
    setSearchTerm,
    filterValues,
    setFilterValues,
    clearFilters,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSort,
    results: filteredOrdersList,
    totalCount,
    filteredCount,
    hasActiveFilters,
    hasActiveSearch,
  } = useAdvancedSearch<Order>({
    data: allOrders,
    searchFields: ['id', 'customerName', 'customerId'],
    fuzzy: true,
    fuzzyThreshold: 0.6,
    filters: {
      status: (order, value) => order.status === value,
      dateRange: (order, value) => {
        if (!value.from && !value.to) return true;
        const orderDate = new Date(order.createdAt).getTime();
        const from = value.from ? new Date(value.from).getTime() : 0;
        const to = value.to ? new Date(value.to).setHours(23, 59, 59) : Infinity;
        return orderDate >= from && orderDate <= to;
      },
      totalRange: (order, value) => {
        if (!value.min && !value.max) return true;
        const min = value.min ? parseFloat(value.min) : 0;
        const max = value.max ? parseFloat(value.max) : Infinity;
        return order.total >= min && order.total <= max;
      },
    },
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Filter fields for advanced filter component
  const filterFields: FilterField[] = [
    {
      id: 'status',
      label: 'Order Status',
      type: 'select',
      options: [
        { value: 'new', label: 'New' },
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      id: 'dateRange',
      label: 'Order Date',
      type: 'dateRange',
    },
    {
      id: 'totalRange',
      label: 'Total Amount (฿)',
      type: 'numberRange',
    },
  ];

  // Pagination
  const totalPages = Math.ceil(filteredOrdersList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const filteredOrders = filteredOrdersList.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterValues]);

  // Bulk selection
  const bulk = useBulkSelect<Order>({
    items: filteredOrders,
    getItemId: (order) => order.id,
  });

  // Bulk actions handlers
  const handleBulkAction = async (actionId: string) => {
    if (bulk.selectedCount === 0) return;

    try {
      if (actionId === 'delete') {
        await bulkDeleteOrders(bulk.selectedIds);
        // Refresh data after deletion
        await refresh();
        bulk.clearSelection();
      } else if (actionId === 'export') {
        bulkExportToCSV(
          bulk.selectedItems,
          'selected-orders',
          [
            { key: 'id', label: 'Order ID' },
            { key: 'customerName', label: 'Customer' },
            { key: 'status', label: 'Status' },
            { key: 'total', label: 'Total' },
            { key: 'createdAt', label: 'Date' },
            { key: 'channel', label: 'Channel' },
            { key: 'paymentMethod', label: 'Payment' },
          ]
        );
        bulk.clearSelection();
      } else if (actionId.startsWith('status-')) {
        const status = actionId.replace('status-', '') as Order['status'];
        await bulkUpdateOrderStatus(bulk.selectedIds, status);
        await refresh();
        bulk.clearSelection();
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const bulkActions: BulkAction[] = [
    {
      id: 'export',
      label: 'ส่งออก CSV',
      icon: <Download className="h-4 w-4" />,
      variant: 'default',
    },
    {
      id: 'status-processing',
      label: 'Processing',
      icon: <EditIcon className="h-4 w-4" />,
      variant: 'default',
    },
    {
      id: 'status-shipped',
      label: 'Shipped',
      icon: <Check className="h-4 w-4" />,
      variant: 'success',
    },
    {
      id: 'delete',
      label: 'ลบรายการ',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      requiresConfirmation: true,
      confirmationMessage: 'คลิกอีกครั้งเพื่อยืนยันการลบ',
    },
  ];

  const handleMarkAsShipped = async (orderId: string) => {
    if (!confirm('Mark this order as shipped?')) return;

    try {
      // Optimistic update: update order status in UI immediately
      await mutate(
        async () => {
          const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'shipped' }),
          });

          if (!response.ok) {
            throw new Error('Failed to update order status');
          }

          // Return updated orders list
          return allOrders.map((order) =>
            order.id === orderId ? { ...order, status: 'shipped' as OrderStatus } : order
          );
        },
        {
          optimisticData: allOrders.map((order) =>
            order.id === orderId ? { ...order, status: 'shipped' as OrderStatus } : order
          ),
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        }
      );
    } catch (err) {
      console.error('Error updating order:', err);
      alert(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  const statusCounts = {
    all: allOrders.length,
    new: allOrders.filter((o) => o.status === 'new').length,
    processing: allOrders.filter((o) => o.status === 'processing').length,
    shipped: allOrders.filter((o) => o.status === 'shipped').length,
    delivered: allOrders.filter((o) => o.status === 'delivered').length,
    cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="p-6 flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="p-6 flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4 text-center">
              <Filter className="h-12 w-12 text-red-600" />
              <div>
                <p className="text-red-600 font-semibold">เกิดข้อผิดพลาด</p>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{error}</p>
              </div>
              <button
                onClick={() => refresh()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                ลองอีกครั้ง
              </button>
            </div>
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Orders Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            จัดการและติดตามคำสั่งซื้อทั้งหมด
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { label: 'All', value: 'all', count: statusCounts.all },
            { label: 'New', value: 'new', count: statusCounts.new },
            { label: 'Processing', value: 'processing', count: statusCounts.processing },
            { label: 'Shipped', value: 'shipped', count: statusCounts.shipped },
            { label: 'Delivered', value: 'delivered', count: statusCounts.delivered },
            { label: 'Cancelled', value: 'cancelled', count: statusCounts.cancelled },
          ].map((tab) => (
            <div
              key={tab.value}
              className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap"
            >
              {tab.label} ({tab.count})
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input with Fuzzy Search */}
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by Order ID, Customer Name, or Email..."
                fuzzy={true}
                resultsCount={filteredCount}
                totalCount={totalCount}
              />
            </div>

            {/* Advanced Filters & Export */}
            <div className="flex gap-2">
              <AdvancedFilter
                fields={filterFields}
                values={filterValues}
                onChange={setFilterValues}
                onReset={clearFilters}
              />

              <ExportButton
                data={filteredOrdersList}
                filename="orders-export"
                columns={[
                  { key: 'id', label: 'Order ID' },
                  { key: 'customerName', label: 'Customer' },
                  { key: 'status', label: 'Status' },
                  { key: 'total', label: 'Total' },
                  { key: 'createdAt', label: 'Date' },
                ]}
                onExport={(format) => {
                  console.log(`Exporting ${filteredOrdersList.length} orders as ${format}`);
                }}
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={bulk.isAllSelected}
                      onChange={bulk.toggleAll}
                      indeterminate={bulk.isIndeterminate}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Filter className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <p className="text-gray-600 dark:text-gray-400">
                          No orders found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        bulk.isSelected(order.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={bulk.isSelected(order.id)}
                          onChange={() => bulk.toggleItem(order.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {order.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {order.customerName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {order.customerId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {order.items.length} items
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {order.items.map((item) => item.product).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300">
                          {order.paymentMethod}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {order.channel}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(order.total)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(order.createdAt), 'dd MMM yyyy', {
                          locale: th,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {(order.status === 'new' ||
                            order.status === 'processing') && (
                            <button
                              onClick={() => handleMarkAsShipped(order.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                              title="Mark as Shipped"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredOrdersList.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOrdersList.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => {
                setItemsPerPage(newSize);
                setCurrentPage(1);
              }}
              showItemsPerPage={true}
            />
          )}
        </div>

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedCount={bulk.selectedCount}
          totalCount={filteredOrders.length}
          actions={bulkActions}
          onAction={handleBulkAction}
          onClear={bulk.clearSelection}
        />
      </div>
      </AdminLayout>
    </AdminGuard>
  );
}
