import { SearchService } from '../../backend/services/search-service.js';
import { sampleCells, sampleSearchResults } from '../fixtures/sample-cells.js';

// Mock dependencies
vi.mock('../../backend/services/index.js', () => ({
  embeddingService: {
    generateEmbedding: vi.fn(),
    generateEmbeddings: vi.fn(),
    calculateCosineSimilarity: vi.fn()
  },
  labelService: {
    generateLabels: vi.fn(),
    generateRangeLabels: vi.fn(),
    generateSearchExplanation: vi.fn()
  }
}));

describe('SearchService', () => {
  let searchService;
  let mockEmbeddingService;
  let mockLabelService;

  beforeEach(async () => {
    searchService = new SearchService();
    await searchService.initialize();
    
    const { embeddingService, labelService } = await import('../../backend/services/index.js');
    mockEmbeddingService = embeddingService;
    mockLabelService = labelService;
    
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with empty index', () => {
      const newService = new SearchService();
      expect(newService.index).toBeInstanceOf(Map);
      expect(newService.initialized).toBe(false);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      const newService = new SearchService();
      await newService.initialize();
      expect(newService.initialized).toBe(true);
    });

    test('should not reinitialize if already initialized', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      await searchService.initialize();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('addToIndex', () => {
    test('should add documents to index', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockLabelService.generateLabels.mockResolvedValue({
        labels: ['revenue'],
        confidence: [0.9],
        method: 'heuristic',
        explanation: 'Revenue cell'
      });

      await searchService.addToIndex(sampleCells);

      expect(searchService.index.size).toBe(sampleCells.length);
      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledTimes(sampleCells.length);
      expect(mockLabelService.generateLabels).toHaveBeenCalledTimes(sampleCells.length);
    });

    test('should handle empty document array', async () => {
      await searchService.addToIndex([]);
      expect(searchService.index.size).toBe(0);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockLabelService.generateLabels.mockResolvedValue({
        labels: ['revenue'],
        confidence: [0.9],
        method: 'heuristic',
        explanation: 'Revenue cell'
      });
      await searchService.addToIndex(sampleCells);
    });

    test('should perform semantic search', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);

      const results = await searchService.search('revenue', { topK: 5 });

      expect(Array.isArray(results)).toBe(true);
      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith('revenue', 'query');
    });

    test('should return results even with low similarity', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockEmbeddingService.calculateCosineSimilarity.mockReturnValue(0.00001); // Very low similarity

      const results = await searchService.search('nonexistent', { topK: 5 });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    test('should respect topK parameter', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);

      const results = await searchService.search('revenue', { topK: 1 });

      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('keywordSearch', () => {
    beforeEach(async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockLabelService.generateLabels.mockResolvedValue({
        labels: ['revenue'],
        confidence: [0.9],
        method: 'heuristic',
        explanation: 'Revenue cell'
      });
      await searchService.addToIndex(sampleCells);
    });

    test('should perform keyword search', async () => {
      const results = await searchService.keywordSearch('revenue', { topK: 5 });

      expect(Array.isArray(results)).toBe(true);
    });

    test('should return empty array for no keyword matches', async () => {
      const results = await searchService.keywordSearch('nonexistent', { topK: 5 });

      expect(results).toEqual([]);
    });
  });

  describe('addRangesToIndex', () => {
    test('should add ranges to index', async () => {
      const ranges = [
        {
          id: 'range1',
          description: 'Revenue range',
          text_for_embedding: 'Revenue data range'
        }
      ];

      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockLabelService.generateRangeLabels.mockResolvedValue({
        labels: ['range'],
        confidence: [0.8],
        method: 'heuristic',
        explanation: 'Data range'
      });

      await searchService.addRangesToIndex(ranges);

      expect(searchService.index.size).toBe(ranges.length);
    });
  });

  describe('getStats', () => {
    test('should return correct statistics', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockLabelService.generateLabels.mockResolvedValue({
        labels: ['revenue'],
        confidence: [0.9],
        method: 'heuristic',
        explanation: 'Revenue cell'
      });

      await searchService.addToIndex(sampleCells);

      const stats = searchService.getStats();

      expect(stats).toHaveProperty('totalDocuments', sampleCells.length);
      expect(stats).toHaveProperty('cells', sampleCells.length);
      expect(stats).toHaveProperty('ranges', 0);
    });
  });

  describe('clearIndex', () => {
    test('should clear the index', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockLabelService.generateLabels.mockResolvedValue({
        labels: ['revenue'],
        confidence: [0.9],
        method: 'heuristic',
        explanation: 'Revenue cell'
      });

      await searchService.addToIndex(sampleCells);
      expect(searchService.index.size).toBe(sampleCells.length);

      searchService.clearIndex();
      expect(searchService.index.size).toBe(0);
    });
  });
});
