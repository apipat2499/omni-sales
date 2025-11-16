/**
 * Shipping Integration Utility
 * Handles integration with shipping carriers (FedEx, UPS, DHL)
 * Provides rate calculation, label generation, tracking, and webhooks
 */

import { PackingInfo } from './fulfillment-management';

export type CarrierType = 'fedex' | 'ups' | 'dhl' | 'usps' | 'custom';
export type ServiceLevel = 'ground' | 'express' | 'overnight' | 'international' | 'economy';
export type LabelFormat = 'pdf' | 'png' | 'zpl';
export type TrackingStatus =
  | 'pre_transit'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'exception'
  | 'cancelled';

export interface Address {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface Parcel {
  weight: number;
  weightUnit: 'lb' | 'kg' | 'oz' | 'g';
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm';
  };
}

export interface ShippingRate {
  carrier: CarrierType;
  carrierName: string;
  service: string;
  serviceLevel: ServiceLevel;
  rate: number;
  currency: string;
  estimatedDays: number;
  estimatedDelivery?: Date;
  deliveryGuarantee: boolean;
  insuranceAvailable: boolean;
  maxInsuranceAmount?: number;
  metadata?: Record<string, any>;
}

export interface CarrierConfig {
  id: string;
  carrier: CarrierType;
  name: string;
  enabled: boolean;
  credentials: {
    apiKey?: string;
    accountNumber?: string;
    meterNumber?: string;
    accessKey?: string;
    secretKey?: string;
    userId?: string;
    password?: string;
  };
  settings: {
    defaultService?: string;
    testMode: boolean;
    autoInsurance: boolean;
    defaultInsuranceAmount?: number;
    signatureRequired: boolean;
    saturdayDelivery: boolean;
  };
  negotiatedRates?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingLabel {
  id: string;
  trackingNumber: string;
  carrier: CarrierType;
  service: string;
  labelUrl: string;
  labelFormat: LabelFormat;
  labelData?: string; // Base64 encoded label
  commercialInvoiceUrl?: string;
  rate: number;
  currency: string;
  createdAt: Date;
}

export interface TrackingEvent {
  timestamp: Date;
  status: TrackingStatus;
  statusDetail: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  details: string;
  carrier: CarrierType;
}

export interface ShipmentRequest {
  carrier: CarrierType;
  service: string;
  fromAddress: Address;
  toAddress: Address;
  parcel: Parcel;
  insurance?: {
    amount: number;
    currency: string;
  };
  reference?: string;
  labelFormat?: LabelFormat;
  signatureRequired?: boolean;
  saturdayDelivery?: boolean;
  customsInfo?: CustomsInfo;
}

export interface CustomsInfo {
  contentsType: 'merchandise' | 'documents' | 'gift' | 'returned_goods' | 'sample';
  contentsExplanation?: string;
  customsItems: Array<{
    description: string;
    quantity: number;
    weight: number;
    value: number;
    originCountry: string;
    tariffCode?: string;
  }>;
  eelPfc?: string;
  certifySigner: string;
  certify: boolean;
}

export interface WebhookEvent {
  id: string;
  type: 'tracking.updated' | 'shipment.created' | 'shipment.failed' | 'delivery.confirmed';
  trackingNumber: string;
  carrier: CarrierType;
  status: TrackingStatus;
  event: TrackingEvent;
  timestamp: Date;
  data: any;
}

/**
 * Mock rate calculation for FedEx
 */
async function calculateFedExRates(
  config: CarrierConfig,
  from: Address,
  to: Address,
  parcel: Parcel
): Promise<ShippingRate[]> {
  // In production, this would call the FedEx API
  // For now, return mock rates based on weight and distance

  const baseRate = parcel.weight * 0.5; // $0.50 per lb
  const distanceFactor = from.state !== to.state ? 1.5 : 1.0;

  return [
    {
      carrier: 'fedex',
      carrierName: 'FedEx',
      service: 'FEDEX_GROUND',
      serviceLevel: 'ground',
      rate: baseRate * distanceFactor,
      currency: 'USD',
      estimatedDays: 5,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      deliveryGuarantee: false,
      insuranceAvailable: true,
      maxInsuranceAmount: 50000,
    },
    {
      carrier: 'fedex',
      carrierName: 'FedEx',
      service: 'FEDEX_EXPRESS_SAVER',
      serviceLevel: 'express',
      rate: baseRate * distanceFactor * 2,
      currency: 'USD',
      estimatedDays: 3,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      deliveryGuarantee: true,
      insuranceAvailable: true,
      maxInsuranceAmount: 50000,
    },
    {
      carrier: 'fedex',
      carrierName: 'FedEx',
      service: 'FEDEX_OVERNIGHT',
      serviceLevel: 'overnight',
      rate: baseRate * distanceFactor * 4,
      currency: 'USD',
      estimatedDays: 1,
      estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      deliveryGuarantee: true,
      insuranceAvailable: true,
      maxInsuranceAmount: 50000,
    },
  ];
}

/**
 * Mock rate calculation for UPS
 */
async function calculateUPSRates(
  config: CarrierConfig,
  from: Address,
  to: Address,
  parcel: Parcel
): Promise<ShippingRate[]> {
  // In production, this would call the UPS API
  const baseRate = parcel.weight * 0.45; // $0.45 per lb
  const distanceFactor = from.state !== to.state ? 1.5 : 1.0;

  return [
    {
      carrier: 'ups',
      carrierName: 'UPS',
      service: 'UPS_GROUND',
      serviceLevel: 'ground',
      rate: baseRate * distanceFactor,
      currency: 'USD',
      estimatedDays: 5,
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      deliveryGuarantee: false,
      insuranceAvailable: true,
      maxInsuranceAmount: 50000,
    },
    {
      carrier: 'ups',
      carrierName: 'UPS',
      service: 'UPS_3_DAY_SELECT',
      serviceLevel: 'express',
      rate: baseRate * distanceFactor * 1.8,
      currency: 'USD',
      estimatedDays: 3,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      deliveryGuarantee: true,
      insuranceAvailable: true,
      maxInsuranceAmount: 50000,
    },
    {
      carrier: 'ups',
      carrierName: 'UPS',
      service: 'UPS_NEXT_DAY_AIR',
      serviceLevel: 'overnight',
      rate: baseRate * distanceFactor * 3.5,
      currency: 'USD',
      estimatedDays: 1,
      estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      deliveryGuarantee: true,
      insuranceAvailable: true,
      maxInsuranceAmount: 50000,
    },
  ];
}

/**
 * Mock rate calculation for DHL
 */
async function calculateDHLRates(
  config: CarrierConfig,
  from: Address,
  to: Address,
  parcel: Parcel
): Promise<ShippingRate[]> {
  // In production, this would call the DHL API
  const baseRate = parcel.weight * 0.6; // $0.60 per lb (international focus)
  const isInternational = from.country !== to.country;

  return [
    {
      carrier: 'dhl',
      carrierName: 'DHL',
      service: 'DHL_ECONOMY_SELECT',
      serviceLevel: 'economy',
      rate: baseRate * (isInternational ? 2 : 1),
      currency: 'USD',
      estimatedDays: isInternational ? 7 : 5,
      estimatedDelivery: new Date(Date.now() + (isInternational ? 7 : 5) * 24 * 60 * 60 * 1000),
      deliveryGuarantee: false,
      insuranceAvailable: true,
      maxInsuranceAmount: 50000,
    },
    {
      carrier: 'dhl',
      carrierName: 'DHL',
      service: 'DHL_EXPRESS_WORLDWIDE',
      serviceLevel: 'international',
      rate: baseRate * (isInternational ? 3 : 1.5),
      currency: 'USD',
      estimatedDays: isInternational ? 3 : 2,
      estimatedDelivery: new Date(Date.now() + (isInternational ? 3 : 2) * 24 * 60 * 60 * 1000),
      deliveryGuarantee: true,
      insuranceAvailable: true,
      maxInsuranceAmount: 50000,
    },
  ];
}

/**
 * Get shipping rates from all enabled carriers
 */
export async function getShippingRates(
  carriers: CarrierConfig[],
  from: Address,
  to: Address,
  parcel: Parcel
): Promise<ShippingRate[]> {
  const enabledCarriers = carriers.filter((c) => c.enabled);
  const ratePromises: Promise<ShippingRate[]>[] = [];

  for (const carrier of enabledCarriers) {
    switch (carrier.carrier) {
      case 'fedex':
        ratePromises.push(calculateFedExRates(carrier, from, to, parcel));
        break;
      case 'ups':
        ratePromises.push(calculateUPSRates(carrier, from, to, parcel));
        break;
      case 'dhl':
        ratePromises.push(calculateDHLRates(carrier, from, to, parcel));
        break;
    }
  }

  const ratesArrays = await Promise.all(ratePromises);
  const allRates = ratesArrays.flat();

  // Sort by rate (cheapest first)
  allRates.sort((a, b) => a.rate - b.rate);

  return allRates;
}

/**
 * Generate shipping label
 */
export async function generateShippingLabel(
  config: CarrierConfig,
  shipment: ShipmentRequest
): Promise<ShippingLabel> {
  // In production, this would call the carrier's API
  // For now, return a mock label

  const trackingNumber = generateTrackingNumber(shipment.carrier);

  // Mock label generation
  const label: ShippingLabel = {
    id: `LBL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    trackingNumber,
    carrier: shipment.carrier,
    service: shipment.service,
    labelUrl: `https://example.com/labels/${trackingNumber}.pdf`,
    labelFormat: shipment.labelFormat || 'pdf',
    rate: 15.99, // Mock rate
    currency: 'USD',
    createdAt: new Date(),
  };

  // In production, you would:
  // 1. Validate addresses
  // 2. Call carrier API to create shipment
  // 3. Download label data
  // 4. Store label in cloud storage
  // 5. Return label information

  return label;
}

/**
 * Generate tracking number
 */
function generateTrackingNumber(carrier: CarrierType): string {
  const prefixes: Record<CarrierType, string> = {
    fedex: '7739',
    ups: '1Z',
    dhl: 'DHL',
    usps: '9400',
    custom: 'CUS',
  };

  const prefix = prefixes[carrier];
  const random = Math.random().toString(36).substr(2, 12).toUpperCase();

  return `${prefix}${random}`;
}

/**
 * Track package
 */
export async function trackPackage(
  carrier: CarrierType,
  trackingNumber: string,
  config?: CarrierConfig
): Promise<TrackingEvent[]> {
  // In production, this would call the carrier's tracking API
  // For now, return mock tracking events

  const mockEvents: TrackingEvent[] = [
    {
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: 'pre_transit',
      statusDetail: 'Label Created',
      details: 'Shipping label has been created',
      carrier,
    },
    {
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'in_transit',
      statusDetail: 'Picked Up',
      location: {
        city: 'Los Angeles',
        state: 'CA',
        country: 'US',
        postalCode: '90001',
      },
      details: 'Package picked up by carrier',
      carrier,
    },
    {
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'in_transit',
      statusDetail: 'In Transit',
      location: {
        city: 'Phoenix',
        state: 'AZ',
        country: 'US',
        postalCode: '85001',
      },
      details: 'Package in transit',
      carrier,
    },
    {
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'out_for_delivery',
      statusDetail: 'Out for Delivery',
      location: {
        city: 'Dallas',
        state: 'TX',
        country: 'US',
        postalCode: '75201',
      },
      details: 'Package out for delivery',
      carrier,
    },
  ];

  return mockEvents;
}

/**
 * Batch generate labels
 */
export async function batchGenerateLabels(
  config: CarrierConfig,
  shipments: ShipmentRequest[]
): Promise<{
  success: ShippingLabel[];
  failed: Array<{ shipment: ShipmentRequest; error: string }>;
}> {
  const success: ShippingLabel[] = [];
  const failed: Array<{ shipment: ShipmentRequest; error: string }> = [];

  for (const shipment of shipments) {
    try {
      const label = await generateShippingLabel(config, shipment);
      success.push(label);
    } catch (error) {
      failed.push({
        shipment,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { success, failed };
}

/**
 * Validate address
 */
export async function validateAddress(address: Address): Promise<{
  isValid: boolean;
  errors: string[];
  suggestions?: Address[];
}> {
  // In production, this would call an address validation API
  const errors: string[] = [];

  if (!address.street1) {
    errors.push('Street address is required');
  }

  if (!address.city) {
    errors.push('City is required');
  }

  if (!address.state) {
    errors.push('State is required');
  }

  if (!address.postalCode) {
    errors.push('Postal code is required');
  }

  if (!address.country) {
    errors.push('Country is required');
  }

  // Basic US postal code validation
  if (address.country === 'US' && address.postalCode) {
    const postalCodeRegex = /^\d{5}(-\d{4})?$/;
    if (!postalCodeRegex.test(address.postalCode)) {
      errors.push('Invalid US postal code format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Schedule pickup
 */
export async function schedulePickup(
  config: CarrierConfig,
  address: Address,
  pickupDate: Date,
  packageCount: number,
  totalWeight: number
): Promise<{
  confirmationNumber: string;
  pickupDate: Date;
  readyTime: string;
  closeTime: string;
}> {
  // In production, this would call the carrier's pickup scheduling API

  return {
    confirmationNumber: `PU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    pickupDate,
    readyTime: '09:00',
    closeTime: '17:00',
  };
}

/**
 * Cancel shipment
 */
export async function cancelShipment(
  config: CarrierConfig,
  trackingNumber: string
): Promise<{
  cancelled: boolean;
  refundAmount?: number;
  refundStatus: 'approved' | 'pending' | 'denied';
}> {
  // In production, this would call the carrier's void/cancel API

  return {
    cancelled: true,
    refundAmount: 15.99,
    refundStatus: 'approved',
  };
}

/**
 * Handle webhook event
 */
export function handleWebhookEvent(payload: any, carrier: CarrierType): WebhookEvent | null {
  // In production, this would parse and validate webhook payloads from carriers
  // Each carrier has a different webhook format

  try {
    // Parse carrier-specific webhook format
    const event: WebhookEvent = {
      id: payload.id || `WH-${Date.now()}`,
      type: 'tracking.updated',
      trackingNumber: payload.trackingNumber,
      carrier,
      status: payload.status,
      event: {
        timestamp: new Date(payload.timestamp),
        status: payload.status,
        statusDetail: payload.statusDetail,
        location: payload.location,
        details: payload.details,
        carrier,
      },
      timestamp: new Date(),
      data: payload,
    };

    return event;
  } catch (error) {
    console.error('Error parsing webhook event:', error);
    return null;
  }
}

/**
 * Calculate dimensional weight
 */
export function calculateDimensionalWeight(
  dimensions: { length: number; width: number; height: number; unit: 'in' | 'cm' },
  carrier: CarrierType
): number {
  // Convert to inches if needed
  let length = dimensions.length;
  let width = dimensions.width;
  let height = dimensions.height;

  if (dimensions.unit === 'cm') {
    length = length / 2.54;
    width = width / 2.54;
    height = height / 2.54;
  }

  // Different carriers use different divisors
  const divisors: Record<CarrierType, number> = {
    fedex: 139,
    ups: 139,
    dhl: 139,
    usps: 166,
    custom: 139,
  };

  const divisor = divisors[carrier];
  const dimWeight = (length * width * height) / divisor;

  return Math.ceil(dimWeight);
}

/**
 * Convert weight units
 */
export function convertWeight(
  weight: number,
  fromUnit: 'lb' | 'kg' | 'oz' | 'g',
  toUnit: 'lb' | 'kg' | 'oz' | 'g'
): number {
  if (fromUnit === toUnit) return weight;

  // Convert to pounds first
  let pounds: number;
  switch (fromUnit) {
    case 'lb':
      pounds = weight;
      break;
    case 'kg':
      pounds = weight * 2.20462;
      break;
    case 'oz':
      pounds = weight / 16;
      break;
    case 'g':
      pounds = (weight / 1000) * 2.20462;
      break;
  }

  // Convert from pounds to target unit
  switch (toUnit) {
    case 'lb':
      return pounds;
    case 'kg':
      return pounds / 2.20462;
    case 'oz':
      return pounds * 16;
    case 'g':
      return (pounds / 2.20462) * 1000;
  }
}

/**
 * Estimate delivery date
 */
export function estimateDeliveryDate(
  shipDate: Date,
  estimatedDays: number,
  excludeWeekends: boolean = true
): Date {
  let date = new Date(shipDate);
  let daysAdded = 0;

  while (daysAdded < estimatedDays) {
    date.setDate(date.getDate() + 1);

    if (excludeWeekends) {
      const dayOfWeek = date.getDay();
      // Skip weekends
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    } else {
      daysAdded++;
    }
  }

  return date;
}

/**
 * Compare shipping rates
 */
export function compareRates(rates: ShippingRate[]): {
  cheapest: ShippingRate;
  fastest: ShippingRate;
  recommended: ShippingRate;
  allRates: ShippingRate[];
} {
  if (rates.length === 0) {
    throw new Error('No rates to compare');
  }

  const sortedByPrice = [...rates].sort((a, b) => a.rate - b.rate);
  const sortedBySpeed = [...rates].sort((a, b) => a.estimatedDays - b.estimatedDays);

  // Recommended: best balance of price and speed
  const recommended = [...rates].sort((a, b) => {
    const aScore = a.rate / 10 + a.estimatedDays * 2;
    const bScore = b.rate / 10 + b.estimatedDays * 2;
    return aScore - bScore;
  })[0];

  return {
    cheapest: sortedByPrice[0],
    fastest: sortedBySpeed[0],
    recommended,
    allRates: sortedByPrice,
  };
}

/**
 * Cache for shipping rates (1 hour TTL)
 */
const rateCache = new Map<
  string,
  {
    rates: ShippingRate[];
    timestamp: number;
  }
>();

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get cached rates or fetch new ones
 */
export async function getCachedRates(
  carriers: CarrierConfig[],
  from: Address,
  to: Address,
  parcel: Parcel,
  forceRefresh: boolean = false
): Promise<ShippingRate[]> {
  const cacheKey = JSON.stringify({ from, to, parcel });
  const cached = rateCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rates;
  }

  const rates = await getShippingRates(carriers, from, to, parcel);

  rateCache.set(cacheKey, {
    rates,
    timestamp: Date.now(),
  });

  return rates;
}

/**
 * Clear rate cache
 */
export function clearRateCache(): void {
  rateCache.clear();
}
