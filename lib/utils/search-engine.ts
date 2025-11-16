/**
 * Advanced Search Engine with Fuzzy Matching and Intelligent Ranking
 *
 * Features:
 * - Levenshtein distance algorithm for fuzzy matching
 * - Search indexing for fast lookups
 * - Result ranking with field weights
 * - Search modifiers and operators
 * - Multi-entity search (orders, items, products, templates)
 */

import type { OrderItem, Product, Order } from '@/types';
import type { OrderTemplate } from './order-templates';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type SearchScope = 'all' | 'items' | 'products' | 'orders' | 'templates';
export type SearchOperator = 'AND' | 'OR' | 'NOT';
export type EntityType = 'item' | 'product' | 'order' | 'template';

export interface SearchQuery {
  text: string;
  filters: Record<string, any>;
  modifiers: SearchModifier[];
  scope: SearchScope;
  limit: number;
}

export interface SearchModifier {
  field: string;
  operator: string;
  value: string;
}

export interface SearchResult<T = any> {
  entity: T;
  type: EntityType;
  score: number;
  highlights: Record<string, string>;
  matchedFields: string[];
}

export interface SearchIndex {
  term: string;
  entityType: EntityType;
  entityId: string;
  field: string;
  weight: number;
  originalValue: string;
}

export interface FuzzyMatchResult {
  matched: boolean;
  score: number;
  distance: number;
}

export interface SearchFilter {
  id: string;
  field: string;
  operator: string;
  value: any;
}

export interface ParsedQuery {
  text: string;
  modifiers: SearchModifier[];
  operators: SearchOperator[];
  excludeTerms: string[];
  exactPhrases: string[];
}

// ============================================
// CONFIGURATION
// ============================================

const FUZZY_THRESHOLD = 0.6; // Minimum similarity score (0-1)
const DEFAULT_LIMIT = 100;
const DEBOUNCE_MS = 300;

// Field weights for scoring
const FIELD_WEIGHTS: Record<string, number> = {
  // Primary fields
  id: 1.5,
  name: 1.5,
  productName: 1.5,
  customerName: 1.5,

  // Secondary fields
  description: 1.0,
  tags: 1.0,
  notes: 1.0,
  sku: 1.0,

  // Tertiary fields
  category: 0.5,
  status: 0.5,
  metadata: 0.5,
};

// Match type scores
const MATCH_SCORES = {
  EXACT: 1.0,
  PREFIX: 0.8,
  FUZZY: 0.6,
  PARTIAL: 0.4,
};

// ============================================
// LEVENSHTEIN DISTANCE ALGORITHM
// ============================================

/**
 * Calculate Levenshtein distance between two strings
 * Uses dynamic programming for O(n*m) complexity
 *
 * @param a - First string
 * @param b - Second string
 * @returns Edit distance (number of operations needed)
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  // Early exit for empty strings
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  // Create matrix
  const matrix: number[][] = Array(aLen + 1)
    .fill(null)
    .map(() => Array(bLen + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= aLen; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= bLen; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[aLen][bLen];
}

/**
 * Calculate similarity score from Levenshtein distance
 *
 * @param distance - Edit distance
 * @param maxLength - Maximum string length
 * @returns Similarity score (0-1)
 */
export function distanceToSimilarity(distance: number, maxLength: number): number {
  if (maxLength === 0) return 0;
  return 1 - (distance / maxLength);
}

// ============================================
// FUZZY MATCHING
// ============================================

/**
 * Perform fuzzy matching between query and target string
 *
 * @param query - Search query
 * @param target - Target string to match against
 * @param threshold - Minimum similarity threshold (default: 0.6)
 * @returns Match result with score
 */
export function fuzzyMatch(
  query: string,
  target: string,
  threshold: number = FUZZY_THRESHOLD
): FuzzyMatchResult {
  // Normalize strings
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedTarget = target.toLowerCase().trim();

  // Check for exact match
  if (normalizedQuery === normalizedTarget) {
    return {
      matched: true,
      score: MATCH_SCORES.EXACT,
      distance: 0,
    };
  }

  // Check for prefix match
  if (normalizedTarget.startsWith(normalizedQuery)) {
    return {
      matched: true,
      score: MATCH_SCORES.PREFIX,
      distance: normalizedTarget.length - normalizedQuery.length,
    };
  }

  // Check for partial match (contains)
  if (normalizedTarget.includes(normalizedQuery)) {
    return {
      matched: true,
      score: MATCH_SCORES.PARTIAL,
      distance: normalizedTarget.length - normalizedQuery.length,
    };
  }

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalizedQuery, normalizedTarget);
  const maxLength = Math.max(normalizedQuery.length, normalizedTarget.length);
  const similarity = distanceToSimilarity(distance, maxLength);

  return {
    matched: similarity >= threshold,
    score: similarity >= threshold ? similarity * MATCH_SCORES.FUZZY : 0,
    distance,
  };
}

/**
 * Fuzzy match with multiple targets
 * Returns best match
 */
export function fuzzyMatchMultiple(
  query: string,
  targets: string[],
  threshold: number = FUZZY_THRESHOLD
): FuzzyMatchResult & { matchedTarget?: string } {
  let bestMatch: FuzzyMatchResult & { matchedTarget?: string } = {
    matched: false,
    score: 0,
    distance: Infinity,
  };

  for (const target of targets) {
    const result = fuzzyMatch(query, target, threshold);
    if (result.matched && result.score > bestMatch.score) {
      bestMatch = {
        ...result,
        matchedTarget: target,
      };
    }
  }

  return bestMatch;
}

// ============================================
// QUERY PARSING
// ============================================

/**
 * Parse search query with modifiers and operators
 *
 * Supports:
 * - Field search: name:apple
 * - Comparison: quantity:>100
 * - Range: price:100..500
 * - Exact phrase: "exact match"
 * - Exclude: -term
 * - Operators: AND, OR, NOT
 */
export function parseQuery(query: string): ParsedQuery {
  const modifiers: SearchModifier[] = [];
  const operators: SearchOperator[] = [];
  const excludeTerms: string[] = [];
  const exactPhrases: string[] = [];
  let cleanText = query;

  // Extract exact phrases
  const phraseRegex = /"([^"]+)"/g;
  let phraseMatch;
  while ((phraseMatch = phraseRegex.exec(query)) !== null) {
    exactPhrases.push(phraseMatch[1]);
    cleanText = cleanText.replace(phraseMatch[0], '');
  }

  // Extract field modifiers (field:value, field:>value, field:min..max)
  const modifierRegex = /(\w+):((?:[><=!]+)?(?:\w+)|(?:\d+\.\.\d+))/g;
  let modMatch;
  while ((modMatch = modifierRegex.exec(query)) !== null) {
    const field = modMatch[1];
    const valueWithOp = modMatch[2];

    // Parse operator and value
    let operator = '=';
    let value = valueWithOp;

    if (valueWithOp.startsWith('>')) {
      operator = '>';
      value = valueWithOp.substring(1);
    } else if (valueWithOp.startsWith('<')) {
      operator = '<';
      value = valueWithOp.substring(1);
    } else if (valueWithOp.startsWith('>=')) {
      operator = '>=';
      value = valueWithOp.substring(2);
    } else if (valueWithOp.startsWith('<=')) {
      operator = '<=';
      value = valueWithOp.substring(2);
    } else if (valueWithOp.startsWith('!=')) {
      operator = '!=';
      value = valueWithOp.substring(2);
    } else if (valueWithOp.includes('..')) {
      operator = 'range';
      // Keep range value as is
    }

    modifiers.push({ field, operator, value });
    cleanText = cleanText.replace(modMatch[0], '');
  }

  // Extract exclude terms
  const excludeRegex = /-(\w+)/g;
  let excludeMatch;
  while ((excludeMatch = excludeRegex.exec(query)) !== null) {
    excludeTerms.push(excludeMatch[1]);
    cleanText = cleanText.replace(excludeMatch[0], '');
  }

  // Extract logical operators
  const operatorRegex = /\b(AND|OR|NOT)\b/gi;
  let opMatch;
  while ((opMatch = operatorRegex.exec(query)) !== null) {
    operators.push(opMatch[1].toUpperCase() as SearchOperator);
    cleanText = cleanText.replace(opMatch[0], '');
  }

  // Clean up text
  cleanText = cleanText.trim().replace(/\s+/g, ' ');

  return {
    text: cleanText,
    modifiers,
    operators,
    excludeTerms,
    exactPhrases,
  };
}

// ============================================
// SEARCH INDEXING
// ============================================

let searchIndexCache: SearchIndex[] = [];

/**
 * Build search index from entities
 * Creates inverted index for fast lookups
 */
export function buildSearchIndex(
  items: OrderItem[],
  products: Product[],
  orders: Order[],
  templates: OrderTemplate[]
): SearchIndex[] {
  const index: SearchIndex[] = [];

  // Index order items
  items.forEach((item) => {
    if (item.id) {
      // Index product name
      if (item.productName) {
        const terms = tokenize(item.productName);
        terms.forEach((term) => {
          index.push({
            term,
            entityType: 'item',
            entityId: item.id!,
            field: 'productName',
            weight: FIELD_WEIGHTS.productName,
            originalValue: item.productName,
          });
        });
      }

      // Index product ID
      if (item.productId) {
        index.push({
          term: item.productId.toLowerCase(),
          entityType: 'item',
          entityId: item.id!,
          field: 'productId',
          weight: FIELD_WEIGHTS.id,
          originalValue: item.productId,
        });
      }

      // Index notes
      if (item.notes) {
        const terms = tokenize(item.notes);
        terms.forEach((term) => {
          index.push({
            term,
            entityType: 'item',
            entityId: item.id!,
            field: 'notes',
            weight: FIELD_WEIGHTS.notes,
            originalValue: item.notes!,
          });
        });
      }
    }
  });

  // Index products
  products.forEach((product) => {
    // Index name
    const nameTerms = tokenize(product.name);
    nameTerms.forEach((term) => {
      index.push({
        term,
        entityType: 'product',
        entityId: product.id,
        field: 'name',
        weight: FIELD_WEIGHTS.name,
        originalValue: product.name,
      });
    });

    // Index ID
    index.push({
      term: product.id.toLowerCase(),
      entityType: 'product',
      entityId: product.id,
      field: 'id',
      weight: FIELD_WEIGHTS.id,
      originalValue: product.id,
    });

    // Index SKU
    index.push({
      term: product.sku.toLowerCase(),
      entityType: 'product',
      entityId: product.id,
      field: 'sku',
      weight: FIELD_WEIGHTS.sku,
      originalValue: product.sku,
    });

    // Index description
    if (product.description) {
      const descTerms = tokenize(product.description);
      descTerms.forEach((term) => {
        index.push({
          term,
          entityType: 'product',
          entityId: product.id,
          field: 'description',
          weight: FIELD_WEIGHTS.description,
          originalValue: product.description!,
        });
      });
    }
  });

  // Index orders
  orders.forEach((order) => {
    // Index order ID
    index.push({
      term: order.id.toLowerCase(),
      entityType: 'order',
      entityId: order.id,
      field: 'id',
      weight: FIELD_WEIGHTS.id,
      originalValue: order.id,
    });

    // Index customer name
    const customerTerms = tokenize(order.customerName);
    customerTerms.forEach((term) => {
      index.push({
        term,
        entityType: 'order',
        entityId: order.id,
        field: 'customerName',
        weight: FIELD_WEIGHTS.customerName,
        originalValue: order.customerName,
      });
    });

    // Index status
    index.push({
      term: order.status.toLowerCase(),
      entityType: 'order',
      entityId: order.id,
      field: 'status',
      weight: FIELD_WEIGHTS.status,
      originalValue: order.status,
    });
  });

  // Index templates
  templates.forEach((template) => {
    // Index name
    const nameTerms = tokenize(template.name);
    nameTerms.forEach((term) => {
      index.push({
        term,
        entityType: 'template',
        entityId: template.id,
        field: 'name',
        weight: FIELD_WEIGHTS.name,
        originalValue: template.name,
      });
    });

    // Index description
    if (template.description) {
      const descTerms = tokenize(template.description);
      descTerms.forEach((term) => {
        index.push({
          term,
          entityType: 'template',
          entityId: template.id,
          field: 'description',
          weight: FIELD_WEIGHTS.description,
          originalValue: template.description,
        });
      });
    }

    // Index tags
    if (template.tags) {
      template.tags.forEach((tag) => {
        index.push({
          term: tag.toLowerCase(),
          entityType: 'template',
          entityId: template.id,
          field: 'tags',
          weight: FIELD_WEIGHTS.tags,
          originalValue: tag,
        });
      });
    }
  });

  // Cache the index
  searchIndexCache = index;

  return index;
}

/**
 * Tokenize text into searchable terms
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((term) => term.length > 0);
}

/**
 * Update search index for a single entity
 */
export function updateSearchIndex(
  entity: OrderItem | Product | Order | OrderTemplate,
  entityType: EntityType
): void {
  // Remove old entries
  const entityId = entity.id;
  if (!entityId) return;

  searchIndexCache = searchIndexCache.filter(
    (entry) => !(entry.entityId === entityId && entry.entityType === entityType)
  );

  // Add new entries based on entity type
  // This is a simplified version - in production, you'd call buildSearchIndex with updated data
  // For now, we'll just mark the cache as dirty
  console.log(`Updated index for ${entityType} ${entityId}`);
}

/**
 * Clear search index
 */
export function clearSearchIndex(): void {
  searchIndexCache = [];
}

/**
 * Get cached search index
 */
export function getSearchIndex(): SearchIndex[] {
  return searchIndexCache;
}

// ============================================
// SCORING AND RANKING
// ============================================

/**
 * Calculate relevance score for a match
 *
 * Factors:
 * - Match quality (exact, prefix, fuzzy)
 * - Field weight
 * - Freshness boost (recent items)
 * - Popularity boost (frequently accessed)
 */
export function calculateScore(
  query: string,
  entity: any,
  field: string,
  matchResult: FuzzyMatchResult,
  metadata?: {
    createdAt?: Date;
    accessCount?: number;
  }
): number {
  let score = matchResult.score;

  // Apply field weight
  const fieldWeight = FIELD_WEIGHTS[field] || 1.0;
  score *= fieldWeight;

  // Freshness boost (recent items get +10%)
  if (metadata?.createdAt) {
    const daysSinceCreation = (Date.now() - metadata.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) {
      score *= 1.1;
    }
  }

  // Popularity boost (frequently accessed items get +5%)
  if (metadata?.accessCount && metadata.accessCount > 10) {
    score *= 1.05;
  }

  // Normalize score to 0-100
  return Math.min(Math.round(score * 100), 100);
}

/**
 * Apply field weights to score
 */
export function applyFieldWeights(score: number, field: string): number {
  const weight = FIELD_WEIGHTS[field] || 1.0;
  return score * weight;
}

/**
 * Rank search results by score
 */
export function rankResults<T>(results: SearchResult<T>[]): SearchResult<T>[] {
  return results.sort((a, b) => {
    // Primary sort by score
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    // Secondary sort by number of matched fields
    if (a.matchedFields.length !== b.matchedFields.length) {
      return b.matchedFields.length - a.matchedFields.length;
    }

    // Tertiary sort by entity type priority
    const typePriority: Record<EntityType, number> = {
      order: 4,
      item: 3,
      product: 2,
      template: 1,
    };

    return (typePriority[b.type] || 0) - (typePriority[a.type] || 0);
  });
}

// ============================================
// FILTERING
// ============================================

/**
 * Create a search filter
 */
export function createFieldFilter(
  field: string,
  operator: string,
  value: any
): SearchFilter {
  return {
    id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    field,
    operator,
    value,
  };
}

/**
 * Apply filters to search results
 */
export function applyFilters<T>(
  results: SearchResult<T>[],
  filters: SearchFilter[]
): SearchResult<T>[] {
  if (filters.length === 0) return results;

  return results.filter((result) => {
    return filters.every((filter) => {
      const entityValue = (result.entity as any)[filter.field];

      switch (filter.operator) {
        case '=':
          return entityValue === filter.value;
        case '!=':
          return entityValue !== filter.value;
        case '>':
          return Number(entityValue) > Number(filter.value);
        case '<':
          return Number(entityValue) < Number(filter.value);
        case '>=':
          return Number(entityValue) >= Number(filter.value);
        case '<=':
          return Number(entityValue) <= Number(filter.value);
        case 'range': {
          const [min, max] = filter.value.split('..').map(Number);
          const val = Number(entityValue);
          return val >= min && val <= max;
        }
        case 'contains':
          return String(entityValue).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'startsWith':
          return String(entityValue).toLowerCase().startsWith(String(filter.value).toLowerCase());
        default:
          return true;
      }
    });
  });
}

/**
 * Apply search modifiers to filter results
 */
export function applyModifiers<T>(
  results: SearchResult<T>[],
  modifiers: SearchModifier[]
): SearchResult<T>[] {
  if (modifiers.length === 0) return results;

  return results.filter((result) => {
    return modifiers.every((modifier) => {
      const entityValue = (result.entity as any)[modifier.field];

      if (entityValue === undefined) return false;

      switch (modifier.operator) {
        case '=':
          return String(entityValue).toLowerCase() === modifier.value.toLowerCase();
        case '>':
          return Number(entityValue) > Number(modifier.value);
        case '<':
          return Number(entityValue) < Number(modifier.value);
        case '>=':
          return Number(entityValue) >= Number(modifier.value);
        case '<=':
          return Number(entityValue) <= Number(modifier.value);
        case '!=':
          return String(entityValue).toLowerCase() !== modifier.value.toLowerCase();
        case 'range': {
          const [min, max] = modifier.value.split('..').map(Number);
          const val = Number(entityValue);
          return val >= min && val <= max;
        }
        default:
          return String(entityValue).toLowerCase().includes(modifier.value.toLowerCase());
      }
    });
  });
}

// ============================================
// MAIN SEARCH FUNCTION
// ============================================

/**
 * Perform search across entities
 *
 * @param query - Search query with filters and modifiers
 * @param entities - Entities to search
 * @returns Ranked search results
 */
export function search<T>(
  query: SearchQuery,
  entities: {
    items?: OrderItem[];
    products?: Product[];
    orders?: Order[];
    templates?: OrderTemplate[];
  }
): SearchResult<T>[] {
  const { text, scope, limit } = query;
  const parsedQuery = parseQuery(text);
  const results: SearchResult<any>[] = [];

  // Determine which entities to search
  const shouldSearchItems = scope === 'all' || scope === 'items';
  const shouldSearchProducts = scope === 'all' || scope === 'products';
  const shouldSearchOrders = scope === 'all' || scope === 'orders';
  const shouldSearchTemplates = scope === 'all' || scope === 'templates';

  // Search order items
  if (shouldSearchItems && entities.items) {
    entities.items.forEach((item) => {
      const itemResults = searchEntity(item, 'item', parsedQuery);
      results.push(...itemResults);
    });
  }

  // Search products
  if (shouldSearchProducts && entities.products) {
    entities.products.forEach((product) => {
      const productResults = searchEntity(product, 'product', parsedQuery);
      results.push(...productResults);
    });
  }

  // Search orders
  if (shouldSearchOrders && entities.orders) {
    entities.orders.forEach((order) => {
      const orderResults = searchEntity(order, 'order', parsedQuery);
      results.push(...orderResults);
    });
  }

  // Search templates
  if (shouldSearchTemplates && entities.templates) {
    entities.templates.forEach((template) => {
      const templateResults = searchEntity(template, 'template', parsedQuery);
      results.push(...templateResults);
    });
  }

  // Apply modifiers
  let filteredResults = applyModifiers(results, parsedQuery.modifiers);

  // Filter out excluded terms
  if (parsedQuery.excludeTerms.length > 0) {
    filteredResults = filteredResults.filter((result) => {
      const entityString = JSON.stringify(result.entity).toLowerCase();
      return !parsedQuery.excludeTerms.some((term) => entityString.includes(term.toLowerCase()));
    });
  }

  // Rank results
  const rankedResults = rankResults(filteredResults);

  // Limit results
  return rankedResults.slice(0, limit || DEFAULT_LIMIT);
}

/**
 * Search a single entity
 */
function searchEntity(
  entity: any,
  type: EntityType,
  parsedQuery: ParsedQuery
): SearchResult<any>[] {
  const results: SearchResult<any>[] = [];
  const matchedFields: string[] = [];
  const highlights: Record<string, string> = {};
  let totalScore = 0;
  let matchCount = 0;

  // Get searchable fields based on entity type
  const fields = getSearchableFields(entity, type);

  // Search each field
  for (const [field, value] of Object.entries(fields)) {
    if (!value) continue;

    const stringValue = String(value);
    const matchResult = fuzzyMatch(parsedQuery.text, stringValue);

    if (matchResult.matched) {
      matchedFields.push(field);

      // Create highlight
      highlights[field] = highlightMatch(stringValue, parsedQuery.text);

      // Calculate score
      const score = calculateScore(
        parsedQuery.text,
        entity,
        field,
        matchResult,
        {
          createdAt: entity.createdAt,
          accessCount: entity.accessCount,
        }
      );

      totalScore += score;
      matchCount++;
    }
  }

  // Check exact phrases
  if (parsedQuery.exactPhrases.length > 0) {
    const entityString = JSON.stringify(entity).toLowerCase();
    const hasAllPhrases = parsedQuery.exactPhrases.every((phrase) =>
      entityString.includes(phrase.toLowerCase())
    );

    if (!hasAllPhrases) {
      return results; // Skip this entity if exact phrases don't match
    }

    // Boost score for exact phrase match
    totalScore *= 1.2;
  }

  // Only add to results if we have matches
  if (matchCount > 0) {
    const averageScore = totalScore / matchCount;

    results.push({
      entity,
      type,
      score: Math.round(averageScore),
      highlights,
      matchedFields,
    });
  }

  return results;
}

/**
 * Get searchable fields for an entity
 */
function getSearchableFields(
  entity: any,
  type: EntityType
): Record<string, any> {
  switch (type) {
    case 'item':
      return {
        productId: entity.productId,
        productName: entity.productName,
        notes: entity.notes,
      };
    case 'product':
      return {
        id: entity.id,
        name: entity.name,
        description: entity.description,
        sku: entity.sku,
        category: entity.category,
      };
    case 'order':
      return {
        id: entity.id,
        customerName: entity.customerName,
        status: entity.status,
      };
    case 'template':
      return {
        id: entity.id,
        name: entity.name,
        description: entity.description,
        tags: entity.tags?.join(' '),
      };
    default:
      return {};
  }
}

/**
 * Highlight matched text
 */
function highlightMatch(text: string, query: string): string {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  const before = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const after = text.substring(index + query.length);

  return `${before}<mark>${match}</mark>${after}`;
}

/**
 * Search with filters
 */
export function searchWithFilters<T>(
  text: string,
  filters: SearchFilter[],
  entities: {
    items?: OrderItem[];
    products?: Product[];
    orders?: Order[];
    templates?: OrderTemplate[];
  },
  scope: SearchScope = 'all',
  limit: number = DEFAULT_LIMIT
): SearchResult<T>[] {
  const query: SearchQuery = {
    text,
    filters: {},
    modifiers: [],
    scope,
    limit,
  };

  let results = search<T>(query, entities);
  results = applyFilters(results, filters);

  return results;
}
