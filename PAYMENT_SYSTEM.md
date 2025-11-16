# Payment Processing & Invoicing System

## Overview

The Payment Processing & Invoicing System is a comprehensive solution for managing payments, invoices, refunds, and financial transactions within the Omni-Sales platform. It provides multi-tenant support with complete payment lifecycle management, invoice generation, revenue tracking, and compliance with financial regulations.

## Database Schema

The payment system uses 9 PostgreSQL tables with advanced features including JSON storage for flexible data structures, comprehensive indexing for performance, and Row-Level Security (RLS) for multi-tenant isolation.

## Core Tables

### 1. payment_methods
Manages configured payment gateway integrations and payment method settings.
- Columns: id, user_id, payment_method_name, payment_type, is_active, api_key_encrypted, secret_key_encrypted, webhook_secret, test_mode, configuration, created_at, updated_at
- Payment Types: card, bank_transfer, paypal, stripe, apple_pay, google_pay
- Use Cases: Payment gateway configuration, API credential management, webhook integration

### 2. payments
Records all payment transactions with provider details and status tracking.
- Columns: id, user_id, invoice_id, order_id, customer_id, customer_name, customer_email, payment_method_id, payment_type, provider, provider_transaction_id, amount, currency, status, payment_date, refund_status, refund_amount, refunded_at, description, metadata, created_at, updated_at
- Statuses: pending, completed, failed, cancelled, refunded
- Providers: stripe, paypal, square, razorpay, wise, manual
- Use Cases: Transaction recording, payment tracking, multi-provider support

### 3. invoices
Complete invoice management with customer details, itemization, and payment tracking.
- Columns: id, user_id, order_id, invoice_number, customer_id, customer_name, customer_email, customer_phone, billing_address, shipping_address, subtotal, tax, tax_rate, discount_amount, shipping_cost, total_amount, paid_amount, due_amount, status, payment_terms, due_date, issued_date, paid_date, invoice_date, notes, terms_and_conditions, pdf_url, email_sent, email_sent_at, reminders_sent, last_reminder_sent_at, created_at, updated_at
- Statuses: draft, sent, viewed, partially_paid, paid, overdue, cancelled
- Use Cases: Invoice generation, payment terms, customer billing, recurring billing

### 4. invoice_items
Line items for invoices with product details and pricing.
- Columns: id, invoice_id, product_id, product_name, description, quantity, unit_price, discount_percent, line_total, tax_rate, tax_amount, created_at
- Use Cases: Itemized billing, product tracking, price breakdown, tax calculation

### 5. transactions
Ledger of all financial transactions including payments, refunds, and adjustments.
- Columns: id, user_id, invoice_id, payment_id, transaction_type, amount, currency, status, reference_id, notes, created_at
- Transaction Types: payment, refund, adjustment, fee
- Use Cases: Financial ledger, transaction history, audit trail, accounting integration

### 6. refunds
Refund request management with processing status and provider tracking.
- Columns: id, user_id, payment_id, invoice_id, refund_amount, reason, status, provider_refund_id, notes, processed_at, requested_at, created_at, updated_at
- Statuses: pending, processing, completed, failed, rejected
- Use Cases: Customer refunds, return processing, payment reversals, dispute resolution

### 7. payment_disputes
Chargeback and dispute management with evidence tracking.
- Columns: id, user_id, payment_id, invoice_id, dispute_id, reason, status, amount_disputed, amount_won, evidence_urls, created_at, resolved_at, updated_at
- Statuses: open, under_review, won, lost, resolved
- Use Cases: Chargeback management, dispute evidence, resolution tracking, fraud protection

### 8. payment_reconciliations
Bank reconciliation matching expected vs. received payments.
- Columns: id, user_id, reconciliation_date, payment_method_id, total_expected, total_received, discrepancy, status, notes, reconciled_at, created_at, updated_at
- Statuses: pending, in_progress, completed, discrepancy_found
- Use Cases: Bank reconciliation, payment verification, discrepancy detection

### 9. payment_analytics
Daily aggregated KPI metrics for dashboard and reporting.
- Columns: id, user_id, analytics_date, total_revenue, total_payments, successful_payments, failed_payments, total_invoices, paid_invoices, unpaid_invoices, overdue_invoices, total_refunded, average_payment_amount, payment_success_rate, revenue_by_payment_type, revenue_by_provider, created_at
- Use Cases: Dashboard metrics, trend analysis, performance reporting, revenue forecasting

## Service Layer Functions

### Invoice Management

- **getInvoices(userId, filters)**: Retrieves all invoices for a user with optional filtering
  - Filters: status, customerId, search
  - Returns: Array of Invoice objects

- **createInvoice(userId, invoiceData)**: Creates new invoice with items
  - Input: customerId, customerName, email, phone, addresses, items, tax, discount, shipping, notes
  - Calculates totals automatically
  - Returns: Created Invoice object with calculated amounts

- **updateInvoiceStatus(invoiceId, status)**: Updates invoice status
  - Sets paid_date when status changes to 'paid'
  - Returns: Boolean success indicator

### Payment Management

- **getPayments(userId, filters)**: Retrieves all payments with optional filtering
  - Filters: status, customerId, provider
  - Returns: Array of Payment objects

- **recordPayment(userId, paymentData)**: Records new payment transaction
  - Input: invoiceId, orderId, customerId, amount, provider, type
  - Sets status to 'completed' and records payment_date
  - Returns: Created Payment object or null on error

### Refund Management

- **processRefund(userId, refundData)**: Initiates refund request
  - Input: paymentId, invoiceId, amount, reason, notes
  - Sets status to 'processing' for manual review
  - Returns: Created Refund object or null on error

### Dashboard & Analytics

- **getPaymentDashboardData(userId)**: Retrieves comprehensive dashboard metrics
  - Aggregates payments, invoices, refunds from database
  - Calculates metrics: revenue, success rate, invoice status distribution
  - Returns: PaymentDashboardData with:
    - totalRevenue, todayRevenue
    - pendingPayments, failedPayments, refundedAmount
    - totalInvoices, paidInvoices, unpaidInvoices, overdueInvoices
    - averagePaymentAmount, paymentSuccessRate
    - recentPayments[], recentInvoices[], topPaymentMethods
    - revenueByProvider, invoiceStatusDistribution, paymentMethodStats

## API Endpoints

### GET /api/payment/dashboard
Retrieves payment system dashboard data with all KPI metrics.
- Query: userId (required)
- Returns: Dashboard data with complete metrics and lists
- Response:
  ```json
  {
    "success": true,
    "data": {
      "totalRevenue": 12500.50,
      "todayRevenue": 1200.00,
      "pendingPayments": 3,
      "failedPayments": 1,
      "refundedAmount": 450.00,
      "totalInvoices": 45,
      "paidInvoices": 38,
      "unpaidInvoices": 5,
      "overdueInvoices": 2,
      "averagePaymentAmount": 325.60,
      "paymentSuccessRate": 95.50,
      "recentPayments": [...],
      "recentInvoices": [...],
      "topPaymentMethods": {...},
      "revenueByProvider": {...},
      "invoiceStatusDistribution": {...},
      "paymentMethodStats": [...]
    }
  }
  ```

## Best Practices

### Payment Processing
1. **Secure API Keys** - Encrypt and rotate payment gateway API keys regularly
2. **Error Handling** - Log all payment failures with detailed error information
3. **Idempotency** - Use idempotency keys to prevent duplicate charges
4. **Timeout Handling** - Implement proper timeouts and retry logic for payment requests
5. **PCI Compliance** - Never store raw payment card data; use tokenization

### Invoice Management
1. **Invoice Numbering** - Use sequential, unique invoice numbers for audit trail
2. **Due Date Tracking** - Monitor invoices approaching due dates
3. **Automated Reminders** - Send payment reminders before due date
4. **Late Payment Notices** - Notify customers of overdue invoices
5. **Invoice Storage** - Archive PDF copies for compliance and reference

### Reconciliation
1. **Daily Reconciliation** - Match payments to bank deposits daily
2. **Investigate Discrepancies** - Follow up on mismatched amounts immediately
3. **Document Adjustments** - Keep records of all reconciliation adjustments
4. **Timing Issues** - Account for processing delays in payment timing
5. **Refund Tracking** - Reconcile refunds against bank statements

### Refund & Dispute Management
1. **Refund Policies** - Define clear refund policies and communicate to customers
2. **Refund Timeline** - Process refunds within acceptable timeframes (typically 5-10 days)
3. **Dispute Evidence** - Maintain detailed records of transactions and customer communications
4. **Chargeback Defense** - Document transactions to defend against chargebacks
5. **Prevention** - Identify and prevent fraud patterns

### Financial Compliance
1. **Tax Calculation** - Ensure accurate tax rate application
2. **Reporting** - Generate reports for accounting and tax purposes
3. **Audit Trail** - Maintain complete audit trail of all transactions
4. **Data Retention** - Follow regulations for financial data retention (typically 7 years)
5. **Currency Handling** - Support multi-currency transactions with proper conversion rates

## Compliance Considerations

### PCI DSS Compliance
- Never store full credit card numbers
- Use secure tokenization for payment processing
- Implement SSL/TLS encryption for payment data transmission
- Maintain audit logs of all payment transactions
- Regular security testing and penetration testing

### Tax Compliance
- Calculate and track sales tax by jurisdiction
- Generate tax reports for regulatory filing
- Support tax-exempt customers
- VAT/GST tracking for international transactions
- Tax documentation for accounting

### Payment Regulations
- Support multiple payment methods as required
- Maintain payment records per financial regulations
- Implement fraud detection mechanisms
- Support customer payment disputes and chargebacks
- Compliance with payment processor requirements

### Data Protection
- GDPR compliance for EU customer data
- CCPA compliance for California customer data
- Data encryption at rest and in transit
- Regular data backups
- Customer data deletion upon request

## Troubleshooting

### High Payment Failure Rate
- Check payment gateway API status and connectivity
- Verify API keys and credentials are current
- Review transaction logs for error codes
- Contact payment processor for technical support
- Implement retry logic with exponential backoff

### Invoice Payment Not Recording
- Check invoice status and payment linkage
- Verify payment webhook is configured correctly
- Review payment matching logic
- Check for duplicate payment records
- Investigate payment processor notification delays

### Refund Processing Delays
- Check refund status in payment processor dashboard
- Verify bank account details for refund destination
- Review refund processing timelines (typically 5-10 business days)
- Check for holds on payments (fraud checks)
- Contact payment processor support if delayed beyond normal timeframe

### Invoice Number Conflicts
- Verify invoice number generation is using sequential logic
- Check for manual invoice creation conflicts
- Review invoice deletion history
- Implement unique constraint on invoice_number

### Reconciliation Discrepancies
- Verify all payments are recorded in system
- Check for timing differences (processing delays)
- Review refunds and adjustments
- Verify currency conversion rates if applicable
- Check for duplicate entries

## System Limits

- Invoice Amount: Up to $999,999.99 per invoice
- Invoice Items: Up to 1,000 items per invoice
- Payment Methods: Up to 50 active payment methods per user
- Concurrent Payments: Limited by payment processor rate limits
- Refund Window: Varies by payment processor (typically 180 days)
- Dispute Window: Typically 120-180 days per payment processor
- Storage: Unlimited invoice storage with archival for old records

## Integration Patterns

### Payment Gateway Integration
- Stripe: Direct API integration with webhook support
- PayPal: REST API with IPN webhook notifications
- Square: Square API with event-based webhooks
- Custom Processors: Generic transaction recording

### ERP/Accounting Integration
- Export payment data to accounting software
- Sync invoice data with ERP systems
- Reconciliation data sharing
- Financial report generation

### Notification Integration
- Payment confirmation emails to customers
- Invoice reminders via email/SMS
- Payment failure notifications
- Refund status updates
- Dispute notifications

### Webhook Events
- payment.completed
- payment.failed
- invoice.created
- invoice.paid
- refund.processed
- dispute.created
- reconciliation.completed

## Version History

**v1.0 - Initial Release**
- Core payment processing
- Invoice management and generation
- Refund handling
- Payment reconciliation
- Multi-provider support
- Complete financial analytics
- Dashboard and reporting
- PCI compliance support

## Related Documentation

- **Email Marketing**: EMAIL_MARKETING.md
- **SMS & Push Notifications**: SMS_PUSH_NOTIFICATIONS.md
- **Loyalty Program**: LOYALTY_PROGRAM.md
- **Support System**: SUPPORT_SYSTEM.md
- **Orders Management**: Order tracking and fulfillment

## Support & Feedback

For issues, questions, or feature requests, please:
1. Check the troubleshooting section above
2. Review the service layer function documentation
3. Check API endpoint response formats
4. Contact the development team with detailed information about the issue
