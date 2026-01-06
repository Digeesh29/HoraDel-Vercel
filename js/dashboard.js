// Check if we're in client interface at file load time
if (window.location.href.includes('/Client/') || 
    document.title.includes('Client') ||
    document.querySelector('script[src*="/Client/js/"]')) {
    debugLog('🚫 Admin dashboard.js blocked - Client interface detected');
    // Stop loading this file completely
    throw new Error('Admin dashboard.js blocked in client interface');
}

// Fetch dashboard data from API
async function initAdminDashboardPage() {
    // Additional runtime check
    debugLog('🔍 Admin dashboard function called');
    debugLog('🔍 Current pathname:', window.location.pathname);
    debugLog('🔍 Document title:', document.title);
    debugLog('🔍 Brand title element:', document.querySelector('.brand-title')?.textContent);
    
    if (window.location.pathname.includes('/Client/') || 
        document.title.includes('Client') ||
        document.querySelector('.brand-title')?.textContent?.includes('Client')) {
        debugLog('🚫 Admin dashboard blocked in client interface');
        return;
    }
    
    try {
        // Show loading state
        showLoadingState();

        // Debug API_BASE_URL
        debugLog('🔍 API_BASE_URL value:', API_BASE_URL);
        
        // Fetch complete dashboard summary from API
        debugLog('📊 Fetching dashboard summary from:', `${API_BASE_URL}/dashboard/summary`);
        let response = await fetch(`${API_BASE_URL}/dashboard/summary`);
        
        // If main endpoint fails, try fallback
        if (!response.ok) {
            debugLog('⚠️ Main dashboard endpoint failed, trying fallback...');
            response = await fetch(`${API_BASE_URL}/dashboard-summary`);
        }
        
        debugLog('📡 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        debugLog('📊 Full API Response:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to fetch dashboard data');
        }

        const { stats, recentBookings, trend, companyDistribution, statusOverview } = result.data;
        debugLog('📈 Extracted data:', { stats, recentBookings: recentBookings?.length, trend, companyDistribution, statusOverview });

        // === UPDATE STATS NUMBERS ===
        const dashBookings = document.getElementById("dashBookings");
        const dashActiveVehicles = document.getElementById("dashActiveVehicles");
        const dashParcels = document.getElementById("dashParcels");
        const dashPending = document.getElementById("dashPending");

        if (dashBookings) dashBookings.innerText = stats.todayBookings || 0;
        if (dashActiveVehicles) dashActiveVehicles.innerText = stats.activeVehicles || 0;
        if (dashParcels) dashParcels.innerText = stats.parcelsInTransit || 0;
        if (dashPending) dashPending.innerText = stats.pendingDeliveries || 0;

        // === UPDATE TOTAL STATS ===
        debugLog('📊 Total Stats Debug:', {
            totalBookings: stats.totalBookings,
            totalInTransit: stats.totalInTransit,
            allTimeDelivered: stats.allTimeDelivered,
            fullStatsObject: stats
        });
        
        // Debug: Show all available fields in stats
        debugLog('📊 All stats fields:', Object.keys(stats));
        debugLog('📊 Stats values:', Object.entries(stats));
        
        const dashTotalBookings = document.getElementById("dashTotalBookings");
        const dashTotalInTransit = document.getElementById("dashTotalInTransit");
        const dashTotalDelivered = document.getElementById("dashTotalDelivered");

        // Use fallback values if API returns undefined/null
        const totalBookings = stats.totalBookings ?? 'N/A';
        const totalInTransit = stats.totalInTransit ?? 'N/A';
        const totalDelivered = stats.allTimeDelivered ?? 'N/A';

        debugLog('📊 Final values to display:', { totalBookings, totalInTransit, totalDelivered });

        if (dashTotalBookings) {
            dashTotalBookings.innerText = totalBookings;
            debugLog('✅ Set totalBookings to:', totalBookings);
        } else {
            debugError('❌ dashTotalBookings element not found');
        }
        
        if (dashTotalInTransit) {
            dashTotalInTransit.innerText = totalInTransit;
            debugLog('✅ Set totalInTransit to:', totalInTransit);
        } else {
            debugError('❌ dashTotalInTransit element not found');
        }
        
        if (dashTotalDelivered) {
            dashTotalDelivered.innerText = totalDelivered;
            debugLog('✅ Set totalDelivered to:', totalDelivered);
        } else {
            debugError('❌ dashTotalDelivered element not found');
        }

        // Removed hardcoded test values - now showing real API data

        // === UPDATE GROWTH RATES ===
        updateGrowthRate("dashBookingsGrowth", stats.todayBookingsGrowth);
        updateGrowthRate("dashActiveVehiclesGrowth", stats.activeVehiclesGrowth);
        updateGrowthRate("dashParcelsGrowth", stats.parcelsInTransitGrowth);
        updateGrowthRate("dashPendingGrowth", stats.pendingDeliveriesGrowth);



        // === RENDER LATEST 10 BOOKINGS TABLE ===
        renderBookingsTable(recentBookings);

        // === RENDER CHARTS ===
        renderTrendChart(trend);
        renderCompanyDistributionChart(companyDistribution);

        // Hide loading state
        hideLoadingState();

    } catch (error) {
        debugError('Error loading dashboard:', error);
        showErrorState(error.message);
    }
}

// Update growth rate display
function updateGrowthRate(elementId, growthValue) {
    const element = document.getElementById(elementId);
    if (!element) {
        debugWarn(`Element with ID '${elementId}' not found`);
        return;
    }

    const isPositive = growthValue >= 0;
    const sign = isPositive ? '+' : '';
    
    element.textContent = `${sign}${growthValue}%`;
    element.className = `stat-change ${isPositive ? 'stat-up' : 'stat-down'}`;
}

// Render bookings table
function renderBookingsTable(bookings) {
    const tbody = document.getElementById("dashTableBody");
    
    // Filter to only show BOOKED bookings without assigned vehicles (frontend fallback)
    const unassignedBookings = (bookings || []).filter(b => 
        b.status === 'BOOKED' && !b.assigned_vehicle_id
    );
    
    if (!unassignedBookings || unassignedBookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:40px; color:#9ca3af;">
                    <div style="margin-bottom:8px;">🎉 All bookings have been assigned!</div>
                    <div style="font-size:13px;">No pending assignments at the moment.</div>
                </td>
            </tr>
        `;
        return;
    }

    function statusClass(status) {
        switch (status) {
            case "Dispatched": return "st-dispatched";
            case "Assigned":   return "st-assigned";
            case "Verified":   return "st-verified";
            case "Submitted":  return "st-submitted";
            case "Pending":    return "st-pending";
            case "InTransit":  return "st-assigned";
            case "Delivered":  return "st-verified";
            default:           return "st-pending";
        }
    }

    tbody.innerHTML = unassignedBookings.map(b => {
        const badge = statusClass(b.status);
        const companyName = b.company?.name || 'N/A';
        
        // Format booking date
        const bookingDate = new Date(b.booking_date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <tr>
                <td style="font-weight:500;">${b.lr_number}</td>
                <td>${bookingDate}</td>
                <td>${companyName}</td>
                <td>${b.consignee_name}</td>
                <td>${b.destination}</td>
                <td>${b.article_count}</td>
                <td><span class="status-badge ${badge}">${b.status}</span></td>
                <td>
                    <button class="view-btn-icon" onclick="openSlideoverForLR('${b.lr_number}')">
                        <span class="material-symbols-outlined" style="font-size:18px;">visibility</span>
                    </button>
                    <button class="view-btn-icon" onclick='printBookingPDF(${JSON.stringify(b).replace(/"/g,"&quot;")})'>
                        <span class="material-symbols-outlined" style="font-size:18px;">print</span>
                    </button>
                </td>
            </tr>
        `;
    }).join("");

}

// Render trend chart
function renderTrendChart(trend) {
    if (window._dashTrendChart) window._dashTrendChart.destroy();

    const trendCtx = document.getElementById("dashTrendChart");
    if (!trendCtx) return;

    window._dashTrendChart = new Chart(trendCtx, {
        type: "line",
        data: {
            labels: trend.labels || ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
            datasets: [{
                label: "Bookings",
                data: trend.values || [0, 0, 0, 0, 0, 0, 0],
                borderColor: "#3b82f6",
                backgroundColor: "transparent",
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: "#3b82f6",
                pointBorderColor: "#3b82f6",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'white',
                    titleColor: '#1f2937',
                    bodyColor: '#6b7280',
                    borderColor: '#e5e7eb',
                    borderWidth: 1
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: "#f3f4f6", drawBorder: false },
                    ticks: { color: "#6b7280", font: { size: 11 } }
                },
                x: { 
                    grid: { display: false, drawBorder: false },
                    ticks: { color: "#6b7280", font: { size: 11 } }
                }
            }
        }
    });
}

// Render company distribution chart
function renderCompanyDistributionChart(distribution) {
    if (window._dashLoadChart) window._dashLoadChart.destroy();

    const loadCtx = document.getElementById("dashLoadChart");
    if (!loadCtx) return;

    window._dashLoadChart = new Chart(loadCtx, {
        type: "bar",
        data: {
            labels: distribution.labels || [],
            datasets: [{
                label: "Load",
                data: distribution.values || [],
                backgroundColor: "#10b981",
                borderRadius: 6,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'white',
                    titleColor: '#1f2937',
                    bodyColor: '#6b7280',
                    borderColor: '#e5e7eb',
                    borderWidth: 1
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: "#f3f4f6", drawBorder: false },
                    ticks: { color: "#6b7280", font: { size: 11 } }
                },
                x: { 
                    grid: { display: false, drawBorder: false },
                    ticks: { color: "#6b7280", font: { size: 11 } }
                }
            }
        }
    });
}

// Show loading state
function showLoadingState() {
    const statsCards = document.querySelectorAll('.stat-value');
    statsCards.forEach(card => {
        card.innerHTML = '<span style="color:#9ca3af;">...</span>';
    });

    const tbody = document.getElementById("dashTableBody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:40px; color:#9ca3af;">
                    <div style="display:inline-block; animation: spin 1s linear infinite;">⏳</div>
                    Loading dashboard data...
                </td>
            </tr>
        `;
    }
}

// Hide loading state
function hideLoadingState() {
    // Loading state is replaced by actual data
}

// Show error state
function showErrorState(message) {
    const tbody = document.getElementById("dashTableBody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:40px; color:#ef4444;">
                    <div style="margin-bottom:8px;">❌ Error loading dashboard</div>
                    <div style="font-size:13px; color:#9ca3af;">${message}</div>
                    <button onclick="initAdminDashboardPage()" style="margin-top:16px; padding:8px 16px; background:#111827; color:white; border:none; border-radius:6px; cursor:pointer;">
                        Retry
                    </button>
                </td>
            </tr>
        `;
    }

    // Show error toast
    if (typeof showToast === 'function') {
        showToast('Failed to load dashboard data', 'error');
    }
}

// Setup view all bookings button
function setupViewAllButton() {
    const viewAllBtn = document.getElementById("viewAllBookingsBtn");
    if (viewAllBtn) {
        viewAllBtn.addEventListener("click", () => {
            const navBtn = document.querySelector('.nav-item[data-page="bookings"]');
            if (navBtn) navBtn.click();
        });
    }
}

// Add CSS animation for loading spinner
if (!document.getElementById('dashboard-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'dashboard-spinner-style';
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// Debug function to test database data
async function testDashboardData() {
    try {
        debugLog('� Testeing dashboard data...');
        const response = await fetch(`${API_BASE_URL}/dashboard/test-data`);
        const result = await response.json();
        
        if (result.success) {
            debugLog('📊 Database Test Results:', result.data);
            alert(`Database Test Results:\n\nTotal Bookings Found: ${result.data.totalFound}\nStatus Counts: ${JSON.stringify(result.data.statusCounts, null, 2)}\n\nCheck console for details.`);
        } else {
            debugError('❌ Test failed:', result.error);
            alert('Test failed: ' + result.error);
        }
    } catch (error) {
        debugError('❌ Test error:', error);
        alert('Test error: ' + error.message);
    }
}

// Test the summary API directly
async function testSummaryAPI() {
    try {
        debugLog('🔍 Testing summary API...');
        const response = await fetch(`${API_BASE_URL}/dashboard/summary`);
        const result = await response.json();
        
        debugLog('📊 Summary API Response:', result);
        
        if (result.success && result.data && result.data.stats) {
            const stats = result.data.stats;
            alert(`Summary API Test:\n\nTotal Bookings: ${stats.totalBookings}\nTotal In-Transit: ${stats.totalInTransit}\nAll Time Delivered: ${stats.allTimeDelivered}\n\nFull stats object in console.`);
        } else {
            alert('Summary API returned no stats data');
        }
    } catch (error) {
        debugError('❌ Summary API error:', error);
        alert('Summary API error: ' + error.message);
    }
}

// Add to window for console access
window.testDashboardData = testDashboardData;
window.testSummaryAPI = testSummaryAPI;