import { EmbeddingService } from '../../backend/services/embedding-service.js';
import { vi } from 'vitest';

// Mock OpenAI
const mockOpenAI = {
  embeddings: {
    create: vi.fn().mockResolvedValue({
      data: [{ embedding: Array(1536).fill(0.123) }]
    })
  }
};

vi.mock('openai', () => {
  return {
    __esModule: true,
    default: vi.fn().mockImplementation(() => mockOpenAI)
  };
});

describe('EmbeddingService', () => {
  let embeddingService;

  beforeEach(async () => {
    embeddingService = new EmbeddingService();
    vi.clearAllMocks();
    
    // Reset the mock to default behavior
    mockOpenAI.embeddings.create.mockResolvedValue({
      data: [{ embedding: Array(1536).fill(0.123) }]
    });
  });

  describe('constructor', () => {
    test('should initialize with correct defaults', () => {
      expect(embeddingService.model).toBe('text-embedding-3-small');
      expect(embeddingService.rateLimitDelay).toBe(1000);
      expect(embeddingService.initialized).toBe(false);
      expect(embeddingService.embeddingCache).toBeInstanceOf(Map);
    });
  });

  describe('initialize', () => {
    test('should initialize with valid API key', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      await embeddingService.initialize();
      
      expect(embeddingService.initialized).toBe(true);
      expect(embeddingService.openai).toBeDefined();
    });

    test('should handle missing API key', async () => {
      delete process.env.OPENAI_API_KEY;
      
      await expect(embeddingService.initialize()).rejects.toThrow('OpenAI API key not found');
      expect(embeddingService.initialized).toBe(false);
      expect(embeddingService.openai).toBeNull();
    });
  });

  describe('generateEmbedding', () => {
    beforeEach(async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      await embeddingService.initialize();
    });

    test('should generate embedding successfully', async () => {
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3] }]
      };
      
      mockOpenAI.embeddings.create.mockResolvedValue(mockResponse);

      const result = await embeddingService.generateEmbedding('test text');

      expect(result).toEqual([0.1, 0.2, 0.3]);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'test text',
        encoding_format: 'float'
      });
    });

    test('should use cached embedding if available', async () => {
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3] }]
      };
      
      mockOpenAI.embeddings.create.mockResolvedValue(mockResponse);

      // First call
      await embeddingService.generateEmbedding('test text');
      
      // Second call should use cache
      const result = await embeddingService.generateEmbedding('test text');

      expect(result).toEqual([0.1, 0.2, 0.3]);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(1);
    });

    test('should handle API errors', async () => {
      mockOpenAI.embeddings.create.mockRejectedValue(new Error('API Error'));

      await expect(embeddingService.generateEmbedding('test text'))
        .rejects.toThrow('API Error');
    });

    test('should return null when OpenAI is not initialized', async () => {
      delete process.env.OPENAI_API_KEY;
      embeddingService = new EmbeddingService();
      
      await expect(embeddingService.generateEmbedding('test text'))
        .rejects.toThrow('OpenAI API key not found');
    });
  });

  describe('generateEmbeddings', () => {
    beforeEach(async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      await embeddingService.initialize();
    });

    test('should generate multiple embeddings', async () => {
      const mockResponse = {
        data: [
          { embedding: Array(1536).fill(0.123) },
          { embedding: Array(1536).fill(0.123) }
        ]
      };
      
      mockOpenAI.embeddings.create.mockResolvedValue(mockResponse);

      const result = await embeddingService.generateEmbeddings(['text1', 'text2']);

      expect(result).toEqual([Array(1536).fill(0.123), Array(1536).fill(0.123)]);
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: ['text1', 'text2'],
        encoding_format: 'float'
      });
    });

    test('should handle mixed cached and uncached embeddings', async () => {
      // First call to cache one embedding
      await embeddingService.generateEmbedding('cached text');

      // Mock response for the second call (only for 'new text')
      const mockResponse = {
        data: [{ embedding: Array(1536).fill(0.456) }]
      };
      
      mockOpenAI.embeddings.create.mockResolvedValue(mockResponse);

      // Second call with mixed texts
      const result = await embeddingService.generateEmbeddings(['cached text', 'new text']);

      expect(result[0]).toEqual(Array(1536).fill(0.123)); // Cached (from first call)
      expect(result[1]).toEqual(Array(1536).fill(0.456)); // New (from second call)
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(2); // Once for each call
    });
  });

  describe('hashText', () => {
    test('should generate consistent hashes', () => {
      const text = 'test text';
      const hash1 = embeddingService.hashText(text);
      const hash2 = embeddingService.hashText(text);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
    });

    test('should generate different hashes for different texts', () => {
      const hash1 = embeddingService.hashText('text1');
      const hash2 = embeddingService.hashText('text2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('getStats', () => {
    test('should return correct statistics', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      await embeddingService.initialize();

      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3] }]
      };
      
      mockOpenAI.embeddings.create.mockResolvedValue(mockResponse);

      await embeddingService.generateEmbedding('test1', 'cell');
      await embeddingService.generateEmbedding('test2', 'query');

      const stats = embeddingService.getStats();

      expect(stats.total).toBe(2);
      expect(stats.cell).toBe(1);
      expect(stats.query).toBe(1);
      expect(stats.model).toBe('text-embedding-3-small');
    });
  });
});
