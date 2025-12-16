// CLIENT DASHBOARD PAGE

async function initClientDashboardPage() {
    console.log('📊 Initializing Client Dashboard page...');
    console.log('📊 This is the CLIENT dashboard, not admin dashboard');
    
    // Debug: Check if we have company information
    const companyId = getCompanyId();
    const companyName = getCompanyName();
    
    if (!companyId || !companyName) {
        console.error('❌ Missing company information!');
        console.log('Available localStorage keys:', Object.keys(localStorage));
        
        // Show error message to user
        document.getElementById('content').innerHTML = `
            <div style="text-align: center; padding: 60px; color: #dc2626;">
                <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 16px;">error</span>
                <h3>Company Information Missing</h3>
                <p>Please logout and login again to refresh your company information.</p>
                <button onclick="logout()" style="background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 6px; margin-top: 16px; cursor: pointer;">Logout</button>
            </div>
        `;
        return;
    }
    
    // Load dashboard data
    await loadClientDashboardData();
}

function logout() {
    localStorage.clear();
    window.location.href = '/login';
}

async function loadClientDashboardData() {
    try {
        const companyId = getCompanyId();
        const companyName = getCompanyName();
        
        console.log('🔍 Client Dashboard Debug Info:');
        console.log('- Company ID:', companyId);
        console.log('- Company Name:', companyName);
        console.log('- API Base URL:', API_BASE_URL);
        console.log('- All localStorage:', Object.keys(localStorage).map(key => `${key}: ${localStorage.getItem(key)}`));
        
        if (!companyId) {
            console.error('❌ No company ID found in localStorage');
            showToast('Company information not found. Please login again.', 'error');
            return;
        }
        
        console.log(`📊 Loading dashboard data for company: ${companyName} (${companyId})`);
        
        // Update welcome message with company name
        const welcomeElement = document.getElementById('companyWelcome');
        if (welcomeElement) {
            welcomeElement.textContent = `${companyName} - Track your shipments and manage your bookings`;
        } else {
            console.warn('⚠️ companyWelcome element not found');
        }
        
        // Fetch company-specific dashboard data
        const apiUrl = `${API_BASE_URL}/dashboard/summary?companyId=${companyId}`;
        console.log('🌐 Fetching from:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('📡 Response status:', response.status);
        
        const result = await response.json();
        console.log('📊 Dashboard API response:', result);
        
        if (result.success) {
            // Update stats with real data
            const stats = result.data.stats || result.data;
            console.log('📈 Stats data:', stats);
            
            // Safely update elements with null checks
            const todayBookingsEl = document.getElementById('todayBookings');
            const pendingDeliveryEl = document.getElementById('pendingDelivery');
            const totalDeliveredEl = document.getElementById('totalDelivered');
            const inTransitEl = document.getElementById('inTransit');
            
            console.log('📊 Element check:', {
                todayBookings: !!todayBookingsEl,
                pendingDelivery: !!pendingDeliveryEl,
                totalDelivered: !!totalDeliveredEl,
                inTransit: !!inTransitEl
            });
            
            if (todayBookingsEl) todayBookingsEl.textContent = stats.todayBookings || '0';
            else console.warn('⚠️ todayBookings element not found');
            
            if (pendingDeliveryEl) pendingDeliveryEl.textContent = stats.pendingDeliveries || '0';
            else console.warn('⚠️ pendingDelivery element not found');
            
            if (totalDeliveredEl) totalDeliveredEl.textContent = stats.totalDelivered || '0';
            else console.warn('⚠️ totalDelivered element not found');
            
            if (inTransitEl) inTransitEl.textContent = stats.inTransit || '0';
            else console.warn('⚠️ inTransit element not found');
            
            console.log('✅ Client dashboard data loaded for company:', companyName);
            
            // Load recent bookings
            await loadRecentBookings(companyId);
        } else {
            console.error('❌ API returned error:', result.error);
            throw new Error(result.error || 'Failed to load dashboard data');
        }
        
    } catch (error) {
        console.error('❌ Error loading client dashboard data:', error);
        showToast('Error loading dashboard data: ' + error.message, 'error');
        
        // Fallback to default values with null checks
        const todayBookingsEl = document.getElementById('todayBookings');
        const pendingDeliveryEl = document.getElementById('pendingDelivery');
        const totalDeliveredEl = document.getElementById('totalDelivered');
        const inTransitEl = document.getElementById('inTransit');
        
        if (todayBookingsEl) todayBookingsEl.textContent = '0';
        if (pendingDeliveryEl) pendingDeliveryEl.textContent = '0';
        if (totalDeliveredEl) totalDeliveredEl.textContent = '0';
        if (inTransitEl) inTransitEl.textContent = '0';
    }
}

async function loadRecentBookings(companyId) {
    try {
        const bookingsUrl = `${API_BASE_URL}/bookings?companyId=${companyId}&limit=5`;
        console.log('📋 Fetching recent bookings from:', bookingsUrl);
        
        const response = await fetch(bookingsUrl);
        console.log('📡 Bookings response status:', response.status);
        
        const result = await response.json();
        console.log('📋 Bookings API response:', result);
        
        const tableBody = document.getElementById('recentBookingsTable');
        
        if (!tableBody) {
            console.error('❌ recentBookingsTable element not found');
            return;
        }
        
        if (result.success && result.data && result.data.length > 0) {
            console.log(`✅ Found ${result.data.length} recent bookings`);
            tableBody.innerHTML = result.data.map(booking => `
                <tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 16px 24px; color: #111827; font-weight: 500;">${booking.lr_number}</td>
                    <td style="padding: 16px 24px; color: #6b7280;">${new Date(booking.booking_date).toLocaleDateString()}</td>
                    <td style="padding: 16px 24px; color: #6b7280;">${booking.destination}</td>
                    <td style="padding: 16px 24px; color: #6b7280;">${booking.article_count}</td>
                    <td style="padding: 16px 24px;">
                        <span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; ${getStatusStyle(booking.status)}">${booking.status}</span>
                    </td>
                    <td style="padding: 16px 24px;">
                        <button onclick="trackShipment('${booking.lr_number}')" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">Track</button>
                    </td>
                </tr>
            `).join('');
        } else {
            console.log('⚠️ No bookings found for company:', companyId);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 40px; text-align: center; color: #6b7280;">
                        No bookings found for your company. 
                        <br><br>
                        <button onclick="loadPage('client-booking')" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; margin-right: 8px; cursor: pointer;">Create Booking</button>
                        <button onclick="createTestBooking()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Create Test Booking</button>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('❌ Error loading recent bookings:', error);
        const tableBody = document.getElementById('recentBookingsTable');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 40px; text-align: center; color: #dc2626;">
                        Error loading bookings: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

function getStatusStyle(status) {
    switch (status) {
        case 'DELIVERED':
            return 'background: #dcfce7; color: #16a34a;';
        case 'IN-TRANSIT':
            return 'background: #fef3c7; color: #d97706;';
        case 'BOOKED':
            return 'background: #dbeafe; color: #2563eb;';
        default:
            return 'background: #f3f4f6; color: #6b7280;';
    }
}

// Test function to create a sample booking
async function createTestBooking() {
    try {
        const companyId = getCompanyId();
        const companyName = getCompanyName();
        
        if (!companyId) {
            showToast('Company ID not found', 'error');
            return;
        }
        
        console.log('🧪 Creating test booking for company:', companyName, companyId);
        
        // Test with your example: 300 articles
        const testBooking = {
            companyId: companyId,
            companyName: companyName,
            consigneeName: 'Test Customer (300 Articles)',
            consigneeContact: '+91-9876543210',
            destination: 'Test City',
            articleCount: 300,
            parcelType: 'Standard'
        };
        
        console.log('🧮 Test Calculation Check:', {
            articles: testBooking.articleCount,
            expectedWith100Rate: testBooking.articleCount * 100,
            expectedWith10Rate: testBooking.articleCount * 10
        });
        
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testBooking)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Test booking result:', result.data);
            showToast(`Test booking created! Total: ₹${result.data.grand_total}`, 'success');
            // Reload dashboard data
            await loadClientDashboardData();
        } else {
            throw new Error(result.error || 'Failed to create test booking');
        }
        
    } catch (error) {
        console.error('Error creating test booking:', error);
        showToast('Error creating test booking: ' + error.message, 'error');
    }
}