import express from 'express';
import multer from 'multer';
import path from 'path';
import { excelParserService, searchService } from '../services/index.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/sheets/upload
 * Upload and parse Excel files
 */
router.post('/upload', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded'
      });
    }

    const results = [];
    const allCells = [];
    const allRanges = [];

    for (const file of req.files) {
      try {
        console.log(`📊 Processing file: ${file.originalname}`);
        
        const spreadsheetData = await excelParserService.parseExcelFile(file.path);
        
        results.push({
          fileName: file.originalname,
          filePath: file.path,
          ...spreadsheetData
        });

        // Collect all cells and ranges for indexing
        Object.values(spreadsheetData.sheets).forEach(sheet => {
          allCells.push(...sheet.cells);
          allRanges.push(...sheet.ranges);
        });

      } catch (error) {
        console.error(`Failed to process file ${file.originalname}:`, error.message);
        results.push({
          fileName: file.originalname,
          error: error.message,
          success: false
        });
      }
    }

    // Index all loaded data
    if (allCells.length > 0) {
      console.log(`📚 Indexing ${allCells.length} cells...`);
      await searchService.addToIndex(allCells);
    }

    if (allRanges.length > 0) {
      console.log(`📚 Indexing ${allRanges.length} ranges...`);
      await searchService.addRangesToIndex(allRanges);
    }

    res.json({
      message: 'Files processed successfully',
      results,
      stats: {
        totalCells: allCells.length,
        totalRanges: allRanges.length,
        searchIndexSize: searchService.getStats().totalDocuments
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Failed to process files',
      message: error.message
    });
  }
});

/**
 * POST /api/sheets/load-default
 * Load default Excel files from project directory
 */
router.post('/load-default', async (req, res) => {
  try {
    const { options = {} } = req.body;

    console.log('📊 Loading default Excel files...');
    const { results, allCells, allRanges } = await excelParserService.loadDefaultFiles(options);

    // Index all loaded data
    if (allCells.length > 0) {
      console.log(`📚 Indexing ${allCells.length} cells...`);
      await searchService.addToIndex(allCells);
    }

    if (allRanges.length > 0) {
      console.log(`📚 Indexing ${allRanges.length} ranges...`);
      await searchService.addRangesToIndex(allRanges);
    }

    res.json({
      message: 'Default files loaded successfully',
      results,
      stats: {
        totalCells: allCells.length,
        totalRanges: allRanges.length,
        searchIndexSize: searchService.getStats().totalDocuments
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Load default files error:', error);
    res.status(500).json({
      error: 'Failed to load default files',
      message: error.message
    });
  }
});

/**
 * GET /api/sheets/files
 * Get list of available Excel files
 */
router.get('/files', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const files = [];
    const defaultFiles = [
      '[Test] FInancial Model.xlsx',
      '[Test] Sales Dashboard.xlsx'
    ];
    
    for (const fileName of defaultFiles) {
      const filePath = path.join(process.cwd(), fileName);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        files.push({
          name: fileName,
          path: filePath,
          size: stats.size,
          modified: stats.mtime
        });
      }
    }
    
    res.json({
      files,
      count: files.length
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      error: 'Failed to get files',
      message: error.message
    });
  }
});

export default router;
