'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Check online status
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically redirect when back online
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Set initial status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      // Try to fetch a simple endpoint to check connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        setIsRetrying(false);
      }
    } catch (error) {
      // Still offline
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 dark:bg-blue-600 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-full p-6 shadow-lg">
              <WifiOff
                className="w-16 h-16 text-gray-400 dark:text-gray-500"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="mb-8">
          {isOnline ? (
            <>
              <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                กลับมาออนไลน์แล้ว!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                กำลังเปลี่ยนเส้นทาง...
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                คุณออฟไลน์อยู่
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ
              </p>
            </>
          )}
        </div>

        {/* Connection Status Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isOnline
                ? 'bg-green-500 animate-pulse'
                : 'bg-red-500'
            }`}
          ></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
          </span>
        </div>

        {/* Retry Button */}
        {!isOnline && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`}
            />
            <span>{isRetrying ? 'กำลังตรวจสอบ...' : 'ลองอีกครั้ง'}</span>
          </button>
        )}

        {/* Additional Info */}
        <div className="mt-12 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            ข้อมูลที่บันทึกไว้
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ข้อมูลบางส่วนอาจพร้อมใช้งานในโหมดออฟไลน์
            เมื่อคุณกลับมาออนไลน์ ระบบจะซิงค์ข้อมูลโดยอัตโนมัติ
          </p>
        </div>

        {/* Troubleshooting Tips */}
        <div className="mt-6 text-left">
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
              วิธีแก้ปัญหา
            </summary>
            <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 ml-4">
              <li>ตรวจสอบว่าเปิด Wi-Fi หรือข้อมูลมือถือแล้ว</li>
              <li>ลองเปิด-ปิดโหมดเครื่องบินใหม่</li>
              <li>ตรวจสอบว่าอุปกรณ์อื่นเชื่อมต่อเครือข่ายได้หรือไม่</li>
              <li>รีสตาร์ทเราเตอร์ของคุณ</li>
              <li>ติดต่อผู้ให้บริการอินเทอร์เน็ตของคุณ</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
