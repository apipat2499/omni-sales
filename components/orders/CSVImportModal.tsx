'use client';

import { useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { useBulkImport } from '@/lib/hooks/useCSVImport';
import { generateCSVTemplate, downloadCSV } from '@/lib/utils/csv-import';
import type { OrderItem } from '@/types';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: Omit<OrderItem, 'id'>[]) => Promise<void>;
  orderId?: string;
}

export default function CSVImportModal({
  isOpen,
  onClose,
  onImport,
  orderId,
}: CSVImportModalProps) {
  const {
    importFile,
    isLoading,
    result,
    error,
    preview,
    previewError,
    generatePreview,
    clearPreview,
    reset,
  } = useBulkImport();

  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');
  const [isImporting, setIsImporting] = useState(false);

  const handleFileSelect = async (file: File) => {
    await generatePreview(file);
    if (preview) {
      setStep('preview');
    }
  };

  const handleImport = async () => {
    if (!preview || preview.length === 0) return;

    setIsImporting(true);
    try {
      await onImport(preview);
      reset();
      clearPreview();
      setStep('upload');
      onClose();
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = generateCSVTemplate();
    downloadCSV(template, 'order-template.csv');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
          disabled={isLoading || isImporting}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              นำเข้าจาก CSV
            </h2>
            <button
              onClick={onClose}
              disabled={isLoading || isImporting}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 flex-grow overflow-y-auto">
            {/* Step 1: Upload */}
            {step === 'upload' && (
              <div className="space-y-4">
                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    วิธีใช้:
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>1. ดาวน์โหลดแม่แบบ CSV</li>
                    <li>2. กรอกข้อมูลสินค้า (ชื่อ, จำนวน, ราคา)</li>
                    <li>3. อัพโหลดไฟล์ CSV</li>
                    <li>4. ตรวจสอบข้อมูลและยืนยัน</li>
                  </ul>
                </div>

                {/* Template Download */}
                <button
                  onClick={downloadTemplate}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-400 transition-colors"
                >
                  <FileText className="h-5 w-5 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ดาวน์โหลดแม่แบบ CSV
                  </span>
                </button>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    อัพโหลดไฟล์ CSV
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileSelect(file);
                        }
                      }}
                      disabled={isLoading}
                      className="hidden"
                      id="csv-file"
                    />
                    <label
                      htmlFor="csv-file"
                      className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="h-6 w-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {isLoading ? 'กำลังโหลด...' : 'ลากไฟล์มาที่นี่ หรือ คลิกเพื่อเลือก'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Error Message */}
                {previewError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {previewError}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Preview */}
            {step === 'preview' && preview && preview.length > 0 && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700 dark:text-green-400">
                    พบ {preview.length} รายการที่จะนำเข้า
                  </p>
                </div>

                {/* Preview Table */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                          ชื่อสินค้า
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">
                          จำนวน
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">
                          ราคา
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">
                          ส่วนลด
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 5).map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                            {item.productName}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                            ฿{item.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                            {item.discount ? `฿${item.discount.toFixed(2)}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {preview.length > 5 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    และอีก {preview.length - 5} รายการ
                  </p>
                )}

                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      รวมรายการ
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {preview.length}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      รวมจำนวน
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {preview.reduce((sum, item) => sum + item.quantity, 0)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      รวมราคา
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ฿{preview
                        .reduce((sum, item) => sum + item.price * item.quantity, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-3 justify-end flex-shrink-0 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={() => {
                if (step === 'preview') {
                  clearPreview();
                  setStep('upload');
                } else {
                  onClose();
                }
              }}
              disabled={isLoading || isImporting}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {step === 'preview' ? 'กลับ' : 'ยกเลิก'}
            </button>

            {step === 'preview' && preview && (
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin">⚙️</span>
                    กำลังนำเข้า...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    ยืนยันและนำเข้า
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
