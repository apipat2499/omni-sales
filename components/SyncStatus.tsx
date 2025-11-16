'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { getSyncManager, SyncProgress } from '@/lib/pwa/sync-manager';
import { getStorageUsage } from '@/lib/pwa/indexed-db';

interface StorageInfo {
  pendingOrders: number;
  cachedOrders: number;
  cachedProducts: number;
  cachedCustomers: number;
  syncQueue: number;
}

export default function SyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadSyncStatus();

    // Update storage info periodically
    const interval = setInterval(() => {
      updateStorageInfo();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const loadSyncStatus = async () => {
    const syncManager = getSyncManager();
    const lastSync = await syncManager.getLastSyncTime();
    setLastSyncTime(lastSync);
    setIsSyncing(syncManager.isSyncInProgress());

    await updateStorageInfo();
  };

  const updateStorageInfo = async () => {
    try {
      const info = await getStorageUsage();
      setStorage(info);
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      const syncManager = getSyncManager({
        onProgress: (prog) => {
          setProgress(prog);
        },
      });

      const result = await syncManager.syncAll();

      if (result.success) {
        const lastSync = await syncManager.getLastSyncTime();
        setLastSyncTime(lastSync);
      }

      await updateStorageInfo();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
      setProgress(null);
    }
  };

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'ยังไม่เคยซิงค์';

    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'เมื่อสักครู่';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diff / 86400000)} วันที่แล้ว`;
  };

  const hasPendingData = storage && (storage.pendingOrders > 0 || storage.syncQueue > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isSyncing ? (
            <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
          ) : hasPendingData ? (
            <Clock className="w-5 h-5 text-yellow-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {isSyncing ? 'กำลังซิงค์ข้อมูล...' : hasPendingData ? 'มีข้อมูลรอซิงค์' : 'ข้อมูลอัปเดตแล้ว'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ซิงค์ล่าสุด: {formatTime(lastSyncTime)}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSync();
          }}
          disabled={isSyncing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ทันที'}
        </button>
      </div>

      {/* Progress Bar */}
      {isSyncing && progress && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {progress.current || 'กำลังซิงค์...'}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {progress.completed} / {progress.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
                }}
              />
            </div>
            {progress.failed > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                <span>ล้มเหลว: {progress.failed} รายการ</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && storage && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {storage.pendingOrders}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">คำสั่งซื้อรอซิงค์</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {storage.syncQueue}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">การเปลี่ยนแปลงรอซิงค์</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {storage.cachedOrders}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">คำสั่งซื้อแคช</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {storage.cachedProducts}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">สินค้าแคช</div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ข้อมูลที่แคชไว้จะช่วยให้คุณทำงานได้แม้ออฟไลน์
              และจะถูกซิงค์กับเซิร์ฟเวอร์อัตโนมัติเมื่อออนไลน์
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
