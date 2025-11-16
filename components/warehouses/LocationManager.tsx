'use client';

import React, { useState, useMemo } from 'react';
import { useWarehouseManagement } from '@/lib/hooks/useWarehouseManagement';
import { WarehouseLocation, WarehouseZone } from '@/lib/utils/warehouse-management';
import { t } from '@/lib/utils/i18n';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LocationManagerProps {
  warehouseId: string;
}

type ViewMode = 'zones' | 'locations' | 'barcode';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LocationManager({ warehouseId }: LocationManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('zones');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateZoneModal, setShowCreateZoneModal] = useState(false);
  const [showCreateLocationModal, setShowCreateLocationModal] = useState(false);

  const {
    warehouse,
    locations,
    zones,
    isLoading,
    addZone,
    editZone,
    removeZone,
    addLocation,
    editLocation,
    removeLocation,
    generateBarcode,
    refresh,
  } = useWarehouseManagement(warehouseId);

  // Filter locations
  const filteredLocations = useMemo(() => {
    let filtered = locations;

    if (selectedZone) {
      filtered = filtered.filter(l => l.zone === selectedZone);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        l =>
          l.barcode?.toLowerCase().includes(query) ||
          l.zone.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [locations, selectedZone, searchQuery]);

  if (isLoading || !warehouse) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('warehouse.location.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {warehouse.name} • {locations.length} {t('warehouse.locations')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refresh()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
          >
            {t('common.refresh')}
          </button>
          <button
            onClick={() => setShowCreateLocationModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {t('warehouse.location.create')}
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <ViewTab
            active={viewMode === 'zones'}
            onClick={() => setViewMode('zones')}
            label={t('warehouse.location.zones')}
          />
          <ViewTab
            active={viewMode === 'locations'}
            onClick={() => setViewMode('locations')}
            label={t('warehouse.location.locations')}
          />
          <ViewTab
            active={viewMode === 'barcode'}
            onClick={() => setViewMode('barcode')}
            label={t('warehouse.location.barcodes')}
          />
        </nav>
      </div>

      {/* View Content */}
      <div className="mt-6">
        {viewMode === 'zones' && (
          <ZonesView
            zones={zones}
            onCreateZone={() => setShowCreateZoneModal(true)}
            onEditZone={editZone}
            onDeleteZone={removeZone}
          />
        )}
        {viewMode === 'locations' && (
          <LocationsView
            locations={filteredLocations}
            zones={zones}
            selectedZone={selectedZone}
            onZoneSelect={setSelectedZone}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreateLocation={() => setShowCreateLocationModal(true)}
            onEditLocation={editLocation}
            onDeleteLocation={removeLocation}
          />
        )}
        {viewMode === 'barcode' && (
          <BarcodeView
            warehouseId={warehouseId}
            locations={locations}
            generateBarcode={generateBarcode}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// VIEW COMPONENTS
// ============================================================================

function ZonesView({
  zones,
  onCreateZone,
  onEditZone,
  onDeleteZone,
}: {
  zones: WarehouseZone[];
  onCreateZone: () => void;
  onEditZone: (id: string, updates: any) => void;
  onDeleteZone: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('warehouse.zones')} ({zones.length})
        </h3>
        <button
          onClick={onCreateZone}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          {t('warehouse.zone.create')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map(zone => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            onEdit={onEditZone}
            onDelete={onDeleteZone}
          />
        ))}
      </div>

      {zones.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">{t('warehouse.zone.noZones')}</p>
          <button
            onClick={onCreateZone}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {t('warehouse.zone.createFirst')}
          </button>
        </div>
      )}
    </div>
  );
}

function LocationsView({
  locations,
  zones,
  selectedZone,
  onZoneSelect,
  searchQuery,
  onSearchChange,
  onCreateLocation,
  onEditLocation,
  onDeleteLocation,
}: {
  locations: WarehouseLocation[];
  zones: WarehouseZone[];
  selectedZone: string | null;
  onZoneSelect: (zone: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateLocation: () => void;
  onEditLocation: (id: string, updates: any) => void;
  onDeleteLocation: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={t('warehouse.location.search')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>

        {/* Zone Filter */}
        <select
          value={selectedZone || ''}
          onChange={(e) => onZoneSelect(e.target.value || null)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">{t('warehouse.zone.all')}</option>
          {zones.map(zone => (
            <option key={zone.id} value={zone.code}>
              {t('warehouse.zone')} {zone.code}
            </option>
          ))}
        </select>
      </div>

      {/* Locations Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t('warehouse.location.barcode')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t('warehouse.zone')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t('warehouse.location.position')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t('warehouse.location.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t('warehouse.location.stock')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {locations.map(location => (
              <tr key={location.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm font-mono text-gray-900 dark:text-white">
                    {location.barcode}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {location.zone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  A{location.aisle}-S{location.shelf}-B{location.bin}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      location.currentStock.length > 0
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {location.currentStock.length > 0 ? t('warehouse.occupied') : t('warehouse.empty')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {location.currentStock.reduce((sum, s) => sum + s.quantity, 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => onEditLocation(location.id, {})}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => onDeleteLocation(location.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400"
                  >
                    {t('common.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {locations.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">{t('warehouse.location.noLocations')}</p>
          <button
            onClick={onCreateLocation}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {t('warehouse.location.createFirst')}
          </button>
        </div>
      )}
    </div>
  );
}

function BarcodeView({
  warehouseId,
  locations,
  generateBarcode,
}: {
  warehouseId: string;
  locations: WarehouseLocation[];
  generateBarcode: (whId: string, zone: string, aisle: number, shelf: number, bin: number) => string;
}) {
  const [zone, setZone] = useState('A');
  const [aisle, setAisle] = useState(1);
  const [shelf, setShelf] = useState(1);
  const [bin, setBin] = useState(1);
  const [generatedBarcode, setGeneratedBarcode] = useState('');

  const handleGenerate = () => {
    const barcode = generateBarcode(warehouseId, zone, aisle, shelf, bin);
    setGeneratedBarcode(barcode);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Generator */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('warehouse.barcode.generator')}
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('warehouse.zone')}
              </label>
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                maxLength={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('warehouse.location.aisle')}
              </label>
              <input
                type="number"
                value={aisle}
                onChange={(e) => setAisle(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min={1}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('warehouse.location.shelf')}
              </label>
              <input
                type="number"
                value={shelf}
                onChange={(e) => setShelf(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('warehouse.location.bin')}
              </label>
              <input
                type="number"
                value={bin}
                onChange={(e) => setBin(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min={1}
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {t('warehouse.barcode.generate')}
          </button>

          {generatedBarcode && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t('warehouse.barcode.generated')}
              </div>
              <code className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                {generatedBarcode}
              </code>
            </div>
          )}
        </div>
      </div>

      {/* Barcode List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('warehouse.barcode.list')} ({locations.length})
        </h3>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {locations.map(location => (
            <div
              key={location.id}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded flex items-center justify-between"
            >
              <code className="font-mono text-sm text-gray-900 dark:text-white">
                {location.barcode}
              </code>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Zone {location.zone}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function ViewTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`py-4 px-1 border-b-2 font-medium text-sm ${
        active
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

function ZoneCard({
  zone,
  onEdit,
  onDelete,
}: {
  zone: WarehouseZone;
  onEdit: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}) {
  const utilization = zone.capacity > 0 ? (zone.usedCapacity / zone.capacity) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            {zone.name}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{zone.code}</p>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
            zone.type === 'storage'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
              : zone.type === 'picking'
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
          }`}
        >
          {zone.type}
        </span>
      </div>

      <div className="space-y-3">
        {/* Utilization */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">
              {t('warehouse.utilization')}
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {Math.round(utilization)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                utilization >= 90
                  ? 'bg-red-500'
                  : utilization >= 75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${utilization}%` }}
            />
          </div>
        </div>

        {/* Capacity */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">{t('warehouse.capacity')}</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {zone.usedCapacity} / {zone.capacity}
          </span>
        </div>

        {/* Aisle Range */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">{t('warehouse.zone.aisles')}</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {zone.aisleRange.start} - {zone.aisleRange.end}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onEdit(zone.id, {})}
          className="flex-1 px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          {t('common.edit')}
        </button>
        <button
          onClick={() => onDelete(zone.id)}
          className="flex-1 px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {t('common.delete')}
        </button>
      </div>
    </div>
  );
}
