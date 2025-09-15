import OpenAI from 'openai';

/**
 * Service for generating and managing embeddings
 */
export class EmbeddingService {
  constructor() {
    this.openai = null;
    this.model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    this.rateLimitDelay = 1000; // 1 second between requests
    this.initialized = false;
    this.embeddingCache = new Map(); // Simple in-memory cache
  }

  /**
   * Initialize OpenAI client
   */
  async initialize() {
    if (this.initialized) return;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY environment variable.');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.initialized = true;
    console.log('✅ OpenAI API initialized');
  }

  /**
   * Generate embedding for text
   * @param {string} text - Text to embed
   * @param {string} type - Type of content (cell, range, query)
   * @returns {array} Embedding vector
   */
  async generateEmbedding(text, type = 'cell') {
    await this.initialize();

    // Check cache first
    const cacheKey = `embedding_${type}_${this.hashText(text)}`;
    const cached = this.embeddingCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float'
      });

      const embedding = response.data[0].embedding;
      
      // Cache the embedding
      this.embeddingCache.set(cacheKey, embedding);
      
      return embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error.message);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts
   * @param {array} texts - Array of texts to embed
   * @param {string} type - Type of content
   * @returns {array} Array of embedding vectors
   */
  async generateEmbeddings(texts, type = 'cell') {
    await this.initialize();

    const embeddings = [];
    const uncachedTexts = [];
    const uncachedIndices = [];

    // Check cache for each text
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const cacheKey = `embedding_${type}_${this.hashText(text)}`;
      const cached = this.embeddingCache.get(cacheKey);
      
      if (cached) {
        embeddings[i] = cached;
      } else {
        uncachedTexts.push(text);
        uncachedIndices.push(i);
      }
    }

    // Generate embeddings for uncached texts
    if (uncachedTexts.length > 0) {
      try {
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

        const response = await this.openai.embeddings.create({
          model: this.model,
          input: uncachedTexts,
          encoding_format: 'float'
        });

        // Cache and store new embeddings
        for (let i = 0; i < response.data.length; i++) {
          const embedding = response.data[i].embedding;
          const originalIndex = uncachedIndices[i];
          const text = uncachedTexts[i];
          
          embeddings[originalIndex] = embedding;
          
          // Cache the embedding
          const cacheKey = `embedding_${type}_${this.hashText(text)}`;
          this.embeddingCache.set(cacheKey, embedding);
        }
      } catch (error) {
        console.error('Failed to generate embeddings:', error.message);
        throw error;
      }
    }

    return embeddings;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {array} vectorA - First vector
   * @param {array} vectorB - Second vector
   * @returns {number} Cosine similarity score
   */
  calculateCosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Find most similar vectors using cosine similarity
   * @param {array} queryVector - Query vector
   * @param {array} vectors - Array of vectors to search
   * @param {number} topK - Number of top results to return
   * @returns {array} Array of {index, similarity} objects
   */
  findSimilarVectors(queryVector, vectors, topK = 10) {
    const similarities = vectors.map((vector, index) => ({
      index,
      similarity: this.calculateCosineSimilarity(queryVector, vector)
    }));

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, topK);
  }

  /**
   * Hash text for cache key
   * @param {string} text - Text to hash
   * @returns {string} Hash string
   */
  hashText(text) {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get embedding statistics
   * @returns {object} Statistics about embeddings
   */
  getStats() {
    const embeddingKeys = Array.from(this.embeddingCache.keys());
    const cellEmbeddings = embeddingKeys.filter(key => key.includes('_cell_')).length;
    const rangeEmbeddings = embeddingKeys.filter(key => key.includes('_range_')).length;
    const queryEmbeddings = embeddingKeys.filter(key => key.includes('_query_')).length;

    return {
      total: embeddingKeys.length,
      cell: cellEmbeddings,
      range: rangeEmbeddings,
      query: queryEmbeddings,
      model: this.model
    };
  }
}
