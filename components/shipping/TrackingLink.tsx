'use client';

import React from 'react';
import { ExternalLink, Package } from 'lucide-react';

interface TrackingLinkProps {
  provider: string;
  trackingNumber: string;
}

export function TrackingLink({ provider, trackingNumber }: TrackingLinkProps) {
  const getProviderUrl = (provider: string, trackingNumber: string): string | null => {
    const urls: Record<string, string> = {
      'kerry': `https://th.kerryexpress.com/en/track/?track=${trackingNumber}`,
      'flash': `https://www.flashexpress.com/tracking/?se=${trackingNumber}`,
      'thailand-post': `https://track.thailandpost.co.th/?trackNumber=${trackingNumber}`,
    };
    return urls[provider] || null;
  };

  const getProviderName = (code: string): string => {
    const providers: Record<string, string> = {
      'kerry': 'Kerry Express',
      'flash': 'Flash Express',
      'thailand-post': 'Thailand Post',
    };
    return providers[code] || code;
  };

  const trackingUrl = getProviderUrl(provider, trackingNumber);

  if (!trackingUrl) {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <Package className="h-4 w-4" />
        <span className="text-sm">Tracking: {trackingNumber}</span>
      </div>
    );
  }

  return (
    <a
      href={trackingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
    >
      <Package className="h-4 w-4" />
      <span className="text-sm font-medium">
        Track with {getProviderName(provider)}
      </span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
