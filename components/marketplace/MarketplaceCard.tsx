'use client';

import { MarketplaceConnection, MarketplacePlatform } from '@/types';
import { MoreVertical, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface MarketplaceCardProps {
  connection: MarketplaceConnection;
  platform?: MarketplacePlatform;
  onSync?: (connectionId: string) => void;
  onDisconnect?: (connectionId: string) => void;
}

export function MarketplaceCard({
  connection,
  platform,
  onSync,
  onDisconnect,
}: MarketplaceCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSync = async () => {
    if (!onSync) return;

    setIsSyncing(true);
    try {
      await onSync(connection.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const lastSyncTime = connection.lastSyncedAt
    ? new Date(connection.lastSyncedAt).toLocaleDateString()
    : 'Never';

  const platformName = platform?.name || connection.platformCode.toUpperCase();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {platform?.iconUrl && (
            <img
              src={platform.iconUrl}
              alt={platformName}
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold dark:text-white">
              {platformName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {connection.shopName || connection.shopId || 'Connected'}
            </p>
            {connection.lastSyncedAt && (
              <p className="mt-1 text-xs text-gray-500">
                Last synced: {lastSyncTime}
              </p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>

          {showMenu && (
            <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-700">
              <button
                onClick={() => {
                  handleSync();
                  setShowMenu(false);
                }}
                disabled={isSyncing}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <RefreshCw className="h-4 w-4" />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>

              {onDisconnect && (
                <button
                  onClick={() => {
                    onDisconnect(connection.id);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900"
                >
                  Disconnect
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          {isSyncing ? 'Syncing...' : 'Sync Orders'}
        </button>
      </div>
    </div>
  );
}
