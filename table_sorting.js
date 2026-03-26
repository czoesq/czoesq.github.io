/**
 * Table Sorting Functionality for Dashboard
 * Adds click-to-sort functionality to all tables
 */

class TableSorter {
    constructor() {
        this.tables = document.querySelectorAll('table');
        this.init();
    }

    init() {
        this.tables.forEach(table => {
            this.addSortingToTable(table);
        });
    }

    addSortingToTable(table) {
        const headers = table.querySelectorAll('th');
        
        headers.forEach((header, index) => {
            // Only make sortable if header contains text (not empty)
            if (header.textContent.trim()) {
                header.style.cursor = 'pointer';
                header.style.position = 'relative';
                header.title = 'Click to sort';
                
                // Add sort indicator
                const indicator = document.createElement('span');
                indicator.className = 'sort-indicator';
                indicator.innerHTML = ' ↕';
                indicator.style.opacity = '0.5';
                indicator.style.fontSize = '0.8em';
                header.appendChild(indicator);
                
                header.addEventListener('click', () => {
                    this.sortTable(table, index);
                    this.updateSortIndicator(header, table, index);
                });
            }
        });
    }

    sortTable(table, columnIndex) {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('tr'));
        const isNumeric = this.isColumnNumeric(rows, columnIndex);
        const currentOrder = table.getAttribute('data-sort-order') || 'asc';
        const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';

        rows.sort((a, b) => {
            const aCell = a.cells[columnIndex];
            const bCell = b.cells[columnIndex];
            
            let aValue = aCell ? aCell.textContent.trim() : '';
            let bValue = bCell ? bCell.textContent.trim() : '';

            if (isNumeric) {
                aValue = this.parseNumber(aValue);
                bValue = this.parseNumber(bValue);
            }

            if (newOrder === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });

        // Remove existing rows
        while (tbody.firstChild) {
            tbody.removeChild(tbody.firstChild);
        }

        // Add sorted rows
        rows.forEach(row => tbody.appendChild(row));
        
        // Store sort state
        table.setAttribute('data-sort-column', columnIndex);
        table.setAttribute('data-sort-order', newOrder);
    }

    isColumnNumeric(rows, columnIndex) {
        // Check first few rows to determine if column is numeric
        const sampleRows = rows.slice(0, Math.min(5, rows.length));
        
        return sampleRows.some(row => {
            const cell = row.cells[columnIndex];
            if (!cell) return false;
            
            const text = cell.textContent.trim();
            // Check if it looks like a number (with optional $, commas, etc.)
            return /^\$?[\d,]+(\.\d+)?%?$/.test(text) || 
                   /^\d+$/.test(text) ||
                   text.includes('$');
        });
    }

    parseNumber(text) {
        // Remove currency symbols, commas, and percentage signs
        const cleaned = text.replace(/[$,%]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? text : num;
    }

    updateSortIndicator(clickedHeader, table, columnIndex) {
        // Reset all indicators
        table.querySelectorAll('th .sort-indicator').forEach(indicator => {
            indicator.innerHTML = ' ↕';
            indicator.style.opacity = '0.5';
        });

        // Update clicked header indicator
        const currentOrder = table.getAttribute('data-sort-order');
        const indicator = clickedHeader.querySelector('.sort-indicator');
        
        if (currentOrder === 'asc') {
            indicator.innerHTML = ' ↑';
            indicator.style.opacity = '1';
        } else {
            indicator.innerHTML = ' ↓';
            indicator.style.opacity = '1';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TableSorter();
    
    // Add some CSS for better visual feedback
    const style = document.createElement('style');
    style.textContent = `
        th:hover {
            background-color: #f8f9fa;
        }
        .sort-indicator {
            margin-left: 5px;
            font-weight: bold;
        }
        table {
            border-collapse: collapse;
            width: 100%;
        }
        th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
    `;
    document.head.appendChild(style);
});

// Also provide a simple function that can be called directly
function enableTableSorting() {
    return new TableSorter();
}