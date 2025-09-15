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
OPENAI_API_KEY=your_openai_api_key_here

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

### Test Coverage
- **Total Tests**: 57 tests (100% passing)
- **Code Coverage**: 45.82% overall
- **Test Framework**: Vitest with v8 coverage provider
- **Coverage Report**: [docs/test-coverage-report.md](docs/test-coverage-report.md)

### Unit Tests
```bash
npm test
```

### Tests with Coverage
```bash
npm test -- --coverage
```

### Integration Tests
```bash
npm run evaluate
```

### Frontend Testing

#### 1. Start the Application
```bash
# Start the server
npm start

# Or with Docker
docker-compose up
```

#### 2. Access the Web Interface
Open your browser and navigate to: `http://localhost:3000`

#### 3. Load Sample Data
1. Click **"Load Default Files"** button
2. Wait for the loading indicator to complete
3. Verify you see success message with statistics

#### 4. Test Search Functionality

**Semantic Search:**
1. Select **"Semantic"** mode
2. Enter query: `"Find all revenue calculations"`
3. Click **"Search"**
4. Verify results show relevant cells with explanations

**Keyword Search:**
1. Select **"Keyword"** mode  
2. Enter query: `"revenue"`
3. Click **"Search"**
4. Verify exact keyword matches are highlighted

**Compare Mode:**
1. Select **"Compare"** mode
2. Enter query: `"profit margin"`
3. Click **"Search"**
4. Verify both semantic and keyword results are displayed side-by-side

#### 5. Test File Upload
1. Click **"Upload Custom Files"**
2. Select an Excel file (.xlsx or .xls)
3. Click **"Upload"**
4. Verify file is processed and indexed

#### 6. Test System Status
1. Click **"System Status"** button
2. Verify all services show as initialized
3. Check statistics for loaded data

#### 7. Sample Test Queries
Try these queries to test different functionality:

**Financial Queries:**
- `"Show me all profit calculations"`
- `"Find revenue growth formulas"`
- `"Where are the budget comparisons?"`

**Formula Queries:**
- `"Find lookup formulas"`
- `"Show percentage calculations"`
- `"Where are the sum formulas?"`

**Data Analysis:**
- `"Find forecast data"`
- `"Show trend analysis"`
- `"Where are the charts?"`

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

### Docker Deployment

#### Quick Start with Docker
```bash
# Build and run with Docker Compose
docker-compose up

# Or build and run manually
docker build -t semantic-spreadsheet-search .
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key semantic-spreadsheet-search
```

#### Automated Deployment
```bash
# Set your OpenAI API key
export OPENAI_API_KEY="your_openai_api_key_here"

# Run automated deployment script
chmod +x deploy.sh
./deploy.sh
```

#### Docker Features
- **Multi-stage Build**: Optimized production image
- **Non-root User**: Security best practices
- **Health Checks**: Built-in container monitoring
- **Volume Mounts**: Persistent file storage
- **Environment Variables**: Secure configuration

### CI/CD Pipeline

The project includes a complete GitHub Actions CI/CD pipeline:

#### Automated Testing
- **Node.js Versions**: Tests on Node.js 18.x and 20.x
- **Test Coverage**: Automated coverage reporting
- **Code Quality**: Linting and formatting checks
- **Docker Build**: Automated container building and testing

#### Pipeline Stages
1. **Test**: Run all tests with coverage
2. **Build**: Build Docker image
3. **Verify**: Test container functionality
4. **Deploy**: Ready for production deployment

#### CI Status
[![CI](https://github.com/Ashishjagrawal/search-sheets/workflows/CI/badge.svg)](https://github.com/Ashishjagrawal/search-sheets/actions)

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
- **[Test Coverage Report](docs/test-coverage-report.md)** - Comprehensive test coverage analysis
- **[Docker & CI/CD Guide](docs/docker-and-ci.md)** - Containerization and deployment documentation
- **[Frontend Testing Guide](docs/frontend-testing-guide.md)** - Complete web interface testing instructions

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

