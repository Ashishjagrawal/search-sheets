#!/bin/bash

# Semantic Spreadsheet Search - Setup Script
# This script sets up the application on any OS

set -e

echo "🚀 Setting up Semantic Spreadsheet Search..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
            print_error "Node.js version 18 or higher is required. Current version: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        print_status "Visit: https://nodejs.org/"
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Dependencies installed successfully"
    else
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
}

# Setup environment file
setup_env() {
    print_status "Setting up environment file..."
    
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            cp env.example .env
            print_success "Created .env file from env.example"
            print_warning "Please edit .env file and add your OpenAI API key"
        else
            print_error "env.example file not found"
            exit 1
        fi
    else
        print_warning ".env file already exists, skipping creation"
    fi
}

# Check for required files
check_files() {
    print_status "Checking for required files..."
    
    REQUIRED_FILES=(
        "package.json"
        "backend/server.js"
        "frontend/index.html"
        "[Test] FInancial Model.xlsx"
        "[Test] Sales Dashboard.xlsx"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "$file" ]; then
            print_success "Found: $file"
        else
            print_error "Missing required file: $file"
            exit 1
        fi
    done
}

# Create uploads directory if it doesn't exist
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p uploads
    print_success "Created uploads directory"
}

# Test the application
test_application() {
    print_status "Testing application startup..."
    
    # Start the application in background
    timeout 10s npm start &
    APP_PID=$!
    
    # Wait a moment for startup
    sleep 5
    
    # Check if the application is running
    if kill -0 $APP_PID 2>/dev/null; then
        print_success "Application started successfully"
        
        # Test health endpoint
        if command -v curl &> /dev/null; then
            if curl -s http://localhost:3000/api/health > /dev/null; then
                print_success "Health check passed"
            else
                print_warning "Health check failed, but application is running"
            fi
        fi
        
        # Stop the application
        kill $APP_PID 2>/dev/null || true
    else
        print_error "Application failed to start"
        exit 1
    fi
}

# Main setup function
main() {
    echo "=========================================="
    echo "  Semantic Spreadsheet Search Setup"
    echo "=========================================="
    echo
    
    check_node
    check_npm
    check_files
    create_directories
    install_dependencies
    setup_env
    
    echo
    print_success "Setup completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Edit .env file and add your OpenAI API key"
    echo "2. Run: npm start"
    echo "3. Open: http://localhost:3000"
    echo
    echo "For more information, see README.md"
    echo "=========================================="
}

# Run main function
main "$@"
