import { ExcelParserService } from '../../backend/services/excel-parser.js';
import { sampleExcelData } from '../fixtures/sample-cells.js';

import { vi } from 'vitest';

// Mock the xlsx library
vi.mock('xlsx', () => {
  const mockXLSX = {
    readFile: vi.fn(),
    utils: {
      sheet_to_json: vi.fn()
    }
  };
  
  return {
    default: mockXLSX,
    readFile: mockXLSX.readFile,
    utils: mockXLSX.utils
  };
});

// Mock utility functions
vi.mock('../../backend/utils/heuristics.js', () => ({
  detectHeaders: vi.fn(() => ({
    rowHeaders: [],
    columnHeaders: [],
    headerRows: []
  }))
}));

vi.mock('../../backend/utils/formula-parser.js', () => ({
  parseFormula: vi.fn((formula) => ({ type: 'formula', expression: formula }))
}));

describe('ExcelParserService', () => {
  let excelParser;
  let mockXLSX;

  beforeEach(async () => {
    excelParser = new ExcelParserService();
    vi.clearAllMocks();
    
    // Get the mocked xlsx module
    const xlsxModule = await import('xlsx');
    mockXLSX = xlsxModule.default;
    
    // Set up default mock return values
    mockXLSX.readFile.mockReturnValue(sampleExcelData.workbook);
    mockXLSX.utils.sheet_to_json.mockImplementation((worksheet, options) => {
      if (worksheet === sampleExcelData.workbook.Sheets.Sheet1) {
        return [
          ['Header1', 'Header2'],
          ['Value1', 123]
        ];
      }
      if (worksheet === sampleExcelData.workbook.Sheets.Sheet2) {
        return [
          ['Metric', 'Q1'],
          ['Revenue', 1000]
        ];
      }
      return [];
    });
  });

  describe('constructor', () => {
    test('should initialize with correct properties', () => {
      expect(excelParser.initialized).toBe(false);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully', async () => {
      await excelParser.initialize();
      expect(excelParser.initialized).toBe(true);
    });

    test('should not reinitialize if already initialized', async () => {
      await excelParser.initialize();
      const consoleSpy = vi.spyOn(console, 'log');
      await excelParser.initialize();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('parseExcelFile', () => {
    beforeEach(async () => {
      await excelParser.initialize();
    });

    test('should parse Excel file successfully', async () => {
      const mockWorkbook = {
        Props: { Title: 'Test Spreadsheet' },
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {
            'A1': { v: 'Revenue', w: 'Revenue' },
            'B1': { v: 'Q1', w: 'Q1' }
          }
        }
      };

      const XLSX = await import('xlsx');
      XLSX.readFile.mockReturnValue(mockWorkbook);
      XLSX.utils.sheet_to_json.mockReturnValue([
        ['Revenue', 'Q1'],
        [15000, 16000]
      ]);

      const result = await excelParser.parseExcelFile('test.xlsx');

      expect(XLSX.readFile).toHaveBeenCalledWith('test.xlsx');
      expect(result).toHaveProperty('id', 'test');
      expect(result).toHaveProperty('title', 'test');
      expect(result).toHaveProperty('sheets');
      expect(typeof result.sheets).toBe('object');
    });

    test('should handle file parsing errors', async () => {
      const { default: mockXLSX } = await import('xlsx');
      
      mockXLSX.readFile.mockImplementation(() => {
        throw new Error('File not found');
      });

      await expect(excelParser.parseExcelFile('nonexistent.xlsx'))
        .rejects.toThrow('File not found');
    });
  });

  describe('loadDefaultFiles', () => {
    beforeEach(async () => {
      await excelParser.initialize();
    });

    test('should load default files successfully', async () => {
      const mockWorkbook = {
        Props: { Title: 'Test Spreadsheet' },
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {
            'A1': { v: 'Revenue', w: 'Revenue' }
          }
        }
      };

      const XLSX = await import('xlsx');
      XLSX.readFile.mockReturnValue(mockWorkbook);
      XLSX.utils.sheet_to_json.mockReturnValue([['Revenue']]);

      const result = await excelParser.loadDefaultFiles();

      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('allCells');
      expect(result).toHaveProperty('allRanges');
      expect(Array.isArray(result.results)).toBe(true);
      expect(Array.isArray(result.allCells)).toBe(true);
      expect(Array.isArray(result.allRanges)).toBe(true);
    });
  });

  describe('getCellReference', () => {
    test('should generate correct cell references', () => {
      expect(excelParser.getCellReference(0, 0)).toBe('A1');
      expect(excelParser.getCellReference(0, 25)).toBe('Z1');
      expect(excelParser.getCellReference(1, 0)).toBe('A2');
      expect(excelParser.getCellReference(0, 26)).toBe('AA1');
    });
  });

  describe('generateId', () => {
    test('should generate consistent IDs', () => {
      const id1 = excelParser.generateId('Test Sheet');
      const id2 = excelParser.generateId('Test Sheet');
      expect(id1).toBe(id2);
      expect(typeof id1).toBe('string');
    });
  });

  describe('determineCellType', () => {
    test('should determine cell types correctly', () => {
      const numberCell = { rawValue: 123, formula: null };
      const stringCell = { rawValue: 'hello', formula: null };
      const formulaCell = { rawValue: 123, formula: '=A1+B1' };

      expect(excelParser.determineCellType(numberCell)).toBe('number');
      expect(excelParser.determineCellType(stringCell)).toBe('text');
      expect(excelParser.determineCellType(formulaCell)).toBe('formula');
    });
  });
});
