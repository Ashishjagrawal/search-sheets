import express from 'express';
import { searchService } from '../services/index.js';

const router = express.Router();

/**
 * Calculate overlap between two result sets
 * @param {array} results1 - First result set
 * @param {array} results2 - Second result set
 * @returns {object} Overlap statistics
 */
function calculateOverlap(results1, results2) {
  const ids1 = new Set(results1.map(r => r.id));
  const ids2 = new Set(results2.map(r => r.id));
  
  const intersection = new Set([...ids1].filter(id => ids2.has(id)));
  const union = new Set([...ids1, ...ids2]);
  
  return {
    intersection: intersection.size,
    union: union.size,
    jaccard: intersection.size / union.size,
    semanticOnly: ids1.size - intersection.size,
    keywordOnly: ids2.size - intersection.size
  };
}

/**
 * POST /api/search
 * Perform semantic or keyword search
 */
router.post('/', async (req, res) => {
  try {
    const { query, mode = 'semantic', topK = 10, includeRanges = true } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required and must be a string'
      });
    }

    let results = [];

    if (mode === 'semantic') {
      results = await searchService.search(query, { topK, includeRanges });
    } else if (mode === 'keyword') {
      results = await searchService.keywordSearch(query, { topK, includeRanges });
    } else if (mode === 'both') {
      const [semanticResults, keywordResults] = await Promise.all([
        searchService.search(query, { topK, includeRanges }),
        searchService.keywordSearch(query, { topK, includeRanges })
      ]);
      
      results = {
        semantic: semanticResults,
        keyword: keywordResults,
        comparison: {
          semanticCount: semanticResults.length,
          keywordCount: keywordResults.length,
          overlap: calculateOverlap(semanticResults, keywordResults)
        }
      };
    } else {
      return res.status(400).json({
        error: 'Invalid mode. Use "semantic", "keyword", or "both"'
      });
    }

    res.json({
      query,
      mode,
      results,
      timestamp: new Date().toISOString(),
      stats: searchService.getStats()
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * GET /api/search/stats
 * Get search statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = searchService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

/**
 * POST /api/search/clear
 * Clear search index
 */
router.post('/clear', (req, res) => {
  try {
    searchService.clearIndex();
    res.json({
      message: 'Search index cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear error:', error);
    res.status(500).json({
      error: 'Failed to clear index',
      message: error.message
    });
  }
});

export default router;
