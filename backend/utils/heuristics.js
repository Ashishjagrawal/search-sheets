/**
 * Heuristic functions for detecting patterns in spreadsheet data
 */

/**
 * Detect header rows in spreadsheet data
 * @param {array} values - 2D array of cell values
 * @param {object} options - Detection options
 * @returns {object} Header information
 */
export function detectHeaders(values, options = {}) {
  const { headerRows = 1, minTextCells = 3 } = options;
  
  if (!values || values.length === 0) {
    return {
      rowHeaders: [],
      columnHeaders: [],
      headerRows: []
    };
  }

  const rowHeaders = [];
  const columnHeaders = [];
  const detectedHeaderRows = [];

  // Detect row headers (first column)
  for (let i = 0; i < Math.min(headerRows, values.length); i++) {
    const row = values[i];
    if (row && row[0] && typeof row[0] === 'string' && row[0].trim()) {
      rowHeaders.push(row[0].trim());
    }
  }

  // Detect column headers (first row)
  const firstRow = values[0] || [];
  for (let j = 0; j < firstRow.length; j++) {
    const cell = firstRow[j];
    if (cell && typeof cell === 'string' && cell.trim()) {
      columnHeaders.push(cell.trim());
    }
  }

  // Detect additional header rows
  for (let i = 0; i < Math.min(headerRows, values.length); i++) {
    const row = values[i];
    const textCells = row ? row.filter(cell => 
      cell && typeof cell === 'string' && cell.trim()
    ).length : 0;
    
    if (textCells >= minTextCells) {
      detectedHeaderRows.push(i);
    }
  }

  return {
    rowHeaders,
    columnHeaders,
    headerRows: detectedHeaderRows
  };
}

/**
 * Detect business concepts in cell content
 * @param {object} cell - Cell data
 * @returns {array} Array of detected concepts
 */
export function detectBusinessConcepts(cell) {
  const concepts = [];
  const text = (cell.formattedValue || cell.rawValue || '').toLowerCase();
  const headers = cell.headers || {};
  const headerText = [
    headers.column,
    headers.row,
    ...(headers.context || []).map(c => c.value)
  ].filter(Boolean).join(' ').toLowerCase();

  const allText = `${text} ${headerText}`;

  // Revenue/Sales concepts
  if (matchesPattern(allText, ['revenue', 'sales', 'income', 'earnings'])) {
    concepts.push('revenue');
  }

  // Cost/Expense concepts
  if (matchesPattern(allText, ['cost', 'expense', 'cogs', 'cost of goods', 'operating expense'])) {
    concepts.push('cost');
  }

  // Profit/Margin concepts
  if (matchesPattern(allText, ['profit', 'margin', 'gross profit', 'net profit', 'ebitda'])) {
    concepts.push('profitability');
  }

  // Percentage concepts
  if (matchesPattern(allText, ['%', 'percent', 'percentage', 'rate', 'ratio'])) {
    concepts.push('percentage');
  }

  // Growth concepts
  if (matchesPattern(allText, ['growth', 'increase', 'decrease', 'change', 'cagr', 'yoy'])) {
    concepts.push('growth');
  }

  // Budget concepts
  if (matchesPattern(allText, ['budget', 'actual', 'variance', 'forecast', 'projection'])) {
    concepts.push('budget');
  }

  // Time concepts
  if (matchesPattern(allText, ['q1', 'q2', 'q3', 'q4', 'quarter', 'monthly', 'yearly', 'annual'])) {
    concepts.push('time_series');
  }

  // Financial ratios
  if (matchesPattern(allText, ['roi', 'roa', 'roe', 'debt', 'equity', 'ratio'])) {
    concepts.push('financial_ratio');
  }

  // Lookup concepts
  if (cell.formula && matchesPattern(cell.formula.toLowerCase(), ['vlookup', 'hlookup', 'xlookup', 'index', 'match'])) {
    concepts.push('lookup');
  }

  // Aggregation concepts
  if (cell.formula && matchesPattern(cell.formula.toLowerCase(), ['sum', 'average', 'count', 'max', 'min'])) {
    concepts.push('aggregation');
  }

  // Conditional concepts
  if (cell.formula && matchesPattern(cell.formula.toLowerCase(), ['if', 'ifs', 'switch', 'choose'])) {
    concepts.push('conditional');
  }

  return [...new Set(concepts)]; // Remove duplicates
}

/**
 * Check if text matches any of the patterns
 * @param {string} text - Text to check
 * @param {array} patterns - Array of patterns to match
 * @returns {boolean} True if any pattern matches
 */
function matchesPattern(text, patterns) {
  return patterns.some(pattern => 
    text.includes(pattern.toLowerCase())
  );
}

/**
 * Calculate concept match score
 * @param {array} cellConcepts - Concepts detected in cell
 * @param {array} queryConcepts - Concepts in query
 * @returns {number} Match score (0-1)
 */
export function calculateConceptMatch(cellConcepts, queryConcepts) {
  if (!cellConcepts.length || !queryConcepts.length) return 0;
  
  const intersection = cellConcepts.filter(concept => 
    queryConcepts.includes(concept)
  );
  
  return intersection.length / Math.max(cellConcepts.length, queryConcepts.length);
}

/**
 * Detect formula complexity
 * @param {object} parsedFormula - Parsed formula object
 * @returns {number} Complexity score (0-1)
 */
export function detectFormulaComplexity(parsedFormula) {
  if (!parsedFormula || !parsedFormula.functions) return 0;
  
  const { functions, references, complexity } = parsedFormula;
  
  // Normalize complexity score to 0-1 range
  const maxComplexity = 20; // Arbitrary max
  const normalizedComplexity = Math.min(complexity / maxComplexity, 1);
  
  // Boost for specific complex functions
  const complexFunctions = ['VLOOKUP', 'INDEX', 'MATCH', 'XLOOKUP', 'IFS', 'SWITCH'];
  const hasComplexFunctions = functions.some(fn => complexFunctions.includes(fn));
  
  return hasComplexFunctions ? Math.min(normalizedComplexity + 0.3, 1) : normalizedComplexity;
}

/**
 * Calculate sheet importance score
 * @param {string} sheetName - Name of the sheet
 * @returns {number} Importance score (0-1)
 */
export function calculateSheetImportance(sheetName) {
  const name = sheetName.toLowerCase();
  
  // High importance sheets
  if (matchesPattern(name, ['p&l', 'profit', 'income', 'revenue', 'financial', 'budget', 'forecast'])) {
    return 1.0;
  }
  
  // Medium importance sheets
  if (matchesPattern(name, ['dashboard', 'summary', 'overview', 'analysis', 'metrics'])) {
    return 0.7;
  }
  
  // Lower importance sheets
  if (matchesPattern(name, ['raw', 'data', 'input', 'temp', 'backup'])) {
    return 0.3;
  }
  
  return 0.5; // Default importance
}

/**
 * Generate text description for embedding
 * @param {object} cell - Cell data
 * @returns {string} Text description for embedding
 */
export function generateEmbeddingText(cell) {
  const parts = [];
  
  // Add sheet context
  parts.push(`Sheet: ${cell.sheetName}`);
  
  // Add headers
  if (cell.headers?.column) {
    parts.push(`Column: ${cell.headers.column}`);
  }
  if (cell.headers?.row) {
    parts.push(`Row: ${cell.headers.row}`);
  }
  
  // Add formula or value
  if (cell.formula) {
    parts.push(`Formula: ${cell.formula}`);
    if (cell.parsedFormula?.type) {
      parts.push(`Type: ${cell.parsedFormula.type}`);
    }
  } else if (cell.formattedValue) {
    parts.push(`Value: ${cell.formattedValue}`);
  }
  
  // Add context from nearby cells
  if (cell.headers?.context?.length > 0) {
    const contextValues = cell.headers.context
      .slice(0, 3) // Limit to 3 context items
      .map(c => c.value)
      .join(', ');
    parts.push(`Context: ${contextValues}`);
  }
  
  return parts.join(' - ');
}

/**
 * Generate text description for range embedding
 * @param {object} range - Range data
 * @returns {string} Text description for embedding
 */
export function generateRangeEmbeddingText(range) {
  const parts = [];
  
  // Add sheet context
  parts.push(`Sheet: ${range.sheetName}`);
  
  // Add header
  if (range.header) {
    parts.push(`Header: ${range.header}`);
  }
  
  // Add range info
  parts.push(`Range: ${range.startRow}-${range.endRow}`);
  
  // Add sample values
  if (range.sampleValues?.length > 0) {
    parts.push(`Values: ${range.sampleValues.slice(0, 3).join(', ')}`);
  }
  
  // Add formula pattern
  if (range.formulaPattern && range.formulaPattern !== 'values') {
    parts.push(`Pattern: ${range.formulaPattern}`);
  }
  
  return parts.join(' - ');
}
