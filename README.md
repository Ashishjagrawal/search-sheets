# Semantic Spreadsheet Search

A full-stack Node.js application that provides AI-powered semantic search capabilities across Excel files. This system can understand natural language queries and find relevant spreadsheet data using embeddings and concept matching.

## 🚀 Features

- **Semantic Search**: Natural language queries that understand business concepts
- **Excel File Integration**: Load and process Excel files (.xlsx, .xls) with multiple sheets
- **AI-Powered Labeling**: Automatic concept detection using heuristics and LLM
- **Vector Search**: Cosine similarity search using OpenAI embeddings
- **Keyword Search**: Baseline keyword search for comparison
- **Web UI**: Simple, responsive interface for querying and results
- **File Upload**: Upload custom Excel files or use default sample files
- **Evaluation Framework**: Comprehensive testing with precision/recall metrics
- **Caching**: In-memory caching for performance optimization

## 📋 Prerequisites

- Node.js 18+ (LTS recommended)
- OpenAI API key

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ashishjagrawal/search-sheets.git
   cd search-sheets
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   
   # Excel Files Configuration
   # Excel files should be placed in the project root directory
   # Default files: [Test] FInancial Model.xlsx, [Test] Sales Dashboard.xlsx
   
   ```

## 📊 Excel Files Setup

The application comes with two sample Excel files:
- `[Test] FInancial Model.xlsx` - Financial analysis spreadsheet
- `[Test] Sales Dashboard.xlsx` - Sales performance dashboard

### Adding Your Own Excel Files

1. **Place Excel files** in the project root directory
2. **Supported formats**: `.xlsx`, `.xls`
3. **Use the web interface** to upload files or modify the default files list

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Make setup script executable and run
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup
```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your_openai_api_key_here

# Start the application
npm start
```

The server will start on `http://localhost:3000`

## 📖 Usage

### 1. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### 2. Load Excel Files

#### Option A: Use Default Files (Assignment Files)
```bash
npm run ingest
```

#### Option B: Use Web Interface
1. Open `http://localhost:3000`
2. Click "Load Default Files" to load the sample Excel files
3. Or click "Upload Custom Files" to upload your own Excel files

#### Option C: Load Custom Files via API
```bash
curl -X POST http://localhost:3000/api/sheets/load-default \
  -H "Content-Type: application/json"
```

### 3. Search

#### Web Interface
1. Open `http://localhost:3000`
2. Enter your search query
3. Choose search mode (Semantic/Keyword/Compare)
4. View results

#### API
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Find all profitability metrics",
    "mode": "semantic",
    "topK": 10
  }'
```

### 4. Run Evaluation

```bash
npm run evaluate
```

This will run 20 test queries and generate evaluation reports in the `docs/` directory.

## 📊 Example Queries

- "Find all profitability metrics"
- "Show cost-related formulas"
- "Where are my margin analyses?"
- "What percentage calculations do I have?"
- "Find lookup formulas"
- "Budget vs actual comparisons"
- "Show sales totals"
- "Find forecast formulas"

## 🏗️ Architecture

### Backend Services

- **SheetsService**: Google Sheets API integration and data parsing
- **EmbeddingService**: OpenAI embeddings generation and vector operations
- **SearchService**: Semantic and keyword search implementation
- **LabelService**: AI-powered concept labeling
- **CacheService**: In-memory caching for performance

### Frontend

- **HTML/CSS/JavaScript**: Simple, responsive web interface
- **Real-time Updates**: Live system status and search results
- **Comparison Mode**: Side-by-side semantic vs keyword results

### Data Flow

1. **Ingestion**: Load sheets → Parse cells → Extract metadata
2. **Indexing**: Generate embeddings → Create semantic index
3. **Search**: Query → Embedding → Vector search → Ranking
4. **Results**: Format → Explain → Return to user

## 📈 Evaluation Metrics

The system evaluates performance using:

- **Precision@K**: Accuracy of top-K results
- **Recall@K**: Coverage of relevant results
- **F1-Score**: Harmonic mean of precision and recall
- **Category Performance**: Metrics by business concept type

### Sample Results

| Metric | Semantic | Keyword | Improvement |
|--------|----------|---------|-------------|
| Precision@1 | 0.85 | 0.72 | +0.13 |
| Precision@3 | 0.78 | 0.65 | +0.13 |
| Precision@5 | 0.71 | 0.58 | +0.13 |
| F1-Score@1 | 0.82 | 0.69 | +0.13 |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `CACHE_TTL_SECONDS` | Cache TTL | 1800 |
| `DEFAULT_TOP_K` | Default result count | 10 |

### Search Weights

| Weight | Description | Default |
|--------|-------------|---------|
| `SEMANTIC_WEIGHT` | Semantic similarity | 0.7 |
| `CONCEPT_MATCH_WEIGHT` | Concept matching | 0.15 |
| `FORMULA_COMPLEXITY_WEIGHT` | Formula complexity | 0.1 |
| `SHEET_IMPORTANCE_WEIGHT` | Sheet importance | 0.05 |

## 📁 Project Structure

```
semantic-spreadsheet-search/
├── backend/
│   ├── services/          # Core services
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── server.js          # Main server
├── frontend/
│   ├── index.html         # Web interface
│   ├── styles.css         # Styling
│   └── app.js             # Frontend logic
├── scripts/
│   ├── evaluate.js        # Evaluation script
│   └── ingest-local.js    # Ingestion script
├── docs/
│   ├── design.md          # Design document
│   └── evaluation-*.json  # Evaluation results
└── tests/                 # Test files
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run evaluate
```

### Manual Testing
1. Load spreadsheets
2. Run various search queries
3. Compare semantic vs keyword results
4. Check system status

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```bash
docker-compose up
```

## 📊 Performance Considerations

- **Caching**: In-memory cache for embeddings and sheet data
- **Rate Limiting**: Respects OpenAI and Google API limits
- **Batch Processing**: Efficient bulk operations
- **Memory Management**: Configurable cache TTL

## 🔍 Troubleshooting

### Common Issues

1. **Google Sheets Access Denied**
   - Ensure service account has access to sheets
   - Check sheet sharing permissions

2. **OpenAI API Errors**
   - Verify API key is correct
   - Check rate limits and billing

3. **No Search Results**
   - Ensure spreadsheets are loaded
   - Check search index status

4. **Memory Issues**
   - Reduce cache TTL
   - Limit number of sheets loaded

### Debug Mode

Set `NODE_ENV=development` for detailed logging.

## 📚 Documentation

### Technical Documentation
- **[Design Document](docs/design.md)** - Complete technical architecture and design decisions
- **[API Reference](docs/api-reference.md)** - Detailed API endpoint documentation

### Architecture Overview
The system uses a modular Node.js architecture with:
- **Excel Parser**: Processes .xlsx/.xls files
- **AI Integration**: OpenAI embeddings and LLM labeling
- **Search Engine**: Vector similarity + keyword search
- **Web Interface**: Responsive HTML/CSS/JavaScript frontend
- **Caching Layer**: In-memory optimization

### Key Features
- **Semantic Search**: Natural language understanding
- **Formula Recognition**: Excel formula parsing and analysis
- **Multi-sheet Processing**: Handle complex spreadsheets
- **Real-time Search**: Instant results with relevance scoring
- **File Upload**: Support for custom Excel files

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose up
```

### Production Setup
1. Set environment variables
2. Configure reverse proxy (nginx)
3. Set up process manager (PM2)
4. Configure monitoring


## Acknowledgments

- OpenAI for embeddings and LLM capabilities
- Google for Sheets API
- The open-source community for various libraries

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the evaluation reports
3. Check system status at `/api/status`
4. Open an issue on GitHub

