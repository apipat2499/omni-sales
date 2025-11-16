'use client';

import React, { useState, useEffect } from 'react';
import { Package, MapPin, Clock, CheckCircle, XCircle, TruckIcon } from 'lucide-react';

interface TrackingEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
}

interface TrackingInfoProps {
  orderId: string;
}

export function TrackingInfo({ orderId }: TrackingInfoProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<any>(null);

  useEffect(() => {
    loadTracking();
  }, [orderId]);

  const loadTracking = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}/tracking`);
      const data = await response.json();

      if (data.success) {
        setTracking(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to load tracking information');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!tracking || !tracking.tracking) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">No tracking information available</p>
      </div>
    );
  }

  const { shipment, tracking: trackingData } = tracking;

  return (
    <div className="space-y-6">
      {/* Tracking Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tracking Information
              </h3>
              <p className="text-sm text-gray-500">
                {getProviderName(shipment.provider)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Tracking Number</p>
            <p className="font-mono font-semibold text-gray-900">
              {shipment.trackingNumber}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-start space-x-3">
            <TruckIcon className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Status</p>
              <p className="text-sm text-gray-900">{trackingData.statusDescription}</p>
            </div>
          </div>

          {trackingData.estimatedDeliveryDate && (
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Estimated Delivery</p>
                <p className="text-sm text-gray-900">
                  {new Date(trackingData.estimatedDeliveryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {trackingData.actualDeliveryDate && (
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Delivered On</p>
                <p className="text-sm text-gray-900">
                  {new Date(trackingData.actualDeliveryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {trackingData.recipientName && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Received by: <span className="font-medium text-gray-900">{trackingData.recipientName}</span>
            </p>
          </div>
        )}
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Tracking History</h4>

        {trackingData.trackingHistory && trackingData.trackingHistory.length > 0 ? (
          <div className="space-y-4">
            {trackingData.trackingHistory.map((event: TrackingEvent, index: number) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${index === 0 ? 'bg-blue-100' : 'bg-gray-100'}
                  `}>
                    {getStatusIcon(event.status, index === 0)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <p className={`text-sm font-medium ${index === 0 ? 'text-blue-900' : 'text-gray-900'}`}>
                      {event.description}
                    </p>
                    <p className="text-xs text-gray-500 ml-2">
                      {event.date} {event.time}
                    </p>
                  </div>

                  <div className="flex items-center mt-1 space-x-2">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <p className="text-sm text-gray-600">{event.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No tracking events available</p>
        )}
      </div>
    </div>
  );
}

function getProviderName(code: string): string {
  const providers: Record<string, string> = {
    'kerry': 'Kerry Express',
    'flash': 'Flash Express',
    'thailand-post': 'Thailand Post',
  };
  return providers[code] || code;
}

function getStatusIcon(status: string, isLatest: boolean) {
  const className = isLatest ? 'text-blue-600' : 'text-gray-400';

  if (status.includes('delivered') || status.includes('Delivered')) {
    return <CheckCircle className={`h-5 w-5 ${className}`} />;
  }
  if (status.includes('transit') || status.includes('Transit')) {
    return <TruckIcon className={`h-5 w-5 ${className}`} />;
  }
  if (status.includes('cancel') || status.includes('Cancel')) {
    return <XCircle className={`h-5 w-5 ${className}`} />;
  }
  return <Package className={`h-5 w-5 ${className}`} />;
}
