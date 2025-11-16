/**
 * Chatbot Intents & Actions
 * Intent detection and action execution for AI chatbot
 */

import type {
  IntentType,
  IntentConfidence,
  IntentDetectionResult,
  IntentActionResult,
  ChatbotContext,
} from './types';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Intent patterns for rule-based detection
 */
const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  order_lookup: [
    /\b(where|what|check|find|track|status|view)\b.*\border\b/i,
    /\border\b.*\b(number|id|#|status|tracking)\b/i,
    /\bmy\s+orders?\b/i,
    /\border\s+history\b/i,
  ],
  shipping_tracking: [
    /\b(track|where|status|locate)\b.*\b(package|shipment|delivery|parcel)\b/i,
    /\bshipping\b.*\b(status|track|update)\b/i,
    /\bwhen\b.*\b(arrive|deliver|receive)\b/i,
    /\bdelivery\s+(status|time|date)\b/i,
  ],
  return_request: [
    /\b(return|send back|exchange)\b.*\b(item|product|order)\b/i,
    /\bhow\b.*\breturn\b/i,
    /\breturn\s+(policy|process|label)\b/i,
    /\bwant\s+to\s+return\b/i,
  ],
  refund_request: [
    /\b(refund|money back|reimburse)\b/i,
    /\bcancel\b.*\border\b.*\brefund\b/i,
    /\bhow\b.*\bget\b.*\brefund\b/i,
    /\brefund\s+(status|policy|request)\b/i,
  ],
  product_recommendation: [
    /\b(recommend|suggest|show|find)\b.*\b(product|item)\b/i,
    /\bwhat\b.*\b(product|item)\b.*\b(good|best|recommend)\b/i,
    /\blooking\s+for\b.*\bproduct\b/i,
    /\b(similar|alternative)\s+products?\b/i,
  ],
  faq: [
    /\b(policy|policies|how|what|when|can|do you)\b/i,
    /\bfrequently\s+asked\b/i,
    /\bhelp\s+(center|desk)\b/i,
  ],
  escalate_to_human: [
    /\b(speak|talk|chat)\b.*\b(human|agent|person|representative)\b/i,
    /\bcustomer\s+(service|support)\b/i,
    /\bneed\s+help\b.*\bhuman\b/i,
  ],
  account_management: [
    /\b(account|profile|password|email)\b.*\b(change|update|edit|reset)\b/i,
    /\bupdate\b.*\b(information|details|address)\b/i,
    /\bchange\s+password\b/i,
  ],
  complaint: [
    /\b(complaint|complain|unhappy|dissatisfied|angry|frustrated)\b/i,
    /\bbad\b.*\b(service|experience|quality)\b/i,
    /\bnot\s+(satisfied|happy)\b/i,
  ],
  general_inquiry: [/.*/], // Catch-all
};

/**
 * Extract entities from user message
 */
function extractEntities(message: string, intent: IntentType): Record<string, any> {
  const entities: Record<string, any> = {};

  // Order ID extraction (various formats)
  const orderIdPatterns = [
    /\b(?:order|#|id|ref)\s*:?\s*([A-Z0-9-]{6,20})/i,
    /\b([A-Z0-9]{6,20})\b/,
  ];

  for (const pattern of orderIdPatterns) {
    const match = message.match(pattern);
    if (match) {
      entities.orderId = match[1].toUpperCase();
      break;
    }
  }

  // Email extraction
  const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    entities.email = emailMatch[0].toLowerCase();
  }

  // Phone number extraction (Thai format)
  const phoneMatch = message.match(/\b(0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4})\b/);
  if (phoneMatch) {
    entities.phone = phoneMatch[1].replace(/[-\s]/g, '');
  }

  // Product name/category extraction
  if (intent === 'product_recommendation') {
    const productKeywords = message.match(/\b(laptop|phone|tablet|camera|watch|clothing|shoes|bag)\w*/gi);
    if (productKeywords) {
      entities.productCategory = productKeywords[0].toLowerCase();
    }
  }

  // Tracking number extraction
  const trackingMatch = message.match(/\b([A-Z]{2}\d{9}[A-Z]{2}|[A-Z0-9]{10,30})\b/);
  if (trackingMatch && intent === 'shipping_tracking') {
    entities.trackingNumber = trackingMatch[1];
  }

  return entities;
}

/**
 * Calculate intent confidence based on pattern matching
 */
function calculateConfidence(
  message: string,
  intent: IntentType,
  patterns: RegExp[]
): number {
  let score = 0;
  const lowerMessage = message.toLowerCase();

  for (const pattern of patterns) {
    if (pattern.test(lowerMessage)) {
      score += 0.3;
    }
  }

  // Bonus for specific keywords
  const intentKeywords: Record<IntentType, string[]> = {
    order_lookup: ['order', 'purchase', 'bought'],
    shipping_tracking: ['shipping', 'delivery', 'track', 'arrive'],
    return_request: ['return', 'exchange', 'send back'],
    refund_request: ['refund', 'money back', 'reimburse'],
    product_recommendation: ['recommend', 'suggest', 'looking for'],
    faq: ['policy', 'how', 'what', 'when'],
    escalate_to_human: ['agent', 'human', 'representative'],
    general_inquiry: [],
    complaint: ['complaint', 'unhappy', 'bad'],
    account_management: ['account', 'password', 'profile'],
  };

  const keywords = intentKeywords[intent] || [];
  for (const keyword of keywords) {
    if (lowerMessage.includes(keyword)) {
      score += 0.15;
    }
  }

  return Math.min(score, 1.0);
}

/**
 * Detect intent from user message
 */
export async function detectIntent(
  message: string,
  context?: Partial<ChatbotContext>
): Promise<IntentDetectionResult> {
  const scores: Array<{ intent: IntentType; score: number }> = [];

  // Calculate scores for each intent
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    const score = calculateConfidence(message, intent as IntentType, patterns);
    if (score > 0) {
      scores.push({ intent: intent as IntentType, score });
    }
  }

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  // Get top intent
  const topIntent = scores[0] || { intent: 'general_inquiry' as IntentType, score: 0.3 };

  // Extract entities
  const entities = extractEntities(message, topIntent.intent);

  // Determine confidence level
  let confidence: IntentConfidence;
  if (topIntent.score >= 0.7) {
    confidence = 'high';
  } else if (topIntent.score >= 0.4) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Determine if escalation is needed
  const shouldEscalate =
    topIntent.intent === 'escalate_to_human' ||
    topIntent.intent === 'complaint' ||
    confidence === 'low';

  let escalationReason: 'complex_issue' | 'user_request' | 'low_confidence' | 'sensitive_data' | undefined;
  if (shouldEscalate) {
    if (topIntent.intent === 'escalate_to_human') {
      escalationReason = 'user_request';
    } else if (topIntent.intent === 'complaint') {
      escalationReason = 'sensitive_data';
    } else if (confidence === 'low') {
      escalationReason = 'low_confidence';
    } else {
      escalationReason = 'complex_issue';
    }
  }

  return {
    intent: topIntent.intent,
    confidence,
    entities,
    shouldEscalate,
    escalationReason,
  };
}

/**
 * Execute intent action
 */
export async function executeIntentAction(
  intent: IntentType,
  entities: Record<string, any>,
  customerId: string
): Promise<IntentActionResult> {
  try {
    switch (intent) {
      case 'order_lookup':
        return await handleOrderLookup(entities, customerId);

      case 'shipping_tracking':
        return await handleShippingTracking(entities);

      case 'return_request':
        return await handleReturnRequest(entities, customerId);

      case 'refund_request':
        return await handleRefundRequest(entities, customerId);

      case 'product_recommendation':
        return await handleProductRecommendation(entities, customerId);

      case 'account_management':
        return await handleAccountManagement(entities, customerId);

      case 'faq':
        return await handleFAQ(entities);

      default:
        return {
          success: true,
          data: { message: 'General inquiry handled' },
        };
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Handle order lookup
 */
async function handleOrderLookup(
  entities: Record<string, any>,
  customerId: string
): Promise<IntentActionResult> {
  try {
    let query = supabase.from('orders').select('*');

    if (entities.orderId) {
      query = query.eq('id', entities.orderId);
    } else {
      query = query.eq('customer_id', customerId).order('created_at', { ascending: false }).limit(5);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: {
        orders: data,
        message: data.length > 0
          ? `Found ${data.length} order(s)`
          : 'No orders found',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      shouldEscalate: true,
      escalationReason: 'complex_issue',
    };
  }
}

/**
 * Handle shipping tracking
 */
async function handleShippingTracking(
  entities: Record<string, any>
): Promise<IntentActionResult> {
  try {
    const { orderId, trackingNumber } = entities;

    if (!orderId && !trackingNumber) {
      return {
        success: false,
        error: 'Please provide an order ID or tracking number',
      };
    }

    let query = supabase.from('shipments').select('*');

    if (trackingNumber) {
      query = query.eq('tracking_number', trackingNumber);
    } else if (orderId) {
      query = query.eq('order_id', orderId);
    }

    const { data, error } = await query.single();

    if (error) {
      return {
        success: false,
        error: 'Shipment not found',
      };
    }

    return {
      success: true,
      data: {
        shipment: data,
        message: `Your package is currently ${data.status}`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Handle return request
 */
async function handleReturnRequest(
  entities: Record<string, any>,
  customerId: string
): Promise<IntentActionResult> {
  try {
    const { orderId } = entities;

    if (!orderId) {
      return {
        success: false,
        error: 'Please provide your order ID to initiate a return',
      };
    }

    // Check if order exists and belongs to customer
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('customer_id', customerId)
      .single();

    if (orderError || !order) {
      return {
        success: false,
        error: 'Order not found or does not belong to you',
      };
    }

    // Check return eligibility (within 30 days)
    const orderDate = new Date(order.created_at);
    const daysSinceOrder = Math.floor(
      (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceOrder > 30) {
      return {
        success: false,
        error: 'This order is no longer eligible for return (must be within 30 days)',
        shouldEscalate: true,
        escalationReason: 'complex_issue',
      };
    }

    return {
      success: true,
      data: {
        order,
        returnEligible: true,
        message: `Your order is eligible for return. You have ${30 - daysSinceOrder} days left to return.`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      shouldEscalate: true,
      escalationReason: 'complex_issue',
    };
  }
}

/**
 * Handle refund request
 */
async function handleRefundRequest(
  entities: Record<string, any>,
  customerId: string
): Promise<IntentActionResult> {
  // Refunds are sensitive - always escalate
  return {
    success: true,
    data: {
      message: 'Refund requests require agent approval',
    },
    shouldEscalate: true,
    escalationReason: 'sensitive_data',
  };
}

/**
 * Handle product recommendation
 */
async function handleProductRecommendation(
  entities: Record<string, any>,
  customerId: string
): Promise<IntentActionResult> {
  try {
    const { productCategory } = entities;

    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(5);

    if (productCategory) {
      query = query.ilike('category', `%${productCategory}%`);
    } else {
      // Get popular products
      query = query.order('view_count', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: {
        products: data,
        message: `Here are ${data.length} recommended products`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Handle account management
 */
async function handleAccountManagement(
  entities: Record<string, any>,
  customerId: string
): Promise<IntentActionResult> {
  // Account changes are sensitive - escalate
  return {
    success: true,
    data: {
      message: 'Account changes require verification. Connecting you with an agent.',
    },
    shouldEscalate: true,
    escalationReason: 'sensitive_data',
  };
}

/**
 * Handle FAQ
 */
async function handleFAQ(entities: Record<string, any>): Promise<IntentActionResult> {
  const faqs: Record<string, string> = {
    shipping: 'We offer free shipping on orders over $50. Standard delivery takes 3-5 business days.',
    return: 'You can return items within 30 days of purchase for a full refund. Items must be in original condition.',
    payment: 'We accept credit cards, debit cards, PayPal, and bank transfers.',
    warranty: 'All products come with a 1-year manufacturer warranty.',
    international: 'We ship internationally to most countries. Shipping fees vary by destination.',
  };

  return {
    success: true,
    data: {
      faqs,
      message: 'Here are answers to common questions',
    },
  };
}
