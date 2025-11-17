'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileType } from 'lucide-react';

export type ExportFormat = 'excel' | 'pdf' | 'csv';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
}

export default function ExportButton({
  onExport,
  disabled = false,
  className = '',
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      await onExport(format);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || isExporting}
        className={`
          inline-flex items-center gap-2 px-4 py-2
          bg-green-600 text-white rounded-lg
          hover:bg-green-700 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <Download className="w-4 h-4" />
        {isExporting ? 'กำลัง Export...' : 'Export'}
      </button>

      {showMenu && !isExporting && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText className="w-4 h-4 text-red-600" />
                <span>Export PDF</span>
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileType className="w-4 h-4 text-blue-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
