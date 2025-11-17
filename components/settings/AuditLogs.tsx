'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Filter, Download } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { exportToCSV } from '@/lib/utils/backup';

interface AuditLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

async function fetchAuditLogs(page: number, filters: any) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    ...filters,
  });

  const response = await fetch(`/api/audit-logs?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch audit logs');
  }
  return response.json();
}

const ACTION_LABELS: Record<string, string> = {
  create: 'สร้าง',
  update: 'แก้ไข',
  delete: 'ลบ',
  view: 'เปิดดู',
  export: 'ส่งออก',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  update: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  delete: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  view: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  export: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
};

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, filters],
    queryFn: () => fetchAuditLogs(page, filters),
    staleTime: 30 * 1000,
  });

  const logs = data?.data || [];
  const pagination = data?.pagination;

  const handleExport = () => {
    if (logs.length === 0) return;
    exportToCSV(logs, 'audit-logs');
  };

  if (isLoading) {
    return <SkeletonLoader type="list" count={10} />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">เกิดข้อผิดพลาดในการโหลด audit logs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Audit Logs
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              ประวัติการเปลี่ยนแปลงทั้งหมดในระบบ
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filters.action}
            onChange={(e) => {
              setFilters({ ...filters, action: e.target.value });
              setPage(1);
            }}
            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            <option value="">ทุกการกระทำ</option>
            <option value="create">สร้าง</option>
            <option value="update">แก้ไข</option>
            <option value="delete">ลบ</option>
            <option value="view">เปิดดู</option>
            <option value="export">ส่งออก</option>
          </select>

          <select
            value={filters.entityType}
            onChange={(e) => {
              setFilters({ ...filters, entityType: e.target.value });
              setPage(1);
            }}
            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            <option value="">ทุกประเภท</option>
            <option value="product">สินค้า</option>
            <option value="order">คำสั่งซื้อ</option>
            <option value="customer">ลูกค้า</option>
            <option value="discount">ส่วนลด</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  วันที่/เวลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  การกระทำ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Entity ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log: AuditLog) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {new Date(log.created_at).toLocaleString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                    {log.entity_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {log.entity_id || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {log.ip_address || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
