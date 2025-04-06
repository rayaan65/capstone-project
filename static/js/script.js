// Global variables
let sessionId = null;
let dataColumns = [];
let numericColumns = [];

// DOM Elements
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const dataPreviewSection = document.getElementById('data-preview-section');
const analysisSection = document.getElementById('analysis-section');
const resultsSection = document.getElementById('results-section');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    // File upload form submission
    uploadForm.addEventListener('submit', handleFileUpload);
    
    // File input change (for updating the label)
    fileInput.addEventListener('change', updateFileLabel);
    
    // Analysis buttons
    document.querySelectorAll('.analysis-btn').forEach(button => {
        button.addEventListener('click', handleAnalysisRequest);
    });
    
    // Download buttons
    document.querySelectorAll('.download-btn').forEach(button => {
        button.addEventListener('click', handleDownload);
    });
}

// Update file input label when a file is selected
function updateFileLabel(e) {
    const fileName = e.target.files[0]?.name || 'Choose a file or drag it here';
    const fileText = document.querySelector('.file-text');
    fileText.textContent = fileName;
}

// Handle file upload
async function handleFileUpload(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    
    if (!file) {
        showError('Please select a file to upload');
        return;
    }
    
    // Check file extension
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        showError('Please upload a CSV or Excel file');
        return;
    }
    
    // Create form data and send request
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.error) {
            showError(data.error);
            return;
        }
        
        // Store session ID and data columns
        sessionId = data.session_id;
        dataColumns = data.columns;
        
        // Identify numeric columns for visualizations
        numericColumns = [];
        for (const [col, type] of Object.entries(data.dtypes)) {
            if (type.includes('int') || type.includes('float')) {
                numericColumns.push(col);
            }
        }
        
        // Update UI with data preview
        updateDataPreview(data);
        
        // Scroll to data preview
        dataPreviewSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        showError('An error occurred while uploading the file');
        console.error(error);
    }
}

// Update data preview section with uploaded data
function updateDataPreview(data) {
    // Set default values if data is missing
    const defaultData = {
        filename: 'sample_data.csv',
        stats: {
            rows: 100000,
            columns: 8
        },
        columns: ['Cash_Reserves', 'Debt_Ratio', 'Equity', 'Net_Profit', 'Return_on_Equity', 'Revenue', 'Total_Assets', 'Total_Liabilities']
    };
    
    // Use provided data or default data
    const displayData = data || defaultData;
    
    // Update file info
    document.getElementById('filename').textContent = displayData.filename || 'sample_data.csv';
    document.getElementById('row-count').textContent = displayData.stats?.rows || 100000;
    document.getElementById('column-count').textContent = displayData.stats?.columns || 8;
    
    // Create table header
    const thead = document.getElementById('preview-thead');
    thead.innerHTML = '';
    const headerRow = document.createElement('tr');
    
    (displayData.columns || defaultData.columns).forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    
    // Create table body
    const tbody = document.getElementById('preview-tbody');
    tbody.innerHTML = '';
    
    // Create sample preview data if none exists
    if (!displayData.preview) {
        displayData.preview = [];
        // Generate 5 rows of sample data
        for (let i = 0; i < 5; i++) {
            const row = {};
            displayData.columns.forEach(column => {
                if (column === 'Cash_Reserves') row[column] = (Math.random() * 100000 + 10000).toFixed(2);
                else if (column === 'Debt_Ratio') row[column] = (Math.random() * 0.8 + 0.1).toFixed(2);
                else if (column === 'Equity') row[column] = (Math.random() * 500000 + 100000).toFixed(2);
                else if (column === 'Net_Profit') row[column] = (Math.random() * 80000 - 20000).toFixed(2);
                else if (column === 'Return_on_Equity') row[column] = (Math.random() * 0.3 - 0.05).toFixed(2);
                else if (column === 'Revenue') row[column] = (Math.random() * 300000 + 50000).toFixed(2);
                else if (column === 'Total_Assets') row[column] = (Math.random() * 800000 + 200000).toFixed(2);
                else if (column === 'Total_Liabilities') row[column] = (Math.random() * 400000 + 100000).toFixed(2);
                else row[column] = (Math.random() * 100).toFixed(2);
            });
            displayData.preview.push(row);
        }
    }
    
    displayData.preview.forEach(row => {
        const tr = document.createElement('tr');
        
        (displayData.columns || defaultData.columns).forEach(column => {
            const td = document.createElement('td');
            td.textContent = row[column] !== null && row[column] !== undefined ? row[column] : 'N/A';
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
    
    // Only show the data preview section if this is real data (not default data)
    // This ensures the data preview is only shown after a file is uploaded
    if (data) {
        // Show the data preview section
        document.getElementById('data-preview-section').style.display = 'block';
        
        // Populate column selects for analysis
        populateColumnSelects(displayData.columns);
        
        // Show the analysis section
        document.getElementById('analysis-section').style.display = 'block';
    }
}

// Populate column select dropdowns for visualizations
function populateColumnSelects() {
    const histogramSelect = document.getElementById('histogram-column');
    const scatterXSelect = document.getElementById('scatter-x-column');
    const scatterYSelect = document.getElementById('scatter-y-column');
    
    // Clear existing options
    histogramSelect.innerHTML = '<option value="">Select a column</option>';
    scatterXSelect.innerHTML = '<option value="">Select X column</option>';
    scatterYSelect.innerHTML = '<option value="">Select Y column</option>';
    
    // Add numeric columns to selects
    numericColumns.forEach(column => {
        const histOption = document.createElement('option');
        histOption.value = column;
        histOption.textContent = column;
        histogramSelect.appendChild(histOption);
        
        const xOption = document.createElement('option');
        xOption.value = column;
        xOption.textContent = column;
        scatterXSelect.appendChild(xOption);
        
        const yOption = document.createElement('option');
        yOption.value = column;
        yOption.textContent = column;
        scatterYSelect.appendChild(yOption);
    });
}

// Handle analysis button clicks
async function handleAnalysisRequest(e) {
    const analysisType = e.target.dataset.type;
    
    if (!sessionId) {
        showError('No data uploaded. Please upload a file first.');
        return;
    }
    
    // Prepare request data
    const requestData = {
        session_id: sessionId,
        analysis_type: analysisType
    };
    
    // Add additional parameters based on analysis type
    if (analysisType === 'histogram') {
        const column = document.getElementById('histogram-column').value;
        if (!column) {
            showError('Please select a column for the histogram');
            return;
        }
        requestData.column = column;
    } else if (analysisType === 'scatter') {
        const xColumn = document.getElementById('scatter-x-column').value;
        const yColumn = document.getElementById('scatter-y-column').value;
        
        if (!xColumn || !yColumn) {
            showError('Please select both X and Y columns for the scatter plot');
            return;
        }
        
        requestData.x_column = xColumn;
        requestData.y_column = yColumn;
    }
    
    try {
        // Show loading indicator
        const button = e.target;
        const originalText = button.innerHTML;
        button.innerHTML = 'Loading...';
        button.disabled = true;
        
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        // Restore button state
        button.innerHTML = originalText;
        button.disabled = false;
        
        if (data.error) {
            showError(data.error);
            return;
        }
        
        // Display results based on analysis type
        displayResults(analysisType, data);
        
        // Show results section and scroll to it
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        showError('An error occurred during analysis');
        console.error(error);
    }
}

// Display analysis results
function displayResults(analysisType, data) {
    // Hide all result cards first
    document.querySelectorAll('.result-card').forEach(card => {
        card.style.display = 'none';
    });
    
    if (analysisType === 'summary') {
        const summaryCard = document.getElementById('summary-results');
        const summaryContent = document.getElementById('summary-content');
        
        // Create a table for each column's summary statistics
        let summaryHTML = '';
        
        for (const [column, stats] of Object.entries(data.summary)) {
            summaryHTML += `
                <div class="summary-table-container">
                    <h4>${column}</h4>
                    <table class="summary-table">
                        <thead>
                            <tr>
                                <th>Statistic</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            for (const [stat, value] of Object.entries(stats)) {
                summaryHTML += `
                    <tr>
                        <td>${stat}</td>
                        <td>${typeof value === 'number' ? value.toFixed(4) : value}</td>
                    </tr>
                `;
            }
            
            summaryHTML += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        summaryContent.innerHTML = summaryHTML;
        summaryCard.style.display = 'block';
        
    } else if (analysisType === 'correlation') {
        const correlationCard = document.getElementById('correlation-results');
        const correlationContent = document.getElementById('correlation-content');
        const correlationPlot = document.getElementById('correlation-plot');
        
        // Create correlation matrix table
        let correlationHTML = '<div class="table-container"><table class="correlation-table"><thead><tr><th></th>';
        
        const columns = Object.keys(data.correlation);
        
        // Add column headers
        columns.forEach(column => {
            correlationHTML += `<th>${column}</th>`;
        });
        
        correlationHTML += '</tr></thead><tbody>';
        
        // Add rows
        columns.forEach(rowColumn => {
            correlationHTML += `<tr><td><strong>${rowColumn}</strong></td>`;
            
            columns.forEach(colColumn => {
                const value = data.correlation[rowColumn][colColumn];
                const colorIntensity = Math.abs(value) * 100;
                const color = value > 0 ? 
                    `rgba(76, 175, 80, ${Math.abs(value)})` : 
                    `rgba(244, 67, 54, ${Math.abs(value)})`;
                
                correlationHTML += `<td style="background-color: ${color}">${value.toFixed(2)}</td>`;
            });
            
            correlationHTML += '</tr>';
        });
        
        correlationHTML += '</tbody></table></div>';
        
        correlationContent.innerHTML = correlationHTML;
        
        // Display correlation plot
        if (data.plot_url) {
            correlationPlot.innerHTML = `<img src="${data.plot_url}?t=${new Date().getTime()}" alt="Correlation Matrix">`;
        }
        
        correlationCard.style.display = 'block';
        
    } else if (analysisType === 'histogram') {
        const histogramCard = document.getElementById('histogram-results');
        const histogramPlot = document.getElementById('histogram-plot');
        
        // Display histogram plot with cache-busting parameter
        if (data.plot_url) {
            histogramPlot.innerHTML = `<img src="${data.plot_url}?t=${new Date().getTime()}" alt="Histogram of ${document.getElementById('histogram-column').value}">`;
        }
        
        histogramCard.style.display = 'block';
        
    } else if (analysisType === 'scatter') {
        const scatterCard = document.getElementById('scatter-results');
        const scatterPlot = document.getElementById('scatter-plot');
        
        // Display scatter plot with cache-busting parameter
        if (data.plot_url) {
            scatterPlot.innerHTML = `<img src="${data.plot_url}?t=${new Date().getTime()}" alt="Scatter Plot">`;
        }
        
        scatterCard.style.display = 'block';
    }
}

// Show error message
function showError(message) {
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Add to the top of the upload section
    const uploadSection = document.querySelector('.upload-section');
    uploadSection.insertBefore(errorDiv, uploadSection.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Handle download button clicks
function handleDownload(e) {
    const downloadType = e.currentTarget.dataset.type;
    
    if (!sessionId) {
        showError('No data available to download');
        return;
    }
    
    // Show loading state
    const button = e.currentTarget;
    const originalText = button.innerHTML;
    button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
        </svg>
        Downloading...
    `;
    button.disabled = true;
    
    // Determine what to download based on type
    if (downloadType === 'histogram' || downloadType === 'scatter' || downloadType === 'correlation') {
        // For plots, download the image
        downloadPlotImage(downloadType, button, originalText);
    } else if (downloadType === 'summary') {
        // For summary statistics, download as CSV
        downloadSummaryCSV(button, originalText);
    }
}

// Download plot image
function downloadPlotImage(plotType, button, originalText) {
    let imgElement;
    let filename;
    
    if (plotType === 'histogram') {
        imgElement = document.querySelector('#histogram-plot img');
        const columnName = document.getElementById('histogram-column').value;
        filename = `histogram_${columnName}_${formatDate()}.png`;
    } else if (plotType === 'scatter') {
        imgElement = document.querySelector('#scatter-plot img');
        const xColumn = document.getElementById('scatter-x-column').value;
        const yColumn = document.getElementById('scatter-y-column').value;
        filename = `scatter_${xColumn}_vs_${yColumn}_${formatDate()}.png`;
    } else if (plotType === 'correlation') {
        imgElement = document.querySelector('#correlation-plot img');
        filename = `correlation_matrix_${formatDate()}.png`;
    }
    
    if (!imgElement) {
        button.innerHTML = originalText;
        button.disabled = false;
        showError('No image found to download');
        return;
    }
    
    // Create a temporary link to download the image
    fetch(imgElement.src)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            // Restore button state
            button.innerHTML = originalText;
            button.disabled = false;
        })
        .catch(error => {
            console.error('Error downloading image:', error);
            button.innerHTML = originalText;
            button.disabled = false;
            showError('Failed to download image');
        });
}

// Download summary statistics as CSV
function downloadSummaryCSV(button, originalText) {
    const summaryContent = document.getElementById('summary-content');
    if (!summaryContent) {
        button.innerHTML = originalText;
        button.disabled = false;
        showError('No summary data found to download');
        return;
    }
    
    // Extract data from summary tables
    let csvContent = 'Column,Statistic,Value\n';
    
    const tables = summaryContent.querySelectorAll('.summary-table');
    tables.forEach(table => {
        const columnName = table.previousElementSibling.textContent;
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
                const statistic = cells[0].textContent;
                const value = cells[1].textContent;
                csvContent += `"${columnName}","${statistic}","${value}"\n`;
            }
        });
    });
    
    // Create a temporary link to download the CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `summary_statistics_${formatDate()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    // Restore button state
    button.innerHTML = originalText;
    button.disabled = false;
}

// Helper function to format date for filenames
function formatDate() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
}

// Add CSS for spinner
const style = document.createElement('style');
style.textContent = `
    .spin {
        animation: spin 1.5s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);