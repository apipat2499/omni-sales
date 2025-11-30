/**
 * Fuzzy search utilities
 *
 * Provides flexible search that tolerates typos and variations
 */

/**
 * Calculate Levenshtein distance between two strings
 * Used to measure similarity between search term and target
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1)
 * 1 = perfect match, 0 = completely different
 */
export function similarityScore(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longer.length - distance) / longer.length;
}

/**
 * Fuzzy search: Check if search term matches target with tolerance for typos
 *
 * @param searchTerm - The search query
 * @param target - The target string to search in
 * @param threshold - Similarity threshold (0-1), default 0.6
 * @returns true if match found
 */
export function fuzzyMatch(
  searchTerm: string,
  target: string,
  threshold: number = 0.6
): boolean {
  const search = searchTerm.toLowerCase().trim();
  const text = target.toLowerCase().trim();

  // Exact match or contains
  if (text.includes(search)) {
    return true;
  }

  // Word-by-word fuzzy matching
  const searchWords = search.split(/\s+/);
  const targetWords = text.split(/\s+/);

  for (const searchWord of searchWords) {
    let found = false;

    for (const targetWord of targetWords) {
      const score = similarityScore(searchWord, targetWord);
      if (score >= threshold) {
        found = true;
        break;
      }
    }

    // If any search word doesn't match, return false
    if (!found) {
      return false;
    }
  }

  return true;
}

/**
 * Search multiple fields with fuzzy matching
 *
 * @param searchTerm - The search query
 * @param fields - Array of strings to search in
 * @param threshold - Similarity threshold (0-1)
 * @returns true if match found in any field
 */
export function fuzzySearchMultiField(
  searchTerm: string,
  fields: string[],
  threshold: number = 0.6
): boolean {
  if (!searchTerm.trim()) {
    return true; // Empty search matches everything
  }

  return fields.some((field) => fuzzyMatch(searchTerm, field, threshold));
}

/**
 * Highlight matching parts of text
 *
 * @param text - The text to highlight
 * @param searchTerm - The search term to highlight
 * @returns Text with <mark> tags around matches
 */
export function highlightMatch(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) {
    return text;
  }

  const search = searchTerm.toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(search);

  if (index === -1) {
    return text;
  }

  const before = text.substring(0, index);
  const match = text.substring(index, index + searchTerm.length);
  const after = text.substring(index + searchTerm.length);

  return `${before}<mark class="bg-yellow-200 dark:bg-yellow-800">${match}</mark>${after}`;
}

/**
 * Advanced search with multiple criteria
 */
export interface SearchOptions {
  fuzzy?: boolean;
  fuzzyThreshold?: number;
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

export function advancedSearch(
  searchTerm: string,
  target: string,
  options: SearchOptions = {}
): boolean {
  const {
    fuzzy = true,
    fuzzyThreshold = 0.6,
    caseSensitive = false,
    wholeWord = false,
  } = options;

  let search = searchTerm.trim();
  let text = target.trim();

  if (!caseSensitive) {
    search = search.toLowerCase();
    text = text.toLowerCase();
  }

  if (!search) {
    return true;
  }

  // Whole word matching
  if (wholeWord) {
    const regex = new RegExp(`\\b${search}\\b`, caseSensitive ? '' : 'i');
    return regex.test(target);
  }

  // Fuzzy matching
  if (fuzzy) {
    return fuzzyMatch(search, text, fuzzyThreshold);
  }

  // Simple contains
  return text.includes(search);
}
