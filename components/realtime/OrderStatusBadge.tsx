'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { OrderStatus } from '@/types';
import { OrderStatusChangedPayload } from '@/lib/websocket/types';

interface OrderStatusBadgeProps {
  orderId: string;
  initialStatus: OrderStatus;
  customerId?: string;
  className?: string;
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  processing: 'bg-blue-100 text-blue-800 border-blue-300',
  shipped: 'bg-purple-100 text-purple-800 border-purple-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderStatusBadge({
  orderId,
  initialStatus,
  customerId,
  className = '',
}: OrderStatusBadgeProps) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const ws = useWebSocket({
    autoConnect: true,
    namespaces: ['orders'],
  });

  useEffect(() => {
    if (!ws.isConnected) return;

    // Listen for order status changes
    const cleanup = ws.on<OrderStatusChangedPayload>('order:status_changed', (data) => {
      if (data.orderId === orderId) {
        setIsUpdating(true);
        setStatus(data.newStatus);

        // Visual feedback animation
        setTimeout(() => setIsUpdating(false), 1000);
      }
    });

    return cleanup;
  }, [ws, orderId]);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <span
        className={`
          inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
          border transition-all duration-300
          ${statusColors[status]}
          ${isUpdating ? 'scale-110 shadow-lg' : 'scale-100'}
        `}
      >
        {/* Live indicator dot */}
        {ws.isConnected && (
          <span
            className={`
              w-1.5 h-1.5 rounded-full animate-pulse
              ${status === 'delivered' ? 'bg-green-600' : status === 'cancelled' ? 'bg-red-600' : 'bg-current'}
            `}
          />
        )}
        {statusLabels[status]}
      </span>

      {/* Update animation overlay */}
      {isUpdating && (
        <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
      )}

      {/* Connection status indicator (for debugging) */}
      {!ws.isConnected && (
        <span className="ml-2 w-2 h-2 rounded-full bg-gray-400" title="Disconnected" />
      )}
    </div>
  );
}
