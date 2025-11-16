'use client';

/**
 * Intent Badge Component
 * Display detected intent with confidence level
 */

import React from 'react';
import {
  Package,
  Truck,
  RotateCcw,
  DollarSign,
  Sparkles,
  HelpCircle,
  PhoneCall,
  User,
  AlertCircle,
} from 'lucide-react';
import type { IntentType, IntentConfidence } from '@/lib/ai/chatbot/types';

interface IntentBadgeProps {
  intent: IntentType;
  confidence: IntentConfidence;
  showIcon?: boolean;
  showLabel?: boolean;
}

export default function IntentBadge({
  intent,
  confidence,
  showIcon = true,
  showLabel = true,
}: IntentBadgeProps) {
  const intentConfig: Record<
    IntentType,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    order_lookup: {
      label: 'Order Lookup',
      icon: <Package className="w-3 h-3" />,
      color: 'blue',
    },
    shipping_tracking: {
      label: 'Shipping Tracking',
      icon: <Truck className="w-3 h-3" />,
      color: 'purple',
    },
    return_request: {
      label: 'Return Request',
      icon: <RotateCcw className="w-3 h-3" />,
      color: 'orange',
    },
    refund_request: {
      label: 'Refund Request',
      icon: <DollarSign className="w-3 h-3" />,
      color: 'red',
    },
    product_recommendation: {
      label: 'Product Recommendation',
      icon: <Sparkles className="w-3 h-3" />,
      color: 'pink',
    },
    faq: {
      label: 'FAQ',
      icon: <HelpCircle className="w-3 h-3" />,
      color: 'green',
    },
    escalate_to_human: {
      label: 'Escalate to Human',
      icon: <PhoneCall className="w-3 h-3" />,
      color: 'yellow',
    },
    general_inquiry: {
      label: 'General Inquiry',
      icon: <HelpCircle className="w-3 h-3" />,
      color: 'gray',
    },
    complaint: {
      label: 'Complaint',
      icon: <AlertCircle className="w-3 h-3" />,
      color: 'red',
    },
    account_management: {
      label: 'Account Management',
      icon: <User className="w-3 h-3" />,
      color: 'indigo',
    },
  };

  const config = intentConfig[intent];
  const confidenceColor =
    confidence === 'high'
      ? 'bg-green-100 text-green-800 border-green-200'
      : confidence === 'medium'
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-red-100 text-red-800 border-red-200';

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Intent Badge */}
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getColorClasses(
          config.color
        )}`}
      >
        {showIcon && config.icon}
        {showLabel && config.label}
      </span>

      {/* Confidence Badge */}
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${confidenceColor}`}
      >
        {confidence} confidence
      </span>
    </div>
  );
}
