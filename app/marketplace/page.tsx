'use client';

import { useEffect, useState } from 'react';
import { MarketplaceConnection, MarketplacePlatform } from '@/types';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { ConnectMarketplaceModal } from '@/components/marketplace/ConnectMarketplaceModal';
import { Plus } from 'lucide-react';

export default function MarketplacePage() {
  const [platforms, setPlatforms] = useState<MarketplacePlatform[]>([]);
  const [connections, setConnections] = useState<MarketplaceConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<MarketplacePlatform | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      window.location.href = '/login';
      return;
    }

    loadData(userId);
  }, []);

  const loadData = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch platforms
      const platformsRes = await fetch('/api/marketplace/platforms');
      if (!platformsRes.ok) throw new Error('Failed to fetch platforms');
      const platformsData = await platformsRes.json();
      setPlatforms(platformsData);

      // Fetch user's connections
      const connectionsRes = await fetch(
        `/api/marketplace/connections?userId=${userId}`
      );
      if (!connectionsRes.ok) throw new Error('Failed to fetch connections');
      const connectionsData = await connectionsRes.json();
      setConnections(connectionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch('/api/marketplace/sync-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, userId }),
      });

      if (!response.ok) throw new Error('Failed to sync orders');

      const result = await response.json();
      alert(
        `Sync completed: ${result.itemsSynced} items synced, ${result.itemsFailed} failed`
      );

      // Reload connections to update last_synced_at
      loadData(userId);
    } catch (err) {
      alert(
        'Sync failed: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      );
    }
  };

  const handleConnect = async (formData: Record<string, string>) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) throw new Error('User not found');

      const response = await fetch('/api/marketplace/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to create connection');

      // Reload data
      await loadData(userId);
      setShowModal(false);
      setSelectedPlatform(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this marketplace?')) {
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      // TODO: Implement disconnect endpoint
      // For now, just remove from UI
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch (err) {
      alert('Failed to disconnect: ' + (err instanceof Error ? err.message : ''));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const connectedPlatformCodes = connections.map((c) => c.platformCode);
  const availablePlatforms = platforms.filter(
    (p) => !connectedPlatformCodes.includes(p.code)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold dark:text-white">
            Marketplace Integrations
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Connect and sync orders from your favorite marketplaces
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Connected Marketplaces */}
        {connections.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold dark:text-white">
              Connected Marketplaces
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => {
                const platform = platforms.find(
                  (p) => p.code === connection.platformCode
                );
                return (
                  <MarketplaceCard
                    key={connection.id}
                    connection={connection}
                    platform={platform}
                    onSync={handleSync}
                    onDisconnect={handleDisconnect}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Available Platforms to Connect */}
        {availablePlatforms.length > 0 && (
          <div>
            <h2 className="mb-4 text-2xl font-bold dark:text-white">
              Available Marketplaces
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availablePlatforms.map((platform) => (
                <div
                  key={platform.id}
                  className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-600 dark:bg-gray-800"
                >
                  {platform.iconUrl && (
                    <img
                      src={platform.iconUrl}
                      alt={platform.name}
                      className="mx-auto mb-4 h-12 w-12 rounded-lg"
                    />
                  )}
                  <h3 className="font-semibold dark:text-white">
                    {platform.name}
                  </h3>
                  {platform.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {platform.description}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setSelectedPlatform(platform);
                      setShowModal(true);
                    }}
                    className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 w-full"
                  >
                    <Plus className="h-4 w-4" />
                    Connect
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {connections.length === 0 && availablePlatforms.length === 0 && (
          <div className="rounded-lg bg-white p-8 text-center dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              No marketplaces available
            </p>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {showModal && selectedPlatform && (
        <ConnectMarketplaceModal
          platform={selectedPlatform}
          onConnect={handleConnect}
          onClose={() => {
            setShowModal(false);
            setSelectedPlatform(null);
          }}
        />
      )}
    </div>
  );
}
