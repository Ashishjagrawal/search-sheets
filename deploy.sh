#!/bin/bash

# Semantic Spreadsheet Search - Deployment Script
# This script builds and deploys the Docker container

set -e

echo "🚀 Starting deployment of Semantic Spreadsheet Search..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t semantic-spreadsheet-search:latest .

# Check if image was built successfully
if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
else
    echo "❌ Failed to build Docker image"
    exit 1
fi

# Stop and remove existing container if it exists
echo "🔄 Stopping existing container..."
docker stop semantic-spreadsheet-search 2>/dev/null || true
docker rm semantic-spreadsheet-search 2>/dev/null || true

# Run the container
echo "🚀 Starting container..."
docker run -d \
  --name semantic-spreadsheet-search \
  -p 3000:3000 \
  -e OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
  -e NODE_ENV=production \
  --restart unless-stopped \
  semantic-spreadsheet-search:latest

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 10

# Check if container is running
if docker ps | grep -q semantic-spreadsheet-search; then
    echo "✅ Container is running successfully"
    echo "🌐 Application is available at: http://localhost:3000"
    echo "📊 API status: http://localhost:3000/api/status"
    echo "🔍 Frontend: http://localhost:3000"
else
    echo "❌ Container failed to start"
    echo "📋 Container logs:"
    docker logs semantic-spreadsheet-search
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📝 To view logs: docker logs -f semantic-spreadsheet-search"
echo "🛑 To stop: docker stop semantic-spreadsheet-search"
echo "🗑️  To remove: docker rm semantic-spreadsheet-search"
