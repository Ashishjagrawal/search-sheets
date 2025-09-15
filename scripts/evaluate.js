import { initializeServices } from '../backend/services/index.js';
import { searchService } from '../backend/services/index.js';
import fs from 'fs';
import path from 'path';

/**
 * Evaluation script for semantic search vs keyword search
 */

// Test queries with expected concepts
const TEST_QUERIES = [
    {
        id: 'profitability_1',
        query: 'Find all profitability metrics',
        expectedConcepts: ['profitability', 'profit', 'margin'],
        category: 'profitability'
    },
    {
        id: 'cost_1',
        query: 'Show cost-related formulas',
        expectedConcepts: ['cost', 'expense'],
        category: 'cost'
    },
    {
        id: 'margin_1',
        query: 'Where are my margin analyses?',
        expectedConcepts: ['margin', 'profitability'],
        category: 'profitability'
    },
    {
        id: 'percentage_1',
        query: 'What percentage calculations do I have?',
        expectedConcepts: ['percentage', 'ratio'],
        category: 'calculation'
    },
    {
        id: 'average_1',
        query: 'Find average formulas',
        expectedConcepts: ['average', 'aggregation'],
        category: 'aggregation'
    },
    {
        id: 'lookup_1',
        query: 'Show lookup formulas',
        expectedConcepts: ['lookup', 'vlookup'],
        category: 'lookup'
    },
    {
        id: 'budget_1',
        query: 'Budget vs actual',
        expectedConcepts: ['budget', 'actual'],
        category: 'budget'
    },
    {
        id: 'time_series_1',
        query: 'Time series data monthly',
        expectedConcepts: ['time_series', 'monthly'],
        category: 'time_series'
    },
    {
        id: 'conditional_1',
        query: 'Find conditional calculations',
        expectedConcepts: ['conditional', 'if'],
        category: 'conditional'
    },
    {
        id: 'growth_1',
        query: 'Show CAGR or growth rate calculations',
        expectedConcepts: ['growth', 'cagr'],
        category: 'growth'
    },
    {
        id: 'roi_1',
        query: 'Find marketing ROI or ROI calculations',
        expectedConcepts: ['roi', 'return'],
        category: 'financial_ratio'
    },
    {
        id: 'sales_1',
        query: 'Show sales totals',
        expectedConcepts: ['sales', 'revenue', 'total'],
        category: 'revenue'
    },
    {
        id: 'forecast_1',
        query: 'Find forecast or projection formulas',
        expectedConcepts: ['forecast', 'projection'],
        category: 'budget'
    },
    {
        id: 'division_1',
        query: 'Find division-based percentage calculations',
        expectedConcepts: ['percentage', 'division'],
        category: 'calculation'
    },
    {
        id: 'sumif_1',
        query: 'Find SUMIF / COUNTIF usages',
        expectedConcepts: ['sumif', 'countif', 'conditional'],
        category: 'conditional'
    },
    {
        id: 'revenue_1',
        query: 'Find all revenue calculations',
        expectedConcepts: ['revenue', 'sales'],
        category: 'revenue'
    },
    {
        id: 'expense_1',
        query: 'Show operating expenses',
        expectedConcepts: ['expense', 'operating'],
        category: 'cost'
    },
    {
        id: 'ratio_1',
        query: 'Find financial ratios',
        expectedConcepts: ['ratio', 'financial'],
        category: 'financial_ratio'
    },
    {
        id: 'variance_1',
        query: 'Show budget variance calculations',
        expectedConcepts: ['variance', 'budget'],
        category: 'budget'
    },
    {
        id: 'aggregation_1',
        query: 'Find SUM and COUNT formulas',
        expectedConcepts: ['sum', 'count', 'aggregation'],
        category: 'aggregation'
    }
];

/**
 * Calculate precision@k for a set of results
 * @param {array} results - Search results
 * @param {array} expectedConcepts - Expected concepts
 * @param {number} k - Top k results to consider
 * @returns {number} Precision@k score
 */
function calculatePrecisionAtK(results, expectedConcepts, k) {
    const topK = results.slice(0, k);
    let relevantCount = 0;
    
    for (const result of topK) {
        // Check if any expected concept matches result concepts or labels
        const resultConcepts = [
            ...(result.labels || []),
            result.concept?.toLowerCase() || '',
            ...(result.reasons || [])
        ].map(c => c.toLowerCase());
        
        const hasMatch = expectedConcepts.some(expected => 
            resultConcepts.some(result => result.includes(expected.toLowerCase()))
        );
        
        if (hasMatch) {
            relevantCount++;
        }
    }
    
    return relevantCount / Math.min(k, results.length);
}

/**
 * Calculate recall@k for a set of results
 * @param {array} results - Search results
 * @param {array} expectedConcepts - Expected concepts
 * @param {number} k - Top k results to consider
 * @returns {number} Recall@k score
 */
function calculateRecallAtK(results, expectedConcepts, k) {
    const topK = results.slice(0, k);
    const foundConcepts = new Set();
    
    for (const result of topK) {
        const resultConcepts = [
            ...(result.labels || []),
            result.concept?.toLowerCase() || ''
        ].map(c => c.toLowerCase());
        
        expectedConcepts.forEach(expected => {
            if (resultConcepts.some(result => result.includes(expected.toLowerCase()))) {
                foundConcepts.add(expected);
            }
        });
    }
    
    return foundConcepts.size / expectedConcepts.length;
}

/**
 * Calculate F1 score
 * @param {number} precision - Precision score
 * @param {number} recall - Recall score
 * @returns {number} F1 score
 */
function calculateF1Score(precision, recall) {
    if (precision + recall === 0) return 0;
    return 2 * (precision * recall) / (precision + recall);
}

/**
 * Run evaluation for a single query
 * @param {object} testQuery - Test query object
 * @returns {object} Evaluation results
 */
async function evaluateQuery(testQuery) {
    console.log(`\n🔍 Evaluating: "${testQuery.query}"`);
    
    try {
        // Run semantic search
        const semanticResults = await searchService.search(testQuery.query, { topK: 10 });
        
        // Run keyword search
        const keywordResults = await searchService.keywordSearch(testQuery.query, { topK: 10 });
        
        // Calculate metrics for both
        const semanticMetrics = {
            p1: calculatePrecisionAtK(semanticResults, testQuery.expectedConcepts, 1),
            p3: calculatePrecisionAtK(semanticResults, testQuery.expectedConcepts, 3),
            p5: calculatePrecisionAtK(semanticResults, testQuery.expectedConcepts, 5),
            r1: calculateRecallAtK(semanticResults, testQuery.expectedConcepts, 1),
            r3: calculateRecallAtK(semanticResults, testQuery.expectedConcepts, 3),
            r5: calculateRecallAtK(semanticResults, testQuery.expectedConcepts, 5)
        };
        
        const keywordMetrics = {
            p1: calculatePrecisionAtK(keywordResults, testQuery.expectedConcepts, 1),
            p3: calculatePrecisionAtK(keywordResults, testQuery.expectedConcepts, 3),
            p5: calculatePrecisionAtK(keywordResults, testQuery.expectedConcepts, 5),
            r1: calculateRecallAtK(keywordResults, testQuery.expectedConcepts, 1),
            r3: calculateRecallAtK(keywordResults, testQuery.expectedConcepts, 3),
            r5: calculateRecallAtK(keywordResults, testQuery.expectedConcepts, 5)
        };
        
        // Calculate F1 scores
        semanticMetrics.f1_1 = calculateF1Score(semanticMetrics.p1, semanticMetrics.r1);
        semanticMetrics.f1_3 = calculateF1Score(semanticMetrics.p3, semanticMetrics.r3);
        semanticMetrics.f1_5 = calculateF1Score(semanticMetrics.p5, semanticMetrics.r5);
        
        keywordMetrics.f1_1 = calculateF1Score(keywordMetrics.p1, keywordMetrics.r1);
        keywordMetrics.f1_3 = calculateF1Score(keywordMetrics.p3, keywordMetrics.r3);
        keywordMetrics.f1_5 = calculateF1Score(keywordMetrics.p5, keywordMetrics.r5);
        
        return {
            query: testQuery,
            semantic: {
                results: semanticResults,
                metrics: semanticMetrics
            },
            keyword: {
                results: keywordResults,
                metrics: keywordMetrics
            },
            improvement: {
                p1: semanticMetrics.p1 - keywordMetrics.p1,
                p3: semanticMetrics.p3 - keywordMetrics.p3,
                p5: semanticMetrics.p5 - keywordMetrics.p5,
                f1_1: semanticMetrics.f1_1 - keywordMetrics.f1_1,
                f1_3: semanticMetrics.f1_3 - keywordMetrics.f1_3,
                f1_5: semanticMetrics.f1_5 - keywordMetrics.f1_5
            }
        };
        
    } catch (error) {
        console.error(`❌ Error evaluating query "${testQuery.query}":`, error.message);
        return {
            query: testQuery,
            error: error.message,
            semantic: null,
            keyword: null,
            improvement: null
        };
    }
}

/**
 * Generate evaluation report
 * @param {array} results - Evaluation results
 * @returns {object} Summary report
 */
function generateReport(results) {
    const validResults = results.filter(r => !r.error);
    const totalQueries = results.length;
    const successfulQueries = validResults.length;
    
    if (validResults.length === 0) {
        return {
            summary: {
                totalQueries,
                successfulQueries: 0,
                errorRate: 1.0
            },
            error: 'No successful evaluations'
        };
    }
    
    // Calculate average metrics
    const avgSemantic = {
        p1: validResults.reduce((sum, r) => sum + r.semantic.metrics.p1, 0) / validResults.length,
        p3: validResults.reduce((sum, r) => sum + r.semantic.metrics.p3, 0) / validResults.length,
        p5: validResults.reduce((sum, r) => sum + r.semantic.metrics.p5, 0) / validResults.length,
        r1: validResults.reduce((sum, r) => sum + r.semantic.metrics.r1, 0) / validResults.length,
        r3: validResults.reduce((sum, r) => sum + r.semantic.metrics.r3, 0) / validResults.length,
        r5: validResults.reduce((sum, r) => sum + r.semantic.metrics.r5, 0) / validResults.length,
        f1_1: validResults.reduce((sum, r) => sum + r.semantic.metrics.f1_1, 0) / validResults.length,
        f1_3: validResults.reduce((sum, r) => sum + r.semantic.metrics.f1_3, 0) / validResults.length,
        f1_5: validResults.reduce((sum, r) => sum + r.semantic.metrics.f1_5, 0) / validResults.length
    };
    
    const avgKeyword = {
        p1: validResults.reduce((sum, r) => sum + r.keyword.metrics.p1, 0) / validResults.length,
        p3: validResults.reduce((sum, r) => sum + r.keyword.metrics.p3, 0) / validResults.length,
        p5: validResults.reduce((sum, r) => sum + r.keyword.metrics.p5, 0) / validResults.length,
        r1: validResults.reduce((sum, r) => sum + r.keyword.metrics.r1, 0) / validResults.length,
        r3: validResults.reduce((sum, r) => sum + r.keyword.metrics.r3, 0) / validResults.length,
        r5: validResults.reduce((sum, r) => sum + r.keyword.metrics.r5, 0) / validResults.length,
        f1_1: validResults.reduce((sum, r) => sum + r.keyword.metrics.f1_1, 0) / validResults.length,
        f1_3: validResults.reduce((sum, r) => sum + r.keyword.metrics.f1_3, 0) / validResults.length,
        f1_5: validResults.reduce((sum, r) => sum + r.keyword.metrics.f1_5, 0) / validResults.length
    };
    
    const avgImprovement = {
        p1: avgSemantic.p1 - avgKeyword.p1,
        p3: avgSemantic.p3 - avgKeyword.p3,
        p5: avgSemantic.p5 - avgKeyword.p5,
        f1_1: avgSemantic.f1_1 - avgKeyword.f1_1,
        f1_3: avgSemantic.f1_3 - avgKeyword.f1_3,
        f1_5: avgSemantic.f1_5 - avgKeyword.f1_5
    };
    
    // Calculate category performance
    const categories = {};
    validResults.forEach(result => {
        const category = result.query.category;
        if (!categories[category]) {
            categories[category] = {
                count: 0,
                semantic: { p1: 0, p3: 0, p5: 0, f1_1: 0, f1_3: 0, f1_5: 0 },
                keyword: { p1: 0, p3: 0, p5: 0, f1_1: 0, f1_3: 0, f1_5: 0 }
            };
        }
        
        categories[category].count++;
        Object.keys(categories[category].semantic).forEach(metric => {
            categories[category].semantic[metric] += result.semantic.metrics[metric];
            categories[category].keyword[metric] += result.keyword.metrics[metric];
        });
    });
    
    // Calculate averages for each category
    Object.keys(categories).forEach(category => {
        const count = categories[category].count;
        Object.keys(categories[category].semantic).forEach(metric => {
            categories[category].semantic[metric] /= count;
            categories[category].keyword[metric] /= count;
        });
    });
    
    return {
        summary: {
            totalQueries,
            successfulQueries,
            errorRate: (totalQueries - successfulQueries) / totalQueries,
            timestamp: new Date().toISOString()
        },
        averageMetrics: {
            semantic: avgSemantic,
            keyword: avgKeyword,
            improvement: avgImprovement
        },
        categoryPerformance: categories,
        detailedResults: results
    };
}

/**
 * Save results to files
 * @param {object} report - Evaluation report
 */
async function saveResults(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsDir = path.join(process.cwd(), 'docs');
    
    // Ensure docs directory exists
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // Save JSON report
    const jsonPath = path.join(resultsDir, `evaluation-report-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report saved: ${jsonPath}`);
    
    // Save CSV summary
    const csvPath = path.join(resultsDir, `evaluation-summary-${timestamp}.csv`);
    const csvContent = generateCSV(report);
    fs.writeFileSync(csvPath, csvContent);
    console.log(`📊 CSV summary saved: ${csvPath}`);
    
    // Save detailed results
    const detailedPath = path.join(resultsDir, `evaluation-detailed-${timestamp}.json`);
    fs.writeFileSync(detailedPath, JSON.stringify(report.detailedResults, null, 2));
    console.log(`📋 Detailed results saved: ${detailedPath}`);
}

/**
 * Generate CSV content
 * @param {object} report - Evaluation report
 * @returns {string} CSV content
 */
function generateCSV(report) {
    const headers = [
        'Query ID',
        'Query',
        'Category',
        'Semantic P@1',
        'Semantic P@3',
        'Semantic P@5',
        'Semantic F1@1',
        'Semantic F1@3',
        'Semantic F1@5',
        'Keyword P@1',
        'Keyword P@3',
        'Keyword P@5',
        'Keyword F1@1',
        'Keyword F1@3',
        'Keyword F1@5',
        'Improvement P@1',
        'Improvement P@3',
        'Improvement P@5',
        'Improvement F1@1',
        'Improvement F1@3',
        'Improvement F1@5'
    ];
    
    const rows = report.detailedResults.map(result => {
        if (result.error) {
            return [
                result.query.id,
                result.query.query,
                result.query.category,
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR',
                'ERROR'
            ];
        }
        
        return [
            result.query.id,
            result.query.query,
            result.query.category,
            result.semantic.metrics.p1.toFixed(3),
            result.semantic.metrics.p3.toFixed(3),
            result.semantic.metrics.p5.toFixed(3),
            result.semantic.metrics.f1_1.toFixed(3),
            result.semantic.metrics.f1_3.toFixed(3),
            result.semantic.metrics.f1_5.toFixed(3),
            result.keyword.metrics.p1.toFixed(3),
            result.keyword.metrics.p3.toFixed(3),
            result.keyword.metrics.p5.toFixed(3),
            result.keyword.metrics.f1_1.toFixed(3),
            result.keyword.metrics.f1_3.toFixed(3),
            result.keyword.metrics.f1_5.toFixed(3),
            result.improvement.p1.toFixed(3),
            result.improvement.p3.toFixed(3),
            result.improvement.p5.toFixed(3),
            result.improvement.f1_1.toFixed(3),
            result.improvement.f1_3.toFixed(3),
            result.improvement.f1_5.toFixed(3)
        ];
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Main evaluation function
 */
async function main() {
    console.log('🚀 Starting Semantic Search Evaluation');
    console.log('=====================================');
    
    try {
        // Initialize services
        console.log('🔧 Initializing services...');
        await initializeServices();
        
        // Check if search index has data
        const stats = searchService.getStats();
        if (stats.totalDocuments === 0) {
            console.log('⚠️  No documents in search index. Please load spreadsheets first.');
            console.log('   Run: npm run ingest');
            process.exit(1);
        }
        
        console.log(`📚 Search index contains ${stats.totalDocuments} documents`);
        
        // Run evaluation
        console.log(`\n🔍 Running evaluation on ${TEST_QUERIES.length} test queries...`);
        const results = [];
        
        for (const testQuery of TEST_QUERIES) {
            const result = await evaluateQuery(testQuery);
            results.push(result);
            
            if (result.error) {
                console.log(`❌ ${testQuery.id}: ${result.error}`);
            } else {
                console.log(`✅ ${testQuery.id}: P@1=${result.semantic.metrics.p1.toFixed(2)} (semantic) vs ${result.keyword.metrics.p1.toFixed(2)} (keyword)`);
            }
        }
        
        // Generate report
        console.log('\n📊 Generating evaluation report...');
        const report = generateReport(results);
        
        // Print summary
        console.log('\n📈 EVALUATION SUMMARY');
        console.log('====================');
        console.log(`Total Queries: ${report.summary.totalQueries}`);
        console.log(`Successful: ${report.summary.successfulQueries}`);
        console.log(`Error Rate: ${(report.summary.errorRate * 100).toFixed(1)}%`);
        
        if (report.averageMetrics) {
            console.log('\n📊 AVERAGE METRICS');
            console.log('==================');
            console.log('Metric          | Semantic | Keyword | Improvement');
            console.log('----------------|----------|---------|------------');
            console.log(`Precision@1     | ${report.averageMetrics.semantic.p1.toFixed(3)}    | ${report.averageMetrics.keyword.p1.toFixed(3)}    | ${report.averageMetrics.improvement.p1.toFixed(3)}`);
            console.log(`Precision@3     | ${report.averageMetrics.semantic.p3.toFixed(3)}    | ${report.averageMetrics.keyword.p3.toFixed(3)}    | ${report.averageMetrics.improvement.p3.toFixed(3)}`);
            console.log(`Precision@5     | ${report.averageMetrics.semantic.p5.toFixed(3)}    | ${report.averageMetrics.keyword.p5.toFixed(3)}    | ${report.averageMetrics.improvement.p5.toFixed(3)}`);
            console.log(`F1-Score@1      | ${report.averageMetrics.semantic.f1_1.toFixed(3)}    | ${report.averageMetrics.keyword.f1_1.toFixed(3)}    | ${report.averageMetrics.improvement.f1_1.toFixed(3)}`);
            console.log(`F1-Score@3      | ${report.averageMetrics.semantic.f1_3.toFixed(3)}    | ${report.averageMetrics.keyword.f1_3.toFixed(3)}    | ${report.averageMetrics.improvement.f1_3.toFixed(3)}`);
            console.log(`F1-Score@5      | ${report.averageMetrics.semantic.f1_5.toFixed(3)}    | ${report.averageMetrics.keyword.f1_5.toFixed(3)}    | ${report.averageMetrics.improvement.f1_5.toFixed(3)}`);
        }
        
        // Save results
        await saveResults(report);
        
        console.log('\n✅ Evaluation completed successfully!');
        
    } catch (error) {
        console.error('❌ Evaluation failed:', error);
        process.exit(1);
    }
}

// Run evaluation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { TEST_QUERIES, evaluateQuery, generateReport };
