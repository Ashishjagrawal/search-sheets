import OpenAI from 'openai';
import { detectBusinessConcepts } from '../utils/heuristics.js';

/**
 * Service for generating semantic labels using LLM
 */
export class LabelService {
  constructor() {
    this.openai = null;
    this.model = 'gpt-3.5-turbo';
    this.initialized = false;
    this.rateLimitDelay = 1000; // 1 second between requests
    this.labelCache = new Map(); // Simple in-memory cache
  }

  /**
   * Initialize OpenAI client
   */
  async initialize() {
    if (this.initialized) return;

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found. Labeling will use heuristics only.');
      return;
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.initialized = true;
    console.log('✅ OpenAI LLM initialized for labeling');
  }

  /**
   * Generate labels for a cell using heuristics + LLM
   * @param {object} cell - Cell data
   * @returns {object} Labeling result
   */
  async generateLabels(cell) {
    // First, get heuristic labels
    const heuristicLabels = detectBusinessConcepts(cell);
    
    // If we have clear heuristic labels, use them
    if (heuristicLabels.length > 0) {
      return {
        labels: heuristicLabels,
        confidence: 0.8,
        method: 'heuristic',
        explanation: this.generateExplanation(cell, heuristicLabels)
      };
    }

    // For ambiguous cases, try LLM labeling
    if (this.initialized) {
      try {
        const llmLabels = await this.generateLLMLabels(cell);
        return {
          labels: llmLabels.labels,
          confidence: llmLabels.confidence,
          method: 'llm',
          explanation: llmLabels.explanation
        };
      } catch (error) {
        console.warn('LLM labeling failed, falling back to heuristics:', error.message);
      }
    }

    // Fallback to basic heuristic analysis
    const basicLabels = this.generateBasicLabels(cell);
    return {
      labels: basicLabels,
      confidence: 0.5,
      method: 'basic',
      explanation: this.generateExplanation(cell, basicLabels)
    };
  }

  /**
   * Generate labels using LLM
   * @param {object} cell - Cell data
   * @returns {object} LLM labeling result
   */
  async generateLLMLabels(cell) {
    await this.initialize();

    // Check cache first
    const cacheKey = `labels_${cell.id}`;
    const cached = this.labelCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

      const prompt = this.buildClassificationPrompt(cell);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a business analyst expert. Classify spreadsheet cells into business concepts. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(content);
      
      // Cache the result
      this.labelCache.set(cacheKey, result); // Cache for 1 hour
      
      return result;
    } catch (error) {
      console.error('LLM labeling failed:', error.message);
      throw error;
    }
  }

  /**
   * Build classification prompt for LLM
   * @param {object} cell - Cell data
   * @returns {string} Classification prompt
   */
  buildClassificationPrompt(cell) {
    const parts = [];
    
    parts.push('Classify the following spreadsheet item into 1-3 business concept labels (comma-separated). Return JSON: {labels: [...], confidence: [...], short_explanation: "..."}.');
    parts.push('');
    parts.push('Item:');
    parts.push(`- Sheet: ${cell.sheetName}`);
    
    if (cell.headers?.column) {
      parts.push(`- Column Header: ${cell.headers.column}`);
    }
    if (cell.headers?.row) {
      parts.push(`- Row Header: ${cell.headers.row}`);
    }
    
    if (cell.formula) {
      parts.push(`- Formula: ${cell.formula}`);
    }
    
    if (cell.formattedValue) {
      parts.push(`- Value: ${cell.formattedValue}`);
    }
    
    if (cell.headers?.context?.length > 0) {
      const contextValues = cell.headers.context
        .slice(0, 3)
        .map(c => c.value)
        .join(', ');
      parts.push(`- Context: ${contextValues}`);
    }
    
    parts.push('');
    parts.push('Return only JSON.');
    
    return parts.join('\n');
  }

  /**
   * Generate basic labels using simple heuristics
   * @param {object} cell - Cell data
   * @returns {array} Array of labels
   */
  generateBasicLabels(cell) {
    const labels = [];
    const text = (cell.formattedValue || cell.rawValue || '').toLowerCase();
    const headers = cell.headers || {};
    const headerText = [
      headers.column,
      headers.row,
      ...(headers.context || []).map(c => c.value)
    ].filter(Boolean).join(' ').toLowerCase();

    const allText = `${text} ${headerText}`;

    // Basic pattern matching
    if (allText.includes('revenue') || allText.includes('sales')) {
      labels.push('revenue');
    }
    if (allText.includes('cost') || allText.includes('expense')) {
      labels.push('cost');
    }
    if (allText.includes('profit') || allText.includes('margin')) {
      labels.push('profitability');
    }
    if (allText.includes('%') || allText.includes('percent')) {
      labels.push('percentage');
    }
    if (cell.formula) {
      labels.push('formula');
    }
    if (allText.includes('budget') || allText.includes('actual')) {
      labels.push('budget');
    }

    return labels.length > 0 ? labels : ['data'];
  }

  /**
   * Generate explanation for labels
   * @param {object} cell - Cell data
   * @param {array} labels - Generated labels
   * @returns {string} Explanation text
   */
  generateExplanation(cell, labels) {
    const explanations = [];
    
    if (labels.includes('revenue')) {
      explanations.push('contains revenue-related terms');
    }
    if (labels.includes('cost')) {
      explanations.push('contains cost-related terms');
    }
    if (labels.includes('profitability')) {
      explanations.push('contains profitability indicators');
    }
    if (labels.includes('percentage')) {
      explanations.push('contains percentage calculations');
    }
    if (labels.includes('formula')) {
      explanations.push('contains formula');
    }
    if (labels.includes('budget')) {
      explanations.push('contains budget-related terms');
    }
    
    return explanations.join(', ') || 'general data';
  }

  /**
   * Generate labels for a range
   * @param {object} range - Range data
   * @returns {object} Labeling result
   */
  async generateRangeLabels(range) {
    // Create a synthetic cell for range analysis
    const syntheticCell = {
      id: range.id,
      sheetName: range.sheetName,
      headers: { column: range.header },
      formattedValue: range.sampleValues?.join(', ') || '',
      formula: range.hasFormulas ? 'formula_range' : null
    };

    return await this.generateLabels(syntheticCell);
  }

  /**
   * Generate explanation for search result
   * @param {object} result - Search result
   * @param {string} query - Original query
   * @returns {string} Explanation text
   */
  generateSearchExplanation(result, query) {
    const explanations = [];
    
    // Check for concept matches
    if (result.concept) {
      explanations.push(`concept matches: ${result.concept}`);
    }
    
    // Check for formula patterns
    if (result.formula) {
      if (result.formula.includes('SUM')) {
        explanations.push('contains SUM formula');
      } else if (result.formula.includes('/')) {
        explanations.push('contains division calculation');
      } else if (result.formula.includes('VLOOKUP')) {
        explanations.push('contains lookup formula');
      }
    }
    
    // Check for header matches
    if (result.location?.sheet) {
      const sheetName = result.location.sheet.toLowerCase();
      if (sheetName.includes('profit') || sheetName.includes('p&l')) {
        explanations.push('from profit & loss sheet');
      } else if (sheetName.includes('revenue')) {
        explanations.push('from revenue sheet');
      }
    }
    
    return explanations.join(', ') || 'semantic similarity match';
  }

  /**
   * Get labeling statistics
   * @returns {object} Statistics about labeling
   */
  getStats() {
    const labelKeys = Array.from(this.labelCache.keys());
    
    return {
      total: labelKeys.length,
      method: this.initialized ? 'llm+heuristic' : 'heuristic-only',
      model: this.model
    };
  }
}
