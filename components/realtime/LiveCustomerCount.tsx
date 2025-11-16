'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { Users } from 'lucide-react';
import { CustomerOnlineStatusPayload } from '@/lib/websocket/types';

interface LiveCustomerCountProps {
  className?: string;
  showDetails?: boolean;
}

export default function LiveCustomerCount({
  className = '',
  showDetails = false,
}: LiveCustomerCountProps) {
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const ws = useWebSocket({
    autoConnect: true,
    namespaces: ['customers'],
  });

  useEffect(() => {
    if (!ws.isConnected) return;

    // Listen for customer online/offline events
    const cleanupOnline = ws.on<CustomerOnlineStatusPayload>('customer:online', (data) => {
      setOnlineCount((prev) => prev + 1);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);

      // Add to recent activity
      setRecentActivity((prev) => [
        `Customer ${data.customerId} joined`,
        ...prev.slice(0, 4), // Keep only last 5
      ]);
    });

    const cleanupOffline = ws.on<CustomerOnlineStatusPayload>('customer:offline', (data) => {
      setOnlineCount((prev) => Math.max(0, prev - 1));
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);

      setRecentActivity((prev) => [
        `Customer ${data.customerId} left`,
        ...prev.slice(0, 4),
      ]);
    });

    return () => {
      cleanupOnline();
      cleanupOffline();
    };
  }, [ws]);

  // Fetch initial count (in production, fetch from API)
  useEffect(() => {
    // Mock initial data
    setOnlineCount(12);
    setTotalCount(145);
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Online Customers</p>
            <div className="flex items-baseline gap-2">
              <p
                className={`
                  text-2xl font-bold text-gray-900 transition-all duration-300
                  ${isAnimating ? 'scale-110 text-blue-600' : 'scale-100'}
                `}
              >
                {onlineCount}
              </p>
              <p className="text-sm text-gray-500">/ {totalCount} total</p>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        {ws.isConnected && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-600">LIVE</span>
          </div>
        )}
      </div>

      {/* Recent activity */}
      {showDetails && recentActivity.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">Recent Activity</p>
          <div className="space-y-1">
            {recentActivity.map((activity, index) => (
              <p
                key={index}
                className="text-xs text-gray-500 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {activity}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Disconnected indicator */}
      {!ws.isConnected && (
        <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Reconnecting...
        </div>
      )}
    </div>
  );
}
