import XLSX from 'xlsx';
import { parseFormula } from '../utils/formula-parser.js';
import { detectHeaders } from '../utils/heuristics.js';
import fs from 'fs';
import path from 'path';

/**
 * Service for parsing Excel files
 */
export class ExcelParserService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the parser
   */
  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    console.log('✅ Excel Parser initialized');
  }

  /**
   * Parse an Excel file from file path
   * @param {string} filePath - Path to the Excel file
   * @param {object} options - Parsing options
   * @returns {object} Parsed spreadsheet data
   */
  async parseExcelFile(filePath, options = {}) {
    await this.initialize();

    try {
      // Read the Excel file
      const workbook = XLSX.readFile(filePath);
      const fileName = path.basename(filePath, path.extname(filePath));
      
      const spreadsheetData = {
        id: this.generateId(fileName),
        title: fileName,
        filePath: filePath,
        sheets: {},
        loadedAt: new Date().toISOString()
      };

      // Process each sheet
      for (const sheetName of workbook.SheetNames) {
        try {
          console.log(`📊 Parsing sheet: ${sheetName}`);
          const sheetData = await this.parseSheet(workbook, sheetName, options);
          spreadsheetData.sheets[sheetName] = sheetData;
        } catch (error) {
          console.error(`Failed to parse sheet ${sheetName}:`, error.message);
          // Continue with other sheets
        }
      }

      return spreadsheetData;
    } catch (error) {
      console.error(`Failed to parse Excel file ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Parse a specific sheet from workbook
   * @param {object} workbook - XLSX workbook object
   * @param {string} sheetName - Name of the sheet
   * @param {object} options - Parsing options
   * @returns {object} Parsed sheet data
   */
  async parseSheet(workbook, sheetName, options = {}) {
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON with formulas
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false,
      dateNF: 'yyyy-mm-dd'
    });

    // Detect headers
    const headerInfo = detectHeaders(jsonData, options.headerRows);
    
    // Parse cells
    const cells = [];
    const ranges = [];

    for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
      const row = jsonData[rowIndex];
      
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cellValue = row[colIndex];
        
        // Skip empty cells
        if (!cellValue && cellValue !== 0) continue;

        // Get cell reference (e.g., A1, B2)
        const cellRef = this.getCellReference(rowIndex, colIndex);
        
        // Check if this cell has a formula
        const cellFormula = this.getCellFormula(worksheet, cellRef);
        
        const cell = {
          id: `${this.generateId(sheetName)}_${rowIndex + 1}_${colIndex + 1}`,
          spreadsheetId: this.generateId(sheetName),
          sheetName: sheetName,
          row: rowIndex + 1,
          column: colIndex + 1,
          cellRef: cellRef,
          rawValue: cellValue,
          formattedValue: cellValue,
          formula: cellFormula || null,
          note: null, // Excel files don't have notes in this format
          userEnteredFormat: null,
          effectiveFormat: null
        };

        // Parse formula if present
        if (cell.formula) {
          cell.parsedFormula = parseFormula(cell.formula);
        }

        // Determine cell type
        cell.type = this.determineCellType(cell);

        // Get headers for this cell
        cell.headers = this.getCellHeaders(cell, headerInfo, jsonData);

        cells.push(cell);
      }
    }

    // Create range-level documents for multi-cell ranges
    const rangeDocuments = this.createRangeDocuments(cells, headerInfo);

    return {
      spreadsheetId: this.generateId(sheetName),
      sheetName: sheetName,
      title: sheetName,
      rowCount: jsonData.length,
      columnCount: Math.max(...jsonData.map(row => row.length)),
      headerInfo,
      cells,
      ranges: rangeDocuments,
      loadedAt: new Date().toISOString()
    };
  }

  /**
   * Get cell reference from row and column indices
   * @param {number} row - Row index (0-based)
   * @param {number} col - Column index (0-based)
   * @returns {string} Cell reference (e.g., A1, B2)
   */
  getCellReference(row, col) {
    const colLetter = this.getColumnLetter(col);
    return `${colLetter}${row + 1}`;
  }

  /**
   * Get column letter from column index
   * @param {number} col - Column index (0-based)
   * @returns {string} Column letter (A, B, C, ...)
   */
  getColumnLetter(col) {
    let result = '';
    while (col >= 0) {
      result = String.fromCharCode(65 + (col % 26)) + result;
      col = Math.floor(col / 26) - 1;
    }
    return result;
  }

  /**
   * Get cell formula from worksheet
   * @param {object} worksheet - XLSX worksheet object
   * @param {string} cellRef - Cell reference
   * @returns {string|null} Cell formula or null
   */
  getCellFormula(worksheet, cellRef) {
    const cell = worksheet[cellRef];
    if (cell && cell.f) {
      return cell.f;
    }
    return null;
  }

  /**
   * Generate a simple ID from name
   * @param {string} name - Name to generate ID from
   * @returns {string} Generated ID
   */
  generateId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  /**
   * Determine cell type based on content and format
   * @param {object} cell - Cell data
   * @returns {string} Cell type
   */
  determineCellType(cell) {
    if (cell.formula) return 'formula';
    if (cell.formattedValue?.includes('%')) return 'percentage';
    if (!isNaN(cell.rawValue) && cell.rawValue !== '') return 'number';
    if (cell.rawValue instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(cell.rawValue)) return 'date';
    return 'text';
  }

  /**
   * Get headers for a specific cell
   * @param {object} cell - Cell data
   * @param {object} headerInfo - Header information
   * @param {array} values - All cell values
   * @returns {object} Headers for the cell
   */
  getCellHeaders(cell, headerInfo, values) {
    const headers = {
      row: null,
      column: null,
      context: []
    };

    // Get column header
    if (headerInfo.columnHeaders && cell.column <= headerInfo.columnHeaders.length) {
      headers.column = headerInfo.columnHeaders[cell.column - 1];
    }

    // Get row header
    if (headerInfo.rowHeaders && cell.row <= headerInfo.rowHeaders.length) {
      headers.row = headerInfo.rowHeaders[cell.row - 1];
    }

    // Get context headers (nearby cells)
    const contextRange = 2;
    for (let r = Math.max(0, cell.row - contextRange - 1); r < Math.min(values.length, cell.row + contextRange); r++) {
      for (let c = Math.max(0, cell.column - contextRange - 1); c < Math.min(values[r]?.length || 0, cell.column + contextRange); c++) {
        if (r !== cell.row - 1 || c !== cell.column - 1) {
          const contextValue = values[r]?.[c];
          if (contextValue && contextValue.toString().trim()) {
            headers.context.push({
              value: contextValue.toString(),
              row: r + 1,
              column: c + 1,
              distance: Math.abs(r - (cell.row - 1)) + Math.abs(c - (cell.column - 1))
            });
          }
        }
      }
    }

    return headers;
  }

  /**
   * Create range-level documents for multi-cell ranges
   * @param {array} cells - All cells
   * @param {object} headerInfo - Header information
   * @returns {array} Range documents
   */
  createRangeDocuments(cells, headerInfo) {
    const ranges = [];
    const processedCells = new Set();

    // Group cells by similar headers and patterns
    const cellGroups = new Map();

    for (const cell of cells) {
      if (processedCells.has(cell.id)) continue;

      const groupKey = `${cell.sheetName}_${cell.headers.column || 'unknown'}`;
      
      if (!cellGroups.has(groupKey)) {
        cellGroups.set(groupKey, []);
      }
      
      cellGroups.get(groupKey).push(cell);
    }

    // Create range documents for each group
    for (const [groupKey, groupCells] of cellGroups) {
      if (groupCells.length < 2) continue; // Skip single cells

      const range = {
        id: `range_${groupKey}`,
        spreadsheetId: groupCells[0].spreadsheetId,
        sheetName: groupCells[0].sheetName,
        header: groupCells[0].headers.column,
        cells: groupCells,
        startRow: Math.min(...groupCells.map(c => c.row)),
        endRow: Math.max(...groupCells.map(c => c.row)),
        startColumn: Math.min(...groupCells.map(c => c.column)),
        endColumn: Math.max(...groupCells.map(c => c.column)),
        sampleValues: groupCells.slice(0, 5).map(c => c.formattedValue),
        hasFormulas: groupCells.some(c => c.formula),
        formulaPattern: this.detectFormulaPattern(groupCells)
      };

      ranges.push(range);
      
      // Mark cells as processed
      groupCells.forEach(cell => processedCells.add(cell.id));
    }

    return ranges;
  }

  /**
   * Detect formula pattern in a range of cells
   * @param {array} cells - Cells in the range
   * @returns {string} Detected pattern
   */
  detectFormulaPattern(cells) {
    const formulas = cells.filter(c => c.formula).map(c => c.formula);
    if (formulas.length === 0) return 'values';

    // Check for common patterns
    if (formulas.every(f => f.startsWith('='))) {
      const functions = formulas.map(f => f.match(/=([A-Z]+)/)?.[1]).filter(Boolean);
      if (functions.length > 0) {
        const mostCommon = functions.reduce((a, b, i, arr) => 
          arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
        );
        return mostCommon;
      }
    }

    return 'mixed';
  }

  /**
   * Load default Excel files from the project directory
   * @param {object} options - Loading options
   * @returns {object} All loaded spreadsheets
   */
  async loadDefaultFiles(options = {}) {
    await this.initialize();

    const defaultFiles = [
      '[Test] FInancial Model.xlsx',
      '[Test] Sales Dashboard.xlsx'
    ];

    const results = [];
    const allCells = [];
    const allRanges = [];

    for (const fileName of defaultFiles) {
      const filePath = path.join(process.cwd(), fileName);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
      }

      try {
        console.log(`📊 Loading Excel file: ${fileName}`);
        const spreadsheetData = await this.parseExcelFile(filePath, options);
        
        results.push(spreadsheetData);

        // Collect all cells and ranges for indexing
        Object.values(spreadsheetData.sheets).forEach(sheet => {
          allCells.push(...sheet.cells);
          allRanges.push(...sheet.ranges);
        });

        console.log(`✅ Loaded ${Object.keys(spreadsheetData.sheets).length} sheets from ${fileName}`);
        
      } catch (error) {
        console.error(`Failed to load file ${fileName}:`, error.message);
        results.push({
          fileName,
          error: error.message,
          success: false
        });
      }
    }

    return {
      results,
      allCells,
      allRanges,
      loadedAt: new Date().toISOString()
    };
  }
}
