import express from 'express';
import { cacheService, searchService, excelParserService, embeddingService, labelService } from '../services/index.js';

const router = express.Router();

/**
 * GET /api/status
 * Get system status and statistics
 */
router.get('/', (req, res) => {
  try {
    const status = {
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      },
      services: {
        excelParser: {
          initialized: excelParserService?.initialized || false,
          status: excelParserService?.initialized ? 'ready' : 'not initialized'
        },
        search: {
          initialized: searchService?.initialized || false,
          status: searchService?.initialized ? 'ready' : 'not initialized',
          stats: searchService?.getStats() || {}
        },
        embedding: {
          initialized: embeddingService?.initialized || false,
          status: embeddingService?.initialized ? 'ready' : 'not initialized',
          stats: embeddingService?.getStats() || {}
        },
        labeling: {
          initialized: labelService?.initialized || false,
          status: labelService?.initialized ? 'ready' : 'not initialized',
          stats: labelService?.getStats() || {}
        },
        cache: {
          status: 'ready',
          stats: cacheService?.getStats() || {}
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasExcelFiles: true,
      },
      timestamp: new Date().toISOString()
    };

    res.json(status);
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({
      error: 'Failed to get status',
      message: error.message
    });
  }
});

/**
 * GET /api/status/health
 * Simple health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/status/cache
 * Get cache statistics
 */
router.get('/cache', (req, res) => {
  try {
    const stats = cacheService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      error: 'Failed to get cache stats',
      message: error.message
    });
  }
});

/**
 * POST /api/status/cache/clear
 * Clear cache
 */
router.post('/cache/clear', (req, res) => {
  try {
    const { type = 'all' } = req.body;
    cacheService.clear(type);
    
    res.json({
      message: `Cache cleared (${type})`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

/**
 * GET /api/status/search
 * Get search statistics
 */
router.get('/search', (req, res) => {
  try {
    const stats = searchService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Search stats error:', error);
    res.status(500).json({
      error: 'Failed to get search stats',
      message: error.message
    });
  }
});

/**
 * GET /api/status/embeddings
 * Get embedding statistics
 */
router.get('/embeddings', (req, res) => {
  try {
    const stats = embeddingService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Embedding stats error:', error);
    res.status(500).json({
      error: 'Failed to get embedding stats',
      message: error.message
    });
  }
});

export default router;
