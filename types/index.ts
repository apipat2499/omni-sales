export type ProductCategory =
  | 'Electronics'
  | 'Clothing'
  | 'Food & Beverage'
  | 'Home & Garden'
  | 'Sports'
  | 'Books'
  | 'Other';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type OrderChannel =
  | 'online'
  | 'offline'
  | 'mobile'
  | 'phone';

export type CustomerTag =
  | 'vip'
  | 'regular'
  | 'new'
  | 'wholesale';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  sku: string;
  image?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  channel: OrderChannel;
  paymentMethod?: string;
  shippingAddress?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  tags: CustomerTag[];
  lastOrderDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface CategorySales {
  category: string;
  value: number;
  percentage: number;
}

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired';

export interface SubscriptionPlan {
  id: string;
  name: string;
  stripeProductId: string;
  stripePriceId: string;
  amountCents: number;
  currency: string;
  billingInterval: string;
  productLimit: number;
  features: string[];
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  endedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  plan?: SubscriptionPlan;
}

export interface Invoice {
  id: string;
  subscriptionId?: string;
  stripeInvoiceId: string;
  stripeCustomerId: string;
  amountCents: number;
  currency: string;
  status: string;
  description?: string;
  pdfUrl?: string;
  hostedInvoiceUrl?: string;
  paidAt?: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  subscriptionId?: string;
  stripeChargeId: string;
  stripePaymentIntentId: string;
  amountCents: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MarketplaceCode = 'shopee' | 'lazada' | 'facebook';

export interface MarketplacePlatform {
  id: string;
  name: string;
  code: MarketplaceCode;
  iconUrl?: string;
  apiBaseUrl: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceConnection {
  id: string;
  userId: string;
  platformId: string;
  platformCode: MarketplaceCode;
  shopId?: string;
  shopName?: string;
  accessToken?: string;
  refreshToken?: string;
  shopAuthorizationToken?: string;
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  lastSyncedAt?: Date;
  connectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceProduct {
  id: string;
  userId: string;
  connectionId: string;
  marketplaceProductId: string;
  platformCode: MarketplaceCode;
  localProductId?: string;
  name: string;
  description?: string;
  price?: number;
  quantityAvailable?: number;
  imageUrl?: string;
  marketplaceUrl?: string;
  status: string;
  metadata?: Record<string, unknown>;
  syncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceOrder {
  id: string;
  userId: string;
  connectionId: string;
  localOrderId?: string;
  marketplaceOrderId: string;
  platformCode: MarketplaceCode;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderStatus: string;
  paymentStatus?: string;
  totalAmount: number;
  currency: string;
  shippingAddress?: string;
  itemsCount?: number;
  rawData?: Record<string, unknown>;
  syncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceOrderItem {
  id: string;
  marketplaceOrderId: string;
  marketplaceProductId?: string;
  productName: string;
  quantity: number;
  price: number;
  variationDetails?: Record<string, unknown>;
  createdAt: Date;
}

export interface MarketplaceSyncLog {
  id: string;
  userId: string;
  connectionId: string;
  syncType: string;
  status: 'pending' | 'success' | 'failed';
  itemsSynced: number;
  itemsFailed: number;
  errorMessage?: string;
  syncDurationMs?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface DailyMetrics {
  id: string;
  userId: string;
  date: Date;
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  uniqueCustomers: number;
  returnedOrders: number;
  cancelledOrders: number;
  completedOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductPerformance {
  id: string;
  userId: string;
  productId: string;
  date: Date;
  unitsSold: number;
  revenue: number;
  profit: number;
  returns: number;
  ratingAvg?: number;
  rankByRevenue?: number;
  trend?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAnalytics {
  id: string;
  userId: string;
  customerId: string;
  lifetimeValue: number;
  orderCount: number;
  averageOrderValue: number;
  firstPurchaseDate?: Date;
  lastPurchaseDate?: Date;
  daysSincePurchase?: number;
  purchaseFrequency?: number;
  segment?: string;
  churnRisk?: number;
  rfmScore?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelPerformance {
  id: string;
  userId: string;
  channel: string;
  date: Date;
  orders: number;
  revenue: number;
  profit: number;
  averageOrderValue: number;
  conversionRate?: number;
  costPerAcquisition?: number;
  roi?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryPerformance {
  id: string;
  userId: string;
  category: string;
  date: Date;
  orders: number;
  revenue: number;
  profit: number;
  unitsSold: number;
  averagePrice: number;
  marginPercent?: number;
  trend?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesForecast {
  id: string;
  userId: string;
  forecastDate: Date;
  predictedOrders?: number;
  predictedRevenue?: number;
  predictedProfit?: number;
  confidenceScore?: number;
  modelVersion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomReport {
  id: string;
  userId: string;
  name: string;
  description?: string;
  reportType: string;
  filters?: Record<string, unknown>;
  metrics?: string[];
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  isScheduled?: boolean;
  scheduleInterval?: string;
  lastGeneratedAt?: Date;
  exportFormat?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Anomaly {
  id: string;
  userId: string;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high';
  detectedValue?: number;
  expectedValue?: number;
  deviationPercent?: number;
  affectedMetric?: string;
  description?: string;
  isResolved?: boolean;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface AnalyticsDashboard {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  uniqueCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  topProducts: ProductPerformance[];
  topChannels: ChannelPerformance[];
  topCategories: CategoryPerformance[];
  customerSegments: Record<string, number>;
  anomalies: Anomaly[];
}

export type EmailTemplateType =
  | 'order_confirmation'
  | 'payment_receipt'
  | 'order_shipped'
  | 'order_delivered'
  | 'low_stock_alert'
  | 'daily_summary'
  | 'weekly_report'
  | 'abandoned_cart'
  | 'customer_welcome'
  | 'payment_failed';

export interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  templateType: EmailTemplateType;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
  isDefault?: boolean;
  isActive?: boolean;
  previewData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailLog {
  id: string;
  userId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  templateType?: EmailTemplateType;
  status: 'pending' | 'sent' | 'failed' | 'bounced' | 'complained';
  provider?: string;
  providerId?: string;
  opened?: boolean;
  clicked?: boolean;
  openedAt?: Date;
  clickedAt?: Date;
  bounced?: boolean;
  bouncedReason?: string;
  relatedOrderId?: string;
  relatedCustomerId?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailPreferences {
  id: string;
  userId: string;
  dailySummaryEnabled?: boolean;
  dailySummaryTime?: string;
  newOrderNotification?: boolean;
  paymentConfirmation?: boolean;
  lowStockAlert?: boolean;
  lowStockThreshold?: number;
  customerEmailsEnabled?: boolean;
  marketingEmails?: boolean;
  weeklyAnalytics?: boolean;
  monthlyReport?: boolean;
  promotionalEmails?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTrigger {
  id: string;
  userId: string;
  triggerName: string;
  triggerEvent: string;
  templateId: string;
  isEnabled?: boolean;
  delayMinutes?: number;
  recipientType: string;
  conditions?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailQueueItem {
  id: string;
  userId: string;
  recipientEmail: string;
  recipientName?: string;
  templateId?: string;
  subject: string;
  htmlContent: string;
  variables?: Record<string, unknown>;
  status: 'pending' | 'sent' | 'failed';
  retryCount?: number;
  maxRetries?: number;
  scheduledFor?: Date;
  sentAt?: Date;
  errorMessage?: string;
  relatedOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Warehouse {
  id: string;
  userId: string;
  name: string;
  warehouseCode?: string;
  address?: string;
  phone?: string;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryLevel {
  id: string;
  userId: string;
  productId: string;
  warehouseId?: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  lastCountedAt?: Date;
  lastMovementAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  userId: string;
  productId: string;
  warehouseId?: string;
  movementType: string;
  quantityChange: number;
  quantityBefore?: number;
  quantityAfter?: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

export interface ReorderPoint {
  id: string;
  userId: string;
  productId: string;
  warehouseId?: string;
  minStock: number;
  maxStock: number;
  reorderQuantity: number;
  leadTimeDays?: number;
  autoReorder?: boolean;
  isActive?: boolean;
  lastReorderAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockTransfer {
  id: string;
  userId: string;
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  status: 'pending' | 'shipped' | 'received' | 'cancelled';
  shippedAt?: Date;
  receivedAt?: Date;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Barcode {
  id: string;
  userId: string;
  productId: string;
  barcode: string;
  barcodeType?: string;
  quantityPerUnit?: number;
  isActive?: boolean;
  createdAt: Date;
}

export interface StockCount {
  id: string;
  userId: string;
  warehouseId: string;
  countDate: Date;
  status: 'in_progress' | 'completed' | 'cancelled';
  totalItems?: number;
  totalVariance?: number;
  variancePercentage?: number;
  completedAt?: Date;
  createdBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryForecast {
  id: string;
  userId: string;
  productId: string;
  warehouseId?: string;
  forecastDate: Date;
  predictedQuantity?: number;
  confidenceScore?: number;
  method?: string;
  createdAt: Date;
}

export interface InventoryStats {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  turnoverRate: number;
  accuracyRate: number;
}

// ============================================
// CUSTOMER MANAGEMENT (CRM) TYPES
// ============================================

export interface CustomerProfile {
  id: string;
  userId: string;
  customerId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  companyName?: string;
  industry?: string;
  website?: string;
  profilePicture?: string;
  preferredLanguage?: string;
  timezone?: string;
  customerType?: string; // retail, wholesale, distributor
  source?: string; // direct, marketplace, referral
  status: 'active' | 'inactive' | 'vip' | 'at_risk' | 'lost';
  lifetimeValue: number;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate?: Date;
  lastOrderDate?: Date;
  averageOrderValue?: number;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAddress {
  id: string;
  userId: string;
  customerId: string;
  addressType?: string; // billing, shipping, home, office
  streetAddress: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerPreferences {
  id: string;
  userId: string;
  customerId: string;
  notificationEmail: boolean;
  notificationSms: boolean;
  notificationPush: boolean;
  marketingEmails: boolean;
  promotionalOffers: boolean;
  newsletter: boolean;
  productUpdates: boolean;
  orderNotifications: boolean;
  communicationFrequency?: string; // daily, weekly, monthly
  preferredContactMethod?: string; // email, phone, sms
  doNotContact: boolean;
  gdprConsent: boolean;
  gdprConsentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerSegment {
  id: string;
  userId: string;
  name: string;
  description?: string;
  criteria?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerTag {
  id: string;
  userId: string;
  customerId: string;
  tag: string;
  color?: string;
  addedDate: Date;
}

export interface CustomerNote {
  id: string;
  userId: string;
  customerId: string;
  title?: string;
  content: string;
  noteType?: string; // internal, follow_up, reminder, complaint, compliment
  priority?: string; // low, medium, high
  isPinned: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerCommunication {
  id: string;
  userId: string;
  customerId: string;
  communicationType: string; // email, sms, phone, chat, in_person
  subject?: string;
  message: string;
  direction: string; // inbound, outbound
  channel: string; // email, marketplace_message, sms, phone
  status: string; // sent, delivered, opened, clicked, bounced, replied
  sentBy?: string;
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  repliedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerInteraction {
  id: string;
  userId: string;
  customerId: string;
  interactionType: string; // visit, purchase, review, support, return, inquiry
  eventName?: string;
  eventValue?: number;
  pageUrl?: string;
  ipAddress?: string;
  userAgent?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface LoyaltyProgram {
  id: string;
  userId: string;
  name: string;
  description?: string;
  programType: string; // points, tier, referral, vip
  isActive: boolean;
  pointMultiplier: number;
  minPurchaseForPoints: number;
  pointExpiryDays?: number;
  tierStructure?: Record<string, any>;
  rewards?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerLoyaltyPoints {
  id: string;
  userId: string;
  customerId: string;
  loyaltyProgramId?: string;
  totalPoints: number;
  availablePoints: number;
  redeemedPoints: number;
  tierLevel?: string;
  tierSince?: Date;
  pointsExpiryDate?: Date;
  lastActivityDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerRFMScore {
  id: string;
  userId: string;
  customerId: string;
  recencyScore?: number; // 1-5
  frequencyScore?: number; // 1-5
  monetaryScore?: number; // 1-5
  overallRFMScore?: number;
  rfmSegment?: string; // Champions, Loyal, At Risk, etc
  lastCalculatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAnalytics {
  id: string;
  userId: string;
  customerId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  repeatPurchaseRate: number;
  productPreferences?: string[];
  purchaseFrequencyDays?: number;
  churnRiskScore: number; // 0-1
  lifetimeValuePredicted: number;
  engagementScore?: number;
  satisfactionScore?: number;
  npsScore?: number; // -100 to 100
  lastCalculatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// ORDER MANAGEMENT TYPES
// ============================================

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: string;
  reason?: string;
  notes?: string;
  changedBy?: string;
  createdAt: Date;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'partial';
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderShipping {
  id: string;
  orderId: string;
  shippingMethod?: string;
  carrier?: string;
  trackingNumber?: string;
  weightKg?: number;
  dimensionsCm?: string;
  shippingAddress: string;
  shippingStatus: 'pending' | 'picked' | 'packed' | 'shipped' | 'in_transit' | 'delivered' | 'failed';
  shippedAt?: Date;
  deliveredAt?: Date;
  estimatedDelivery?: Date;
  signatureRequired: boolean;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderReturn {
  id: string;
  orderId: string;
  returnNumber: string;
  returnReason: string;
  reasonDetails?: string;
  returnStatus: 'pending' | 'approved' | 'rejected' | 'received' | 'processed';
  refundAmount?: number;
  requestedAt: Date;
  approvedAt?: Date;
  receivedAt?: Date;
  processedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnItem {
  id: string;
  returnId: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  reason?: string;
  condition?: 'unopened' | 'opened' | 'defective' | 'damaged';
  createdAt: Date;
}

export interface Refund {
  id: string;
  orderId?: string;
  returnId?: string;
  amount: number;
  reason: string;
  refundMethod: 'original_payment' | 'store_credit' | 'bank_transfer';
  refundStatus: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  initiatedAt: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FulfillmentTask {
  id: string;
  orderId: string;
  taskType: 'pick' | 'pack' | 'ship' | 'verify' | 'label';
  taskStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDiscount {
  id: string;
  orderId: string;
  couponCode?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  discountAmount: number;
  description?: string;
  createdAt: Date;
}

export interface OrderWithDetails {
  id: string;
  customerId: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: string;
  channel: string;
  paymentMethod?: string;
  shippingAddress?: string;
  notes?: string;
  items: OrderItem[];
  payments?: OrderPayment[];
  shipping?: OrderShipping;
  returns?: OrderReturn[];
  refunds?: Refund[];
  discounts?: OrderDiscount[];
  statusHistory?: OrderStatusHistory[];
  fulfillmentTasks?: FulfillmentTask[];
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
}

// ============================================
// DISCOUNT & COUPON MANAGEMENT TYPES
// ============================================

export type DiscountType = 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'tiered';
export type DiscountStatus = 'active' | 'inactive' | 'expired' | 'archived';
export type DiscountApplicableTo = 'all' | 'specific_products' | 'specific_categories' | 'specific_customers';
export type RuleType = 'quantity_based' | 'amount_based' | 'category_based' | 'customer_segment';
export type CampaignType = 'seasonal' | 'flash_sale' | 'loyalty' | 'bulk_discount' | 'referral';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended' | 'archived';
export type TargetAudience = 'all' | 'specific_segment' | 'new_customers' | 'vip_customers';
export type MarketingChannel = 'email' | 'sms' | 'in_app' | 'web' | 'social';

export interface DiscountCode {
  id: string;
  userId: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  currency: string;
  status: DiscountStatus;
  isStackable: boolean;
  isExclusive: boolean;
  usageLimit?: number;
  usagePerCustomer?: number;
  currentUsageCount: number;
  minimumOrderValue?: number;
  maximumDiscountAmount?: number;
  applicableTo: DiscountApplicableTo;
  startDate?: Date;
  endDate?: Date;
  autoApply: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface DiscountRule {
  id: string;
  userId: string;
  discountCodeId: string;
  ruleType: RuleType;
  conditionOperator?: 'equals' | 'greater_than' | 'less_than' | 'between';
  conditionValue?: Record<string, any>;
  discountValue: number;
  priority: number;
  createdAt: Date;
}

export interface DiscountCodeProduct {
  id: string;
  userId: string;
  discountCodeId: string;
  productId: string;
  productSku?: string;
  productName?: string;
  createdAt: Date;
}

export interface DiscountCodeCategory {
  id: string;
  userId: string;
  discountCodeId: string;
  categoryName: string;
  createdAt: Date;
}

export interface DiscountCodeSegment {
  id: string;
  userId: string;
  discountCodeId: string;
  customerSegmentId?: string;
  segmentName: string;
  createdAt: Date;
}

export interface CouponRedemption {
  id: string;
  userId: string;
  discountCodeId?: string;
  orderId?: string;
  customerId?: string;
  code: string;
  discountAmount: number;
  redeemedAt: Date;
  redeemedBy?: string;
  notes?: string;
}

export interface PromotionalCampaign {
  id: string;
  userId: string;
  campaignName: string;
  description?: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  startDate?: Date;
  endDate?: Date;
  budgetLimit?: number;
  budgetUsed: number;
  discountCodes: string[];
  targetAudience: TargetAudience;
  minPurchaseAmount?: number;
  marketingChannel?: MarketingChannel;
  campaignNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface DiscountAnalytics {
  id: string;
  userId: string;
  discountCodeId?: string;
  campaignId?: string;
  date: Date;
  totalRedemptions: number;
  totalDiscountAmount: number;
  averageOrderValue?: number;
  ordersCreated: number;
  customersReached: number;
  conversionRate?: number;
  createdAt: Date;
}

export interface DiscountWithDetails extends DiscountCode {
  rules?: DiscountRule[];
  applicableProducts?: DiscountCodeProduct[];
  applicableCategories?: DiscountCodeCategory[];
  applicableSegments?: DiscountCodeSegment[];
  redemptions?: CouponRedemption[];
  analytics?: DiscountAnalytics[];
}

// ============================================
// REVIEW & RATING MANAGEMENT TYPES
// ============================================

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden';
export type ReportReason = 'inappropriate' | 'fake' | 'spam' | 'offensive' | 'factually_incorrect';
export type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';
export type VoteType = 'helpful' | 'unhelpful';

export interface ProductReview {
  id: string;
  userId: string;
  productId: string;
  customerId?: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  title: string;
  content: string;
  rating: number; // 1-5
  helpfulCount: number;
  unhelpfulCount: number;
  status: ReviewStatus;
  moderationNotes?: string;
  verifiedPurchase: boolean;
  isFeatured: boolean;
  responseText?: string;
  responseBy?: string;
  responseAt?: Date;
  reportedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewImage {
  id: string;
  userId: string;
  reviewId: string;
  imageUrl: string;
  altText?: string;
  displayOrder?: number;
  createdAt: Date;
}

export interface ReviewVote {
  id: string;
  userId: string;
  reviewId: string;
  voterEmail: string;
  voteType: VoteType;
  createdAt: Date;
}

export interface ReviewReport {
  id: string;
  userId: string;
  reviewId: string;
  reporterEmail: string;
  reportReason: ReportReason;
  reportDescription?: string;
  status: ReportStatus;
  actionTaken?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface ProductRatingSummary {
  id: string;
  userId: string;
  productId: string;
  totalReviews: number;
  approvedReviews: number;
  averageRating: number; // 0.00 to 5.00
  rating5Count: number;
  rating4Count: number;
  rating3Count: number;
  rating2Count: number;
  rating1Count: number;
  recommendationCount: number;
  lastReviewDate?: Date;
  updatedAt: Date;
}

export interface ReviewAnalytics {
  id: string;
  userId: string;
  date: Date;
  productId?: string;
  totalNewReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  averageRating: number;
  positiveReviews: number; // 4-5 stars
  negativeReviews: number; // 1-2 stars
  totalHelpfulVotes: number;
  responseRate: number; // percentage
  createdAt: Date;
}

export interface ProductReviewWithDetails extends ProductReview {
  images?: ReviewImage[];
  votes?: ReviewVote[];
  reports?: ReviewReport[];
}

// ============================================
// WISHLIST & FAVORITES SYSTEM TYPES
// ============================================

export type WishlistVisibility = 'private' | 'friends' | 'public';
export type WishlistItemPriority = 0 | 1 | 2; // 0=low, 1=medium, 2=high
export type ShareType = 'link' | 'email' | 'social';

export interface Wishlist {
  id: string;
  userId: string;
  customerEmail: string;
  wishlistName: string;
  description?: string;
  isPublic: boolean;
  shareCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItem {
  id: string;
  userId: string;
  wishlistId: string;
  productId: string;
  productName: string;
  productImage?: string;
  priceAtAdded: number;
  currentPrice: number;
  priority: WishlistItemPriority;
  notes?: string;
  quantityDesired: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistShare {
  id: string;
  userId: string;
  wishlistId: string;
  shareEmail?: string;
  shareName?: string;
  shareToken: string;
  shareType: ShareType;
  viewCount: number;
  accessedAt?: Date;
  expiresAt?: Date;
  canEdit: boolean;
  createdAt: Date;
}

export interface WishlistPriceHistory {
  id: string;
  userId: string;
  wishlistItemId: string;
  oldPrice: number;
  newPrice: number;
  priceDropAmount: number;
  priceDropPercent: number;
  notificationSent: boolean;
  priceCheckedAt: Date;
  createdAt: Date;
}

export interface WishlistAnalytics {
  id: string;
  userId: string;
  wishlistId?: string;
  date: Date;
  totalItems: number;
  totalValue: number;
  averagePrice: number;
  shareCount: number;
  viewCount: number;
  itemsAdded: number;
  itemsRemoved: number;
  itemsPurchased: number;
  priceDropItems: number;
  createdAt: Date;
}

export interface WishlistPreferences {
  id: string;
  userId: string;
  customerEmail: string;
  notifyPriceDrops: boolean;
  priceDropThreshold: number;
  notifyBackInStock: boolean;
  notifySharedWishlists: boolean;
  weeklyDigest: boolean;
  defaultWishlistVisibility: WishlistVisibility;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistWithItems extends Wishlist {
  items?: WishlistItem[];
  itemCount?: number;
  totalValue?: number;
}

export interface WishlistWithShares extends Wishlist {
  shares?: WishlistShare[];
  items?: WishlistItem[];
}

// ============================================
// LOYALTY & REWARDS TYPES
// ============================================

export type LoyaltyProgramType = 'points' | 'tier' | 'referral' | 'vip';
export type RewardType = 'discount' | 'free_product' | 'free_shipping' | 'upgrade' | 'exclusive_access';
export type RewardUnit = 'percent' | 'amount' | 'points' | 'quantity';
export type RedemptionStatus = 'pending' | 'approved' | 'claimed' | 'used' | 'expired' | 'cancelled';
export type PointTransactionType = 'earned' | 'redeemed' | 'expired' | 'adjusted' | 'refunded';
export type ReferralStatus = 'pending' | 'completed' | 'cancelled' | 'expired';
export type PointRuleType = 'purchase' | 'review' | 'referral' | 'signup' | 'birthday' | 'social_share';

export interface LoyaltyProgram {
  id: string;
  userId: string;
  name: string;
  description?: string;
  programType: LoyaltyProgramType;
  isActive: boolean;
  pointMultiplier: number;
  minPurchaseForPoints: number;
  pointExpiryDays?: number;
  tierStructure?: Record<string, unknown>;
  rewards?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyTier {
  id: string;
  userId: string;
  loyaltyProgramId: string;
  tierName: string;
  tierLevel: number;
  minPoints: number;
  maxPoints?: number;
  minAnnualSpending: number;
  maxAnnualSpending?: number;
  pointsMultiplier: number;
  bonusPointsOnJoin: number;
  exclusiveBenefits: string[];
  colorHex?: string;
  iconUrl?: string;
  isVip: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyPointRule {
  id: string;
  userId: string;
  loyaltyProgramId: string;
  ruleName: string;
  ruleType: PointRuleType;
  triggerEvent: string;
  pointsEarned: number;
  pointsCalculationType?: string;
  percentageValue?: number;
  minTransactionAmount?: number;
  maxPointsPerTransaction?: number;
  categoryApplicable: string[];
  isStackable: boolean;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyReward {
  id: string;
  userId: string;
  loyaltyProgramId: string;
  rewardName: string;
  rewardType: RewardType;
  rewardValue: number;
  rewardUnit: RewardUnit;
  pointsRequired: number;
  totalAvailableQuantity?: number;
  claimedQuantity: number;
  description?: string;
  termsConditions?: string;
  imageUrl?: string;
  tierRequired?: string;
  isActive: boolean;
  isFeatured: boolean;
  expiryDays?: number;
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerRewardRedemption {
  id: string;
  userId: string;
  customerId: string;
  loyaltyProgramId?: string;
  rewardId: string;
  pointsSpent: number;
  redemptionStatus: RedemptionStatus;
  redemptionCode: string;
  orderAppliedTo?: string;
  claimedAt?: Date;
  usedAt?: Date;
  expiresAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyPointTransaction {
  id: string;
  userId: string;
  customerId: string;
  loyaltyProgramId?: string;
  transactionType: PointTransactionType;
  pointsAmount: number;
  pointsBefore?: number;
  pointsAfter?: number;
  relatedOrderId?: string;
  relatedRewardId?: string;
  relatedRuleId?: string;
  description?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

export interface LoyaltyTierHistory {
  id: string;
  userId: string;
  customerId: string;
  loyaltyProgramId?: string;
  previousTierId?: string;
  newTierId: string;
  promotionReason?: string;
  effectiveDate: Date;
  downgradeReason?: string;
  expiryDate?: Date;
  createdAt: Date;
}

export interface LoyaltyPromotion {
  id: string;
  userId: string;
  loyaltyProgramId: string;
  promotionName: string;
  promotionType?: string;
  description?: string;
  pointsMultiplier: number;
  bonusPointsFixed?: number;
  minTransactionAmount?: number;
  maxBonusPoints?: number;
  targetCustomerSegment?: string;
  applicableCategories: string[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  promotionCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyAnalytics {
  id: string;
  userId: string;
  loyaltyProgramId?: string;
  date: Date;
  totalActiveMembers: number;
  newMembers: number;
  pointsIssued: number;
  pointsRedeemed: number;
  pointsExpired: number;
  rewardsClaimed: number;
  rewardsUsed: number;
  avgPointsPerMember: number;
  tierDistribution?: Record<string, number>;
  engagementRate: number;
  repeatPurchaseRate: number;
  revenueFromLoyaltyPurchases: number;
  createdAt: Date;
}

export interface LoyaltyReferralReward {
  id: string;
  userId: string;
  loyaltyProgramId: string;
  referrerCustomerId: string;
  referredCustomerId?: string;
  referralCode: string;
  referrerPoints: number;
  referredCustomerDiscount: number;
  referredCustomerPoints: number;
  referralStatus: ReferralStatus;
  referredCustomerMadePurchase: boolean;
  purchaseDate?: Date;
  minimumPurchaseAmount?: number;
  claimedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerLoyaltyAccount {
  userId: string;
  customerId: string;
  loyaltyProgramId?: string;
  totalPoints: number;
  availablePoints: number;
  redeemedPoints: number;
  tierLevel?: string;
  tierSince?: Date;
  pointsExpiryDate?: Date;
  lastActivityDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// SMS & TEXT MESSAGE NOTIFICATION TYPES
// ============================================

export type SMSStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced';
export type SMSTemplateType = 'order_confirmation' | 'shipping_update' | 'payment_reminder' | 'verification' | 'promotional' | 'reminder' | 'customer_service';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
export type BounceType = 'permanent' | 'temporary' | 'invalid';
export type ConsentStatus = 'opted_in' | 'opted_out' | 'pending' | 'revoked';
export type RegulatoryFramework = 'TCPA' | 'GDPR' | 'PDPA' | 'CCPA';

export interface SMSProvider {
  id: string;
  userId: string;
  providerName: string;
  isActive: boolean;
  senderId: string;
  monthlyQuota: number;
  currentUsage: number;
  supportedCountries: string[];
  connectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSTemplate {
  id: string;
  userId: string;
  name: string;
  templateType: SMSTemplateType;
  content: string;
  variables: string[];
  characterCount: number;
  smsCount: number;
  isDefault: boolean;
  isActive: boolean;
  previewData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSTrigger {
  id: string;
  userId: string;
  triggerName: string;
  triggerEvent: string;
  templateId?: string;
  isEnabled: boolean;
  delayMinutes: number;
  recipientType: string;
  conditions?: Record<string, unknown>;
  maxFrequencyHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSLog {
  id: string;
  userId: string;
  recipientPhone: string;
  recipientName?: string;
  templateType?: SMSTemplateType;
  content: string;
  status: SMSStatus;
  provider?: string;
  providerMessageId?: string;
  deliveryStatus?: string;
  failureReason?: string;
  failureCode?: string;
  segmentsUsed: number;
  cost?: number;
  relatedOrderId?: string;
  relatedCustomerId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSQueue {
  id: string;
  userId: string;
  recipientPhone: string;
  recipientName?: string;
  templateId?: string;
  content: string;
  variables?: Record<string, unknown>;
  status: string;
  retryCount: number;
  maxRetries: number;
  scheduledFor?: Date;
  sentAt?: Date;
  errorMessage?: string;
  relatedOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSPreferences {
  id: string;
  userId: string;
  customerId: string;
  customerPhone: string;
  phoneVerified: boolean;
  verifiedAt?: Date;
  orderNotifications: boolean;
  orderConfirmation: boolean;
  shippingUpdates: boolean;
  deliveryConfirmation: boolean;
  paymentReminders: boolean;
  promotionalOffers: boolean;
  cartAbandonment: boolean;
  loyaltyRewards: boolean;
  isOptedIn: boolean;
  optedInDate?: Date;
  optedOutDate?: Date;
  optedOutReason?: string;
  doNotContact: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSCampaign {
  id: string;
  userId: string;
  campaignName: string;
  description?: string;
  campaignType: string;
  status: CampaignStatus;
  templateId?: string;
  content?: string;
  targetAudience: string;
  recipientCount: number;
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;
  budgetLimit?: number;
  totalCost: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  conversionRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSAnalytics {
  id: string;
  userId: string;
  date: Date;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalBounced: number;
  totalCost: number;
  segmentsUsed: number;
  deliveryRate: number;
  failureRate: number;
  bounceRate: number;
  avgSegmentsPerMessage: number;
  uniqueRecipients: number;
  campaignId?: string;
  createdAt: Date;
}

export interface SMSBounce {
  id: string;
  userId: string;
  phoneNumber: string;
  bounceType: BounceType;
  bounceReason?: string;
  isPermanent: boolean;
  firstBounceAt?: Date;
  lastBounceAt?: Date;
  bounceCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSCompliance {
  id: string;
  userId: string;
  customerId?: string;
  phoneNumber: string;
  consentType: string;
  consentStatus: ConsentStatus;
  consentDate?: Date;
  consentMethod?: string;
  ipAddress?: string;
  regulatoryFramework?: RegulatoryFramework;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// EMAIL MARKETING & CAMPAIGNS TYPES
// ============================================

export type EmailStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked';
export type EmailTemplateType = 'order_confirmation' | 'shipping_update' | 'payment_reminder' | 'newsletter' | 'promotional' | 'welcome' | 'password_reset' | 'verification' | 'cart_recovery' | 'customer_service';
export type EmailCampaignType = 'newsletter' | 'promotional' | 'transactional' | 'welcome' | 'educational' | 'seasonal' | 'cart_recovery';
export type EmailCampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
export type EmailBounceType = 'hard_bounce' | 'soft_bounce' | 'complaint';
export type EmailConsentStatus = 'opted_in' | 'opted_out' | 'pending' | 'revoked' | 'unsupported';
export type EmailRegulatoryFramework = 'CAN-SPAM' | 'GDPR' | 'CASL' | 'PECR' | 'CCPA';

export interface EmailProvider {
  id: string;
  userId: string;
  providerName: string;
  isActive: boolean;
  fromEmail: string;
  fromName?: string;
  replyToEmail?: string;
  monthlyQuota: number;
  currentUsage: number;
  bounceRate: number;
  spamRate: number;
  reputationScore?: number;
  supportedCountries: string[];
  connectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  templateType: EmailTemplateType;
  subjectLine: string;
  preheaderText?: string;
  htmlContent: string;
  plainTextContent?: string;
  variables: string[];
  category?: string;
  thumbnailUrl?: string;
  isDefault: boolean;
  isActive: boolean;
  isResponsive: boolean;
  previewData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTrigger {
  id: string;
  userId: string;
  triggerName: string;
  triggerEvent: string;
  templateId?: string;
  isEnabled: boolean;
  delayMinutes: number;
  recipientType: string;
  conditions?: Record<string, unknown>;
  maxFrequencyHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailLog {
  id: string;
  userId: string;
  recipientEmail: string;
  recipientName?: string;
  templateType?: EmailTemplateType;
  subjectLine: string;
  emailBody?: string;
  status: EmailStatus;
  provider?: string;
  providerMessageId?: string;
  deliveryStatus?: string;
  bounceType?: EmailBounceType;
  bounceReason?: string;
  failureReason?: string;
  failureCode?: string;
  clickCount: number;
  openCount: number;
  relatedOrderId?: string;
  relatedCustomerId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailQueue {
  id: string;
  userId: string;
  recipientEmail: string;
  recipientName?: string;
  templateId?: string;
  subjectLine: string;
  htmlContent: string;
  plainTextContent?: string;
  variables?: Record<string, unknown>;
  status: string;
  retryCount: number;
  maxRetries: number;
  scheduledFor?: Date;
  sentAt?: Date;
  errorMessage?: string;
  relatedOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailPreferences {
  id: string;
  userId: string;
  customerId: string;
  emailAddress: string;
  emailVerified: boolean;
  verifiedAt?: Date;
  allEmails: boolean;
  orderNotifications: boolean;
  orderConfirmation: boolean;
  shippingUpdates: boolean;
  deliveryConfirmation: boolean;
  paymentReminders: boolean;
  promotionalOffers: boolean;
  newsletter: boolean;
  productRecommendations: boolean;
  weeklyDigest: boolean;
  birthdayOffers: boolean;
  flashSales: boolean;
  abandonedCart: boolean;
  isOptedIn: boolean;
  optedInDate?: Date;
  optedOutDate?: Date;
  optedOutReason?: string;
  doNotContact: boolean;
  unsubscribeToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailCampaign {
  id: string;
  userId: string;
  campaignName: string;
  description?: string;
  campaignType: EmailCampaignType;
  status: EmailCampaignStatus;
  templateId?: string;
  subjectLine?: string;
  preheaderText?: string;
  htmlContent?: string;
  plainTextContent?: string;
  targetAudience: string;
  targetSegmentId?: string;
  recipientCount: number;
  segmentFilter?: Record<string, unknown>;
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;
  budgetLimit?: number;
  totalCost: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  complaintCount: number;
  unsubscribedCount: number;
  conversionCount: number;
  revenueGenerated: number;
  openRate?: number;
  clickRate?: number;
  conversionRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailAnalytics {
  id: string;
  userId: string;
  date: Date;
  totalSent: number;
  totalDelivered: number;
  totalBounced: number;
  totalComplained: number;
  totalUnsubscribed: number;
  totalOpened: number;
  totalClicked: number;
  totalRevenue: number;
  totalConversions: number;
  uniqueOpens: number;
  uniqueClicks: number;
  deliveryRate: number;
  bounceRate: number;
  complaintRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenuePerEmail?: number;
  uniqueRecipients: number;
  campaignId?: string;
  createdAt: Date;
}

export interface EmailBounce {
  id: string;
  userId: string;
  emailAddress: string;
  bounceType: EmailBounceType;
  bounceReason?: string;
  isPermanent: boolean;
  firstBounceAt?: Date;
  lastBounceAt?: Date;
  bounceCount: number;
  suppressionStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailCompliance {
  id: string;
  userId: string;
  customerId?: string;
  emailAddress?: string;
  consentType: string;
  consentStatus: EmailConsentStatus;
  consentDate?: Date;
  consentMethod?: string;
  ipAddress?: string;
  userAgent?: string;
  regulatoryFramework?: EmailRegulatoryFramework;
  doubleOptInDate?: Date;
  listId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CUSTOMER SEGMENTATION & BEHAVIORAL ANALYTICS TYPES
// ============================================

export type SegmentType = 'rfm' | 'behavioral' | 'cohort' | 'custom' | 'demographic' | 'value-based';
export type CohortType = 'acquisition' | 'behavior' | 'value';
export type PurchaseStage = 'awareness' | 'consideration' | 'decision' | 'retention' | 'advocacy' | 'churn_risk';
export type EventCategory = 'website' | 'email' | 'sms' | 'app' | 'support';
export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type GrowthPotential = 'high' | 'medium' | 'low';

export interface CustomerSegmentV2 {
  id: string;
  userId: string;
  name: string;
  description?: string;
  segmentType: SegmentType;
  criteria: Record<string, unknown>;
  isActive: boolean;
  memberCount: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentMember {
  id: string;
  userId: string;
  segmentId: string;
  customerId: string;
  joinedAt: Date;
  leftAt?: Date;
}

export interface CustomerBehaviorEvent {
  id: string;
  userId: string;
  customerId: string;
  eventType: string;
  eventCategory?: EventCategory;
  productId?: string;
  productName?: string;
  productCategory?: string;
  eventValue?: number;
  eventProperties?: Record<string, unknown>;
  pageUrl?: string;
  referrerUrl?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  browser?: string;
  os?: string;
  location?: Record<string, unknown>;
  sessionId?: string;
  createdAt: Date;
}

export interface CustomerBehaviorSummary {
  id: string;
  userId: string;
  customerId: string;
  lastActivityDate?: Date;
  totalPageViews: number;
  totalProductViews: number;
  totalAddToCart: number;
  totalPurchases: number;
  totalReviews: number;
  totalWishlistAdds: number;
  totalEmailOpens: number;
  totalEmailClicks: number;
  totalSmsOpens: number;
  avgSessionDurationMinutes?: number;
  favoriteProductCategory?: string;
  favoriteBrand?: string;
  devicePreference?: DeviceType;
  preferredBrowser?: string;
  preferredChannel?: string;
  engagementScore?: number;
  purchaseStage?: PurchaseStage;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cohort {
  id: string;
  userId: string;
  cohortName: string;
  cohortType?: CohortType;
  acquisitionStartDate?: Date;
  acquisitionEndDate?: Date;
  description?: string;
  memberCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CohortMember {
  id: string;
  cohortId: string;
  customerId: string;
  acquiredDate?: Date;
}

export interface CustomerJourneyStage {
  id: string;
  userId: string;
  customerId: string;
  currentStage: PurchaseStage;
  stageEnteredAt?: Date;
  daysInStage?: number;
  previousStage?: PurchaseStage;
  stageHistory?: Record<string, unknown>[];
  exitReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerLTVPrediction {
  id: string;
  userId: string;
  customerId: string;
  currentLtv?: number;
  predictedLtv1Year?: number;
  predictedLtv3Year?: number;
  predictedLtv5Year?: number;
  churnProbability?: number;
  growthPotential?: GrowthPotential;
  confidenceScore?: number;
  predictionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BehavioralAnalytics {
  id: string;
  userId: string;
  date: Date;
  segmentId?: string;
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  atRiskCustomers: number;
  churnedCustomers: number;
  totalPageViews: number;
  totalProductViews: number;
  totalAddToCart: number;
  totalPurchases: number;
  conversionRate?: number;
  avgSessionDurationMinutes?: number;
  bounceRate?: number;
  repeatPurchaseRate?: number;
  avgOrderValue?: number;
  revenue?: number;
  createdAt: Date;
}

export interface SegmentPerformance {
  id: string;
  userId: string;
  segmentId: string;
  date: Date;
  memberCount: number;
  activeMembers: number;
  churnRate?: number;
  lifetimeValue?: number;
  avgOrderValue?: number;
  purchaseFrequency?: number;
  conversionRate?: number;
  emailOpenRate?: number;
  emailClickRate?: number;
  smsOpenRate?: number;
  engagementScore?: number;
  revenueGenerated?: number;
  createdAt: Date;
}

// ============================================
// PRODUCT RECOMMENDATIONS TYPES
// ============================================

export type AlgorithmType = 'collaborative' | 'content_based' | 'popularity' | 'rule_based' | 'hybrid';
export type RelationshipType = 'upsell' | 'cross_sell' | 'complement' | 'similar' | 'bundle';
export type RecommendationContext = 'product_page' | 'cart' | 'email' | 'home' | 'search' | 'checkout';
export type RuleType = 'if_purchase' | 'if_category' | 'if_segment' | 'if_price_range' | 'if_brand';

export interface RecommendationAlgorithm {
  id: string;
  userId: string;
  algorithmType: AlgorithmType;
  algorithmName: string;
  description?: string;
  config?: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductEmbedding {
  id: string;
  userId: string;
  productId: string;
  embeddingModel?: string;
  embeddingVector?: number[];
  categoryEmbedding?: number[];
  qualityScore?: number;
  updatedAt: Date;
}

export interface ProductRelationship {
  id: string;
  userId: string;
  productId1: string;
  productId2: string;
  relationshipType: RelationshipType;
  strength?: number;
  frequency?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductRecommendation {
  id: string;
  userId: string;
  customerId: string;
  recommendedProductId: string;
  recommendationReason?: string;
  rankPosition?: number;
  relevanceScore?: number;
  algorithmType?: AlgorithmType;
  recommendationContext?: RecommendationContext;
  isShown: boolean;
  shownAt?: Date;
  isClicked: boolean;
  clickedAt?: Date;
  isPurchased: boolean;
  purchasedAt?: Date;
  createdAt: Date;
}

export interface RecommendationClick {
  id: string;
  userId: string;
  customerId: string;
  recommendationId?: string;
  productId: string;
  clickedAt: Date;
  deviceType?: string;
  referrerPage?: string;
}

export interface RecommendationConversion {
  id: string;
  userId: string;
  customerId: string;
  recommendationId?: string;
  productId: string;
  orderId?: string;
  revenue?: number;
  convertedAt: Date;
}

export interface RecommendationRule {
  id: string;
  userId: string;
  ruleName: string;
  ruleType?: RuleType;
  conditionProductId?: string;
  conditionCategory?: string;
  conditionSegmentId?: string;
  conditionPriceMin?: number;
  conditionPriceMax?: number;
  recommendedProductIds?: string[];
  isActive: boolean;
  priority?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationAnalytics {
  id: string;
  userId: string;
  date: Date;
  algorithmType?: AlgorithmType;
  totalRecommendations: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  clickThroughRate?: number;
  conversionRate?: number;
  revenueGenerated?: number;
  avgRelevanceScore?: number;
  createdAt: Date;
}

export interface RecommendationProductPerformance {
  id: string;
  userId: string;
  productId: string;
  date: Date;
  timesRecommended: number;
  timesClicked: number;
  timesPurchased: number;
  revenue?: number;
  clickRate?: number;
  conversionRate?: number;
  createdAt: Date;
}

export interface PersonalizationPreferences {
  id: string;
  userId: string;
  customerId: string;
  maxRecommendations?: number;
  preferredCategories?: string[];
  excludedCategories?: string[];
  preferredPriceRangeMin?: number;
  preferredPriceRangeMax?: number;
  excludeAlreadyViewed?: boolean;
  excludeAlreadyPurchased?: boolean;
  enableTrending?: boolean;
  enableSimilar?: boolean;
  enableSeasonal?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DYNAMIC PRICING TYPES
// ============================================

export type PricingStrategyType = 'demand_based' | 'competition_based' | 'seasonality' | 'inventory_based' | 'customer_segment' | 'time_based';
export type RuleType = 'percentage' | 'fixed_amount' | 'cost_plus' | 'value_based' | 'bundle' | 'threshold';
export type DemandLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type PriceAdjustmentType = 'percentage' | 'fixed_amount' | 'absolute';
export type TestStatus = 'planning' | 'active' | 'completed' | 'paused';

export interface PricingStrategy {
  id: string;
  userId: string;
  strategyName: string;
  strategyType: PricingStrategyType;
  description?: string;
  baseStrategyId?: string;
  isActive: boolean;
  applyToAll: boolean;
  priority?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingRule {
  id: string;
  userId: string;
  strategyId: string;
  ruleName: string;
  ruleType: RuleType;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: string;
  priceAdjustmentType?: PriceAdjustmentType;
  priceAdjustmentValue?: number;
  minPrice?: number;
  maxPrice?: number;
  isActive: boolean;
  priority?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompetitorPrice {
  id: string;
  userId: string;
  productId: string;
  competitorName: string;
  competitorSku?: string;
  competitorPrice?: number;
  ourPrice?: number;
  priceDifference?: number;
  lastCheckedAt?: Date;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductPricingHistory {
  id: string;
  userId: string;
  productId: string;
  oldPrice?: number;
  newPrice?: number;
  priceChangePercentage?: number;
  changeReason?: string;
  changeType?: string;
  strategyId?: string;
  ruleId?: string;
  changedBy?: string;
  changedAt: Date;
  effectiveAt?: Date;
  createdAt: Date;
}

export interface DemandIndicator {
  id: string;
  userId: string;
  productId: string;
  date: Date;
  demandLevel?: DemandLevel;
  stockLevel?: number;
  conversionRate?: number;
  viewsCount?: number;
  addToCartCount?: number;
  purchaseCount?: number;
  averageRating?: number;
  reviewCount?: number;
  daysInStock?: number;
  seasonalityIndex?: number;
  trendScore?: number;
  createdAt: Date;
}

export interface PriceElasticity {
  id: string;
  userId: string;
  productId: string;
  elasticityCoefficient?: number;
  priceRangeMin?: number;
  priceRangeMax?: number;
  optimalPrice?: number;
  confidenceScore?: number;
  calculatedAt?: Date;
  isCurrent: boolean;
  createdAt: Date;
}

export interface DynamicPricingAnalytics {
  id: string;
  userId: string;
  date: Date;
  strategyId?: string;
  totalProductsAffected?: number;
  totalPriceChanges?: number;
  averagePriceChange?: number;
  revenueImpact?: number;
  marginImpact?: number;
  demandResponse?: number;
  conversionRateChange?: number;
  customerSatisfactionImpact?: number;
  createdAt: Date;
}

export interface PriceTest {
  id: string;
  userId: string;
  productId: string;
  testName: string;
  testType?: string;
  controlPrice?: number;
  testPrice?: number;
  testPercentage?: number;
  startDate?: Date;
  endDate?: Date;
  status?: TestStatus;
  winnerPrice?: number;
  revenueControl?: number;
  revenueTest?: number;
  conversionControl?: number;
  conversionTest?: number;
  createdAt: Date;
}

// ============================================
// INVENTORY MANAGEMENT TYPES
// ============================================

export type AdjustmentType = 'purchase_order' | 'sale' | 'return' | 'damage' | 'loss' | 'recount' | 'transfer';
export type StockTransferStatus = 'pending' | 'shipped' | 'in_transit' | 'received' | 'cancelled';
export type PurchaseOrderStatus = 'draft' | 'pending' | 'confirmed' | 'shipped' | 'received' | 'cancelled';
export type CountStatus = 'pending' | 'in_progress' | 'completed' | 'reconciled';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Warehouse {
  id: string;
  userId: string;
  warehouseName: string;
  warehouseCode?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  capacity?: number;
  isActive: boolean;
  isPrimary: boolean;
  managerName?: string;
  contactPhone?: string;
  contactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockLevel {
  id: string;
  userId: string;
  productId: string;
  warehouseId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  quantityDamaged: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  leadTimeDays?: number;
  lastCountedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockAdjustment {
  id: string;
  userId: string;
  productId: string;
  warehouseId: string;
  adjustmentType?: AdjustmentType;
  quantityChange: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  adjustedBy?: string;
  adjustedAt: Date;
  createdAt: Date;
}

export interface StockTransfer {
  id: string;
  userId: string;
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  status?: StockTransferStatus;
  transferDate?: Date;
  shippedDate?: Date;
  receivedDate?: Date;
  shippedBy?: string;
  receivedBy?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LowStockAlert {
  id: string;
  userId: string;
  productId: string;
  warehouseId?: string;
  alertType?: string;
  currentQuantity?: number;
  reorderPoint?: number;
  alertStatus?: AlertStatus;
  alertedAt: Date;
  resolvedAt?: Date;
  actionTaken?: string;
  createdAt: Date;
}

export interface StockCount {
  id: string;
  userId: string;
  warehouseId: string;
  countDate?: Date;
  countStatus?: CountStatus;
  totalItemsCounted?: number;
  discrepancyCount?: number;
  countedBy?: string;
  startedAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface StockCountItem {
  id: string;
  userId: string;
  stockCountId: string;
  productId: string;
  expectedQuantity?: number;
  countedQuantity?: number;
  discrepancy?: number;
  discrepancyReason?: string;
  createdAt: Date;
}

export interface InventoryForecast {
  id: string;
  userId: string;
  productId: string;
  warehouseId?: string;
  forecastDate?: Date;
  forecastQuantity?: number;
  confidenceLevel?: number;
  basedOnDays?: number;
  methodology?: string;
  createdAt: Date;
}

export interface InventoryMovement {
  id: string;
  userId: string;
  productId: string;
  warehouseId: string;
  movementDate?: Date;
  movementType?: string;
  quantityIn?: number;
  quantityOut?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  referenceId?: string;
  referenceType?: string;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  userId: string;
  supplierName: string;
  supplierCode?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  userId: string;
  supplierId: string;
  warehouseId: string;
  poNumber?: string;
  poDate?: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  status?: PurchaseOrderStatus;
  totalAmount?: number;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  userId: string;
  purchaseOrderId: string;
  productId: string;
  quantityOrdered?: number;
  quantityReceived?: number;
  unitPrice?: number;
  lineTotal?: number;
  createdAt: Date;
}

export interface InventoryAnalytics {
  id: string;
  userId: string;
  date: Date;
  warehouseId?: string;
  totalItemsInStock?: number;
  totalReservedItems?: number;
  totalAvailableItems?: number;
  totalDamagedItems?: number;
  totalInventoryValue?: number;
  lowStockItems?: number;
  outOfStockItems?: number;
  turnoverRate?: number;
  stockoutPercentage?: number;
  createdAt: Date;
}

// ============================================
// RETURNS & RMA MANAGEMENT TYPES
// ============================================

export interface ReturnReason {
  id: string;
  reasonCode: string;
  reasonName: string;
  description?: string;
  isActive: boolean;
  refundable: boolean;
  requiresInspection: boolean;
  createdAt: Date;
}

export type ReturnStatus = 'pending' | 'authorized' | 'awaiting_return' | 'received' | 'inspecting' | 'processed' | 'rejected' | 'cancelled';
export type ReturnCondition = 'unopened' | 'like_new' | 'good' | 'fair' | 'poor' | 'damaged';
export type RefundStatus = 'pending' | 'approved' | 'processed' | 'completed' | 'failed' | 'cancelled';
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type ItemInspectionResult = 'pass' | 'fail' | 'partial' | 'pending';
export type ShippingStatus = 'pending' | 'label_created' | 'shipped' | 'in_transit' | 'delivered' | 'failed';

export interface Return {
  id: string;
  userId: string;
  orderId: string;
  customerId: string;
  rmaNumber: string;
  returnReasonId?: string;
  reasonDetails?: string;
  returnStatus: ReturnStatus;
  returnCondition?: ReturnCondition;
  subReason?: string;
  customerNotes?: string;
  authorizationCode?: string;
  authorizedAt?: Date;
  authorizedBy?: string;
  returnShippingAddress?: string;
  returnShippingMethod?: string;
  returnCarrier?: string;
  returnTrackingNumber?: string;
  expectedReturnDate?: Date;
  returnReceivedDate?: Date;
  refundAmount?: number;
  refundStatus: RefundStatus;
  refundMethod?: string;
  refundProcessedAt?: Date;
  restockingFeeApplied?: number;
  restockingFeePercentage?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnItem {
  id: string;
  returnId: string;
  orderItemId: string;
  productId: string;
  productName: string;
  quantityReturned: number;
  quantityApproved?: number;
  unitPrice?: number;
  itemCondition?: ReturnCondition;
  itemNotes?: string;
  inspectionNotes?: string;
  inspectionStatus: InspectionStatus;
  createdAt: Date;
}

export interface ReturnInspection {
  id: string;
  returnItemId: string;
  inspectionDate?: Date;
  inspectorName?: string;
  conditionAssessment?: string;
  isResellable?: boolean;
  damagesFound?: string;
  photosUrl?: string[];
  inspectionResult?: ItemInspectionResult;
  notes?: string;
  createdAt: Date;
}

export interface RefundTransaction {
  id: string;
  userId: string;
  returnId: string;
  orderPaymentId?: string;
  refundAmount: number;
  refundMethod?: string;
  paymentMethod?: string;
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  refundStatus?: RefundStatus;
  refundReason?: string;
  processedAt?: Date;
  expectedReceiptDate?: Date;
  actualReceiptDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnShipping {
  id: string;
  returnId: string;
  outboundTrackingNumber?: string;
  outboundCarrier?: string;
  outboundShippedDate?: Date;
  inboundTrackingNumber?: string;
  inboundCarrier?: string;
  inboundShippedDate?: Date;
  inboundDeliveryDate?: Date;
  warehouseReceivedDate?: Date;
  shippingLabelUrl?: string;
  returnInstructionsUrl?: string;
  shippingCost?: number;
  isPrepaid: boolean;
  shippingStatus?: ShippingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnAnalytics {
  id: string;
  userId: string;
  periodStartDate?: Date;
  periodEndDate?: Date;
  totalReturns: number;
  totalReturnValue?: number;
  totalRefunded?: number;
  returnRate?: number;
  averageDaysToReturn?: number;
  averageDaysToRefund?: number;
  resellableItems?: number;
  unreparableItems?: number;
  restockingFeesCollected?: number;
  topReturnReason?: string;
  refundMethodBreakdown?: Record<string, any>;
  returnByCategory?: Record<string, any>;
  createdAt: Date;
}

export interface ReturnStatistics {
  totalReturns: number;
  totalReturnValue: number;
  returnRate: number;
  averageRefundAmount: number;
  averageDaysToRefund: number;
  resellablePercentage: number;
  mostCommonReason: string;
  pendingReturns: number;
  pendingRefunds: number;
}
