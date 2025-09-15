import NodeCache from 'node-cache';

/**
 * Cache service for managing in-memory storage
 */
export class CacheService {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: parseInt(process.env.CACHE_TTL_SECONDS) || 1800, // 30 minutes default
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false // Don't clone objects for better performance
    });
    
    this.embeddingCache = new NodeCache({
      stdTTL: parseInt(process.env.EMBEDDING_CACHE_TTL_SECONDS) || 86400, // 24 hours default
      checkperiod: 600, // Check every 10 minutes
      useClones: false
    });
    
    console.log('📦 Cache service initialized');
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @param {string} type - Cache type ('default' or 'embedding')
   * @returns {any} Cached value or undefined
   */
  get(key, type = 'default') {
    const cache = type === 'embedding' ? this.embeddingCache : this.cache;
    return cache.get(key);
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   * @param {string} type - Cache type ('default' or 'embedding')
   */
  set(key, value, ttl = null, type = 'default') {
    const cache = type === 'embedding' ? this.embeddingCache : this.cache;
    if (ttl) {
      cache.set(key, value, ttl);
    } else {
      cache.set(key, value);
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @param {string} type - Cache type ('default' or 'embedding')
   */
  del(key, type = 'default') {
    const cache = type === 'embedding' ? this.embeddingCache : this.cache;
    cache.del(key);
  }

  /**
   * Clear all cache
   * @param {string} type - Cache type ('default', 'embedding', or 'all')
   */
  clear(type = 'all') {
    if (type === 'all' || type === 'default') {
      this.cache.flushAll();
    }
    if (type === 'all' || type === 'embedding') {
      this.embeddingCache.flushAll();
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    return {
      default: {
        keys: this.cache.keys().length,
        hits: this.cache.getStats().hits,
        misses: this.cache.getStats().misses,
        ksize: this.cache.getStats().ksize,
        vsize: this.cache.getStats().vsize
      },
      embedding: {
        keys: this.embeddingCache.keys().length,
        hits: this.embeddingCache.getStats().hits,
        misses: this.embeddingCache.getStats().misses,
        ksize: this.embeddingCache.getStats().ksize,
        vsize: this.embeddingCache.getStats().vsize
      }
    };
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @param {string} type - Cache type ('default' or 'embedding')
   * @returns {boolean} True if key exists
   */
  has(key, type = 'default') {
    const cache = type === 'embedding' ? this.embeddingCache : this.cache;
    return cache.has(key);
  }

  /**
   * Get all keys from cache
   * @param {string} type - Cache type ('default' or 'embedding')
   * @returns {string[]} Array of cache keys
   */
  keys(type = 'default') {
    const cache = type === 'embedding' ? this.embeddingCache : this.cache;
    return cache.keys();
  }
}
