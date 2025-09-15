# Semantic Spreadsheet Search - Design Document

## 1. Architecture Overview

### High-Level Architecture

The Semantic Spreadsheet Search system is built as a modular Node.js application that processes Excel files and provides AI-powered semantic search capabilities:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Frontend  │    │   Express API   │    │   Excel Files   │
│   (HTML/CSS/JS) │◄──►│   Server        │◄──►│   (.xlsx/.xls)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Search Engine  │
                    │  (Vector + KW)  │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │  OpenAI API     │    │  Cache Layer    │
                    │  (Embeddings)   │    │  (In-Memory)    │
                    └─────────────────┘    └─────────────────┘
```

### Core Services

1. **ExcelParserService**: Handles Excel file parsing and data extraction
2. **EmbeddingService**: Manages OpenAI embeddings generation and vector operations
3. **SearchService**: Implements semantic and keyword search algorithms
4. **LabelService**: Provides AI-powered concept labeling and classification
5. **CacheService**: Manages in-memory caching for performance optimization

## 2. Data Ingestion Pipeline

### 2.1 Excel File Processing

```
Excel File → Parse Sheets → Extract Cells → Generate Embeddings → Index Data
```

1. **File Upload**: Accept Excel files (.xlsx, .xls) via web interface or API
2. **Sheet Parsing**: Process all sheets within the Excel file
3. **Cell Extraction**: Extract cell values, formulas, headers, and metadata
4. **Embedding Generation**: Create semantic embeddings for each cell
5. **Indexing**: Store processed data in searchable index

### 2.2 Cell Data Structure

Each cell is processed into a structured document:

```javascript
{
  id: "sheet_2_3",
  spreadsheetId: "sheet_id",
  sheetName: "Dashboard",
  row: 2,
  column: 3,
  cellRef: "C2",
  rawValue: 15000,
  formattedValue: 15000,
  formula: "=B2*1.1",
  parsedFormula: { /* parsed formula tree */ },
  note: null,
  type: "number",
  headers: { row: "Revenue", column: "Q1" },
  embedding: [0.1, 0.2, ...], // 1536-dimensional vector
  labels: ["revenue", "formula", "calculation"],
  labelConfidence: [0.9, 0.8, 0.7],
  labelMethod: "heuristic+llm",
  labelExplanation: "Detected revenue calculation formula"
}
```

## 3. Search Architecture

### 3.1 Semantic Search Pipeline

```
Query → Generate Embedding → Vector Similarity → Rank Results → Return
```

1. **Query Processing**: Convert natural language to embedding vector
2. **Vector Search**: Find similar cells using cosine similarity
3. **Ranking**: Combine semantic similarity with concept matching
4. **Result Formatting**: Structure results with explanations

### 3.2 Search Algorithms

#### Vector Similarity Search
- **Algorithm**: Cosine similarity on OpenAI embeddings
- **Model**: text-embedding-3-small (1536 dimensions)
- **Threshold**: Configurable similarity threshold
- **Caching**: Embeddings cached for performance

#### Keyword Search
- **Algorithm**: Inverted index with TF-IDF scoring
- **Features**: Case-insensitive, partial matching
- **Scope**: Cell values, formulas, headers, notes

#### Ranking Algorithm
The search uses a combination of:
- **Semantic Similarity**: Cosine similarity between query and cell embeddings
- **Concept Matching**: Heuristic and LLM-based concept detection
- **Relevance Scoring**: Based on headers, formulas, and cell content

## 4. AI Integration

### 4.1 OpenAI API Usage

#### Embeddings
- **Model**: text-embedding-3-small
- **Rate Limiting**: 1 second delay between requests
- **Caching**: In-memory cache for duplicate texts
- **Batch Processing**: Process multiple texts efficiently

#### LLM Labeling
- **Model**: gpt-3.5-turbo
- **Purpose**: Generate business concept labels
- **Prompt Engineering**: Structured prompts for consistent output
- **Fallback**: Heuristic labeling when API unavailable

### 4.2 Concept Detection

#### Heuristic Rules
```javascript
const businessConcepts = {
  revenue: /revenue|sales|income|earnings/i,
  cost: /cost|expense|spending|outlay/i,
  profit: /profit|margin|gain|return/i,
  formula: /^=.*$/,
  percentage: /%|\d+\.\d+%/,
  currency: /\$|€|£|¥/
};
```

#### LLM-Assisted Labeling
- **Input**: Cell context (headers, values, formulas)
- **Output**: Structured JSON with labels and confidence
- **Caching**: Results cached to reduce API calls

## 5. Performance Optimization

### 5.1 Caching Strategy

#### Multi-Level Caching
1. **Embedding Cache**: Store generated embeddings
2. **Label Cache**: Cache LLM-generated labels
3. **Search Cache**: Cache frequent search results
4. **File Cache**: Cache parsed Excel data

#### Cache Configuration
```javascript
const cacheConfig = {
  embedding: { ttl: 86400 }, // 24 hours
  labels: { ttl: 3600 },     // 1 hour
  search: { ttl: 1800 },     // 30 minutes
  files: { ttl: 7200 }       // 2 hours
};
```

### 5.2 Memory Management

- **Streaming**: Process large files in chunks
- **Garbage Collection**: Regular cleanup of unused data
- **Memory Monitoring**: Track heap usage and optimize

## 6. API Design

### 6.1 RESTful Endpoints

#### Search API
```
POST /api/search
{
  "query": "Find all profitability metrics",
  "mode": "semantic|keyword|both",
  "topK": 10
}
```

#### File Management API
```
POST /api/sheets/upload     # Upload Excel files
POST /api/sheets/load-default # Load sample files
GET  /api/sheets/files      # List available files
```

#### System API
```
GET  /api/status           # System status
GET  /api/health           # Health check
```

### 6.2 Response Format

```javascript
{
  "query": "profitability metrics",
  "mode": "semantic",
  "results": [
    {
      "id": "financial_dashboard_6_1",
      "concept": "revenue",
      "location": { "sheet": "Dashboard", "range": "6:1" },
      "formula": "=B6*C6",
      "value": "Net Profit Margin",
      "relevance": 0.85,
      "explanation": "Matches profitability concept",
      "labels": ["revenue", "profitability", "margin"]
    }
  ],
  "stats": { "totalDocuments": 575, "searchTime": 0.2 }
}
```

## 7. Frontend Architecture

### 7.1 Component Structure

```
Frontend/
├── index.html          # Main page
├── app.js             # Application logic
└── styles.css         # Styling
```

#### Key Features
- **Responsive Design**: Works on desktop and mobile
- **Real-time Search**: Instant search results
- **File Upload**: Drag-and-drop Excel file upload
- **Search Modes**: Toggle between semantic and keyword search
- **Comparison View**: Side-by-side search mode comparison

### 7.2 User Experience

1. **File Loading**: Upload or use default Excel files
2. **Search Interface**: Natural language query input
3. **Results Display**: Organized by concept with relevance scores
4. **System Status**: Real-time monitoring of system health

## 8. Security Considerations

### 8.1 Data Protection

- **File Validation**: Strict Excel file type checking
- **Size Limits**: 10MB file upload limit
- **Input Sanitization**: Clean all user inputs
- **API Rate Limiting**: Prevent abuse

### 8.2 API Security

- **Environment Variables**: Sensitive data in .env
- **CORS Configuration**: Controlled cross-origin access
- **Error Handling**: No sensitive data in error messages

## 9. Scalability and Future Enhancements

### 9.1 Current Limitations

- **In-Memory Storage**: Data lost on restart
- **Single Instance**: No horizontal scaling
- **File Size**: Limited by memory constraints
- **API Rate Limits**: OpenAI API throttling

### 9.2 Scaling Strategies

#### Database Integration
```javascript
// Future: Persistent storage
const database = {
  type: "PostgreSQL + pgvector",
  benefits: [
    "Persistent storage",
    "Vector similarity search",
    "Horizontal scaling",
    "Backup and recovery"
  ]
};
```

#### Microservices Architecture
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ File Service│    │Search Service│   │AI Service   │
│ (Excel)     │    │(Vector/KW)  │   │(Embeddings) │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                   ┌─────────────┐
                   │API Gateway  │
                   │(Load Balancer)│
                   └─────────────┘
```

#### Caching Layer
```javascript
// Future: Redis caching
const redisConfig = {
  host: "redis-cluster",
  features: [
    "Distributed caching",
    "Session management",
    "Pub/Sub for real-time updates",
    "Persistence options"
  ]
};
```

### 9.3 Performance Optimizations

#### Vector Database
- **Pinecone/Weaviate**: Specialized vector databases
- **Approximate Nearest Neighbor**: Faster similarity search
- **Indexing**: Optimized for high-dimensional vectors

#### CDN Integration
- **Static Assets**: Serve frontend from CDN
- **File Storage**: Store Excel files in cloud storage
- **Global Distribution**: Reduce latency worldwide

#### Horizontal Scaling
```yaml
# Docker Swarm / Kubernetes
services:
  web:
    replicas: 3
    load_balancer: nginx
  search:
    replicas: 2
    database: postgresql
  ai:
    replicas: 2
    cache: redis
```

### 9.4 Advanced Features (With more time)

#### Multi-User Support
- **Authentication**: JWT-based user management
- **File Ownership**: User-specific file access
- **Collaboration**: Shared workspaces and permissions

#### Advanced Analytics
- **Search Analytics**: Track popular queries and patterns
- **Usage Metrics**: Monitor system performance
- **A/B Testing**: Compare search algorithms

#### Machine Learning Enhancements
- **Custom Models**: Train domain-specific embedding models
- **Query Expansion**: Automatically expand user queries
- **Personalization**: Learn from user behavior

## 10. Deployment Architecture

### 10.1 Containerization

The application is fully containerized using Docker with a multi-stage build process for optimal production deployment.

#### Dockerfile
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

COPY . .

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Copy only necessary files from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/uploads ./uploads
COPY --from=builder /app/data ./data
COPY --from=builder /app/.env.example ./.env.example
COPY --from=builder /app/README.md ./README.md
COPY --from=builder /app/design.md ./design.md

# Create uploads directory and set permissions
RUN mkdir -p uploads && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "backend/server.js"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  semantic-spreadsheet-search:
    image: semantic-spreadsheet-search:latest
    container_name: semantic-spreadsheet-search
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    volumes:
      - ./uploads:/app/uploads
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/status"]
      interval: 30s
      timeout: 10s
      retries: 5
```

### 10.2 Deployment Scripts

#### Automated Deployment
```bash
#!/bin/bash
# deploy.sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY environment variable is not set."
  echo "Please set it before running the deployment script, e.g.:"
  echo "export OPENAI_API_KEY=\"your_openai_api_key_here\""
  exit 1
fi

echo "Building Docker image..."
docker build -t semantic-spreadsheet-search:latest .

echo "Stopping and removing any existing container..."
docker stop semantic-spreadsheet-search || true
docker rm semantic-spreadsheet-search || true

echo "Running new Docker container..."
docker run -d \
  --name semantic-spreadsheet-search \
  -p 3000:3000 \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  -v "$(pwd)/uploads:/app/uploads" \
  -v "$(pwd)/data:/app/data" \
  semantic-spreadsheet-search:latest

echo "Deployment complete. Application should be running on http://localhost:3000"
```

### 10.3 CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests with coverage
      run: npm test -- --coverage

    - name: Check if application starts
      run: |
        timeout 10s npm start || echo "Application startup test completed"
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY || 'test-key' }}

  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
    - uses: actions/checkout@v4

    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build Docker image
      run: docker build -t semantic-spreadsheet-search .

    - name: Test Docker container
      run: |
        docker run -d --name test-container -p 3000:3000 \
          -e OPENAI_API_KEY=test-key \
          semantic-spreadsheet-search
        sleep 10
        curl -f http://localhost:3000/api/status || exit 1
        docker stop test-container
        docker rm test-container
```

### 10.4 Production Deployment

#### Environment Variables
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Optional: Cache Configuration
CACHE_TTL_SECONDS=1800
```

#### Health Monitoring
- **Health Endpoint**: `GET /api/status` - Returns system status and service health
- **Docker Health Check**: Built-in container health monitoring
- **Service Dependencies**: Checks OpenAI API connectivity and service initialization

#### Security Considerations
- **Non-root User**: Container runs as non-privileged user
- **Minimal Base Image**: Alpine Linux for reduced attack surface
- **Environment Variables**: Sensitive data via environment variables
- **Volume Mounts**: Persistent storage for uploads and data

#### Monitoring and Logging
- **Application Logs**: Standard output logging
- **Health Checks**: Automated service monitoring via `/api/status`
- **Container Logs**: Docker container logging
- **Error Tracking**: Comprehensive error handling and reporting

## 11. Testing Strategy

### 11.1 Test Coverage

#### Unit Tests
- Service layer testing
- Utility function testing
- API endpoint testing

#### Integration Tests
- End-to-end search functionality
- File upload and processing
- API response validation

#### Performance Tests
- Load testing with multiple users
- Memory usage under stress
- Search response time benchmarks

### 11.2 Quality Assurance

#### Code Quality
- ESLint for code standards
- Prettier for code formatting
- Husky for pre-commit hooks

#### Security Testing
- Dependency vulnerability scanning
- Input validation testing
- API security assessment

## 12. Conclusion

The Semantic Spreadsheet Search system provides a robust foundation for AI-powered spreadsheet analysis. The modular architecture allows for easy extension and scaling, while the current implementation focuses on core functionality and performance.

### Key Strengths
- **Modular Design**: Easy to maintain and extend
- **AI Integration**: Leverages state-of-the-art language models
- **Performance**: Optimized with caching and efficient algorithms
- **User Experience**: Intuitive web interface
- **Scalability**: Architecture supports future enhancements

### Future Roadmap
1. **Phase 1**: Add persistent storage and user management
2. **Phase 2**: Implement microservices architecture
3. **Phase 3**: Add advanced ML features and analytics
4. **Phase 4**: Scale to enterprise-level deployment

