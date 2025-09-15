import { embeddingService, labelService } from './index.js';
import { detectBusinessConcepts, calculateConceptMatch, detectFormulaComplexity, calculateSheetImportance } from '../utils/heuristics.js';

/**
 * Service for semantic search functionality
 */
export class SearchService {
  constructor() {
    this.index = new Map(); // In-memory search index
    this.initialized = false;
  }

  /**
   * Initialize search service
   */
  async initialize() {
    if (this.initialized) return;
    
    this.initialized = true;
    console.log('✅ Search service initialized');
  }

  /**
   * Add documents to search index
   * @param {array} documents - Array of documents to index
   */
  async addToIndex(documents) {
    await this.initialize();

    for (const doc of documents) {
      // Generate embedding for the document
      const embeddingText = this.generateEmbeddingText(doc);
      const embedding = await embeddingService.generateEmbedding(embeddingText, 'cell');
      
      // Generate labels
      const labels = await labelService.generateLabels(doc);
      
      // Store in index
      this.index.set(doc.id, {
        ...doc,
        embedding,
        labels: labels.labels,
        labelConfidence: labels.confidence,
        labelMethod: labels.method,
        labelExplanation: labels.explanation
      });
    }

    console.log(`📚 Indexed ${documents.length} documents`);
  }

  /**
   * Add ranges to search index
   * @param {array} ranges - Array of ranges to index
   */
  async addRangesToIndex(ranges) {
    await this.initialize();

    for (const range of ranges) {
      // Generate embedding for the range
      const embeddingText = this.generateRangeEmbeddingText(range);
      const embedding = await embeddingService.generateEmbedding(embeddingText, 'range');
      
      // Generate labels
      const labels = await labelService.generateRangeLabels(range);
      
      // Store in index
      this.index.set(range.id, {
        ...range,
        embedding,
        labels: labels.labels,
        labelConfidence: labels.confidence,
        labelMethod: labels.method,
        labelExplanation: labels.explanation
      });
    }

    console.log(`📚 Indexed ${ranges.length} ranges`);
  }

  /**
   * Perform semantic search
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {array} Search results
   */
  async search(query, options = {}) {
    await this.initialize();

    const {
      topK = parseInt(process.env.DEFAULT_TOP_K) || 10,
      mode = 'semantic',
      includeRanges = true
    } = options;

    if (this.index.size === 0) {
      return [];
    }

    // Generate query embedding
    const queryEmbedding = await embeddingService.generateEmbedding(query, 'query');
    
    // Detect query concepts
    const queryConcepts = this.detectQueryConcepts(query);
    
    // Calculate similarities
    const similarities = [];
    
    for (const [docId, doc] of this.index) {
      // Skip ranges if not requested
      if (!includeRanges && doc.cells) continue;
      
      // Calculate cosine similarity
      const similarity = embeddingService.calculateCosineSimilarity(queryEmbedding, doc.embedding);
      
      // Calculate concept match
      const conceptMatch = calculateConceptMatch(doc.labels || [], queryConcepts);
      
      // Calculate formula complexity boost
      const formulaComplexity = doc.parsedFormula ? 
        detectFormulaComplexity(doc.parsedFormula) : 0;
      
      // Calculate sheet importance
      const sheetImportance = calculateSheetImportance(doc.sheetName);
      
      // Calculate final score
      const finalScore = this.calculateFinalScore(
        similarity,
        conceptMatch,
        formulaComplexity,
        sheetImportance
      );
      
      similarities.push({
        docId,
        doc,
        similarity,
        conceptMatch,
        formulaComplexity,
        sheetImportance,
        finalScore
      });
    }

    // Sort by final score
    similarities.sort((a, b) => b.finalScore - a.finalScore);
    
    // Take top K results
    const topResults = similarities.slice(0, topK);
    
    // Format results
    return topResults.map(result => this.formatSearchResult(result, query));
  }

  /**
   * Perform keyword search
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {array} Search results
   */
  async keywordSearch(query, options = {}) {
    await this.initialize();

    const {
      topK = parseInt(process.env.DEFAULT_TOP_K) || 10,
      includeRanges = true
    } = options;

    if (this.index.size === 0) {
      return [];
    }

    const queryTerms = query.toLowerCase().split(/\s+/);
    const results = [];

    for (const [docId, doc] of this.index) {
      // Skip ranges if not requested
      if (!includeRanges && doc.cells) continue;
      
      let score = 0;
      const matches = [];

      // Search in headers
      if (doc.headers?.column) {
        const headerText = doc.headers.column.toLowerCase();
        queryTerms.forEach(term => {
          if (headerText.includes(term)) {
            score += 2; // Higher weight for header matches
            matches.push(`header contains "${term}"`);
          }
        });
      }

      if (doc.headers?.row) {
        const rowText = doc.headers.row.toLowerCase();
        queryTerms.forEach(term => {
          if (rowText.includes(term)) {
            score += 1.5;
            matches.push(`row header contains "${term}"`);
          }
        });
      }

      // Search in values
      if (doc.formattedValue) {
        const valueText = doc.formattedValue.toLowerCase();
        queryTerms.forEach(term => {
          if (valueText.includes(term)) {
            score += 1;
            matches.push(`value contains "${term}"`);
          }
        });
      }

      // Search in formulas
      if (doc.formula) {
        const formulaText = doc.formula.toLowerCase();
        queryTerms.forEach(term => {
          if (formulaText.includes(term)) {
            score += 1.5;
            matches.push(`formula contains "${term}"`);
          }
        });
      }

      // Search in labels
      if (doc.labels) {
        doc.labels.forEach(label => {
          queryTerms.forEach(term => {
            if (label.toLowerCase().includes(term)) {
              score += 1.5;
              matches.push(`label matches "${term}"`);
            }
          });
        });
      }

      if (score > 0) {
        results.push({
          docId,
          doc,
          score,
          matches
        });
      }
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);
    
    // Take top K results
    const topResults = results.slice(0, topK);
    
    // Format results
    return topResults.map(result => this.formatKeywordResult(result, query));
  }

  /**
   * Detect concepts in query
   * @param {string} query - Search query
   * @returns {array} Array of detected concepts
   */
  detectQueryConcepts(query) {
    const concepts = [];
    const lowerQuery = query.toLowerCase();

    // Map query terms to concepts
    const conceptMap = {
      'profit': ['profitability'],
      'margin': ['profitability'],
      'revenue': ['revenue'],
      'sales': ['revenue'],
      'cost': ['cost'],
      'expense': ['cost'],
      'percentage': ['percentage'],
      'ratio': ['percentage'],
      'growth': ['growth'],
      'budget': ['budget'],
      'actual': ['budget'],
      'forecast': ['budget'],
      'lookup': ['lookup'],
      'vlookup': ['lookup'],
      'formula': ['formula'],
      'calculation': ['formula']
    };

    Object.entries(conceptMap).forEach(([term, conceptList]) => {
      if (lowerQuery.includes(term)) {
        concepts.push(...conceptList);
      }
    });

    return [...new Set(concepts)]; // Remove duplicates
  }

  /**
   * Calculate final search score
   * @param {number} similarity - Cosine similarity
   * @param {number} conceptMatch - Concept match score
   * @param {number} formulaComplexity - Formula complexity score
   * @param {number} sheetImportance - Sheet importance score
   * @returns {number} Final score
   */
  calculateFinalScore(similarity, conceptMatch, formulaComplexity, sheetImportance) {
    const weights = {
      semantic: parseFloat(process.env.SEMANTIC_WEIGHT) || 0.7,
      concept: parseFloat(process.env.CONCEPT_MATCH_WEIGHT) || 0.15,
      formula: parseFloat(process.env.FORMULA_COMPLEXITY_WEIGHT) || 0.1,
      sheet: parseFloat(process.env.SHEET_IMPORTANCE_WEIGHT) || 0.05
    };

    return (
      weights.semantic * similarity +
      weights.concept * conceptMatch +
      weights.formula * formulaComplexity +
      weights.sheet * sheetImportance
    );
  }

  /**
   * Format search result
   * @param {object} result - Search result
   * @param {string} query - Original query
   * @returns {object} Formatted result
   */
  formatSearchResult(result, query) {
    const { doc, finalScore, similarity, conceptMatch } = result;
    
    return {
      id: doc.id,
      concept: this.getPrimaryConcept(doc),
      location: {
        sheet: doc.sheetName,
        range: doc.cells ? `${doc.startRow}-${doc.endRow}` : `${doc.row}:${doc.column}`
      },
      formula: doc.formula || null,
      value: doc.formattedValue || null,
      explanation: labelService.generateSearchExplanation(doc, query),
      relevance: finalScore,
      reasons: this.generateReasons(doc, query, similarity, conceptMatch),
      labels: doc.labels || [],
      type: doc.cells ? 'range' : 'cell'
    };
  }

  /**
   * Format keyword search result
   * @param {object} result - Keyword search result
   * @param {string} query - Original query
   * @returns {object} Formatted result
   */
  formatKeywordResult(result, query) {
    const { doc, score, matches } = result;
    
    return {
      id: doc.id,
      concept: this.getPrimaryConcept(doc),
      location: {
        sheet: doc.sheetName,
        range: doc.cells ? `${doc.startRow}-${doc.endRow}` : `${doc.row}:${doc.column}`
      },
      formula: doc.formula || null,
      value: doc.formattedValue || null,
      explanation: `Keyword matches: ${matches.join(', ')}`,
      relevance: score / 10, // Normalize to 0-1 range
      reasons: matches,
      labels: doc.labels || [],
      type: doc.cells ? 'range' : 'cell'
    };
  }

  /**
   * Get primary concept for a document
   * @param {object} doc - Document
   * @returns {string} Primary concept
   */
  getPrimaryConcept(doc) {
    if (doc.labels && doc.labels.length > 0) {
      return doc.labels[0];
    }
    
    if (doc.headers?.column) {
      return doc.headers.column;
    }
    
    if (doc.formula) {
      return 'Formula';
    }
    
    return 'Data';
  }

  /**
   * Generate reasons for search result
   * @param {object} doc - Document
   * @param {string} query - Original query
   * @param {number} similarity - Similarity score
   * @param {number} conceptMatch - Concept match score
   * @returns {array} Array of reasons
   */
  generateReasons(doc, query, similarity, conceptMatch) {
    const reasons = [];
    
    if (similarity > 0.8) {
      reasons.push('high semantic similarity');
    } else if (similarity > 0.6) {
      reasons.push('good semantic similarity');
    }
    
    if (conceptMatch > 0.5) {
      reasons.push('concept match');
    }
    
    if (doc.formula) {
      if (doc.formula.includes('SUM')) {
        reasons.push('contains SUM formula');
      } else if (doc.formula.includes('/')) {
        reasons.push('contains division calculation');
      }
    }
    
    if (doc.headers?.column) {
      const header = doc.headers.column.toLowerCase();
      const queryLower = query.toLowerCase();
      if (header.includes(queryLower) || queryLower.includes(header)) {
        reasons.push('header matches query');
      }
    }
    
    return reasons;
  }

  /**
   * Generate embedding text for document
   * @param {object} doc - Document
   * @returns {string} Text for embedding
   */
  generateEmbeddingText(doc) {
    const parts = [];
    
    parts.push(`Sheet: ${doc.sheetName}`);
    
    if (doc.headers?.column) {
      parts.push(`Column: ${doc.headers.column}`);
    }
    
    if (doc.formula) {
      parts.push(`Formula: ${doc.formula}`);
    } else if (doc.formattedValue) {
      parts.push(`Value: ${doc.formattedValue}`);
    }
    
    return parts.join(' - ');
  }

  /**
   * Generate embedding text for range
   * @param {object} range - Range document
   * @returns {string} Text for embedding
   */
  generateRangeEmbeddingText(range) {
    const parts = [];
    
    parts.push(`Sheet: ${range.sheetName}`);
    parts.push(`Header: ${range.header}`);
    parts.push(`Range: ${range.startRow}-${range.endRow}`);
    
    if (range.sampleValues?.length > 0) {
      parts.push(`Values: ${range.sampleValues.slice(0, 3).join(', ')}`);
    }
    
    return parts.join(' - ');
  }

  /**
   * Get search statistics
   * @returns {object} Search statistics
   */
  getStats() {
    return {
      totalDocuments: this.index.size,
      cells: Array.from(this.index.values()).filter(doc => !doc.cells).length,
      ranges: Array.from(this.index.values()).filter(doc => doc.cells).length,
      initialized: this.initialized
    };
  }

  /**
   * Clear search index
   */
  clearIndex() {
    this.index.clear();
    console.log('🗑️ Search index cleared');
  }
}
