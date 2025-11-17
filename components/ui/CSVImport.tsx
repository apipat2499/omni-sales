'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';

interface CSVImportProps {
  onImport: (data: any[]) => Promise<{ success: number; failed: number; errors: string[] }>;
  templateHeaders: string[];
  entityName: string;
  onClose: () => void;
}

export default function CSVImport({ onImport, templateHeaders, entityName, onClose }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        alert('กรุณาเลือกไฟล์ CSV เท่านั้น');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      data.push(row);
    }

    return data;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        alert('ไฟล์ CSV ว่างเปล่าหรือมีรูปแบบไม่ถูกต้อง');
        setIsUploading(false);
        return;
      }

      const result = await onImport(data);
      setResult(result);
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('เกิดข้อผิดพลาดในการอิมพอร์ตไฟล์');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = templateHeaders.join(',');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${entityName}_template.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            อิมพอร์ต {entityName} จาก CSV
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  ดาวน์โหลดเทมเพลต CSV
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  ดาวน์โหลดไฟล์เทมเพลตเพื่อดูรูปแบบที่ถูกต้อง
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="h-4 w-4" />
                  ดาวน์โหลดเทมเพลต
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              เลือกไฟล์ CSV
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {file ? (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์มาวาง
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">รองรับไฟล์ .csv เท่านั้น</p>
                </div>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">นำเข้าสำเร็จ {result.success} รายการ</span>
              </div>
              {result.failed > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-100 mb-2">
                        ล้มเหลว {result.failed} รายการ
                      </p>
                      <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                        {result.errors.slice(0, 5).map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                        {result.errors.length > 5 && (
                          <li className="text-xs text-red-600 dark:text-red-400">
                            และอีก {result.errors.length - 5} รายการ...
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'กำลังอิมพอร์ต...' : 'อิมพอร์ต'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            disabled={isUploading}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
