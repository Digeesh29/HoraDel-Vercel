// Prevent admin main.js from running in client interface
console.log('🔍 Admin main.js loading...');
console.log('🔍 Current URL:', window.location.href);
console.log('🔍 Current pathname:', window.location.pathname);

// Check if we're in client interface
if (window.location.href.includes('/Client/') || 
    window.location.pathname.includes('/Client/') ||
    document.querySelector('script[src*="/Client/js/"]')) {
    console.log('🚫 Admin main.js BLOCKED - Client interface detected');
    
    // Override any problematic functions immediately
    window.initDashboardPage = function() {
        console.log('🚫 Admin dashboard function blocked');
    };
    window.initAdminDashboardPage = function() {
        console.log('🚫 Admin dashboard function blocked');
    };
    
    // Stop all execution by throwing error
    throw new Error('Admin main.js blocked in client interface');
}

// GLOBAL STATE (same data you had before)
const bookings = [
    { lr: "LR-2024-001", date: "2024-12-01", company: "TechCorp",     consignee: "ABC Company",  dest: "Andheri, Mumbai", articles: 25, type: "Standard", status: "Dispatched", assignedTo: "MH-12-AB-1234" },
    { lr: "LR-2024-002", date: "2024-12-01", company: "GlobalTrade",  consignee: "PQR Ltd",      dest: "Pune",           articles: 35, type: "Express",  status: "Assigned",   assignedTo: "MH-14-CD-5678" },
    { lr: "LR-2024-003", date: "2024-12-01", company: "FastShip",     consignee: "MNO Inc",      dest: "Bangalore",      articles: 28, type: "Standard", status: "Verified",   assignedTo: null },
    { lr: "LR-2024-004", date: "2024-12-01", company: "QuickMove",    consignee: "DEF Solutions",dest: "Delhi",          articles: 22, type: "Standard", status: "Submitted",  assignedTo: null },
    { lr: "LR-2024-005", date: "2024-12-01", company: "EasyLogistics",consignee: "GHI Enterprises",dest:"Chennai",       articles: 18, type: "Express",  status: "Dispatched", assignedTo: "TN-09-EF-9012" }
];

const vehicles = [
    { no: "MH-12-AB-1234", driver: "Rajesh Kumar", contact: "9876543210", capacity: "5 Tons", status: "Dispatched" },
    { no: "MH-14-CD-5678", driver: "Amit Sharma",  contact: "9123456789", capacity: "3 Tons", status: "Assigned"   },
    { no: "TN-09-EF-9012", driver: "Suresh Menon", contact: "9988776655", capacity: "7 Tons", status: "Dispatched" },
    { no: "KA-05-GH-3456", driver: "Vikas Reddy",  contact: "9876543213", capacity: "5 Tons", status: "Pending"    },
    { no: "DL-07-IJ-7890", driver: "Manoj Singh",  contact: "9876543214", capacity: "4 Tons", status: "Pending"    }
];

let activeLr = null;

// Simple toast
function showToast(msg, type = "success", duration = 2500) {
    const el = document.createElement("div");
    const bg = type === "success" ? "#10b981" : type === "info" ? "#3b82f6" : "#ef4444";
    el.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:9999;
      background:${bg};color:white;padding:10px 14px;border-radius:8px;
      font-size:14px;font-family:Inter,system-ui;
      box-shadow:0 10px 15px -3px rgba(0,0,0,.2);
    `;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "0.2s"; }, duration);
    setTimeout(() => el.remove(), duration + 200);
}

// Export CSV (Reports → Excel)
function exportCSV() {
    const headers = ["LR,Company,Consignee,Destination,Status,Vehicle"];
    const rows = bookings.map(b =>
        `${b.lr},${b.company},${b.consignee},${b.dest},${b.status},${b.assignedTo || ""}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "transport_report.csv";
    link.click();
}

// Global manifest printer
function printBookingPDF(booking) {
    const w = window.open("", "_blank", "height=600,width=800");
    if (!w) return alert("Enable popups to print");

    w.document.write(`
        <html><head><title>Manifest - ${booking.lr}</title>
        <style>
            body{font-family:Arial;padding:40px;}
            h1{margin-bottom:10px;}
            table{width:100%;border-collapse:collapse;margin-top:20px;}
            th,td{border:1px solid #ddd;padding:8px;text-align:left;}
        </style>
        </head><body>
        <h1>HoraDel Transport</h1>
        <p><b>LR:</b> ${booking.lr}</p>
        <p><b>Date:</b> ${booking.date}</p>
        <p><b>Company:</b> ${booking.company}</p>
        <p><b>Consignee:</b> ${booking.consignee}</p>
        <p><b>Destination:</b> ${booking.dest}</p>

        <table>
            <thead><tr><th>Description</th><th>Type</th><th>Qty</th></tr></thead>
            <tbody><tr><td>Logistics Service</td><td>${booking.type}</td><td>${booking.articles}</td></tr></tbody>
        </table>
        <script>window.onload=function(){window.print();}</script>
        </body></html>
    `);
    w.document.close();
}

// Open side drawer with LR details (used by bookings & dashboard)
function openSlideoverForLR(lr) {
    const b = bookings.find(x => x.lr === lr);
    if (!b) return;
    activeLr = b;
    alert(
        `LR: ${b.lr}\nCompany: ${b.company}\nConsignee: ${b.consignee}\nDestination: ${b.dest}\nArticles: ${b.articles}\nStatus: ${b.status}`
    );
}

// NAV + PAGE LOADING
document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");

    function loadPage(page, queryParams = '') {
        // Update URL with query parameters if provided
        if (queryParams) {
            const newUrl = `${window.location.pathname}${queryParams}`;
            window.history.pushState({}, '', newUrl);
        }
        
        console.log(`🔍 Loading page: ${page}`);
        fetch(`pages/${page}.html`)
            .then(r => {
                console.log(`🔍 Fetch response for ${page}:`, r.status, r.statusText);
                if (!r.ok) {
                    throw new Error(`HTTP ${r.status}: ${r.statusText}`);
                }
                return r.text();
            })
            .then(html => {
                console.log(`🔍 HTML loaded for ${page}:`, html.length, 'characters');
                content.innerHTML = html;

                // Call page-specific init function
                if (page === "dashboard") initAdminDashboardPage();
                if (page === "bookings") initBookingsPage();
                if (page === "vehicles") initVehiclesPage();
                if (page === "assign-parcels") {
                    console.log('🔍 Loading assign parcels page...');
                    // Use the working fallback function directly
                    initAssignParcelsPageFallback();
                    
                    // Set up the button click handler with working function
                    setTimeout(() => {
                        const assignBtn = document.getElementById('assignSelectedBtn');
                        if (assignBtn) {
                            console.log('🔍 Setting up assign button click handler');
                            
                            // Define the assign function directly here
                            window.simpleAssignParcels = async function() {
                                console.log('🔍 Assign function called!');
                                
                                // Get selected parcels
                                const selectedCheckboxes = document.querySelectorAll('.parcel-checkbox:checked');
                                const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
                                
                                console.log('🔍 Selected parcels:', selectedIds);
                                
                                if (selectedIds.length === 0) {
                                    alert('Please select at least one parcel to assign');
                                    return;
                                }
                                
                                // Show loading state
                                assignBtn.disabled = true;
                                assignBtn.innerHTML = 'Assigning...';
                                
                                try {
                                    // Get vehicle ID from URL
                                    const urlParams = new URLSearchParams(window.location.search);
                                    const vehicleId = urlParams.get('vehicleId');
                                    
                                    console.log('🔍 Assigning to vehicle ID:', vehicleId);
                                    console.log('🔍 Selected parcel IDs:', selectedIds);
                                    
                                    // Assign each selected parcel to the vehicle
                                    let successCount = 0;
                                    for (const parcelId of selectedIds) {
                                        try {
                                            console.log('🔍 Assigning parcel:', parcelId);
                                            
                                            const response = await fetch(`${API_BASE_URL}/bookings/${parcelId}`, {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({
                                                    assigned_vehicle_id: vehicleId,
                                                    status: 'IN-TRANSIT'
                                                })
                                            });
                                            
                                            const result = await response.json();
                                            console.log('🔍 Assign result for', parcelId, ':', result);
                                            
                                            if (result.success) {
                                                successCount++;
                                                console.log('✅ Parcel', parcelId, 'assigned successfully');
                                            } else {
                                                console.error('❌ Failed to assign parcel', parcelId, ':', result.error);
                                            }
                                        } catch (error) {
                                            console.error('❌ Error assigning parcel', parcelId, ':', error);
                                        }
                                    }
                                    
                                    // Update vehicle status to 'Assigned' if any parcels were assigned
                                    if (successCount > 0) {
                                        try {
                                            const vehicleResponse = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}`, {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({
                                                    status: 'Assigned'
                                                })
                                            });
                                            
                                            const vehicleResult = await vehicleResponse.json();
                                            if (vehicleResult.success) {
                                                console.log('✅ Vehicle status updated to Assigned');
                                            }
                                        } catch (error) {
                                            console.error('❌ Error updating vehicle status:', error);
                                        }
                                    }
                                    
                                    // Show success message
                                    if (successCount > 0) {
                                        showToast(`Successfully assigned ${successCount} parcels to vehicle!`, 'success');
                                    } else {
                                        showToast('No parcels were assigned. Please try again.', 'error');
                                    }
                                    
                                    // Navigate back to vehicles page
                                    setTimeout(() => {
                                        loadPage('vehicles');
                                    }, 1500);
                                    
                                } catch (error) {
                                    console.error('❌ Error in assign function:', error);
                                    showToast('Error assigning parcels. Please try again.', 'error');
                                    
                                    // Reset button
                                    assignBtn.disabled = false;
                                    assignBtn.innerHTML = `Assign <span id="assignCount">${selectedIds.length}</span>`;
                                }
                            };
                            
                            // Set the onclick handler
                            assignBtn.onclick = window.simpleAssignParcels;
                            
                            // Initialize button state
                            assignBtn.disabled = true;
                            assignBtn.style.backgroundColor = '#d1d5db';
                            assignBtn.style.cursor = 'not-allowed';
                        }
                    }, 1000);
                }
                if (page === "ratecard") initRateCardPage();
                if (page === "client-approval") initClientApprovalPage();
                if (page === "client-register") initClientRegisterPage();
                if (page === "reports") initReportsPage();
                if (page === "profile") initProfilePage();
            })
            .catch(error => {
                console.error(`❌ Error loading page ${page}:`, error);
                content.innerHTML = `
                    <div style="padding: 40px; text-align: center; color: #dc2626;">
                        <h3>Error Loading Page</h3>
                        <p>Failed to load ${page}.html</p>
                        <p>Error: ${error.message}</p>
                        <button onclick="location.reload()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Reload Page
                        </button>
                    </div>
                `;
            });
    }

    // Make loadPage globally accessible
    window.loadPage = loadPage;

    // Sidebar click
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const page = btn.getAttribute("data-page");
            loadPage(page);

            const title = page === "ratecard" ? "Rate Card" :
                          page === "client-approval" ? "Client Approval" :
                          page === "client-register" ? "Client Register" :
                          page.charAt(0).toUpperCase() + page.slice(1);
            document.getElementById("pageTitle").innerText = title;
        });
    });

    // Click handler for user profile (Admin button)
    const userAvatar = document.getElementById("userAvatar");
    const userName = document.getElementById("userName");
    
    if (userAvatar) {
        userAvatar.addEventListener("click", () => {
            // Trigger profile page load
            document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
            const profileBtn = document.querySelector('[data-page="profile"]');
            if (profileBtn) profileBtn.classList.add("active");
            
            loadPage("profile");
            document.getElementById("pageTitle").innerText = "Profile";
        });
    }
    
    if (userName) {
        userName.addEventListener("click", () => {
            // Trigger profile page load
            document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
            const profileBtn = document.querySelector('[data-page="profile"]');
            if (profileBtn) profileBtn.classList.add("active");
            
            loadPage("profile");
            document.getElementById("pageTitle").innerText = "Profile";
        });
    }

    // Logout functionality
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to logout?")) {
                // Clear authentication data
                localStorage.removeItem('userRole');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                localStorage.removeItem('userId');
                localStorage.removeItem('companyId');
                localStorage.removeItem('companyName');
                localStorage.removeItem('companyEmail');
                
                // Redirect to login
                console.log('🚪 Logging out and redirecting to login...');
                window.location.replace('/login');
            }
        });
    }

    // Load default page (dashboard)
    console.log('📊 Loading dashboard...');
    loadPage("dashboard");
    
    // Load pending approval count
    loadPendingApprovalCount();
});

// Load pending approval count for badge
async function loadPendingApprovalCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/consignees/pending`);
        const result = await response.json();
        
        if (result.success) {
            const count = result.data?.length || 0;
            const badge = document.getElementById('approvalBadge');
            
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading pending approval count:', error);
    }
}


// Fallback function for assign parcels page
async function initAssignParcelsPageFallback() {
    console.log('🚛 Initializing Assign Parcels Page (Fallback)...');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Search params:', window.location.search);
    
    // Get vehicle ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = urlParams.get('vehicleId');
    
    console.log('🔍 Vehicle ID from URL:', vehicleId);
    console.log('🔍 API_BASE_URL:', API_BASE_URL);
    
    if (!vehicleId) {
        console.error('❌ No vehicle ID provided');
        showToast('No vehicle ID provided', 'error');
        loadPage('vehicles');
        return;
    }
    
    try {
        // Fetch vehicle details
        console.log('🔍 Fetching vehicle data...');
        const response = await fetch(`${API_BASE_URL}/vehicles`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error('Failed to fetch vehicle data');
        }
        
        const vehicle = result.data.find(v => v.id === vehicleId);
        if (!vehicle) {
            throw new Error('Vehicle not found');
        }
        
        console.log('✅ Vehicle found:', vehicle.registration_number);
        
        // Update vehicle info display
        const vehicleNumberEl = document.getElementById('assignVehicleNumber');
        const driverNameEl = document.getElementById('assignDriverName');
        const contactNumberEl = document.getElementById('assignContactNumber');
        
        if (vehicleNumberEl) vehicleNumberEl.textContent = vehicle.registration_number;
        if (driverNameEl) driverNameEl.textContent = vehicle.driver?.name || 'No Driver';
        if (contactNumberEl) contactNumberEl.textContent = vehicle.driver?.phone || 'N/A';
        
        // Load available parcels
        console.log('🔍 Fetching available parcels...');
        const bookingsResponse = await fetch(`${API_BASE_URL}/bookings`);
        const bookingsResult = await bookingsResponse.json();
        
        if (!bookingsResult.success) {
            throw new Error('Failed to load parcels');
        }
        
        // Filter for available parcels (BOOKED, SUBMITTED, VERIFIED - not yet assigned)
        const parcels = bookingsResult.data.filter(b => 
            !b.assigned_vehicle_id && 
            ['BOOKED', 'SUBMITTED', 'VERIFIED', 'PENDING'].includes(b.status)
        );
        
        console.log('✅ Found', parcels.length, 'available parcels');
        
        const tbody = document.getElementById('assignParcelsTableBody');
        const availableCountEl = document.getElementById('availableParcelsCount');
        
        if (parcels.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#9ca3af;">No available parcels to assign</td></tr>';
            if (availableCountEl) availableCountEl.textContent = '0';
            return;
        }
        
        if (tbody) {
            tbody.innerHTML = parcels.map(parcel => `
                <tr data-parcel-id="${parcel.id}">
                    <td>
                        <input type="checkbox" class="parcel-checkbox" value="${parcel.id}">
                    </td>
                    <td>${parcel.lr_number}</td>
                    <td>${new Date(parcel.booking_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>${parcel.company?.name || '-'}</td>
                    <td>${parcel.consignee_name || parcel.consignee}</td>
                    <td>${parcel.destination}</td>
                    <td>${parcel.article_count}</td>
                    <td>${parcel.parcel_type}</td>
                    <td><span class="status-badge st-${(parcel.status || 'pending').toLowerCase()}">${parcel.status || 'Pending'}</span></td>
                </tr>
            `).join('');
        }
        
        if (availableCountEl) availableCountEl.textContent = parcels.length;
        
        console.log('✅ Assign parcels page loaded successfully');
        
        // Set up button functionality for fallback
        const assignBtn = document.getElementById('assignSelectedBtn');
        if (assignBtn) {
            assignBtn.onclick = function() {
                console.log('🔍 Fallback assign button clicked!');
                
                // Get selected parcels
                const selectedCheckboxes = document.querySelectorAll('.parcel-checkbox:checked');
                const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
                
                console.log('🔍 Selected parcels:', selectedIds);
                
                if (selectedIds.length === 0) {
                    alert('Please select at least one parcel to assign');
                    return;
                }
                
                // Show success message
                showToast(`Successfully assigned ${selectedIds.length} parcels to vehicle!`, 'success');
                
                // Navigate back to vehicles page
                setTimeout(() => {
                    loadPage('vehicles');
                }, 1500);
            };
        }
        
        // Set up checkbox functionality
        const checkboxes = document.querySelectorAll('.parcel-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.onchange = function() {
                const selectedCount = document.querySelectorAll('.parcel-checkbox:checked').length;
                const selectedCountEl = document.getElementById('selectedParcelCount');
                const assignCountEl = document.getElementById('assignCount');
                const assignBtn = document.getElementById('assignSelectedBtn');
                
                if (selectedCountEl) {
                    selectedCountEl.textContent = `${selectedCount} selected`;
                }
                
                if (assignCountEl) {
                    assignCountEl.textContent = selectedCount;
                }
                
                if (assignBtn) {
                    assignBtn.disabled = selectedCount === 0;
                    if (selectedCount === 0) {
                        assignBtn.style.backgroundColor = '#d1d5db';
                        assignBtn.style.cursor = 'not-allowed';
                    } else {
                        assignBtn.style.backgroundColor = '#6b7280';
                        assignBtn.style.cursor = 'pointer';
                    }
                }
            };
        });
        
    } catch (error) {
        console.error('❌ Error loading assign parcels page:', error);
        showToast('Error loading page: ' + error.message, 'error');
        setTimeout(() => loadPage('vehicles'), 2000);
    }
}
