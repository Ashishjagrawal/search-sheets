import { Parser } from 'hot-formula-parser';

const parser = new Parser();

/**
 * Parse a formula and extract its components
 * @param {string} formula - Excel/Google Sheets formula
 * @returns {object} Parsed formula information
 */
export function parseFormula(formula) {
  if (!formula || !formula.startsWith('=')) {
    return null;
  }

  try {
    const parsed = parser.parse(formula);
    
    if (parsed.error) {
      return {
        error: parsed.error,
        original: formula,
        functions: [],
        references: [],
        operators: []
      };
    }

    return {
      original: formula,
      ast: parsed,
      functions: extractFunctions(parsed),
      references: extractReferences(parsed),
      operators: extractOperators(parsed),
      complexity: calculateComplexity(parsed),
      type: determineFormulaType(parsed)
    };
  } catch (error) {
    return {
      error: error.message,
      original: formula,
      functions: [],
      references: [],
      operators: []
    };
  }
}

/**
 * Extract function names from parsed formula
 * @param {object} ast - Parsed AST
 * @returns {array} Array of function names
 */
function extractFunctions(ast) {
  const functions = [];
  
  function traverse(node) {
    if (node.type === 'FUNCTION') {
      functions.push(node.name);
    }
    
    if (node.args) {
      node.args.forEach(traverse);
    }
  }
  
  traverse(ast);
  return [...new Set(functions)]; // Remove duplicates
}

/**
 * Extract cell references from parsed formula
 * @param {object} ast - Parsed AST
 * @returns {array} Array of cell references
 */
function extractReferences(ast) {
  const references = [];
  
  function traverse(node) {
    if (node.type === 'CELL_REFERENCE') {
      references.push({
        cell: node.value,
        sheet: node.sheet || null,
        absolute: node.absolute
      });
    } else if (node.type === 'CELL_RANGE') {
      references.push({
        range: node.value,
        sheet: node.sheet || null,
        absolute: node.absolute
      });
    }
    
    if (node.args) {
      node.args.forEach(traverse);
    }
  }
  
  traverse(ast);
  return references;
}

/**
 * Extract operators from parsed formula
 * @param {object} ast - Parsed AST
 * @returns {array} Array of operators
 */
function extractOperators(ast) {
  const operators = [];
  
  function traverse(node) {
    if (node.type === 'OPERATOR') {
      operators.push(node.value);
    }
    
    if (node.args) {
      node.args.forEach(traverse);
    }
  }
  
  traverse(ast);
  return [...new Set(operators)]; // Remove duplicates
}

/**
 * Calculate formula complexity score
 * @param {object} ast - Parsed AST
 * @returns {number} Complexity score
 */
function calculateComplexity(ast) {
  let complexity = 0;
  
  function traverse(node) {
    if (node.type === 'FUNCTION') {
      complexity += 2; // Functions add complexity
    } else if (node.type === 'OPERATOR') {
      complexity += 1; // Operators add complexity
    } else if (node.type === 'CELL_REFERENCE' || node.type === 'CELL_RANGE') {
      complexity += 0.5; // References add some complexity
    }
    
    if (node.args) {
      node.args.forEach(traverse);
    }
  }
  
  traverse(ast);
  return complexity;
}

/**
 * Determine the type of formula based on its structure
 * @param {object} ast - Parsed AST
 * @returns {string} Formula type
 */
function determineFormulaType(ast) {
  const functions = extractFunctions(ast);
  const operators = extractOperators(ast);
  
  // Check for specific patterns
  if (functions.includes('SUM')) return 'aggregation';
  if (functions.includes('AVERAGE')) return 'aggregation';
  if (functions.includes('COUNT')) return 'aggregation';
  if (functions.includes('MAX') || functions.includes('MIN')) return 'aggregation';
  
  if (functions.includes('IF')) return 'conditional';
  if (functions.includes('VLOOKUP') || functions.includes('HLOOKUP')) return 'lookup';
  if (functions.includes('INDEX') || functions.includes('MATCH')) return 'lookup';
  if (functions.includes('XLOOKUP')) return 'lookup';
  
  if (operators.includes('/') && functions.length === 0) return 'percentage';
  if (operators.includes('*') && functions.length === 0) return 'calculation';
  if (operators.includes('+') || operators.includes('-')) return 'calculation';
  
  if (functions.includes('RATE') || functions.includes('CAGR')) return 'financial';
  if (functions.includes('PMT') || functions.includes('FV') || functions.includes('PV')) return 'financial';
  
  return 'other';
}

/**
 * Get a human-readable description of the formula
 * @param {object} parsedFormula - Parsed formula object
 * @returns {string} Human-readable description
 */
export function describeFormula(parsedFormula) {
  if (!parsedFormula || parsedFormula.error) {
    return 'Invalid formula';
  }

  const { functions, type, complexity } = parsedFormula;
  
  let description = '';
  
  if (functions.length > 0) {
    description += `Uses ${functions.join(', ')} function${functions.length > 1 ? 's' : ''}`;
  }
  
  if (type === 'percentage') {
    description += ' (percentage calculation)';
  } else if (type === 'aggregation') {
    description += ' (aggregation)';
  } else if (type === 'lookup') {
    description += ' (lookup)';
  } else if (type === 'conditional') {
    description += ' (conditional logic)';
  } else if (type === 'financial') {
    description += ' (financial calculation)';
  }
  
  if (complexity > 5) {
    description += ' (complex)';
  } else if (complexity < 2) {
    description += ' (simple)';
  }
  
  return description;
}
