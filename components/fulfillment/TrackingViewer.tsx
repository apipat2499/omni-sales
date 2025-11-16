/**
 * Tracking Viewer Component
 * Displays real-time package tracking with status timeline
 */

'use client';

import React, { useState, useEffect } from 'react';
import { TrackingEvent, TrackingStatus } from '@/lib/utils/shipping-integration';
import { useShippingCarriers } from '@/lib/hooks/useShippingCarriers';
import { useI18n } from '@/lib/hooks/useI18n';

interface TrackingViewerProps {
  trackingNumber: string;
  carrierId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onStatusChange?: (status: TrackingStatus) => void;
}

export function TrackingViewer({
  trackingNumber,
  carrierId,
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute default
  onStatusChange,
}: TrackingViewerProps) {
  const { t } = useI18n();
  const { trackPackage: trackPackageHook } = useShippingCarriers();

  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load tracking events
  const loadTracking = async () => {
    if (!carrierId) return;

    setLoading(true);
    setError(null);

    try {
      const trackingEvents = await trackPackageHook(carrierId, trackingNumber);
      setEvents(trackingEvents);
      setLastUpdated(new Date());

      // Notify status change
      if (trackingEvents.length > 0) {
        const latestEvent = trackingEvents[trackingEvents.length - 1];
        onStatusChange?.(latestEvent.status);
      }
    } catch (err) {
      console.error('Error loading tracking:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Load tracking on mount
  useEffect(() => {
    loadTracking();
  }, [trackingNumber, carrierId]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadTracking();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, trackingNumber, carrierId]);

  // Get status color
  const getStatusColor = (status: TrackingStatus): string => {
    switch (status) {
      case 'pre_transit':
        return 'bg-gray-100 text-gray-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      case 'exception':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: TrackingStatus): string => {
    switch (status) {
      case 'pre_transit':
        return '📝';
      case 'in_transit':
        return '🚚';
      case 'out_for_delivery':
        return '📦';
      case 'delivered':
        return '✅';
      case 'returned':
        return '↩️';
      case 'exception':
        return '⚠️';
      case 'cancelled':
        return '❌';
      default:
        return '📦';
    }
  };

  // Get current status
  const currentStatus = events.length > 0 ? events[events.length - 1].status : null;

  // Calculate progress
  const getProgress = (): number => {
    if (!currentStatus) return 0;

    const progressMap: Record<TrackingStatus, number> = {
      pre_transit: 10,
      in_transit: 50,
      out_for_delivery: 90,
      delivered: 100,
      returned: 100,
      exception: 50,
      cancelled: 0,
    };

    return progressMap[currentStatus] || 0;
  };

  // Get estimated delivery
  const getEstimatedDelivery = (): Date | null => {
    // In a real implementation, this would come from the carrier API
    // For now, we'll estimate based on current status
    if (currentStatus === 'delivered') return events[events.length - 1].timestamp;

    const now = new Date();
    const daysToAdd = currentStatus === 'out_for_delivery' ? 0 : currentStatus === 'in_transit' ? 2 : 5;
    const estimated = new Date(now);
    estimated.setDate(now.getDate() + daysToAdd);
    return estimated;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('fulfillment.tracking.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('fulfillment.tracking.trackingNumber')}: {trackingNumber}
          </p>
        </div>
        <button
          onClick={loadTracking}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('common.loading') : t('common.refresh')}
        </button>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-gray-500">
          {t('fulfillment.tracking.lastUpdated')}:{' '}
          {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Current Status */}
      {currentStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-5xl">{getStatusIcon(currentStatus)}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t(`fulfillment.tracking.status.${currentStatus}`)}
                </h2>
                {events.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {events[events.length - 1].details}
                  </p>
                )}
              </div>
            </div>
            <span
              className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(
                currentStatus
              )}`}
            >
              {t(`fulfillment.tracking.status.${currentStatus}`)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>{t('fulfillment.tracking.progress')}</span>
              <span>{getProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  currentStatus === 'delivered'
                    ? 'bg-green-600'
                    : currentStatus === 'exception'
                    ? 'bg-red-600'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
          </div>

          {/* Estimated Delivery */}
          {currentStatus !== 'delivered' && currentStatus !== 'returned' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  {t('fulfillment.tracking.estimatedDelivery')}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {getEstimatedDelivery()?.toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          {t('fulfillment.tracking.timeline')}
        </h2>

        {loading && events.length === 0 ? (
          <p className="text-center text-gray-500 py-8">{t('common.loading')}</p>
        ) : events.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {t('fulfillment.tracking.noEvents')}
          </p>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Events */}
            <div className="space-y-6">
              {events
                .slice()
                .reverse()
                .map((event, index) => (
                  <div key={index} className="relative flex items-start">
                    {/* Icon */}
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className={`flex items-center justify-center w-16 h-16 rounded-full ${getStatusColor(
                          event.status
                        )} border-4 border-white shadow`}
                      >
                        <span className="text-2xl">{getStatusIcon(event.status)}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="ml-6 flex-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {event.statusDetail}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{event.details}</p>
                            {event.location && (
                              <p className="text-sm text-gray-500 mt-2">
                                📍{' '}
                                {[
                                  event.location.city,
                                  event.location.state,
                                  event.location.country,
                                ]
                                  .filter(Boolean)
                                  .join(', ')}
                              </p>
                            )}
                          </div>
                          <div className="ml-4 text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {event.timestamp.toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {event.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Delivery Map Placeholder */}
      {currentStatus === 'in_transit' || currentStatus === 'out_for_delivery' ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('fulfillment.tracking.map')}
          </h2>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center">
              <span className="text-6xl mb-4 block">🗺️</span>
              <p className="text-gray-600">{t('fulfillment.tracking.mapPlaceholder')}</p>
              <p className="text-sm text-gray-500 mt-1">
                {t('fulfillment.tracking.mapComingSoon')}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Proof of Delivery */}
      {currentStatus === 'delivered' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-900 mb-4">
            {t('fulfillment.tracking.proofOfDelivery')}
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-green-900">
                {t('fulfillment.tracking.deliveredAt')}
              </p>
              <p className="text-sm text-green-700">
                {events[events.length - 1].timestamp.toLocaleString()}
              </p>
            </div>
            {events[events.length - 1].location && (
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-green-900">
                  {t('fulfillment.tracking.deliveryLocation')}
                </p>
                <p className="text-sm text-green-700">
                  {[
                    events[events.length - 1].location.city,
                    events[events.length - 1].location.state,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm text-green-700">
                {t('fulfillment.tracking.signatureOnFile')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exception/Problem Alert */}
      {currentStatus === 'exception' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-4">
            ⚠️ {t('fulfillment.tracking.exception')}
          </h2>
          <p className="text-sm text-red-700 mb-4">
            {t('fulfillment.tracking.exceptionDetails')}
          </p>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            {t('fulfillment.tracking.contactSupport')}
          </button>
        </div>
      )}

      {/* Share Tracking */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('fulfillment.tracking.shareTracking')}
        </h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={`${window.location.origin}/tracking/${trackingNumber}`}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/tracking/${trackingNumber}`
              );
              alert(t('common.copied'));
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('common.copy')}
          </button>
        </div>
      </div>
    </div>
  );
}
