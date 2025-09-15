import { ExcelParserService } from './excel-parser.js';
import { EmbeddingService } from './embedding-service.js';
import { SearchService } from './search-service.js';
import { LabelService } from './label-service.js';
import { CacheService } from './cache-service.js';

// Global service instances
export let excelParserService;
export let embeddingService;
export let searchService;
export let labelService;
export let cacheService;

/**
 * Initialize all services
 */
export async function initializeServices() {
  try {
    console.log('🔧 Initializing services...');
    
    // Initialize cache service first
    cacheService = new CacheService();
    
    // Initialize other services
    excelParserService = new ExcelParserService();
    embeddingService = new EmbeddingService();
    labelService = new LabelService();
    searchService = new SearchService();
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    throw error;
  }
}

export {
  ExcelParserService,
  EmbeddingService,
  SearchService,
  LabelService,
  CacheService
};
