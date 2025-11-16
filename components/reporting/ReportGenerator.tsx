'use client';

import { useState } from 'react';
import { Download, Plus, Trash2, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { useAdvancedReporting } from '@/lib/hooks/useAdvancedReporting';
import { useI18n } from '@/lib/hooks/useI18n';
import type { OrderItem } from '@/types';
import type { ReportType } from '@/lib/utils/advanced-reporting';

interface ReportGeneratorProps {
  items: OrderItem[];
  showList?: boolean;
  className?: string;
}

export default function ReportGenerator({
  items,
  showList = true,
  className = '',
}: ReportGeneratorProps) {
  const i18n = useI18n();
  const { reports, selectedReport, generateReport, deleteSelectedReport, exportReport } =
    useAdvancedReporting();

  const [reportType, setReportType] = useState<ReportType>('sales');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleGenerateReport = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    generateReport(reportType, items, start, end);
  };

  const reportTypeLabels: Record<ReportType, string> = {
    sales: 'Sales Report',
    inventory: 'Inventory Report',
    product: 'Product Report',
    customer: 'Customer Report',
    financial: 'Financial Report',
    custom: 'Custom Report',
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Report Generator Form */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between hover:opacity-75 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span className="font-semibold dark:text-white">{i18n.t('reports.generateReport')}</span>
          </div>
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium dark:text-white mb-1">
                {i18n.t('reports.title')}
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              >
                {Object.entries(reportTypeLabels).map(([type, label]) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium dark:text-white mb-1">
                  {i18n.t('common.date')} From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium dark:text-white mb-1">
                  {i18n.t('common.date')} To
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateReport}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {i18n.t('reports.generateReport')}
            </button>
          </div>
        )}
      </div>

      {/* Report Viewer */}
      {selectedReport && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          {/* Report Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold dark:text-white">{selectedReport.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedReport.generatedAt.toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => exportReport(selectedReport, 'csv')}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                CSV
              </button>
              <button
                onClick={() => exportReport(selectedReport, 'json')}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                JSON
              </button>
              <button
                onClick={() => deleteSelectedReport(selectedReport.id)}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {selectedReport.metrics.map((metric, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{metric.name}</div>
                <div className="text-2xl font-bold dark:text-white">
                  {metric.value}
                  {metric.unit && <span className="text-sm ml-1">{metric.unit}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Data Tables (if available) */}
          {selectedReport.data && (
            <ReportDataViewer reportType={selectedReport.type} data={selectedReport.data} />
          )}
        </div>
      )}

      {/* Reports List */}
      {showList && reports.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold dark:text-white mb-3">{i18n.t('reports.title')}</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => {
                  // In a real app, would fetch full report
                }}
                className={`w-full p-2 text-left rounded transition-colors ${
                  selectedReport?.id === report.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="font-medium text-sm dark:text-white">{report.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {report.generatedAt.toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Report data viewer component
 */
function ReportDataViewer({
  reportType,
  data,
}: {
  reportType: string;
  data: Record<string, any>;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (reportType === 'sales' && data.topProducts) {
    return (
      <div className="space-y-3">
        <DataSection
          title="Top Products"
          expanded={expandedSection === 'topProducts'}
          onToggle={() => toggleSection('topProducts')}
        >
          <div className="space-y-2">
            {data.topProducts.map((product: any, idx: number) => (
              <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                <div className="font-medium dark:text-white">{product.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Qty: {product.quantity} • Revenue: ฿{product.revenue.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </DataSection>
      </div>
    );
  }

  return null;
}

/**
 * Collapsible data section
 */
function DataSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
      >
        <span className="font-medium dark:text-white">{title}</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && <div className="p-3">{children}</div>}
    </div>
  );
}
