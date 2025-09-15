#!/usr/bin/env node

/**
 * Basic test script to verify core functionality
 */

import { initializeServices } from './backend/services/index.js';
import { excelParserService, searchService } from './backend/services/index.js';

async function runBasicTests() {
  console.log('🧪 Running basic functionality tests...\n');

  try {
    // Test 1: Service initialization
    console.log('1. Testing service initialization...');
    await initializeServices();
    console.log('✅ Services initialized successfully\n');

    // Test 2: Excel file loading
    console.log('2. Testing Excel file loading...');
    const { results, allCells, allRanges } = await excelParserService.loadDefaultFiles();
    console.log(`✅ Loaded ${results.length} files with ${allCells.length} cells and ${allRanges.length} ranges\n`);

    // Test 3: Search indexing
    console.log('3. Testing search indexing...');
    if (allCells.length > 0) {
      await searchService.addToIndex(allCells);
      console.log(`✅ Indexed ${allCells.length} cells\n`);
    }

    // Test 4: Search functionality
    console.log('4. Testing search functionality...');
    const searchResults = await searchService.search('revenue', { topK: 3 });
    console.log(`✅ Search returned ${searchResults.length} results\n`);

    // Test 5: System stats
    console.log('5. Testing system statistics...');
    const stats = searchService.getStats();
    console.log(`✅ Search index contains ${stats.totalDocuments} documents\n`);

    console.log('🎉 All basic tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBasicTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runBasicTests };
