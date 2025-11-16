/**
 * Scheduled Analytics Report Delivery Script
 *
 * Automatically generates and sends analytics reports via email.
 * Can be run as a cron job for daily, weekly, or monthly reports.
 *
 * Usage:
 *   ts-node scripts/send-analytics-reports.ts --frequency daily
 *   ts-node scripts/send-analytics-reports.ts --frequency weekly
 *   ts-node scripts/send-analytics-reports.ts --frequency monthly
 */

import { createReportGenerator, ReportConfig } from '../lib/analytics/bi/report-generator';
import nodemailer from 'nodemailer';

// ============================================
// CONFIGURATION
// ============================================

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface ReportRecipient {
  email: string;
  name: string;
  reports: ('daily' | 'weekly' | 'monthly')[];
}

// Email configuration (from environment variables)
const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
};

// Report recipients (in production, fetch from database)
const recipients: ReportRecipient[] = [
  {
    email: 'admin@example.com',
    name: 'Admin',
    reports: ['daily', 'weekly', 'monthly']
  },
  {
    email: 'manager@example.com',
    name: 'Manager',
    reports: ['weekly', 'monthly']
  }
];

// ============================================
// REPORT TEMPLATES
// ============================================

const reportTemplates: Record<string, ReportConfig> = {
  daily: {
    name: 'Daily Performance Report',
    description: 'Daily business performance metrics and KPIs',
    dimensions: ['date'],
    metrics: ['total_orders', 'total_revenue', 'avg_order_value', 'unique_customers'],
    dateRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      end: new Date()
    },
    orderBy: [{ field: 'date', direction: 'desc' }],
    limit: 30
  },
  weekly: {
    name: 'Weekly Analytics Report',
    description: 'Weekly business analytics with trends and insights',
    dimensions: ['week', 'order_channel'],
    metrics: [
      'total_orders',
      'total_revenue',
      'total_cost',
      'gross_profit',
      'avg_order_value',
      'unique_customers'
    ],
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      end: new Date()
    },
    groupBy: ['week', 'order_channel'],
    orderBy: [{ field: 'week', direction: 'desc' }]
  },
  monthly: {
    name: 'Monthly Business Intelligence Report',
    description: 'Comprehensive monthly business performance and analytics',
    dimensions: ['month', 'product_category'],
    metrics: [
      'total_orders',
      'total_revenue',
      'total_cost',
      'gross_profit',
      'profit_margin',
      'avg_order_value',
      'unique_customers',
      'unique_products'
    ],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    },
    groupBy: ['month', 'product_category'],
    orderBy: [{ field: 'total_revenue', direction: 'desc' }]
  }
};

// ============================================
// EMAIL TEMPLATES
// ============================================

function generateEmailHTML(
  reportName: string,
  frequency: string,
  recipientName: string,
  summary: any
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .metric {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #dee2e6;
          }
          .metric:last-child {
            border-bottom: none;
          }
          .metric-label {
            font-weight: 600;
            color: #495057;
          }
          .metric-value {
            font-weight: bold;
            color: #667eea;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #dee2e6;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportName}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">
            ${new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        <p>Hello ${recipientName},</p>

        <p>
          Here is your ${frequency} analytics report. Please find the attached PDF
          for the complete report with detailed charts and insights.
        </p>

        <div class="summary">
          <h2 style="margin-top: 0; color: #495057;">Executive Summary</h2>
          <div class="metric">
            <span class="metric-label">Total Revenue</span>
            <span class="metric-value">$${summary.totalRevenue?.toLocaleString() || '0'}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Total Orders</span>
            <span class="metric-value">${summary.totalOrders?.toLocaleString() || '0'}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Unique Customers</span>
            <span class="metric-value">${summary.uniqueCustomers?.toLocaleString() || '0'}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Average Order Value</span>
            <span class="metric-value">$${summary.avgOrderValue?.toFixed(2) || '0.00'}</span>
          </div>
          ${
            summary.grossProfit
              ? `
          <div class="metric">
            <span class="metric-label">Gross Profit</span>
            <span class="metric-value">$${summary.grossProfit?.toLocaleString() || '0'}</span>
          </div>
          `
              : ''
          }
        </div>

        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/analytics/advanced" class="button">
            View Full Dashboard
          </a>
        </div>

        <div class="footer">
          <p>
            This is an automated report from your Omni-Sales Analytics System.<br>
            To manage your report preferences, please visit the dashboard settings.
          </p>
          <p style="margin-top: 20px; font-size: 12px; color: #adb5bd;">
            © ${new Date().getFullYear()} Omni-Sales. All rights reserved.
          </p>
        </div>
      </body>
    </html>
  `;
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Generate report and calculate summary
 */
async function generateReport(frequency: 'daily' | 'weekly' | 'monthly') {
  console.log(`Generating ${frequency} report...`);

  const config = reportTemplates[frequency];
  if (!config) {
    throw new Error(`No template found for frequency: ${frequency}`);
  }

  const generator = createReportGenerator();

  // Generate report data
  const report = await generator.generateReport(config);

  // Generate PDF export
  const pdf = await generator.exportReport(report, {
    format: 'pdf',
    filename: `${frequency}-report-${new Date().toISOString().split('T')[0]}`,
    includeCharts: true,
    orientation: 'landscape'
  });

  // Calculate summary
  const summary = calculateSummary(report.data);

  return {
    report,
    pdf,
    summary
  };
}

/**
 * Calculate executive summary from report data
 */
function calculateSummary(data: any[]) {
  if (!data || data.length === 0) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      uniqueCustomers: 0,
      avgOrderValue: 0
    };
  }

  const totalRevenue = data.reduce((sum, row) => sum + (row.total_revenue || 0), 0);
  const totalOrders = data.reduce((sum, row) => sum + (row.total_orders || 0), 0);
  const uniqueCustomers = data.reduce((sum, row) => sum + (row.unique_customers || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const grossProfit = data.reduce((sum, row) => sum + (row.gross_profit || 0), 0);

  return {
    totalRevenue,
    totalOrders,
    uniqueCustomers,
    avgOrderValue,
    grossProfit
  };
}

/**
 * Send email with report
 */
async function sendReportEmail(
  recipient: ReportRecipient,
  frequency: string,
  pdf: Blob,
  summary: any
) {
  console.log(`Sending ${frequency} report to ${recipient.email}...`);

  // Create transporter
  const transporter = nodemailer.createTransport(emailConfig);

  // Convert blob to buffer
  const pdfBuffer = Buffer.from(await pdf.arrayBuffer());

  // Email options
  const mailOptions = {
    from: `"Omni-Sales Analytics" <${emailConfig.auth.user}>`,
    to: recipient.email,
    subject: `${reportTemplates[frequency].name} - ${new Date().toLocaleDateString()}`,
    html: generateEmailHTML(
      reportTemplates[frequency].name,
      frequency,
      recipient.name,
      summary
    ),
    attachments: [
      {
        filename: `${frequency}-report-${new Date().toISOString().split('T')[0]}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  // Send email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent to ${recipient.email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to send email to ${recipient.email}:`, error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const frequencyArg = args.find((arg) => arg.startsWith('--frequency='));
  const frequency = frequencyArg?.split('=')[1] as 'daily' | 'weekly' | 'monthly' || 'daily';

  if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
    console.error('Invalid frequency. Use: daily, weekly, or monthly');
    process.exit(1);
  }

  console.log(`\n📊 Starting ${frequency} analytics report delivery\n`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);

  try {
    // Generate report
    const { report, pdf, summary } = await generateReport(frequency);

    console.log(`\n✓ Report generated successfully`);
    console.log(`  - Rows: ${report.metadata.rowCount}`);
    console.log(`  - Execution time: ${report.metadata.executionTime}ms`);
    console.log(`  - Total Revenue: $${summary.totalRevenue.toLocaleString()}`);
    console.log(`  - Total Orders: ${summary.totalOrders.toLocaleString()}\n`);

    // Filter recipients for this frequency
    const targetRecipients = recipients.filter((r) => r.reports.includes(frequency));

    console.log(`📧 Sending reports to ${targetRecipients.length} recipients...\n`);

    // Send emails
    const results = await Promise.all(
      targetRecipients.map((recipient) =>
        sendReportEmail(recipient, frequency, pdf, summary)
      )
    );

    const successCount = results.filter((r) => r).length;
    const failCount = results.length - successCount;

    console.log(`\n✅ Report delivery complete!`);
    console.log(`  - Success: ${successCount}`);
    console.log(`  - Failed: ${failCount}\n`);

    process.exit(failCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Error generating or sending reports:', error);
    process.exit(1);
  }
}

// ============================================
// EXECUTE
// ============================================

if (require.main === module) {
  main();
}

export { generateReport, sendReportEmail, calculateSummary };
