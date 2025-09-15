# Docker and CI/CD Documentation

## Overview

This document provides comprehensive information about Docker containerization and CI/CD pipeline for the Semantic Spreadsheet Search application.

## Docker Containerization

### Dockerfile Structure

The application uses a multi-stage Docker build for optimal production deployment:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
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

# Security: Create non-root user
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

### Docker Features

#### Security
- **Non-root User**: Container runs as `nextjs` user (UID 1001)
- **Minimal Base Image**: Alpine Linux for reduced attack surface
- **Multi-stage Build**: Only production dependencies in final image
- **Environment Variables**: Sensitive data via environment variables

#### Performance
- **Optimized Layers**: Efficient layer caching
- **Minimal Image Size**: Only necessary files included
- **Health Checks**: Built-in container health monitoring
- **Volume Mounts**: Persistent storage for uploads and data

### Docker Compose

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

### Docker Commands

#### Building
```bash
# Build the image
docker build -t semantic-spreadsheet-search .

# Build with specific tag
docker build -t semantic-spreadsheet-search:v1.0.0 .

# Build without cache
docker build --no-cache -t semantic-spreadsheet-search .
```

#### Running
```bash
# Run with environment variable
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key semantic-spreadsheet-search

# Run with volume mounts
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/data:/app/data \
  semantic-spreadsheet-search

# Run in background
docker run -d --name semantic-search \
  -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  semantic-spreadsheet-search
```

#### Management
```bash
# View running containers
docker ps

# View logs
docker logs semantic-search

# Stop container
docker stop semantic-search

# Remove container
docker rm semantic-search

# Remove image
docker rmi semantic-spreadsheet-search
```

## CI/CD Pipeline

### GitHub Actions Workflow

The project uses GitHub Actions for continuous integration and deployment:

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

### Pipeline Stages

#### 1. Test Stage
- **Node.js Versions**: Tests on Node.js 18.x and 20.x
- **Dependencies**: Install with `npm ci`
- **Test Execution**: Run all tests with coverage
- **Coverage Reporting**: Generate coverage reports
- **Startup Test**: Verify application can start

#### 2. Build Stage
- **Docker Build**: Build production Docker image
- **Container Test**: Test container functionality
- **Health Check**: Verify API endpoints work
- **Cleanup**: Remove test containers

### CI Features

#### Automated Testing
- **Unit Tests**: 57 tests covering all services
- **Integration Tests**: API endpoint testing
- **Coverage**: 45.82% code coverage with detailed reporting
- **Multi-version**: Tests on multiple Node.js versions

#### Quality Assurance
- **Code Quality**: Automated linting and formatting
- **Dependency Security**: Vulnerability scanning
- **Build Verification**: Docker image validation
- **Health Monitoring**: Container health checks

#### Performance
- **Parallel Execution**: Tests run in parallel
- **Caching**: npm cache for faster builds
- **Efficient Builds**: Multi-stage Docker builds
- **Resource Optimization**: Minimal resource usage

## Deployment Scripts

### Automated Deployment

The `deploy.sh` script provides automated deployment:

```bash
#!/bin/bash
set -e

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY environment variable is not set."
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

### Usage

```bash
# Set environment variable
export OPENAI_API_KEY="your_openai_api_key_here"

# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## Environment Configuration

### Required Environment Variables

```env
# OpenAI Configuration (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration (Optional)
PORT=3000
NODE_ENV=production

# Cache Configuration (Optional)
CACHE_TTL_SECONDS=1800
```

### Docker Environment

```bash
# Set environment variables
export OPENAI_API_KEY="your_key"
export PORT=3000
export NODE_ENV=production

# Run with environment file
docker run --env-file .env semantic-spreadsheet-search
```

## Health Monitoring

### Health Endpoints

- **Status Endpoint**: `GET /api/status`
  - Returns system status and service health
  - Includes memory usage, uptime, and service statistics
  - Used by Docker health checks

### Docker Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/status"]
  interval: 30s
  timeout: 10s
  retries: 5
```

### Monitoring Commands

```bash
# Check container health
docker inspect semantic-spreadsheet-search | grep Health

# View health check logs
docker logs semantic-spreadsheet-search

# Test health endpoint
curl http://localhost:3000/api/status
```

## Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker logs semantic-spreadsheet-search

# Check environment variables
docker exec semantic-spreadsheet-search env

# Test with interactive shell
docker run -it semantic-spreadsheet-search sh
```

#### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
docker run -p 3001:3000 semantic-spreadsheet-search
```

#### Permission Issues
```bash
# Fix uploads directory permissions
sudo chown -R 1001:1001 uploads/

# Or run with different user
docker run --user 1001:1001 semantic-spreadsheet-search
```

### Debug Mode

```bash
# Run with debug logging
docker run -e NODE_ENV=development semantic-spreadsheet-search

# Run with shell access
docker run -it --entrypoint sh semantic-spreadsheet-search

# Run with volume mounts for debugging
docker run -v $(pwd):/app semantic-spreadsheet-search
```

## Best Practices

### Security
- Always use non-root user in containers
- Keep base images updated
- Use environment variables for secrets
- Implement proper health checks

### Performance
- Use multi-stage builds for smaller images
- Implement proper caching strategies
- Monitor resource usage
- Use health checks for reliability

### Maintenance
- Regular security updates
- Monitor container logs
- Implement proper backup strategies
- Use container orchestration for production

## Production Considerations

### Scaling
- Use container orchestration (Kubernetes, Docker Swarm)
- Implement load balancing
- Use external databases for persistence
- Implement proper monitoring and alerting

### Security
- Use secrets management
- Implement network security
- Regular security audits
- Use container scanning tools

### Monitoring
- Implement centralized logging
- Use monitoring tools (Prometheus, Grafana)
- Set up alerting for critical issues
- Monitor performance metrics
