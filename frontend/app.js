// Semantic Spreadsheet Search Frontend
class SpreadsheetSearchApp {
    constructor() {
        this.apiBase = '/api';
        this.currentResults = null;
        this.initializeEventListeners();
        this.updateSystemStatus();
        
        // Update status every 30 seconds
        setInterval(() => this.updateSystemStatus(), 30000);
    }

    initializeEventListeners() {
        // Load buttons
        document.getElementById('loadDefaultBtn').addEventListener('click', () => this.loadDefaultFiles());
        document.getElementById('loadCustomBtn').addEventListener('click', () => this.toggleCustomLoadForm());
        document.getElementById('loadCustomFilesBtn').addEventListener('click', () => this.loadCustomFiles());
        
        // Search
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        document.getElementById('searchQuery').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        // Example query clicks
        document.querySelectorAll('.example-queries li').forEach(li => {
            li.addEventListener('click', () => {
                document.getElementById('searchQuery').value = li.textContent;
                this.performSearch();
            });
        });
    }

    async loadDefaultFiles() {
        const btn = document.getElementById('loadDefaultBtn');
        const status = document.getElementById('loadStatus');
        
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Loading...';
        status.innerHTML = '';
        
        try {
            const response = await fetch(`${this.apiBase}/sheets/load-default`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                status.innerHTML = `
                    <div class="status-message success">
                        ✅ Loaded ${data.stats.totalCells} cells and ${data.stats.totalRanges} ranges from ${data.results.length} files
                    </div>
                `;
                this.updateSystemStatus();
            } else {
                throw new Error(data.error || 'Failed to load files');
            }
        } catch (error) {
            status.innerHTML = `
                <div class="status-message error">
                    ❌ Error: ${error.message}
                </div>
            `;
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Load Default Files';
        }
    }

    toggleCustomLoadForm() {
        const form = document.getElementById('customLoadForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }

    async loadCustomFiles() {
        const fileInput = document.getElementById('fileInput');
        const btn = document.getElementById('loadCustomFilesBtn');
        const status = document.getElementById('loadStatus');
        
        if (!fileInput.files || fileInput.files.length === 0) {
            status.innerHTML = `
                <div class="status-message error">
                    ❌ Please select at least one Excel file
                </div>
            `;
            return;
        }
        
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Uploading...';
        status.innerHTML = '';
        
        try {
            const formData = new FormData();
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('files', fileInput.files[i]);
            }
            
            const response = await fetch(`${this.apiBase}/sheets/upload`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                const successCount = data.results.filter(r => !r.error).length;
                status.innerHTML = `
                    <div class="status-message success">
                        ✅ Loaded ${data.stats.totalCells} cells and ${data.stats.totalRanges} ranges from ${successCount} files
                    </div>
                `;
                this.updateSystemStatus();
            } else {
                throw new Error(data.error || 'Failed to load files');
            }
        } catch (error) {
            status.innerHTML = `
                <div class="status-message error">
                    ❌ Error: ${error.message}
                </div>
            `;
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Upload and Process Files';
        }
    }

    async performSearch() {
        const query = document.getElementById('searchQuery').value.trim();
        const mode = document.querySelector('input[name="searchMode"]:checked').value;
        const btn = document.getElementById('searchBtn');
        const status = document.getElementById('searchStatus');
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (!query) {
            status.innerHTML = `
                <div class="status-message error">
                    ❌ Please enter a search query
                </div>
            `;
            return;
        }
        
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> Searching...';
        status.innerHTML = '';
        
        try {
            const response = await fetch(`${this.apiBase}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query, mode, topK: 20 })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.currentResults = data;
                this.displayResults(data);
                status.innerHTML = `
                    <div class="status-message success">
                        ✅ Found ${this.getResultCount(data)} results
                    </div>
                `;
            } else {
                throw new Error(data.error || 'Search failed');
            }
        } catch (error) {
            status.innerHTML = `
                <div class="status-message error">
                    ❌ Error: ${error.message}
                </div>
            `;
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <p>Search failed. Please try again.</p>
                </div>
            `;
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Search';
        }
    }

    getResultCount(data) {
        if (data.mode === 'both') {
            return data.results.semantic.length + data.results.keyword.length;
        }
        return data.results.length;
    }

    displayResults(data) {
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (data.mode === 'both') {
            this.displayComparisonResults(data.results);
        } else {
            this.displaySingleResults(data.results);
        }
    }

    displaySingleResults(results) {
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <p>No results found. Try a different search query.</p>
                </div>
            `;
            return;
        }
        
        const html = results.map(result => this.createResultHTML(result)).join('');
        resultsContainer.innerHTML = html;
    }

    displayComparisonResults(results) {
        const resultsContainer = document.getElementById('resultsContainer');
        
        const semanticCount = results.semantic.length;
        const keywordCount = results.keyword.length;
        
        let html = `
            <div class="comparison-stats">
                <h4>Search Comparison</h4>
                <div class="stat-grid">
                    <div class="stat-item">
                        <div class="stat-value">${semanticCount}</div>
                        <div class="stat-label">Semantic Results</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${keywordCount}</div>
                        <div class="stat-label">Keyword Results</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${results.comparison.overlap?.intersection || 0}</div>
                        <div class="stat-label">Overlap</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${results.comparison.jaccard ? results.comparison.jaccard.toFixed(2) : 'N/A'}</div>
                        <div class="stat-label">Jaccard Index</div>
                    </div>
                </div>
            </div>
            
            <div class="comparison-results">
                <div class="comparison-section">
                    <h3>🔍 Semantic Search Results</h3>
                    ${results.semantic.map(result => this.createResultHTML(result)).join('')}
                </div>
                <div class="comparison-section">
                    <h3>🔤 Keyword Search Results</h3>
                    ${results.keyword.map(result => this.createResultHTML(result)).join('')}
                </div>
            </div>
        `;
        
        resultsContainer.innerHTML = html;
    }

    createResultHTML(result) {
        const location = `${result.location.sheet} - ${result.location.range}`;
        const relevance = result.relevance ? Math.round(result.relevance * 100) : 0;
        
        let contentHTML = '';
        if (result.formula) {
            contentHTML = `<div class="result-formula">${result.formula}</div>`;
        } else if (result.value) {
            contentHTML = `<div class="result-value">${result.value}</div>`;
        }
        
        const reasonsHTML = result.reasons.map(reason => 
            `<span class="result-reason">${reason}</span>`
        ).join('');
        
        const labelsHTML = result.labels.map(label => 
            `<span class="result-label">${label}</span>`
        ).join('');
        
        return `
            <div class="result-item">
                <div class="result-header">
                    <div class="result-concept">${result.concept}</div>
                    <div class="result-relevance">${relevance}%</div>
                </div>
                <div class="result-location">
                    <strong>Location:</strong> ${location}
                </div>
                <div class="result-content">
                    ${contentHTML}
                </div>
                <div class="result-explanation">
                    ${result.explanation}
                </div>
                <div class="result-reasons">
                    ${reasonsHTML}
                </div>
                ${labelsHTML ? `<div class="result-labels">${labelsHTML}</div>` : ''}
            </div>
        `;
    }

    async updateSystemStatus() {
        try {
            const response = await fetch(`${this.apiBase}/status`);
            const data = await response.json();
            
            if (response.ok) {
                const searchStats = data.services.search.stats;
                const cacheStats = data.services.cache.stats;
                const embeddingStats = data.services.embedding.stats;
                
                document.getElementById('indexSize').textContent = 
                    `${searchStats.totalDocuments || 0} documents`;
                document.getElementById('cacheStatus').textContent = 
                    `${embeddingStats.total || 0} embeddings cached`;
                document.getElementById('embeddingStatus').textContent = 
                    `${embeddingStats.total || 0} embeddings`;
            }
        } catch (error) {
            console.error('Failed to update system status:', error);
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SpreadsheetSearchApp();
});
