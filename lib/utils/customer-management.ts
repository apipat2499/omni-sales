/**
 * Customer Management Utility
 *
 * Comprehensive customer relationship management (CRM) utility
 * Handles customer CRUD operations, segmentation, purchase history,
 * and communication preferences.
 */

import { Customer, Order, OrderItem } from '@/types';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface CustomerAddress {
  type: 'shipping' | 'billing';
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CustomerPreferences {
  newsletter: boolean;
  sms: boolean;
  email: boolean;
  push: boolean;
  quietHours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
}

export interface CustomerNote {
  id: string;
  customerId: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtendedCustomer extends Customer {
  // Contact Information
  company?: string;
  addresses: CustomerAddress[];

  // Customer Information
  segment: CustomerSegment;
  lifetime_value: number;
  total_orders: number;
  first_order_date: Date | null;
  last_order_date: Date | null;
  average_order_value: number;

  // Communication
  preferences: CustomerPreferences;

  // Notes & Tags
  notes: CustomerNote[];
  tags: string[];

  // Metadata
  isActive: boolean;
}

export type CustomerSegment = 'VIP' | 'Regular' | 'Occasional' | 'New' | 'At Risk' | 'Inactive';

export interface PurchaseHistory {
  orderId: string;
  date: Date;
  items: OrderItem[];
  total: number;
  status: string;
}

export interface CustomerSegmentDefinition {
  id: string;
  name: string;
  description: string;
  rules: SegmentRule[];
  matchCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentRule {
  field: 'lifetime_value' | 'total_orders' | 'last_purchase' | 'segment' | 'average_order_value' | 'tags' | 'days_since_purchase';
  operator: 'equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'between';
  value: any;
}

export interface CustomerInsights {
  purchaseFrequency: number; // days between purchases
  topProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
  categoryPreferences: { category: string; count: number; revenue: number }[];
  churnRisk: 'low' | 'medium' | 'high';
  reorderLikelihood: number; // 0-100
  seasonalPatterns: { month: number; orders: number; revenue: number }[];
  daysSinceLastPurchase: number;
}

export interface CustomerFilters {
  search?: string;
  segment?: CustomerSegment | 'all';
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: 'active' | 'inactive' | 'all';
  minLifetimeValue?: number;
  maxLifetimeValue?: number;
  minOrders?: number;
  maxOrders?: number;
}

export interface CustomerSortOptions {
  field: 'name' | 'email' | 'lifetime_value' | 'total_orders' | 'last_order_date' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface BulkOperationOptions {
  operation: 'addTag' | 'removeTag' | 'updateSegment' | 'updateStatus' | 'updatePreferences';
  value: any;
  customerIds: string[];
}

// ==========================================
// STORAGE KEYS
// ==========================================

const STORAGE_KEYS = {
  CUSTOMERS: 'omni_customers',
  CUSTOMER_SEGMENTS: 'omni_customer_segments',
  CUSTOMER_NOTES: 'omni_customer_notes',
  RECENT_CUSTOMERS: 'omni_recent_customers',
  CUSTOMER_FILTERS: 'omni_customer_filters',
  CUSTOMER_CACHE: 'omni_customer_cache',
} as const;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ==========================================
// CUSTOMER CRUD OPERATIONS
// ==========================================

/**
 * Get all customers with optional filters
 */
export function getCustomers(filters?: CustomerFilters): ExtendedCustomer[] {
  const customers = loadCustomersFromStorage();

  if (!filters) {
    return customers;
  }

  return customers.filter(customer => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.includes(searchLower) ||
        customer.company?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // Segment filter
    if (filters.segment && filters.segment !== 'all') {
      if (customer.segment !== filters.segment) return false;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasAnyTag = filters.tags.some(tag => customer.tags.includes(tag));
      if (!hasAnyTag) return false;
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      const isActive = filters.status === 'active';
      if (customer.isActive !== isActive) return false;
    }

    // Date range filter
    if (filters.dateRange) {
      if (customer.createdAt < filters.dateRange.start || customer.createdAt > filters.dateRange.end) {
        return false;
      }
    }

    // Lifetime value filter
    if (filters.minLifetimeValue !== undefined && customer.lifetime_value < filters.minLifetimeValue) {
      return false;
    }
    if (filters.maxLifetimeValue !== undefined && customer.lifetime_value > filters.maxLifetimeValue) {
      return false;
    }

    // Orders filter
    if (filters.minOrders !== undefined && customer.total_orders < filters.minOrders) {
      return false;
    }
    if (filters.maxOrders !== undefined && customer.total_orders > filters.maxOrders) {
      return false;
    }

    return true;
  });
}

/**
 * Get a single customer by ID
 */
export function getCustomerById(id: string): ExtendedCustomer | null {
  const customers = loadCustomersFromStorage();
  return customers.find(c => c.id === id) || null;
}

/**
 * Create a new customer
 */
export function createCustomer(customerData: Partial<ExtendedCustomer>): ExtendedCustomer {
  const customers = loadCustomersFromStorage();

  const newCustomer: ExtendedCustomer = {
    id: generateId(),
    name: customerData.name || '',
    email: customerData.email || '',
    phone: customerData.phone || '',
    company: customerData.company,
    addresses: customerData.addresses || [],
    segment: customerData.segment || calculateAutoSegment({ total_orders: 0, lifetime_value: 0 }),
    lifetime_value: 0,
    total_orders: 0,
    totalOrders: 0,
    totalSpent: 0,
    first_order_date: null,
    last_order_date: null,
    average_order_value: 0,
    preferences: customerData.preferences || getDefaultPreferences(),
    notes: [],
    tags: customerData.tags || [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  customers.push(newCustomer);
  saveCustomersToStorage(customers);

  // Add to recent customers
  addToRecentCustomers(newCustomer.id);

  return newCustomer;
}

/**
 * Update a customer
 */
export function updateCustomer(id: string, updates: Partial<ExtendedCustomer>): ExtendedCustomer | null {
  const customers = loadCustomersFromStorage();
  const index = customers.findIndex(c => c.id === id);

  if (index === -1) {
    return null;
  }

  const updatedCustomer = {
    ...customers[index],
    ...updates,
    id, // Ensure ID doesn't change
    updatedAt: new Date(),
  };

  customers[index] = updatedCustomer;
  saveCustomersToStorage(customers);

  // Invalidate cache
  invalidateCache(id);

  return updatedCustomer;
}

/**
 * Delete a customer
 */
export function deleteCustomer(id: string): boolean {
  const customers = loadCustomersFromStorage();
  const filteredCustomers = customers.filter(c => c.id !== id);

  if (filteredCustomers.length === customers.length) {
    return false; // Customer not found
  }

  saveCustomersToStorage(filteredCustomers);

  // Remove from recent customers
  removeFromRecentCustomers(id);

  // Invalidate cache
  invalidateCache(id);

  return true;
}

// ==========================================
// CUSTOMER SEGMENTATION
// ==========================================

/**
 * Calculate automatic segment based on customer metrics
 */
export function calculateAutoSegment(customer: { total_orders: number; lifetime_value: number }): CustomerSegment {
  const { total_orders, lifetime_value } = customer;

  // VIP: LTV > 5000 OR total orders > 50
  if (lifetime_value > 5000 || total_orders > 50) {
    return 'VIP';
  }

  // Regular: LTV 500-5000 OR orders 10-50
  if ((lifetime_value >= 500 && lifetime_value <= 5000) || (total_orders >= 10 && total_orders <= 50)) {
    return 'Regular';
  }

  // Occasional: LTV < 500 OR orders < 10
  if (lifetime_value < 500 || total_orders < 10) {
    return 'Occasional';
  }

  return 'Regular';
}

/**
 * Get customers in a specific segment
 */
export function getCustomersBySegment(segment: CustomerSegment): ExtendedCustomer[] {
  const customers = loadCustomersFromStorage();
  return customers.filter(c => c.segment === segment);
}

/**
 * Create a custom segment definition
 */
export function createSegmentDefinition(definition: Omit<CustomerSegmentDefinition, 'id' | 'createdAt' | 'updatedAt' | 'matchCount'>): CustomerSegmentDefinition {
  const segments = loadSegmentDefinitions();

  const newSegment: CustomerSegmentDefinition = {
    ...definition,
    id: generateId(),
    matchCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Calculate initial match count
  newSegment.matchCount = getSegmentMatches(newSegment).length;

  segments.push(newSegment);
  saveSegmentDefinitions(segments);

  return newSegment;
}

/**
 * Get customers matching segment rules
 */
export function getSegmentMatches(segment: CustomerSegmentDefinition): ExtendedCustomer[] {
  const customers = loadCustomersFromStorage();

  return customers.filter(customer => {
    return segment.rules.every(rule => evaluateRule(customer, rule));
  });
}

/**
 * Evaluate a single segment rule
 */
function evaluateRule(customer: ExtendedCustomer, rule: SegmentRule): boolean {
  let value: any;

  switch (rule.field) {
    case 'lifetime_value':
      value = customer.lifetime_value;
      break;
    case 'total_orders':
      value = customer.total_orders;
      break;
    case 'average_order_value':
      value = customer.average_order_value;
      break;
    case 'segment':
      value = customer.segment;
      break;
    case 'tags':
      value = customer.tags;
      break;
    case 'last_purchase':
      value = customer.last_order_date;
      break;
    case 'days_since_purchase':
      value = customer.last_order_date
        ? Math.floor((Date.now() - customer.last_order_date.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;
      break;
    default:
      return false;
  }

  switch (rule.operator) {
    case 'equals':
      return value === rule.value;
    case 'gt':
      return value > rule.value;
    case 'lt':
      return value < rule.value;
    case 'gte':
      return value >= rule.value;
    case 'lte':
      return value <= rule.value;
    case 'contains':
      if (Array.isArray(value)) {
        return value.includes(rule.value);
      }
      return String(value).includes(String(rule.value));
    case 'between':
      return value >= rule.value[0] && value <= rule.value[1];
    default:
      return false;
  }
}

/**
 * Update segment definitions
 */
export function updateSegmentDefinition(id: string, updates: Partial<CustomerSegmentDefinition>): CustomerSegmentDefinition | null {
  const segments = loadSegmentDefinitions();
  const index = segments.findIndex(s => s.id === id);

  if (index === -1) {
    return null;
  }

  const updatedSegment = {
    ...segments[index],
    ...updates,
    id,
    updatedAt: new Date(),
  };

  // Recalculate match count
  updatedSegment.matchCount = getSegmentMatches(updatedSegment).length;

  segments[index] = updatedSegment;
  saveSegmentDefinitions(segments);

  return updatedSegment;
}

/**
 * Delete segment definition
 */
export function deleteSegmentDefinition(id: string): boolean {
  const segments = loadSegmentDefinitions();
  const filteredSegments = segments.filter(s => s.id !== id);

  if (filteredSegments.length === segments.length) {
    return false;
  }

  saveSegmentDefinitions(filteredSegments);
  return true;
}

/**
 * Get all segment definitions
 */
export function getSegmentDefinitions(): CustomerSegmentDefinition[] {
  return loadSegmentDefinitions();
}

// ==========================================
// PURCHASE HISTORY & ANALYTICS
// ==========================================

/**
 * Get purchase history for a customer
 */
export function getCustomerPurchaseHistory(customerId: string, orders: Order[]): PurchaseHistory[] {
  return orders
    .filter(order => order.customerId === customerId)
    .map(order => ({
      orderId: order.id,
      date: order.createdAt,
      items: order.items,
      total: order.total,
      status: order.status,
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Calculate customer insights
 */
export function calculateCustomerInsights(customerId: string, orders: Order[]): CustomerInsights {
  const customerOrders = orders.filter(o => o.customerId === customerId);

  if (customerOrders.length === 0) {
    return {
      purchaseFrequency: 0,
      topProducts: [],
      categoryPreferences: [],
      churnRisk: 'low',
      reorderLikelihood: 0,
      seasonalPatterns: [],
      daysSinceLastPurchase: Infinity,
    };
  }

  // Purchase frequency
  const sortedOrders = customerOrders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const intervals: number[] = [];
  for (let i = 1; i < sortedOrders.length; i++) {
    const daysBetween = (sortedOrders[i].createdAt.getTime() - sortedOrders[i - 1].createdAt.getTime()) / (1000 * 60 * 60 * 24);
    intervals.push(daysBetween);
  }
  const purchaseFrequency = intervals.length > 0
    ? intervals.reduce((a, b) => a + b, 0) / intervals.length
    : 0;

  // Top products
  const productMap = new Map<string, { productId: string; productName: string; quantity: number; revenue: number }>();
  customerOrders.forEach(order => {
    order.items.forEach(item => {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += (item.price * item.quantity);
      } else {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          revenue: item.price * item.quantity,
        });
      }
    });
  });
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Days since last purchase
  const lastOrder = sortedOrders[sortedOrders.length - 1];
  const daysSinceLastPurchase = Math.floor((Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24));

  // Churn risk
  let churnRisk: 'low' | 'medium' | 'high' = 'low';
  if (daysSinceLastPurchase > purchaseFrequency * 3) {
    churnRisk = 'high';
  } else if (daysSinceLastPurchase > purchaseFrequency * 2) {
    churnRisk = 'medium';
  }

  // Reorder likelihood (simplified calculation)
  const reorderLikelihood = Math.max(0, Math.min(100, 100 - (daysSinceLastPurchase / purchaseFrequency) * 50));

  // Seasonal patterns
  const monthlyData = new Map<number, { orders: number; revenue: number }>();
  customerOrders.forEach(order => {
    const month = order.createdAt.getMonth();
    const existing = monthlyData.get(month);
    if (existing) {
      existing.orders++;
      existing.revenue += order.total;
    } else {
      monthlyData.set(month, { orders: 1, revenue: order.total });
    }
  });
  const seasonalPatterns = Array.from(monthlyData.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month - b.month);

  return {
    purchaseFrequency,
    topProducts,
    categoryPreferences: [], // Would need product category data
    churnRisk,
    reorderLikelihood,
    seasonalPatterns,
    daysSinceLastPurchase,
  };
}

/**
 * Update customer metrics from orders
 */
export function updateCustomerMetrics(customerId: string, orders: Order[]): void {
  const customer = getCustomerById(customerId);
  if (!customer) return;

  const customerOrders = orders.filter(o => o.customerId === customerId);

  const total_orders = customerOrders.length;
  const lifetime_value = customerOrders.reduce((sum, order) => sum + order.total, 0);
  const average_order_value = total_orders > 0 ? lifetime_value / total_orders : 0;

  const sortedOrders = customerOrders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const first_order_date = sortedOrders.length > 0 ? sortedOrders[0].createdAt : null;
  const last_order_date = sortedOrders.length > 0 ? sortedOrders[sortedOrders.length - 1].createdAt : null;

  const segment = calculateAutoSegment({ total_orders, lifetime_value });

  updateCustomer(customerId, {
    total_orders,
    lifetime_value,
    average_order_value,
    first_order_date,
    last_order_date,
    segment,
    totalOrders: total_orders,
    totalSpent: lifetime_value,
    lastOrderDate: last_order_date,
  });
}

// ==========================================
// NOTES & TAGS
// ==========================================

/**
 * Add note to customer
 */
export function addCustomerNote(customerId: string, content: string, author: string): CustomerNote {
  const notes = loadNotesFromStorage();

  const newNote: CustomerNote = {
    id: generateId(),
    customerId,
    content,
    author,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  notes.push(newNote);
  saveNotesToStorage(notes);

  return newNote;
}

/**
 * Get notes for a customer
 */
export function getCustomerNotes(customerId: string): CustomerNote[] {
  const notes = loadNotesFromStorage();
  return notes
    .filter(n => n.customerId === customerId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Delete a note
 */
export function deleteCustomerNote(noteId: string): boolean {
  const notes = loadNotesFromStorage();
  const filteredNotes = notes.filter(n => n.id !== noteId);

  if (filteredNotes.length === notes.length) {
    return false;
  }

  saveNotesToStorage(filteredNotes);
  return true;
}

/**
 * Add tag to customer
 */
export function addCustomerTag(customerId: string, tag: string): boolean {
  const customer = getCustomerById(customerId);
  if (!customer) return false;

  if (customer.tags.includes(tag)) {
    return false; // Tag already exists
  }

  const updatedTags = [...customer.tags, tag];
  updateCustomer(customerId, { tags: updatedTags });

  return true;
}

/**
 * Remove tag from customer
 */
export function removeCustomerTag(customerId: string, tag: string): boolean {
  const customer = getCustomerById(customerId);
  if (!customer) return false;

  const updatedTags = customer.tags.filter(t => t !== tag);

  if (updatedTags.length === customer.tags.length) {
    return false; // Tag didn't exist
  }

  updateCustomer(customerId, { tags: updatedTags });

  return true;
}

/**
 * Get all unique tags
 */
export function getAllCustomerTags(): string[] {
  const customers = loadCustomersFromStorage();
  const tagSet = new Set<string>();

  customers.forEach(customer => {
    customer.tags.forEach(tag => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

// ==========================================
// PREFERENCES
// ==========================================

/**
 * Update customer preferences
 */
export function updateCustomerPreferences(customerId: string, preferences: Partial<CustomerPreferences>): boolean {
  const customer = getCustomerById(customerId);
  if (!customer) return false;

  const updatedPreferences = {
    ...customer.preferences,
    ...preferences,
  };

  updateCustomer(customerId, { preferences: updatedPreferences });

  return true;
}

/**
 * Get default preferences
 */
export function getDefaultPreferences(): CustomerPreferences {
  return {
    newsletter: true,
    sms: true,
    email: true,
    push: true,
    quietHours: {
      start: '22:00',
      end: '08:00',
    },
  };
}

/**
 * Check if customer can be contacted at a specific time
 */
export function canContactCustomer(customerId: string, channel: keyof CustomerPreferences): boolean {
  const customer = getCustomerById(customerId);
  if (!customer) return false;

  // Check channel preference
  if (channel !== 'quietHours' && !customer.preferences[channel]) {
    return false;
  }

  // Check quiet hours
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const { start, end } = customer.preferences.quietHours;

  if (start < end) {
    // Normal range (e.g., 22:00 - 08:00 next day)
    if (currentTime >= start || currentTime <= end) {
      return false; // In quiet hours
    }
  } else {
    // Overnight range
    if (currentTime >= start && currentTime <= end) {
      return false; // In quiet hours
    }
  }

  return true;
}

// ==========================================
// BULK OPERATIONS
// ==========================================

/**
 * Perform bulk operation on multiple customers
 */
export function performBulkOperation(options: BulkOperationOptions): { success: number; failed: number } {
  let success = 0;
  let failed = 0;

  options.customerIds.forEach(customerId => {
    try {
      switch (options.operation) {
        case 'addTag':
          if (addCustomerTag(customerId, options.value)) {
            success++;
          } else {
            failed++;
          }
          break;

        case 'removeTag':
          if (removeCustomerTag(customerId, options.value)) {
            success++;
          } else {
            failed++;
          }
          break;

        case 'updateSegment':
          if (updateCustomer(customerId, { segment: options.value })) {
            success++;
          } else {
            failed++;
          }
          break;

        case 'updateStatus':
          if (updateCustomer(customerId, { isActive: options.value })) {
            success++;
          } else {
            failed++;
          }
          break;

        case 'updatePreferences':
          if (updateCustomerPreferences(customerId, options.value)) {
            success++;
          } else {
            failed++;
          }
          break;

        default:
          failed++;
      }
    } catch (error) {
      failed++;
    }
  });

  return { success, failed };
}

// ==========================================
// SEARCH & SORT
// ==========================================

/**
 * Search customers
 */
export function searchCustomers(query: string): ExtendedCustomer[] {
  return getCustomers({ search: query });
}

/**
 * Sort customers
 */
export function sortCustomers(customers: ExtendedCustomer[], options: CustomerSortOptions): ExtendedCustomer[] {
  const sorted = [...customers];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (options.field) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'lifetime_value':
        aValue = a.lifetime_value;
        bValue = b.lifetime_value;
        break;
      case 'total_orders':
        aValue = a.total_orders;
        bValue = b.total_orders;
        break;
      case 'last_order_date':
        aValue = a.last_order_date?.getTime() || 0;
        bValue = b.last_order_date?.getTime() || 0;
        break;
      case 'createdAt':
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return options.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return options.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

// ==========================================
// STORAGE HELPERS
// ==========================================

function loadCustomersFromStorage(): ExtendedCustomer[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!data) return [];

    const customers = JSON.parse(data);

    // Parse dates
    return customers.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      first_order_date: c.first_order_date ? new Date(c.first_order_date) : null,
      last_order_date: c.last_order_date ? new Date(c.last_order_date) : null,
      lastOrderDate: c.last_order_date ? new Date(c.last_order_date) : null,
      notes: (c.notes || []).map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
      })),
    }));
  } catch (error) {
    console.error('Error loading customers from storage:', error);
    return [];
  }
}

function saveCustomersToStorage(customers: ExtendedCustomer[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (error) {
    console.error('Error saving customers to storage:', error);
  }
}

function loadSegmentDefinitions(): CustomerSegmentDefinition[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMER_SEGMENTS);
    if (!data) return [];

    const segments = JSON.parse(data);

    return segments.map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    }));
  } catch (error) {
    console.error('Error loading segment definitions:', error);
    return [];
  }
}

function saveSegmentDefinitions(segments: CustomerSegmentDefinition[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_SEGMENTS, JSON.stringify(segments));
  } catch (error) {
    console.error('Error saving segment definitions:', error);
  }
}

function loadNotesFromStorage(): CustomerNote[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMER_NOTES);
    if (!data) return [];

    const notes = JSON.parse(data);

    return notes.map((n: any) => ({
      ...n,
      createdAt: new Date(n.createdAt),
      updatedAt: new Date(n.updatedAt),
    }));
  } catch (error) {
    console.error('Error loading notes from storage:', error);
    return [];
  }
}

function saveNotesToStorage(notes: CustomerNote[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_NOTES, JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving notes to storage:', error);
  }
}

function addToRecentCustomers(customerId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_CUSTOMERS);
    const recent: string[] = data ? JSON.parse(data) : [];

    // Remove if exists
    const filtered = recent.filter(id => id !== customerId);

    // Add to beginning
    filtered.unshift(customerId);

    // Keep only last 10
    const trimmed = filtered.slice(0, 10);

    localStorage.setItem(STORAGE_KEYS.RECENT_CUSTOMERS, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error adding to recent customers:', error);
  }
}

function removeFromRecentCustomers(customerId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_CUSTOMERS);
    if (!data) return;

    const recent: string[] = JSON.parse(data);
    const filtered = recent.filter(id => id !== customerId);

    localStorage.setItem(STORAGE_KEYS.RECENT_CUSTOMERS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from recent customers:', error);
  }
}

function invalidateCache(customerId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMER_CACHE);
    if (!data) return;

    const cache: Record<string, any> = JSON.parse(data);
    delete cache[customerId];

    localStorage.setItem(STORAGE_KEYS.CUSTOMER_CACHE, JSON.stringify(cache));
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Export customers to CSV
 */
export function exportCustomersToCSV(customers: ExtendedCustomer[]): string {
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Segment', 'Lifetime Value', 'Total Orders', 'Average Order Value', 'Status', 'Tags', 'Created At'];

  const rows = customers.map(c => [
    c.id,
    c.name,
    c.email,
    c.phone,
    c.company || '',
    c.segment,
    c.lifetime_value,
    c.total_orders,
    c.average_order_value,
    c.isActive ? 'Active' : 'Inactive',
    c.tags.join('; '),
    c.createdAt.toISOString(),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Get customer statistics
 */
export function getCustomerStatistics(): {
  total: number;
  active: number;
  inactive: number;
  bySegment: Record<CustomerSegment, number>;
  totalLifetimeValue: number;
  averageLifetimeValue: number;
  totalOrders: number;
  averageOrders: number;
} {
  const customers = loadCustomersFromStorage();

  const bySegment: Record<CustomerSegment, number> = {
    VIP: 0,
    Regular: 0,
    Occasional: 0,
    New: 0,
    'At Risk': 0,
    Inactive: 0,
  };

  let totalLifetimeValue = 0;
  let totalOrders = 0;
  let active = 0;

  customers.forEach(c => {
    bySegment[c.segment] = (bySegment[c.segment] || 0) + 1;
    totalLifetimeValue += c.lifetime_value;
    totalOrders += c.total_orders;
    if (c.isActive) active++;
  });

  return {
    total: customers.length,
    active,
    inactive: customers.length - active,
    bySegment,
    totalLifetimeValue,
    averageLifetimeValue: customers.length > 0 ? totalLifetimeValue / customers.length : 0,
    totalOrders,
    averageOrders: customers.length > 0 ? totalOrders / customers.length : 0,
  };
}
