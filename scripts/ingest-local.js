import dotenv from 'dotenv';
import { initializeServices } from '../backend/services/index.js';
import { excelParserService, searchService } from '../backend/services/index.js';

// Load environment variables
dotenv.config();

/**
 * Script to load and index Excel files for local development
 */

/**
 * Load and index Excel files
 */
async function loadAndIndexSheets() {
    console.log('🚀 Starting Excel file ingestion...');
    
    try {
        // Initialize services
        console.log('🔧 Initializing services...');
        await initializeServices();
        
        console.log('📊 Loading default Excel files...');
        const { results, allCells, allRanges } = await excelParserService.loadDefaultFiles();
        
        // Index all loaded data
        if (allCells.length > 0) {
            console.log(`\n📚 Indexing ${allCells.length} cells...`);
            await searchService.addToIndex(allCells);
            console.log('✅ Cells indexed successfully');
        }
        
        if (allRanges.length > 0) {
            console.log(`\n📚 Indexing ${allRanges.length} ranges...`);
            await searchService.addRangesToIndex(allRanges);
            console.log('✅ Ranges indexed successfully');
        }
        
        // Print summary
        console.log('\n📊 INGESTION SUMMARY');
        console.log('====================');
        console.log(`Total Files: ${results.length}`);
        console.log(`Successful: ${results.filter(r => !r.error).length}`);
        console.log(`Failed: ${results.filter(r => r.error).length}`);
        console.log(`Total Cells: ${allCells.length}`);
        console.log(`Total Ranges: ${allRanges.length}`);
        console.log(`Search Index Size: ${searchService.getStats().totalDocuments}`);
        
        // Print file details
        console.log('\n📋 FILE DETAILS');
        console.log('================');
        results.forEach((result, index) => {
            if (result.error) {
                console.log(`${index + 1}. ❌ ${result.fileName || 'Unknown File'} - ${result.error}`);
            } else {
                const sheetCount = result.sheets ? Object.keys(result.sheets).length : 0;
                const cellCount = result.sheets ? Object.values(result.sheets).reduce((sum, sheet) => sum + sheet.cells.length, 0) : 0;
                const rangeCount = result.sheets ? Object.values(result.sheets).reduce((sum, sheet) => sum + sheet.ranges.length, 0) : 0;
                
                console.log(`${index + 1}. ✅ ${result.title || 'Unknown Title'}`);
                console.log(`   Sheets: ${sheetCount}, Cells: ${cellCount}, Ranges: ${rangeCount}`);
            }
        });
        
        console.log('\n✅ Ingestion completed successfully!');
        console.log('🎯 You can now run the evaluation script: npm run evaluate');
        
    } catch (error) {
        console.error('❌ Ingestion failed:', error);
        process.exit(1);
    }
}

/**
 * Test search functionality
 */
async function testSearch() {
    console.log('\n🔍 Testing search functionality...');
    
    const testQueries = [
        'Find all profitability metrics',
        'Show cost-related formulas',
        'What percentage calculations do I have?',
        'Find lookup formulas'
    ];
    
    for (const query of testQueries) {
        try {
            console.log(`\n🔍 Query: "${query}"`);
            
            const semanticResults = await searchService.search(query, { topK: 3 });
            const keywordResults = await searchService.keywordSearch(query, { topK: 3 });
            
            console.log(`   Semantic: ${semanticResults.length} results`);
            console.log(`   Keyword: ${keywordResults.length} results`);
            
            if (semanticResults.length > 0) {
                console.log(`   Top semantic result: ${semanticResults[0].concept} (${Math.round(semanticResults[0].relevance * 100)}%)`);
            }
            
            if (keywordResults.length > 0) {
                console.log(`   Top keyword result: ${keywordResults[0].concept} (${Math.round(keywordResults[0].relevance * 100)}%)`);
            }
            
        } catch (error) {
            console.error(`   ❌ Search failed: ${error.message}`);
        }
    }
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'load';
    
    switch (command) {
        case 'load':
            await loadAndIndexSheets();
            break;
        case 'test':
            await initializeServices();
            await testSearch();
            break;
        case 'full':
            await loadAndIndexSheets();
            await testSearch();
            break;
        default:
            console.log('Usage: npm run ingest [load|test|full]');
            console.log('  load - Load and index spreadsheets (default)');
            console.log('  test - Test search functionality');
            console.log('  full - Load and test');
            break;
    }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { loadAndIndexSheets, testSearch };
