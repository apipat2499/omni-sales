'use client';

import { ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset?: () => void;
}

export default function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const router = useRouter();

  const handleRefresh = () => {
    if (onReset) {
      onReset();
    }
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            เกิดข้อผิดพลาด
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                ข้อความแสดงข้อผิดพลาด:
              </p>
              <code className="text-xs text-red-700 dark:text-red-300 block overflow-x-auto">
                {error.message}
              </code>
            </div>
          )}

          {/* Error Stack (Development only) */}
          {process.env.NODE_ENV === 'development' && errorInfo && (
            <details className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer mb-2">
                รายละเอียดเพิ่มเติม (สำหรับนักพัฒนา)
              </summary>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap">
                {errorInfo.componentStack}
              </pre>
              {error && error.stack && (
                <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                  {error.stack}
                </pre>
              )}
            </details>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRefresh}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RefreshCw className="h-5 w-5" />
              โหลดหน้าใหม่
            </button>
            <button
              onClick={handleGoHome}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-gray-700 dark:text-gray-300"
            >
              <Home className="h-5 w-5" />
              กลับหน้าหลัก
            </button>
          </div>

          {/* Support Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              หากปัญหายังคงเกิดขึ้น กรุณาติดต่อทีมสนับสนุน
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
