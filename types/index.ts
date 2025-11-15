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
