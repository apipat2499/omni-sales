/**
 * Shipping Manager Component
 * Handles carrier selection, rate comparison, and label generation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { FulfillmentOrder } from '@/lib/utils/fulfillment-management';
import {
  ShippingRate,
  Address,
  Parcel,
  ShipmentRequest,
} from '@/lib/utils/shipping-integration';
import { useShippingCarriers } from '@/lib/hooks/useShippingCarriers';
import { useI18n } from '@/lib/hooks/useI18n';

interface ShippingManagerProps {
  fulfillmentOrder: FulfillmentOrder;
  fromAddress: Address;
  toAddress: Address;
  onLabelGenerated?: (labelUrl: string, trackingNumber: string) => void;
  onShipped?: () => void;
}

export function ShippingManager({
  fulfillmentOrder,
  fromAddress,
  toAddress,
  onLabelGenerated,
  onShipped,
}: ShippingManagerProps) {
  const { t } = useI18n();
  const {
    carriers,
    loading: carriersLoading,
    getRate,
    generateLabel,
    schedulePickup,
  } = useShippingCarriers();

  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [generatingLabel, setGeneratingLabel] = useState(false);
  const [schedulingPickup, setSchedulingPickup] = useState(false);

  // Insurance
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [insuranceAmount, setInsuranceAmount] = useState(0);

  // Options
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [saturdayDelivery, setSaturdayDelivery] = useState(false);

  // Pickup
  const [pickupDate, setPickupDate] = useState<Date>(new Date());
  const [pickupScheduled, setPickupScheduled] = useState(false);
  const [pickupConfirmation, setPickupConfirmation] = useState('');

  // Label
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

  // Calculate parcel from packing info
  const parcel: Parcel = {
    weight: fulfillmentOrder.packing.weight || 1,
    weightUnit: 'lb',
    dimensions: fulfillmentOrder.packing.dimensions || {
      length: 12,
      width: 12,
      height: 12,
      unit: 'in',
    },
  };

  // Load shipping rates
  useEffect(() => {
    if (fulfillmentOrder.packing.weight && fulfillmentOrder.packing.dimensions) {
      fetchRates();
    }
  }, [fulfillmentOrder.packing.weight, fulfillmentOrder.packing.dimensions]);

  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const fetchedRates = await getRate(fromAddress, toAddress, parcel);
      setRates(fetchedRates);

      // Auto-select cheapest rate
      if (fetchedRates.length > 0) {
        setSelectedRate(fetchedRates[0]);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoadingRates(false);
    }
  };

  // Handle generate label
  const handleGenerateLabel = async () => {
    if (!selectedRate) return;

    setGeneratingLabel(true);
    try {
      const shipment: ShipmentRequest = {
        carrier: selectedRate.carrier,
        service: selectedRate.service,
        fromAddress,
        toAddress,
        parcel,
        insurance: insuranceEnabled
          ? {
              amount: insuranceAmount,
              currency: 'USD',
            }
          : undefined,
        reference: fulfillmentOrder.orderId,
        labelFormat: 'pdf',
        signatureRequired,
        saturdayDelivery,
      };

      const label = await generateLabel(shipment);
      setLabelUrl(label.labelUrl);
      setTrackingNumber(label.trackingNumber);
      onLabelGenerated?.(label.labelUrl, label.trackingNumber);
    } catch (error) {
      console.error('Error generating label:', error);
      alert(t('fulfillment.shipping.labelGenerationError'));
    } finally {
      setGeneratingLabel(false);
    }
  };

  // Handle schedule pickup
  const handleSchedulePickup = async () => {
    if (!selectedRate) return;

    setSchedulingPickup(true);
    try {
      const carrier = carriers.find((c) => c.carrier === selectedRate.carrier);
      if (!carrier) throw new Error('Carrier not found');

      const result = await schedulePickup(
        carrier.id,
        fromAddress,
        pickupDate,
        1,
        parcel.weight
      );

      setPickupConfirmation(result.confirmationNumber);
      setPickupScheduled(true);
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      alert(t('fulfillment.shipping.pickupSchedulingError'));
    } finally {
      setSchedulingPickup(false);
    }
  };

  // Get carrier logo
  const getCarrierLogo = (carrier: string): string => {
    const logos: Record<string, string> = {
      fedex: '📦',
      ups: '📮',
      dhl: '✈️',
      usps: '📬',
    };
    return logos[carrier] || '📦';
  };

  // Get service level badge
  const getServiceBadge = (serviceLevel: string): string => {
    const badges: Record<string, string> = {
      ground: 'bg-gray-100 text-gray-800',
      express: 'bg-blue-100 text-blue-800',
      overnight: 'bg-purple-100 text-purple-800',
      international: 'bg-green-100 text-green-800',
      economy: 'bg-yellow-100 text-yellow-800',
    };
    return badges[serviceLevel] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('fulfillment.shippingManager')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('fulfillment.order')}: {fulfillmentOrder.orderId}
        </p>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('fulfillment.shipping.fromAddress')}
          </h2>
          <address className="not-italic text-sm text-gray-600">
            <p className="font-semibold">{fromAddress.name}</p>
            {fromAddress.company && <p>{fromAddress.company}</p>}
            <p>{fromAddress.street1}</p>
            {fromAddress.street2 && <p>{fromAddress.street2}</p>}
            <p>
              {fromAddress.city}, {fromAddress.state} {fromAddress.postalCode}
            </p>
            <p>{fromAddress.country}</p>
          </address>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('fulfillment.shipping.toAddress')}
          </h2>
          <address className="not-italic text-sm text-gray-600">
            <p className="font-semibold">{toAddress.name}</p>
            {toAddress.company && <p>{toAddress.company}</p>}
            <p>{toAddress.street1}</p>
            {toAddress.street2 && <p>{toAddress.street2}</p>}
            <p>
              {toAddress.city}, {toAddress.state} {toAddress.postalCode}
            </p>
            <p>{toAddress.country}</p>
          </address>
        </div>
      </div>

      {/* Package Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('fulfillment.shipping.packageDetails')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">{t('fulfillment.shipping.weight')}</p>
            <p className="text-lg font-semibold">
              {parcel.weight} {parcel.weightUnit}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('fulfillment.shipping.dimensions')}</p>
            <p className="text-lg font-semibold">
              {parcel.dimensions.length} × {parcel.dimensions.width} ×{' '}
              {parcel.dimensions.height} {parcel.dimensions.unit}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('fulfillment.shipping.boxes')}</p>
            <p className="text-lg font-semibold">{fulfillmentOrder.packing.boxes.length}</p>
          </div>
        </div>
      </div>

      {/* Shipping Rates */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('fulfillment.shipping.rates')}
          </h2>
          <button
            onClick={fetchRates}
            disabled={loadingRates}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingRates ? t('common.loading') : t('fulfillment.shipping.refreshRates')}
          </button>
        </div>

        {loadingRates ? (
          <p className="text-center text-gray-500 py-8">{t('common.loading')}</p>
        ) : rates.length === 0 ? (
          <p className="text-center text-gray-500 py-8">{t('fulfillment.shipping.noRates')}</p>
        ) : (
          <div className="space-y-3">
            {rates.map((rate, index) => (
              <div
                key={index}
                onClick={() => setSelectedRate(rate)}
                className={`border rounded-lg p-4 cursor-pointer transition ${
                  selectedRate === rate
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{getCarrierLogo(rate.carrier)}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{rate.carrierName}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getServiceBadge(
                            rate.serviceLevel
                          )}`}
                        >
                          {rate.service}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('fulfillment.shipping.estimatedDelivery')}:{' '}
                        {rate.estimatedDays} {t('common.days')}
                        {rate.deliveryGuarantee && (
                          <span className="ml-2 text-green-600">
                            ✓ {t('fulfillment.shipping.guaranteed')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {rate.currency === 'USD' ? '$' : rate.currency}
                      {rate.rate.toFixed(2)}
                    </p>
                    {rate.insuranceAvailable && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t('fulfillment.shipping.insuranceAvailable')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shipping Options */}
      {selectedRate && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('fulfillment.shipping.options')}
          </h2>
          <div className="space-y-4">
            {/* Insurance */}
            {selectedRate.insuranceAvailable && (
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="insurance"
                  checked={insuranceEnabled}
                  onChange={(e) => setInsuranceEnabled(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <label htmlFor="insurance" className="font-medium text-gray-900">
                    {t('fulfillment.shipping.insurance')}
                  </label>
                  {insuranceEnabled && (
                    <div className="mt-2">
                      <input
                        type="number"
                        value={insuranceAmount}
                        onChange={(e) => setInsuranceAmount(Number(e.target.value))}
                        placeholder={t('fulfillment.shipping.insuranceAmount')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Signature Required */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="signature"
                checked={signatureRequired}
                onChange={(e) => setSignatureRequired(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="signature" className="ml-3 font-medium text-gray-900">
                {t('fulfillment.shipping.signatureRequired')}
              </label>
            </div>

            {/* Saturday Delivery */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="saturday"
                checked={saturdayDelivery}
                onChange={(e) => setSaturdayDelivery(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="saturday" className="ml-3 font-medium text-gray-900">
                {t('fulfillment.shipping.saturdayDelivery')}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {selectedRate && !labelUrl && (
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleGenerateLabel}
            disabled={generatingLabel}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generatingLabel
              ? t('fulfillment.shipping.generatingLabel')
              : t('fulfillment.shipping.generateLabel')}
          </button>
        </div>
      )}

      {/* Label Generated */}
      {labelUrl && trackingNumber && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-green-900">
                {t('fulfillment.shipping.labelGenerated')}
              </h2>
              <p className="text-sm text-green-700 mt-1">
                {t('fulfillment.shipping.trackingNumber')}: {trackingNumber}
              </p>
            </div>
            <a
              href={labelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {t('fulfillment.shipping.downloadLabel')}
            </a>
          </div>

          {/* Schedule Pickup */}
          <div className="mt-6 pt-6 border-t border-green-200">
            <h3 className="font-semibold text-green-900 mb-4">
              {t('fulfillment.shipping.schedulePickup')}
            </h3>
            {!pickupScheduled ? (
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-green-900 mb-1">
                    {t('fulfillment.shipping.pickupDate')}
                  </label>
                  <input
                    type="date"
                    value={pickupDate.toISOString().split('T')[0]}
                    onChange={(e) => setPickupDate(new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button
                  onClick={handleSchedulePickup}
                  disabled={schedulingPickup}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {schedulingPickup
                    ? t('common.loading')
                    : t('fulfillment.shipping.schedulePickup')}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-4">
                <p className="text-green-900">
                  ✓ {t('fulfillment.shipping.pickupScheduled')}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {t('fulfillment.shipping.confirmationNumber')}: {pickupConfirmation}
                </p>
              </div>
            )}
          </div>

          {/* Mark as Shipped */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onShipped}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('fulfillment.shipping.markAsShipped')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
