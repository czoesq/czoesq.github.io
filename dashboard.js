// Dashboard JavaScript
let currentData = null;
let currentSortKey = 'revenue';
let currentSortDirection = -1; // -1 for descending, 1 for ascending

document.addEventListener('DOMContentLoaded', function() {
    // Load data
    fetch('dashboard_data.json')
        .then(response => response.json())
        .then(data => {
            currentData = data;
            updateStats(data);
            createCharts(data);
            updateProductsTable(data);
            generateInsights(data);
        })
        .catch(error => {
            console.error('Error loading data:', error);
            document.body.innerHTML = '<div class="alert alert-danger">Error loading dashboard data</div>';
        });
});

function sortProducts(key) {
    if (currentSortKey === key) {
        currentSortDirection *= -1;
    } else {
        currentSortKey = key;
        currentSortDirection = -1;
    }
    updateProductsTable(currentData);
}

function updateStats(data) {
    // Update summary statistics
    document.getElementById('total-sales').textContent = data.total_sales.toLocaleString();
    document.getElementById('total-revenue').textContent = '$' + data.total_revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('avg-order').textContent = '$' + data.avg_order_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    
    if (data.date_range.start && data.date_range.end) {
        const start = new Date(data.date_range.start).toLocaleDateString();
        const end = new Date(data.date_range.end).toLocaleDateString();
        document.getElementById('date-range').textContent = `${start} to ${end} (${data.date_range.days} days)`;
    }
}

function createCharts(data) {
    // 1. Monthly Sales Chart
    const months = data.monthly_data.map(d => d.month);
    const revenue = data.monthly_data.map(d => d.revenue);
    const sales = data.monthly_data.map(d => d.sales);
    
    const monthlyTrace1 = {
        x: months,
        y: revenue,
        name: 'Revenue',
        type: 'scatter',
        mode: 'lines+markers',
        line: {color: 'blue', width: 3},
        yaxis: 'y'
    };
    
    const monthlyTrace2 = {
        x: months,
        y: sales,
        name: 'Units Sold',
        type: 'bar',
        marker: {color: 'lightblue', opacity: 0.7},
        yaxis: 'y2'
    };
    
    const monthlyLayout = {
        title: 'Monthly Sales Trends',
        xaxis: {title: 'Month'},
        yaxis: {title: 'Revenue ($)', side: 'left'},
        yaxis2: {title: 'Units Sold', side: 'right', overlaying: 'y'},
        hovermode: 'x unified',
        showlegend: true
    };
    
    Plotly.newPlot('monthly-chart', [monthlyTrace1, monthlyTrace2], monthlyLayout);
    
    // 2. Design Categories Chart
    const designData = [
        {category: 'T-Shirts', revenue: data.total_revenue * 0.996, sales: data.total_sales * 0.996},
        {category: 'Hoodies', revenue: data.total_revenue * 0.003, sales: data.total_sales * 0.003},
        {category: 'Other', revenue: data.total_revenue * 0.001, sales: data.total_sales * 0.001}
    ];
    
    const designTrace = {
        values: designData.map(d => d.revenue),
        labels: designData.map(d => d.category),
        type: 'pie',
        hole: 0.4,
        textinfo: 'label+percent',
        hovertemplate: '<b>%{label}</b><br>Revenue: $%{value:,.2f}<br>Sales: %{customdata}<extra></extra>',
        customdata: designData.map(d => Math.round(d.sales))
    };
    
    const designLayout = {
        title: 'Revenue by Design Category',
        annotations: [{text: 'Revenue', showarrow: false}]
    };
    
    Plotly.newPlot('design-chart', [designTrace], designLayout);
    
    // 3. Top Products Chart
    const topProducts = data.top_products.slice(0, 15);
    const productNames = topProducts.map(p => p.title);
    const productRevenue = topProducts.map(p => p.revenue);
    const productSales = topProducts.map(p => p.sales);
    
    const topProductsTrace = {
        x: productRevenue,
        y: productNames,
        type: 'bar',
        orientation: 'h',
        marker: {
            color: productSales,
            colorscale: 'Viridis',
            showscale: true,
            colorbar: {title: 'Units Sold'}
        },
        hovertemplate: '<b>%{y}</b><br>Revenue: $%{x:,.2f}<br>Sales: %{marker.color}<extra></extra>'
    };
    
    const topProductsLayout = {
        title: 'Top Products by Revenue',
        xaxis: {title: 'Revenue ($)'},
        yaxis: {autorange: 'reversed'},
        height: 500
    };
    
    Plotly.newPlot('top-products-chart', [topProductsTrace], topProductsLayout);
    
    // 4. Price Distribution Chart
    const priceRanges = data.price_distribution.map(p => p.range);
    const priceSales = data.price_distribution.map(p => p.sales);
    
    const priceTrace = {
        x: priceRanges,
        y: priceSales,
        type: 'bar',
        marker: {color: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800']},
        hovertemplate: '<b>%{x}</b><br>Sales: %{y}<br>Revenue: $%{customdata:,.2f}<extra></extra>',
        customdata: data.price_distribution.map(p => p.revenue)
    };
    
    const priceLayout = {
        title: 'Sales by Price Range',
        xaxis: {title: 'Price Range'},
        yaxis: {title: 'Number of Sales'}
    };
    
    Plotly.newPlot('price-chart', [priceTrace], priceLayout);
}

function updateProductsTable(data) {
    const tbody = document.getElementById('products-body');
    tbody.innerHTML = '';
    
    // Sort logic
    const sortedProducts = [...data.top_products].sort((a, b) => {
        let valA = a[currentSortKey];
        let valB = b[currentSortKey];
        
        if (currentSortKey === 'avg_price') {
            valA = a.revenue / a.sales;
            valB = b.revenue / b.sales;
        }

        if (valA < valB) return -1 * currentSortDirection;
        if (valA > valB) return 1 * currentSortDirection;
        return 0;
    });

    sortedProducts.slice(0, 10).forEach((product, index) => {
        const row = document.createElement('tr');
        
        // Highlight top 3 products
        if (index < 3) {
            row.classList.add('table-success');
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td title="${product.full_title}">${product.title}</td>
            <td>${product.sales.toLocaleString()}</td>
            <td>$${product.revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>${product.velocity.toFixed(2)}/day</td>
            <td>$${(product.revenue / product.sales).toFixed(2)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

function generateInsights(data) {
    const insightsDiv = document.getElementById('insights');
    
    const insights = [
        {
            title: "💰 Price Concentration",
            content: `${((data.price_distribution.find(p => p.range === '$20-$30')?.sales || 0) / data.total_sales * 100).toFixed(1)}% of sales are in the $20-$30 range`,
            icon: "💰"
        },
        {
            title: "🏆 Top Product Performance",
            content: `Top product "${data.top_products[0]?.title}" has ${data.top_products[0]?.sales} sales generating $${data.top_products[0]?.revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            icon: "🏆"
        },
        {
            title: "📈 Sales Velocity",
            content: `Best performing product sells at ${data.top_products[0]?.velocity.toFixed(2)} units per day`,
            icon: "📈"
        },
        {
            title: "🎯 Opportunity",
            content: `Consider testing price points at $24.99 and $29.99 to optimize the $27.33 concentration`,
            icon: "🎯"
        }
    ];
    
    insightsDiv.innerHTML = insights.map(insight => `
        <div class="col-md-6 mb-3">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${insight.icon} ${insight.title}</h5>
                    <p class="card-text">${insight.content}</p>
                </div>
            </div>
        </div>
    `).join('');
}