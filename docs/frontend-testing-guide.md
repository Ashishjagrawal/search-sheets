# Frontend Testing Guide

## Overview

This guide provides comprehensive instructions for testing the Semantic Spreadsheet Search application through the web interface. The frontend provides an intuitive way to interact with all application features.

## Prerequisites

- Application running on `http://localhost:3000`
- OpenAI API key configured
- Sample Excel files available

## Quick Start Testing

### 1. Application Startup

#### Local Development
```bash
# Start the application
npm start

# Or with development mode
npm run dev
```

#### Docker
```bash
# Start with Docker Compose
docker-compose up

# Or with Docker directly
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key semantic-spreadsheet-search
```

### 2. Access the Interface

Open your web browser and navigate to:
```
http://localhost:3000
```

You should see the main interface with:
- Search input field
- Search mode selector (Semantic/Keyword/Compare)
- Search button
- Load Default Files button
- Upload Custom Files button
- System Status button

## Core Functionality Testing

### 3. Load Sample Data

#### Step-by-Step Process
1. **Click "Load Default Files"** button
2. **Wait for processing** - You'll see a loading indicator
3. **Verify success message** - Should show statistics like:
   ```
   ✅ Default files loaded successfully
   📊 2 files processed, 150 cells indexed
   ```

#### Expected Behavior
- Loading indicator appears
- Progress updates in real-time
- Success message with statistics
- No error messages

#### Troubleshooting
- If loading fails, check browser console for errors
- Verify OpenAI API key is set
- Check server logs for detailed error messages

### 4. Search Functionality Testing

#### Semantic Search Testing

**Test Case 1: Basic Semantic Search**
1. Select **"Semantic"** mode
2. Enter query: `"Find all revenue calculations"`
3. Click **"Search"**
4. **Expected Results:**
   - Results appear with relevance scores
   - Each result shows concept, location, and explanation
   - Results are ranked by relevance

**Test Case 2: Financial Concepts**
1. Query: `"Show me profit margin analysis"`
2. **Expected Results:**
   - Results related to profit calculations
   - Formulas and values displayed
   - Clear explanations of why results match

**Test Case 3: Formula Search**
1. Query: `"Find lookup formulas"`
2. **Expected Results:**
   - Results showing VLOOKUP, INDEX/MATCH, etc.
   - Formula details and locations
   - Context about what the formulas do

#### Keyword Search Testing

**Test Case 1: Exact Keyword Match**
1. Select **"Keyword"** mode
2. Enter query: `"revenue"`
3. Click **"Search"**
4. **Expected Results:**
   - All cells containing "revenue" (case-insensitive)
   - Exact matches highlighted
   - Fast response time

**Test Case 2: Multiple Keywords**
1. Query: `"profit margin"`
2. **Expected Results:**
   - Cells containing both "profit" and "margin"
   - Keyword highlighting
   - Clear match indicators

#### Compare Mode Testing

**Test Case 1: Side-by-Side Comparison**
1. Select **"Compare"** mode
2. Enter query: `"budget analysis"`
3. Click **"Search"**
4. **Expected Results:**
   - Two result panels: Semantic and Keyword
   - Comparison statistics
   - Different result sets for each mode

**Test Case 2: Overlap Analysis**
1. Query: `"sales data"`
2. **Expected Results:**
   - Overlap count between semantic and keyword results
   - Unique results for each mode
   - Clear comparison metrics

### 5. File Upload Testing

#### Upload Process
1. **Click "Upload Custom Files"** button
2. **Select Excel file** (.xlsx or .xls)
3. **Click "Upload"**
4. **Wait for processing**

#### Expected Behavior
- File selection dialog opens
- Progress indicator during upload
- Processing status updates
- Success message with statistics

#### Test Files
Use these types of files for testing:
- **Financial spreadsheets** with formulas
- **Data tables** with headers
- **Charts and graphs** (will be processed as data)
- **Multiple sheets** workbooks

#### Troubleshooting
- **File too large**: Check file size limits
- **Invalid format**: Ensure file is .xlsx or .xls
- **Processing errors**: Check server logs

### 6. System Status Testing

#### Status Check
1. **Click "System Status"** button
2. **Review system information**

#### Expected Status Information
```json
{
  "system": {
    "status": "healthy",
    "uptime": "2m 30s",
    "memory": "45.2 MB used"
  },
  "services": {
    "search": { "initialized": true, "stats": {...} },
    "excel": { "initialized": true, "defaultFiles": [...] },
    "embedding": { "initialized": true, "stats": {...} },
    "labeling": { "initialized": true, "stats": {...} }
  }
}
```

#### Health Indicators
- **Green indicators**: All services healthy
- **Red indicators**: Service issues
- **Statistics**: Current data counts and performance

## Advanced Testing Scenarios

### 7. Performance Testing

#### Large File Testing
1. Upload a large Excel file (10MB+)
2. Monitor processing time
3. Check memory usage in system status
4. Verify search performance

#### Multiple Search Testing
1. Perform 10+ consecutive searches
2. Check response times
3. Verify cache effectiveness
4. Monitor system resources

### 8. Error Handling Testing

#### Invalid Queries
- Empty queries
- Very long queries
- Special characters
- SQL injection attempts

#### Network Issues
- Disconnect internet during search
- Slow network conditions
- API timeout scenarios

#### File Upload Errors
- Corrupted files
- Unsupported formats
- Very large files
- Multiple simultaneous uploads

### 9. User Experience Testing

#### Interface Responsiveness
- Button hover effects
- Loading animations
- Error message clarity
- Result display formatting

#### Mobile Testing
- Responsive design on mobile devices
- Touch interactions
- Screen size adaptation
- Performance on mobile

## Sample Test Queries

### Financial Analysis Queries
```
"Find all revenue calculations"
"Show me profit margin formulas"
"Where are the budget comparisons?"
"Find cost analysis data"
"Show me financial ratios"
```

### Formula Testing Queries
```
"Find lookup formulas"
"Show percentage calculations"
"Where are the sum formulas?"
"Find conditional logic"
"Show me array formulas"
```

### Data Analysis Queries
```
"Find forecast data"
"Show trend analysis"
"Where are the charts?"
"Find pivot table data"
"Show me data validation"
```

### Business Intelligence Queries
```
"Find KPI calculations"
"Show me dashboard data"
"Where are the metrics?"
"Find performance indicators"
"Show me business rules"
```

## Expected Results Format

### Search Results
Each search result should include:
- **Concept**: What the cell represents
- **Location**: Sheet name and cell reference
- **Formula**: Excel formula (if applicable)
- **Value**: Cell value
- **Relevance**: Match score (0-1)
- **Explanation**: Why it matches the query
- **Reasons**: List of matching criteria

### Example Result
```json
{
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
```

## Troubleshooting Common Issues

### No Search Results
1. **Check data loading**: Ensure files are loaded
2. **Verify query**: Try simpler queries
3. **Check system status**: Ensure services are running
4. **Review logs**: Check browser console and server logs

### Slow Performance
1. **Check system status**: Monitor memory usage
2. **Clear cache**: Restart application
3. **Reduce data**: Load fewer files
4. **Check network**: Verify API connectivity

### Upload Failures
1. **Check file format**: Ensure .xlsx or .xls
2. **Verify file size**: Check size limits
3. **Check permissions**: Ensure write access
4. **Review error messages**: Check detailed error info

### API Errors
1. **Check OpenAI API key**: Verify it's set correctly
2. **Check API limits**: Monitor usage and billing
3. **Check network**: Ensure internet connectivity
4. **Review logs**: Check server error logs

## Testing Checklist

### Pre-Testing Setup
- [ ] Application running on localhost:3000
- [ ] OpenAI API key configured
- [ ] Browser developer tools open
- [ ] Sample Excel files available

### Basic Functionality
- [ ] Load default files successfully
- [ ] Semantic search returns results
- [ ] Keyword search returns results
- [ ] Compare mode shows both result types
- [ ] File upload works
- [ ] System status shows healthy

### Advanced Testing
- [ ] Large file upload and processing
- [ ] Multiple consecutive searches
- [ ] Error handling for invalid inputs
- [ ] Mobile responsiveness
- [ ] Performance under load

### Edge Cases
- [ ] Empty search queries
- [ ] Very long search queries
- [ ] Special characters in queries
- [ ] Corrupted file uploads
- [ ] Network disconnection scenarios

## Success Criteria

### Functional Requirements
- All search modes work correctly
- File upload and processing successful
- Results are relevant and accurate
- System status provides useful information
- Error handling is graceful

### Performance Requirements
- Search results appear within 3 seconds
- File processing completes within 30 seconds
- Interface remains responsive
- Memory usage stays reasonable

### User Experience Requirements
- Interface is intuitive and easy to use
- Error messages are clear and helpful
- Results are well-formatted and readable
- Loading indicators provide feedback
- Mobile experience is functional

## Conclusion

This testing guide ensures comprehensive validation of the frontend functionality. Regular testing helps maintain application quality and user experience. For additional testing scenarios or issues, refer to the API documentation or system logs.
