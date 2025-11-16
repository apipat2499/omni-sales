'use client';

/**
 * useCustomerSegments Hook
 *
 * React hook for managing customer segmentation
 * Handles segment definitions, rules, and analytics
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ExtendedCustomer,
  CustomerSegmentDefinition,
  SegmentRule,
  getSegmentDefinitions,
  createSegmentDefinition,
  updateSegmentDefinition,
  deleteSegmentDefinition,
  getSegmentMatches,
} from '../utils/customer-management';

export interface SegmentStats {
  id: string;
  name: string;
  memberCount: number;
  averageLifetimeValue: number;
  averageOrders: number;
  totalRevenue: number;
  growthRate: number;
}

export interface UseCustomerSegmentsReturn {
  // Segment data
  segments: CustomerSegmentDefinition[];
  selectedSegment: CustomerSegmentDefinition | null;
  isLoading: boolean;
  error: string | null;

  // Segment operations
  loadSegments: () => void;
  getSegment: (id: string) => CustomerSegmentDefinition | null;
  createSegment: (data: Omit<CustomerSegmentDefinition, 'id' | 'createdAt' | 'updatedAt' | 'matchCount'>) => Promise<CustomerSegmentDefinition>;
  updateSegment: (id: string, updates: Partial<CustomerSegmentDefinition>) => Promise<CustomerSegmentDefinition | null>;
  deleteSegment: (id: string) => Promise<boolean>;
  selectSegment: (id: string | null) => void;

  // Segment matching
  getMatchingCustomers: (segmentId: string) => ExtendedCustomer[];
  previewMatches: (rules: SegmentRule[]) => ExtendedCustomer[];

  // Segment stats
  getSegmentStats: (segmentId: string) => SegmentStats;

  // Rule builder
  ruleFields: Array<{ value: string; label: string; type: string }>;
  operatorsByType: Record<string, Array<{ value: string; label: string }>>;
}

const RULE_FIELDS = [
  { value: 'lifetime_value', label: 'Lifetime Value', type: 'number' },
  { value: 'total_orders', label: 'Total Orders', type: 'number' },
  { value: 'average_order_value', label: 'Average Order Value', type: 'number' },
  { value: 'segment', label: 'Segment', type: 'string' },
  { value: 'tags', label: 'Tags', type: 'array' },
  { value: 'last_purchase', label: 'Last Purchase Date', type: 'date' },
  { value: 'days_since_purchase', label: 'Days Since Last Purchase', type: 'number' },
] as const;

const OPERATORS_BY_TYPE = {
  number: [
    { value: 'equals', label: 'Equals (=)' },
    { value: 'gt', label: 'Greater Than (>)' },
    { value: 'lt', label: 'Less Than (<)' },
    { value: 'gte', label: 'Greater Than or Equal (≥)' },
    { value: 'lte', label: 'Less Than or Equal (≤)' },
    { value: 'between', label: 'Between' },
  ],
  string: [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
  ],
  array: [
    { value: 'contains', label: 'Contains' },
  ],
  date: [
    { value: 'gt', label: 'After' },
    { value: 'lt', label: 'Before' },
    { value: 'between', label: 'Between' },
  ],
} as const;

export function useCustomerSegments(): UseCustomerSegmentsReturn {
  // State
  const [segments, setSegments] = useState<CustomerSegmentDefinition[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegmentDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load segments
  const loadSegments = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedSegments = getSegmentDefinitions();
      setSegments(loadedSegments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load segments');
      console.error('Error loading segments:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  // Get segment by ID
  const getSegment = useCallback(
    (id: string): CustomerSegmentDefinition | null => {
      return segments.find(s => s.id === id) || null;
    },
    [segments]
  );

  // Create segment
  const createSegment = useCallback(
    async (
      data: Omit<CustomerSegmentDefinition, 'id' | 'createdAt' | 'updatedAt' | 'matchCount'>
    ): Promise<CustomerSegmentDefinition> => {
      setIsLoading(true);
      setError(null);

      try {
        const newSegment = createSegmentDefinition(data);
        loadSegments();
        return newSegment;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create segment';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [loadSegments]
  );

  // Update segment
  const updateSegment = useCallback(
    async (
      id: string,
      updates: Partial<CustomerSegmentDefinition>
    ): Promise<CustomerSegmentDefinition | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = updateSegmentDefinition(id, updates);
        if (!updated) {
          throw new Error('Segment not found');
        }

        loadSegments();

        // Update selected segment if it's the one being updated
        if (selectedSegment?.id === id) {
          setSelectedSegment(updated);
        }

        return updated;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update segment';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [loadSegments, selectedSegment]
  );

  // Delete segment
  const deleteSegment = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const success = deleteSegmentDefinition(id);
        if (!success) {
          throw new Error('Segment not found');
        }

        loadSegments();

        // Clear selected segment if it was deleted
        if (selectedSegment?.id === id) {
          setSelectedSegment(null);
        }

        return true;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete segment';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [loadSegments, selectedSegment]
  );

  // Select segment
  const selectSegment = useCallback(
    (id: string | null) => {
      if (id === null) {
        setSelectedSegment(null);
      } else {
        const segment = getSegment(id);
        setSelectedSegment(segment);
      }
    },
    [getSegment]
  );

  // Get matching customers for a segment
  const getMatchingCustomers = useCallback((segmentId: string): ExtendedCustomer[] => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return [];

    return getSegmentMatches(segment);
  }, [segments]);

  // Preview matches for a set of rules (without saving)
  const previewMatches = useCallback((rules: SegmentRule[]): ExtendedCustomer[] => {
    const tempSegment: CustomerSegmentDefinition = {
      id: 'preview',
      name: 'Preview',
      description: '',
      rules,
      matchCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return getSegmentMatches(tempSegment);
  }, []);

  // Get segment statistics
  const getSegmentStats = useCallback(
    (segmentId: string): SegmentStats => {
      const segment = segments.find(s => s.id === segmentId);
      if (!segment) {
        return {
          id: segmentId,
          name: '',
          memberCount: 0,
          averageLifetimeValue: 0,
          averageOrders: 0,
          totalRevenue: 0,
          growthRate: 0,
        };
      }

      const matchingCustomers = getSegmentMatches(segment);

      const totalRevenue = matchingCustomers.reduce((sum, c) => sum + c.lifetime_value, 0);
      const totalOrders = matchingCustomers.reduce((sum, c) => sum + c.total_orders, 0);

      return {
        id: segment.id,
        name: segment.name,
        memberCount: matchingCustomers.length,
        averageLifetimeValue:
          matchingCustomers.length > 0 ? totalRevenue / matchingCustomers.length : 0,
        averageOrders:
          matchingCustomers.length > 0 ? totalOrders / matchingCustomers.length : 0,
        totalRevenue,
        growthRate: 0, // Would need historical data to calculate
      };
    },
    [segments]
  );

  // Rule builder helpers
  const ruleFields = useMemo(() => RULE_FIELDS as any, []);
  const operatorsByType = useMemo(() => OPERATORS_BY_TYPE, []);

  return {
    // Segment data
    segments,
    selectedSegment,
    isLoading,
    error,

    // Segment operations
    loadSegments,
    getSegment,
    createSegment,
    updateSegment,
    deleteSegment,
    selectSegment,

    // Segment matching
    getMatchingCustomers,
    previewMatches,

    // Segment stats
    getSegmentStats,

    // Rule builder
    ruleFields,
    operatorsByType,
  };
}
