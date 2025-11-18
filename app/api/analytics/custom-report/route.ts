/**
 * Custom Report API
 *
 * Generates custom reports based on user-defined dimensions, metrics, and filters.
 * Uses the BI Report Generator library for flexible report creation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createReportGenerator, ReportConfig } from '@/lib/analytics/bi/report-generator';
import { getCache, setCache } from '@/lib/cache/cache-manager';

export const dynamic = 'force-dynamic';

/**
 * POST endpoint to generate custom report
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      dimensions,
      metrics,
      filters,
      dateRange,
      groupBy,
      orderBy,
      limit,
      exportFormat,
      useCache = true
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Report name is required' },
        { status: 400 }
      );
    }

    if (!dimensions || dimensions.length === 0) {
      return NextResponse.json(
        { error: 'At least one dimension is required' },
        { status: 400 }
      );
    }

    if (!metrics || metrics.length === 0) {
      return NextResponse.json(
        { error: 'At least one metric is required' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `custom_report:${JSON.stringify({ dimensions, metrics, filters, dateRange })}`;
    if (useCache) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // Build report configuration
    const config: ReportConfig = {
      name,
      description,
      dimensions,
      metrics,
      filters,
      dateRange: dateRange ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      } : undefined,
      groupBy,
      orderBy,
      limit
    };

    // Generate report
    const generator = createReportGenerator();
    const report = await generator.generateReport(config);

    // If export format is requested, export the report
    if (exportFormat) {
      const blob = await generator.exportReport(report, {
        format: exportFormat,
        filename: name.toLowerCase().replace(/\s+/g, '-'),
        includeCharts: true,
        orientation: 'landscape'
      });

      // Convert blob to base64 for JSON response
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      return NextResponse.json({
        success: true,
        export: {
          format: exportFormat,
          data: base64,
          mimeType: blob.type
        },
        metadata: report.metadata
      });
    }

    const response = {
      success: true,
      data: report.data,
      metadata: report.metadata,
      config: report.config
    };

    // Cache for 6 hours
    if (useCache) {
      await setCache(cacheKey, response, 21600);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Custom report generation error:', error);
    return NextResponse.json(
      { error: `Failed to generate report: ${error}` },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve report metadata (available dimensions, metrics, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const generator = createReportGenerator();

    const metadata = {
      availableDimensions: generator.getAvailableDimensions(),
      availableMetrics: generator.getAvailableMetrics(),
      supportedExportFormats: ['pdf', 'excel', 'csv', 'json'],
      filterOperators: [
        { value: 'eq', label: 'Equals' },
        { value: 'ne', label: 'Not Equals' },
        { value: 'gt', label: 'Greater Than' },
        { value: 'gte', label: 'Greater Than or Equal' },
        { value: 'lt', label: 'Less Than' },
        { value: 'lte', label: 'Less Than or Equal' },
        { value: 'in', label: 'In List' },
        { value: 'between', label: 'Between' },
        { value: 'like', label: 'Contains' }
      ],
      periodTypes: [
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'quarter', label: 'Quarter' },
        { value: 'year', label: 'Year' }
      ]
    };

    return NextResponse.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error('Report metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report metadata' },
      { status: 500 }
    );
  }
}

/**
 * PUT endpoint to update/refresh a saved report
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, config } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Generate updated report
    const generator = createReportGenerator();
    const report = await generator.generateReport(config);

    // Clear cache for this report
    const cacheKey = `custom_report:${reportId}`;
    await setCache(cacheKey, null, 0); // Clear cache

    return NextResponse.json({
      success: true,
      data: report.data,
      metadata: report.metadata,
      message: 'Report refreshed successfully'
    });
  } catch (error) {
    console.error('Report refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh report' },
      { status: 500 }
    );
  }
}
