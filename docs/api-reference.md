# API Reference

## Base URL
```
http://localhost:3000/api
```

## Authentication
No authentication required for this API.

## Endpoints

### 1. System Status

#### GET `/api/status`
Get system status and service information.

**Response:**
```json
{
  "system": {
    "status": "healthy",
    "uptime": 123.456,
    "memory": {
      "used": "45.2 MB",
      "total": "512 MB",
      "percentage": 8.8
    },
    "version": "1.0.0"
  },
  "services": {
    "search": {
      "initialized": true,
      "stats": {
        "totalDocuments": 150,
        "cells": 120,
        "ranges": 30
      }
    },
    "excel": {
      "initialized": true,
      "defaultFiles": [
        "[Test] FInancial Model.xlsx",
        "[Test] Sales Dashboard.xlsx"
      ]
    },
    "embedding": {
      "initialized": true,
      "stats": {
        "total": 150,
        "model": "text-embedding-3-small"
      }
    },
    "labeling": {
      "initialized": true,
      "stats": {
        "total": 150,
        "method": "llm+heuristic",
        "model": "gpt-3.5-turbo"
      }
    },
    "cache": {
      "initialized": true,
      "stats": {
        "total": 0
      }
    }
  },
  "environment": {
    "nodeVersion": "v18.17.0",
    "platform": "darwin",
    "arch": "x64"
  }
}
```

### 2. Spreadsheet Management

#### POST `/api/sheets/load-default`
Load default Excel files and index them for search.

**Response:**
```json
{
  "message": "Default files loaded successfully",
  "stats": {
    "totalFiles": 2,
    "totalCells": 150,
    "totalRanges": 30,
    "processingTime": "2.5s"
  },
  "files": [
    {
      "id": "[Test] FInancial Model.xlsx",
      "success": true,
      "cells": 75,
      "ranges": 15
    },
    {
      "id": "[Test] Sales Dashboard.xlsx",
      "success": true,
      "cells": 75,
      "ranges": 15
    }
  ]
}
```

#### POST `/api/sheets/upload`
Upload and process Excel files.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `files` (array of Excel files)

**Response:**
```json
{
  "message": "Files processed successfully",
  "stats": {
    "totalFiles": 1,
    "totalCells": 50,
    "totalRanges": 10,
    "processingTime": "1.2s"
  },
  "files": [
    {
      "id": "uploaded-file.xlsx",
      "success": true,
      "cells": 50,
      "ranges": 10
    }
  ]
}
```

### 3. Search Operations

#### POST `/api/search`
Perform semantic or keyword search on indexed spreadsheets.

**Request Body:**
```json
{
  "query": "revenue growth",
  "mode": "semantic",
  "topK": 10,
  "includeRanges": true
}
```

**Parameters:**
- `query` (string, required): Search query
- `mode` (string, optional): Search mode - "semantic", "keyword", or "both" (default: "semantic")
- `topK` (number, optional): Number of results to return (default: 10)
- `includeRanges` (boolean, optional): Include range results (default: true)

**Response (semantic mode):**
```json
{
  "query": "revenue growth",
  "mode": "semantic",
  "results": [
    {
      "id": "sheet1_A2",
      "concept": "Revenue Growth",
      "location": {
        "sheet": "Financial Model",
        "range": "A2"
      },
      "formula": "=B2*1.1",
      "value": 15000,
      "relevance": 0.95,
      "explanation": "Revenue calculation with growth factor",
      "reasons": ["header Revenue", "formula calculation", "growth factor"]
    }
  ],
  "stats": {
    "totalResults": 1,
    "processingTime": "0.8s"
  }
}
```

**Response (keyword mode):**
```json
{
  "query": "revenue",
  "mode": "keyword",
  "results": [
    {
      "id": "sheet1_A1",
      "concept": "Revenue",
      "location": {
        "sheet": "Financial Model",
        "range": "A1"
      },
      "formula": null,
      "value": "Revenue",
      "relevance": 1.0,
      "explanation": "Exact keyword match",
      "reasons": ["keyword Revenue"]
    }
  ],
  "stats": {
    "totalResults": 1,
    "processingTime": "0.2s"
  }
}
```

**Response (both mode):**
```json
{
  "query": "revenue",
  "mode": "both",
  "results": {
    "semantic": [
      {
        "id": "sheet1_A2",
        "concept": "Revenue Growth",
        "location": {
          "sheet": "Financial Model",
          "range": "A2"
        },
        "formula": "=B2*1.1",
        "value": 15000,
        "relevance": 0.95,
        "explanation": "Revenue calculation with growth factor",
        "reasons": ["header Revenue", "formula calculation"]
      }
    ],
    "keyword": [
      {
        "id": "sheet1_A1",
        "concept": "Revenue",
        "location": {
          "sheet": "Financial Model",
          "range": "A1"
        },
        "formula": null,
        "value": "Revenue",
        "relevance": 1.0,
        "explanation": "Exact keyword match",
        "reasons": ["keyword Revenue"]
      }
    ],
    "comparison": {
      "semanticCount": 1,
      "keywordCount": 1,
      "overlap": 0,
      "uniqueSemantic": 1,
      "uniqueKeyword": 1
    }
  },
  "stats": {
    "totalResults": 2,
    "processingTime": "1.0s"
  }
}
```

#### GET `/api/search/stats`
Get search index statistics.

**Response:**
```json
{
  "totalDocuments": 150,
  "cells": 120,
  "ranges": 30
}
```

#### POST `/api/search/clear`
Clear the search index.

**Response:**
```json
{
  "message": "Search index cleared successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Query is required and must be a string",
  "message": "Query is required and must be a string"
}
```

### 500 Internal Server Error
```json
{
  "error": "Search failed",
  "message": "Search failed"
}
```

## Rate Limiting

- No rate limiting currently implemented
- OpenAI API calls are internally rate-limited with 1-second delays

## Data Types

### Cell Object
```json
{
  "id": "string",
  "concept": "string",
  "location": {
    "sheet": "string",
    "range": "string"
  },
  "formula": "string|null",
  "value": "any",
  "relevance": "number",
  "explanation": "string",
  "reasons": ["string"]
}
```

### Location Object
```json
{
  "sheet": "string",
  "range": "string"
}
```

### Stats Object
```json
{
  "totalDocuments": "number",
  "cells": "number",
  "ranges": "number"
}
```

## Examples

### Search for Revenue Data
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "revenue", "mode": "semantic", "topK": 5}'
```

### Upload Excel File
```bash
curl -X POST http://localhost:3000/api/sheets/upload \
  -F "files=@financial-data.xlsx"
```

### Get System Status
```bash
curl http://localhost:3000/api/status
```

### Load Default Files
```bash
curl -X POST http://localhost:3000/api/sheets/load-default
```
