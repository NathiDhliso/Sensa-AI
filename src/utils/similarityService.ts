// Unified Similarity Service
// Consolidates similarity calculation functions from multiple locations

export type SimilarityAlgorithm = 'jaccard' | 'cosine' | 'levenshtein' | 'semantic';

interface SimilarityOptions {
  algorithm?: SimilarityAlgorithm;
  caseSensitive?: boolean;
  threshold?: number;
}

// Semantic similarity mappings (consolidated from mermaid-cartographer)
const SEMANTIC_SYNONYMS: Record<string, string[]> = {
  'analysis': ['examine', 'study', 'investigate', 'research', 'analyze', 'review'],
  'design': ['create', 'build', 'develop', 'construct', 'architect', 'plan'],
  'problem': ['challenge', 'issue', 'difficulty', 'puzzle', 'obstacle', 'trouble'],
  'solution': ['answer', 'resolution', 'fix', 'approach', 'remedy', 'resolve'],
  'learning': ['education', 'study', 'knowledge', 'understanding', 'training', 'instruction'],
  'memory': ['remember', 'recall', 'recollection', 'experience', 'retention', 'memorize'],
  'collaboration': ['teamwork', 'cooperation', 'partnership', 'joint', 'collective', 'shared'],
  'development': ['growth', 'progress', 'advancement', 'evolution', 'improvement', 'enhancement'],
  'implementation': ['execution', 'deployment', 'realization', 'application', 'fulfillment'],
  'optimization': ['improvement', 'enhancement', 'refinement', 'tuning', 'perfection']
};

/**
 * Calculate Jaccard similarity between two sets of words
 */
export function calculateJaccardSimilarity(text1: string, text2: string, caseSensitive = false): number {
  const normalize = (text: string) => caseSensitive ? text : text.toLowerCase();
  
  const set1 = new Set(normalize(text1).split(/\s+/).filter(word => word.length > 0));
  const set2 = new Set(normalize(text2).split(/\s+/).filter(word => word.length > 0));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate Cosine similarity between two text vectors
 */
export function calculateCosineSimilarity(text1: string, text2: string, caseSensitive = false): number {
  const normalize = (text: string) => caseSensitive ? text : text.toLowerCase();
  
  const words1 = normalize(text1).split(/\s+/).filter(word => word.length > 0);
  const words2 = normalize(text2).split(/\s+/).filter(word => word.length > 0);
  
  // Create word frequency vectors
  const allWords = [...new Set([...words1, ...words2])];
  const vector1 = allWords.map(word => words1.filter(w => w === word).length);
  const vector2 = allWords.map(word => words2.filter(w => w === word).length);
  
  // Calculate dot product
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  
  // Calculate magnitudes
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  return magnitude1 === 0 || magnitude2 === 0 ? 0 : dotProduct / (magnitude1 * magnitude2);
}

/**
 * Calculate Levenshtein distance and convert to similarity score
 */
export function calculateLevenshteinSimilarity(text1: string, text2: string, caseSensitive = false): number {
  const str1 = caseSensitive ? text1 : text1.toLowerCase();
  const str2 = caseSensitive ? text2 : text2.toLowerCase();
  
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  const distance = matrix[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

/**
 * Calculate semantic similarity using predefined synonym mappings
 */
export function calculateSemanticSimilarity(text1: string, text2: string, caseSensitive = false): number {
  const normalize = (text: string) => caseSensitive ? text : text.toLowerCase();
  
  const words1 = normalize(text1).split(/\s+/).filter(word => word.length > 0);
  const words2 = normalize(text2).split(/\s+/).filter(word => word.length > 0);
  
  let matches = 0;
  let totalComparisons = 0;
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      totalComparisons++;
      
      // Direct match
      if (word1 === word2) {
        matches++;
        continue;
      }
      
      // Semantic match using synonyms
      const isSemanticMatch = Object.entries(SEMANTIC_SYNONYMS).some(([key, synonyms]) => {
        const word1InGroup = word1.includes(key) || synonyms.some(syn => word1.includes(syn));
        const word2InGroup = word2.includes(key) || synonyms.some(syn => word2.includes(syn));
        return word1InGroup && word2InGroup;
      });
      
      if (isSemanticMatch) {
        matches += 0.8; // Semantic matches get slightly lower weight than exact matches
      }
    }
  }
  
  return totalComparisons === 0 ? 0 : matches / totalComparisons;
}

/**
 * Main similarity calculation function with multiple algorithm support
 */
export function calculateSimilarity(
  text1: string, 
  text2: string, 
  options: SimilarityOptions = {}
): number {
  const {
    algorithm = 'cosine',
    caseSensitive = false,
    threshold = 0
  } = options;
  
  let similarity: number;
  
  switch (algorithm) {
    case 'jaccard':
      similarity = calculateJaccardSimilarity(text1, text2, caseSensitive);
      break;
    case 'cosine':
      similarity = calculateCosineSimilarity(text1, text2, caseSensitive);
      break;
    case 'levenshtein':
      similarity = calculateLevenshteinSimilarity(text1, text2, caseSensitive);
      break;
    case 'semantic':
      similarity = calculateSemanticSimilarity(text1, text2, caseSensitive);
      break;
    default:
      throw new Error(`Unsupported similarity algorithm: ${algorithm}`);
  }
  
  return similarity >= threshold ? similarity : 0;
}

/**
 * Check if two texts are similar based on a threshold
 */
export function areSimilar(
  text1: string, 
  text2: string, 
  options: SimilarityOptions & { threshold: number }
): boolean {
  const similarity = calculateSimilarity(text1, text2, options);
  return similarity >= options.threshold;
}

/**
 * Find the most similar text from a list of candidates
 */
export function findMostSimilar(
  target: string,
  candidates: string[],
  options: SimilarityOptions = {}
): { text: string; similarity: number; index: number } | null {
  if (candidates.length === 0) return null;
  
  let bestMatch = { text: candidates[0], similarity: 0, index: 0 };
  
  candidates.forEach((candidate, index) => {
    const similarity = calculateSimilarity(target, candidate, options);
    if (similarity > bestMatch.similarity) {
      bestMatch = { text: candidate, similarity, index };
    }
  });
  
  return bestMatch.similarity > 0 ? bestMatch : null;
}

/**
 * Add custom semantic synonyms
 */
export function addSemanticSynonyms(word: string, synonyms: string[]): void {
  SEMANTIC_SYNONYMS[word.toLowerCase()] = synonyms.map(s => s.toLowerCase());
}

/**
 * Get all semantic synonym groups
 */
export function getSemanticSynonyms(): Record<string, string[]> {
  return { ...SEMANTIC_SYNONYMS };
}

export default {
  calculateSimilarity,
  calculateJaccardSimilarity,
  calculateCosineSimilarity,
  calculateLevenshteinSimilarity,
  calculateSemanticSimilarity,
  areSimilar,
  findMostSimilar,
  addSemanticSynonyms,
  getSemanticSynonyms
};