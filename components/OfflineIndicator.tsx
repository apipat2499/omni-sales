'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { getOfflineDetector, NetworkStatus } from '@/lib/pwa/offline-detector';

export default function OfflineIndicator() {
  const [status, setStatus] = useState<NetworkStatus>('online');
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const detector = getOfflineDetector();

    // Get initial status
    setStatus(detector.getStatus());

    // Add listener
    const handleStatusChange = (newStatus: NetworkStatus) => {
      setStatus(newStatus);

      // Show indicator when offline or slow
      if (newStatus === 'offline' || newStatus === 'slow') {
        setShowIndicator(true);
      } else {
        // Show briefly when back online, then hide
        setShowIndicator(true);
        setTimeout(() => setShowIndicator(false), 3000);
      }
    };

    detector.addListener(handleStatusChange);

    // Initial check
    if (status === 'offline' || status === 'slow') {
      setShowIndicator(true);
    }

    return () => {
      detector.removeListener(handleStatusChange);
    };
  }, []);

  if (!showIndicator) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'offline':
        return {
          icon: WifiOff,
          text: 'คุณอยู่ในโหมดออฟไลน์',
          subtext: 'การเปลี่ยนแปลงจะถูกบันทึกและซิงค์เมื่อกลับมาออนไลน์',
          bgColor: 'bg-red-500',
          textColor: 'text-white',
        };
      case 'slow':
        return {
          icon: AlertCircle,
          text: 'การเชื่อมต่อช้า',
          subtext: 'บางฟีเจอร์อาจทำงานช้ากว่าปกติ',
          bgColor: 'bg-yellow-500',
          textColor: 'text-white',
        };
      case 'online':
        return {
          icon: Wifi,
          text: 'กลับมาออนไลน์แล้ว',
          subtext: 'ข้อมูลกำลังซิงค์...',
          bgColor: 'bg-green-500',
          textColor: 'text-white',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="fixed top-16 left-0 right-0 z-50 flex justify-center px-4 animate-slide-down">
      <div className={`${config.bgColor} ${config.textColor} rounded-lg shadow-lg px-4 py-3 max-w-md w-full`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{config.text}</p>
            <p className="text-xs opacity-90 mt-0.5">{config.subtext}</p>
          </div>
          {status !== 'online' && (
            <button
              onClick={() => setShowIndicator(false)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="ปิด"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
