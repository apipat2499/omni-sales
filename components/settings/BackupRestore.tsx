'use client';

import { useState } from 'react';
import { Download, Upload, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { downloadBackup, importBackup, exportTableToCSV } from '@/lib/utils/backup';

export default function BackupRestore() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      await downloadBackup();
    } catch (error) {
      console.error('Export failed:', error);
      alert('เกิดข้อผิดพลาดในการ export');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await importBackup(file);
      setImportResult(result);
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        message: 'เกิดข้อผิดพลาดในการ import',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const tables = [
    { name: 'products', label: 'สินค้า' },
    { name: 'customers', label: 'ลูกค้า' },
    { name: 'orders', label: 'คำสั่งซื้อ' },
    { name: 'discounts', label: 'ส่วนลด' },
    { name: 'stock_movements', label: 'การเคลื่อนไหวสต็อก' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          สำรองและกู้คืนข้อมูล
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          จัดการข้อมูลสำรองของระบบ
        </p>
      </div>

      {/* Export Full Backup */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              สำรองข้อมูลทั้งหมด
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              ดาวน์โหลดข้อมูลทั้งหมดในรูปแบบ JSON
            </p>
            <button
              onClick={handleExportAll}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'กำลัง Export...' : 'Export ทั้งหมด (JSON)'}
            </button>
          </div>
        </div>
      </div>

      {/* Import Backup */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              กู้คืนข้อมูล
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              อัปโหลดไฟล์สำรอง JSON เพื่อกู้คืนข้อมูล
            </p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                <Upload className="h-4 w-4" />
                {isImporting ? 'กำลัง Import...' : 'เลือกไฟล์'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="hidden"
                />
              </label>
            </div>

            {importResult && (
              <div className={`mt-4 p-4 rounded-lg border ${
                importResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      importResult.success
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {importResult.message}
                    </p>
                    {importResult.errors && (
                      <ul className="mt-2 text-xs text-red-700 dark:text-red-300 space-y-1">
                        {importResult.errors.map((error: string, i: number) => (
                          <li key={i}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>คำเตือน:</strong> การกู้คืนข้อมูลจะแทนที่ข้อมูลปัจจุบัน
                  กรุณาสำรองข้อมูลก่อนดำเนินการ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Individual Tables */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Export ตารางแยก (CSV)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ดาวน์โหลดข้อมูลแต่ละตารางในรูปแบบ CSV
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tables.map((table) => (
            <button
              key={table.name}
              onClick={() => exportTableToCSV(table.name)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm text-gray-900 dark:text-white"
            >
              <Download className="h-4 w-4" />
              {table.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
