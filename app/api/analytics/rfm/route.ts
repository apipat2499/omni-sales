import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

interface CustomerRFM {
  customerId: string;
  customerName: string;
  recency: number; // days since last order
  frequency: number; // number of orders
  monetary: number; // total spent
  recencyScore: number; // 1-5
  frequencyScore: number; // 1-5
  monetaryScore: number; // 1-5
  rfmScore: string; // e.g., "555"
  segment: string; // Champions, Loyal, At Risk, etc.
}

function calculateRFMScore(value: number, quartiles: number[]): number {
  if (value <= quartiles[0]) return 1;
  if (value <= quartiles[1]) return 2;
  if (value <= quartiles[2]) return 3;
  if (value <= quartiles[3]) return 4;
  return 5;
}

function getSegment(r: number, f: number, m: number): string {
  const score = r + f + m;

  if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
  if (r >= 3 && f >= 3 && m >= 3) return 'Loyal Customers';
  if (r >= 4 && f <= 2 && m <= 2) return 'New Customers';
  if (r >= 3 && f <= 2 && m >= 3) return 'Big Spenders';
  if (r <= 2 && f >= 4 && m >= 4) return 'At Risk';
  if (r <= 2 && f >= 2 && m >= 2) return 'Hibernating';
  if (r <= 2 && f <= 2 && m <= 2) return 'Lost';
  if (r >= 3 && f <= 3 && m <= 3) return 'Promising';
  return 'Need Attention';
}

export async function GET(request: NextRequest) {
  try {
    // Fetch all customers with their order stats
    const { data: customers, error } = await supabase
      .from('customer_stats')
      .select('*');

    if (error) throw error;

    const now = new Date();
    const rfmData: CustomerRFM[] = [];

    // Calculate RFM values
    const recencyValues: number[] = [];
    const frequencyValues: number[] = [];
    const monetaryValues: number[] = [];

    customers?.forEach((customer) => {
      const recency = customer.lastOrderDate
        ? Math.floor((now.getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : 9999; // Very high number for customers with no orders

      recencyValues.push(recency);
      frequencyValues.push(customer.totalOrders || 0);
      monetaryValues.push(customer.totalSpent || 0);
    });

    // Calculate quartiles
    const sortedRecency = [...recencyValues].sort((a, b) => a - b);
    const sortedFrequency = [...frequencyValues].sort((a, b) => a - b);
    const sortedMonetary = [...monetaryValues].sort((a, b) => a - b);

    const recencyQuartiles = [
      sortedRecency[Math.floor(sortedRecency.length * 0.25)],
      sortedRecency[Math.floor(sortedRecency.length * 0.5)],
      sortedRecency[Math.floor(sortedRecency.length * 0.75)],
      sortedRecency[Math.floor(sortedRecency.length * 0.9)],
    ];

    const frequencyQuartiles = [
      sortedFrequency[Math.floor(sortedFrequency.length * 0.25)],
      sortedFrequency[Math.floor(sortedFrequency.length * 0.5)],
      sortedFrequency[Math.floor(sortedFrequency.length * 0.75)],
      sortedFrequency[Math.floor(sortedFrequency.length * 0.9)],
    ];

    const monetaryQuartiles = [
      sortedMonetary[Math.floor(sortedMonetary.length * 0.25)],
      sortedMonetary[Math.floor(sortedMonetary.length * 0.5)],
      sortedMonetary[Math.floor(sortedMonetary.length * 0.75)],
      sortedMonetary[Math.floor(sortedMonetary.length * 0.9)],
    ];

    // Calculate RFM scores for each customer
    customers?.forEach((customer, index) => {
      const recency = customer.lastOrderDate
        ? Math.floor((now.getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : 9999;
      const frequency = customer.totalOrders || 0;
      const monetary = customer.totalSpent || 0;

      // Note: For recency, lower is better, so we invert the score
      const recencyScore = 6 - calculateRFMScore(recency, recencyQuartiles);
      const frequencyScore = calculateRFMScore(frequency, frequencyQuartiles);
      const monetaryScore = calculateRFMScore(monetary, monetaryQuartiles);

      const segment = getSegment(recencyScore, frequencyScore, monetaryScore);

      rfmData.push({
        customerId: customer.id,
        customerName: customer.name,
        recency,
        frequency,
        monetary,
        recencyScore,
        frequencyScore,
        monetaryScore,
        rfmScore: `${recencyScore}${frequencyScore}${monetaryScore}`,
        segment,
      });
    });

    // Group by segment
    const segmentCounts: Record<string, number> = {};
    const segmentRevenue: Record<string, number> = {};

    rfmData.forEach((customer) => {
      segmentCounts[customer.segment] = (segmentCounts[customer.segment] || 0) + 1;
      segmentRevenue[customer.segment] = (segmentRevenue[customer.segment] || 0) + customer.monetary;
    });

    const segments = Object.keys(segmentCounts).map((name) => ({
      name,
      count: segmentCounts[name],
      revenue: segmentRevenue[name],
      averageValue: segmentRevenue[name] / segmentCounts[name],
    }));

    return NextResponse.json({
      customers: rfmData.sort((a, b) => {
        const scoreA = parseInt(a.rfmScore);
        const scoreB = parseInt(b.rfmScore);
        return scoreB - scoreA;
      }),
      segments: segments.sort((a, b) => b.revenue - a.revenue),
      summary: {
        totalCustomers: rfmData.length,
        champions: segmentCounts['Champions'] || 0,
        atRisk: segmentCounts['At Risk'] || 0,
        lost: segmentCounts['Lost'] || 0,
      },
    });
  } catch (error) {
    console.error('Error calculating RFM:', error);
    return NextResponse.json(
      { error: 'Failed to calculate RFM analysis' },
      { status: 500 }
    );
  }
}
