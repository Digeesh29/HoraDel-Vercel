// CLIENT ALL BOOKINGS PAGE

let currentPage = 1;
let totalPages = 1;
let currentFilters = {};

async function initClientBookingsPage() {
    console.log('📦 Initializing Client Parcel Management page...');
    
    // Set default date filters (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById('fromDateFilter').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('toDateFilter').value = today.toISOString().split('T')[0];
    
    // Setup event listeners
    setupBookingsEventListeners();
    
    // Load initial bookings
    await loadClientBookings();
}

function setupBookingsEventListeners() {
    // Filter buttons
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('resetFiltersBtn').addEventListener('click', clearFilters);
    
    // Export and Print buttons
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);
    document.getElementById('printAllBtn').addEventListener('click', printAllBookings);
    
    // Enter key on filters
    ['searchFilter', 'statusFilter', 'fromDateFilter', 'toDateFilter'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') applyFilters();
            });
        }
    });
}

async function loadClientBookings(page = 1) {
    try {
        const companyId = getCompanyId();
        const companyName = getCompanyName();
        
        if (!companyId) {
            showToast('Company information not found. Please login again.', 'error');
            return;
        }
        
        console.log(`📦 Loading parcels for company: ${companyName} (${companyId})`);
        
        // Build query parameters
        const params = new URLSearchParams({
            companyId: companyId,
            page: page,
            limit: 20
        });
        
        // Add filters
        if (currentFilters.search) {
            params.append('search', currentFilters.search);
        }
        if (currentFilters.status && currentFilters.status !== 'All') {
            params.append('status', currentFilters.status);
        }
        if (currentFilters.fromDate) {
            params.append('dateFrom', currentFilters.fromDate);
        }
        if (currentFilters.toDate) {
            params.append('dateTo', currentFilters.toDate);
        }
        
        const response = await fetch(`${API_BASE_URL}/bookings?${params}`);
        const result = await response.json();
        
        if (result.success) {
            renderBookingsTable(result.data || []);
            updatePagination(result.pagination || { page: 1, totalPages: 1, total: 0 });
            
            // Update subtitle
            const subtitle = document.getElementById('bookingsSubtitle');
            if (subtitle) {
                subtitle.textContent = `${result.data?.length || 0} parcels found for ${companyName}`;
            }
        } else {
            throw new Error(result.error || 'Failed to load bookings');
        }
        
    } catch (error) {
        console.error('Error loading client parcels:', error);
        showToast('Error loading parcels: ' + error.message, 'error');
        
        document.getElementById('clientBookingsTable').innerHTML = `
            <tr>
                <td colspan="6" style="padding: 40px; text-align: center; color: #dc2626;">
                    Error loading parcels. Please try again.
                </td>
            </tr>
        `;
    }
}

function renderBookingsTable(bookings) {
    const tableBody = document.getElementById('clientBookingsTable');
    
    if (!bookings || bookings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 40px; text-align: center; color: #6b7280;">
                    No parcels found. <a href="#" onclick="loadPage('client-booking')" style="color: #3b82f6;">Create your first parcel</a>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = bookings.map(booking => `
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 16px 24px; color: #111827; font-weight: 500; font-size: 14px;">${booking.lr_number}</td>
            <td style="padding: 16px 24px; color: #6b7280; font-size: 14px;">${new Date(booking.booking_date).toLocaleDateString()}</td>
            <td style="padding: 16px 24px; color: #6b7280; font-size: 14px;">${booking.destination}</td>
            <td style="padding: 16px 24px; color: #6b7280; font-size: 14px;">${booking.article_count}</td>
            <td style="padding: 16px 24px;">
                <span style="padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; ${getStatusStyle(booking.status)}">${booking.status}</span>
            </td>
            <td style="padding: 16px 24px;">
                <button onclick="printBooking('${booking.id}')" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                    Print
                </button>
            </td>
        </tr>
    `).join('');
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

function updatePagination(pagination) {
    currentPage = pagination.page || 1;
    totalPages = pagination.totalPages || 1;
    
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationButtons = document.getElementById('paginationButtons');
    
    if (paginationInfo) {
        const start = ((currentPage - 1) * 20) + 1;
        const end = Math.min(currentPage * 20, pagination.total || 0);
        paginationInfo.textContent = `Showing ${start}-${end} of ${pagination.total || 0} parcels`;
    }
    
    if (paginationButtons) {
        let buttonsHtml = '';
        
        // Previous button
        if (currentPage > 1) {
            buttonsHtml += `<button onclick="changePage(${currentPage - 1})" style="padding: 8px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer;">Previous</button>`;
        }
        
        // Page numbers
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            const isActive = i === currentPage;
            buttonsHtml += `<button onclick="changePage(${i})" style="padding: 8px 12px; border: 1px solid #d1d5db; background: ${isActive ? '#3b82f6' : 'white'}; color: ${isActive ? 'white' : '#374151'}; border-radius: 6px; cursor: pointer;">${i}</button>`;
        }
        
        // Next button
        if (currentPage < totalPages) {
            buttonsHtml += `<button onclick="changePage(${currentPage + 1})" style="padding: 8px 12px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer;">Next</button>`;
        }
        
        paginationButtons.innerHTML = buttonsHtml;
    }
}

function applyFilters() {
    currentFilters = {
        search: document.getElementById('searchFilter').value.trim(),
        status: document.getElementById('statusFilter').value,
        fromDate: document.getElementById('fromDateFilter').value,
        toDate: document.getElementById('toDateFilter').value
    };
    
    console.log('📦 Applying parcel filters:', currentFilters);
    loadClientBookings(1); // Reset to first page
}

function clearFilters() {
    document.getElementById('searchFilter').value = '';
    document.getElementById('statusFilter').value = 'All';
    document.getElementById('fromDateFilter').value = '';
    document.getElementById('toDateFilter').value = '';
    
    currentFilters = {};
    loadClientBookings(1);
}

function changePage(page) {
    if (page >= 1 && page <= totalPages) {
        loadClientBookings(page);
    }
}

function viewBookingDetails(bookingId) {
    // TODO: Implement booking details modal or page
    showToast(`Viewing details for booking ID: ${bookingId}`, 'info');
}

function printBooking(bookingId) {
    // TODO: Implement individual booking print
    showToast(`Printing booking ID: ${bookingId}`, 'info');
}

function printAllBookings() {
    showToast('Printing all bookings...', 'info');
    // TODO: Implement print all functionality
    window.print();
}

function exportToCSV() {
    showToast('Exporting to CSV...', 'info');
    // TODO: Implement CSV export functionality
}