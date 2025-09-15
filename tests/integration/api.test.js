import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { initializeServices } from '../../backend/services/index.js';
import searchRoutes from '../../backend/routes/search.js';
import sheetsRoutes from '../../backend/routes/sheets.js';
import statusRoutes from '../../backend/routes/status.js';

// Mock services
vi.mock('../../backend/services/index.js', () => ({
  initializeServices: vi.fn(),
  searchService: {
    search: vi.fn(),
    keywordSearch: vi.fn(),
    getStats: vi.fn(() => ({ totalDocuments: 100 }))
  },
  excelParserService: {
    loadDefaultFiles: vi.fn(),
    parseExcelFile: vi.fn()
  },
  embeddingService: {
    getStats: vi.fn(() => ({ total: 50 }))
  },
  labelService: {
    getStats: vi.fn(() => ({ total: 30 }))
  },
  cacheService: {
    getStats: vi.fn(() => ({ total: 20 }))
  }
}));

describe('API Integration Tests', () => {
  let app;

  beforeAll(async () => {
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/search', searchRoutes);
    app.use('/api/sheets', sheetsRoutes);
    app.use('/api/status', statusRoutes);
  });

  describe('Search API', () => {
    test('POST /api/search should perform semantic search', async () => {
      const { searchService } = await import('../../backend/services/index.js');
      searchService.search.mockResolvedValue([
        {
          id: 'test1',
          concept: 'revenue',
          relevance: 0.85,
          explanation: 'Revenue calculation'
        }
      ]);

      const response = await request(app)
        .post('/api/search')
        .send({
          query: 'revenue metrics',
          mode: 'semantic',
          topK: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.query).toBe('revenue metrics');
      expect(response.body.mode).toBe('semantic');
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].concept).toBe('revenue');
    });

    test('POST /api/search should perform keyword search', async () => {
      const { searchService } = await import('../../backend/services/index.js');
      searchService.keywordSearch.mockResolvedValue([
        {
          id: 'test1',
          concept: 'revenue',
          relevance: 0.75,
          explanation: 'Keyword match'
        }
      ]);

      const response = await request(app)
        .post('/api/search')
        .send({
          query: 'revenue',
          mode: 'keyword',
          topK: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.mode).toBe('keyword');
      expect(response.body.results).toHaveLength(1);
    });

    test('POST /api/search should perform both search modes', async () => {
      const { searchService } = await import('../../backend/services/index.js');
      searchService.search.mockResolvedValue([
        { id: 'test1', concept: 'revenue', relevance: 0.85 }
      ]);
      searchService.keywordSearch.mockResolvedValue([
        { id: 'test2', concept: 'profit', relevance: 0.75 }
      ]);

      const response = await request(app)
        .post('/api/search')
        .send({
          query: 'financial metrics',
          mode: 'both',
          topK: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.mode).toBe('both');
      expect(response.body.results).toHaveProperty('semantic');
      expect(response.body.results).toHaveProperty('keyword');
      expect(response.body.results).toHaveProperty('comparison');
    });

    test('POST /api/search should validate query parameter', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({
          mode: 'semantic',
          topK: 5
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Query is required and must be a string');
    });

    test('POST /api/search should handle invalid mode', async () => {
      const response = await request(app)
        .post('/api/search')
        .send({
          query: 'test',
          mode: 'invalid',
          topK: 5
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid mode. Use "semantic", "keyword", or "both"');
    });

    test('GET /api/search/stats should return search statistics', async () => {
      const response = await request(app)
        .get('/api/search/stats');

      expect(response.status).toBe(200);
      expect(response.body.totalDocuments).toBe(100);
    });

    test('POST /api/search/clear should clear search index', async () => {
      const { searchService } = await import('../../backend/services/index.js');
      searchService.clearIndex = vi.fn();

      const response = await request(app)
        .post('/api/search/clear');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Search index cleared successfully');
      expect(searchService.clearIndex).toHaveBeenCalled();
    });
  });

  describe('Sheets API', () => {
    test('POST /api/sheets/load-default should load default files', async () => {
      const { excelParserService } = await import('../../backend/services/index.js');
      excelParserService.loadDefaultFiles.mockResolvedValue({
        results: [
          {
            fileName: 'test.xlsx',
            success: true,
            sheets: { Sheet1: { cells: [], ranges: [] } }
          }
        ],
        allCells: [],
        allRanges: []
      });

      const response = await request(app)
        .post('/api/sheets/load-default')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Default files loaded successfully');
      expect(response.body.results).toHaveLength(1);
    });

    test('GET /api/sheets/files should return available files', async () => {
      const response = await request(app)
        .get('/api/sheets/files');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('count');
    });
  });

  describe('Status API', () => {
    test('GET /api/status should return system status', async () => {
      const response = await request(app)
        .get('/api/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('environment');
      expect(response.body.system).toBeDefined();
      expect(response.body.services.search.stats).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle search service errors', async () => {
      const { searchService } = await import('../../backend/services/index.js');
      searchService.search.mockRejectedValue(new Error('Search failed'));

      const response = await request(app)
        .post('/api/search')
        .send({
          query: 'test',
          mode: 'semantic'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Search failed');
    });

    test('should handle sheets service errors', async () => {
      const { excelParserService } = await import('../../backend/services/index.js');
      excelParserService.loadDefaultFiles.mockRejectedValue(new Error('Load failed'));

      const response = await request(app)
        .post('/api/sheets/load-default')
        .send({});

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to load default files');
    });
  });
});
