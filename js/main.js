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

    function loadPage(page) {
        // Use absolute path to ensure it works on Vercel
        const pagePath = `/pages/${page}.html`;
        
        fetch(pagePath)
            .then(r => {
                if (!r.ok) {
                    throw new Error(`Failed to load page: ${pagePath}`);
                }
                return r.text();
            })
            .then(html => {
                content.innerHTML = html;

                // Call page-specific init function
                if (page === "dashboard") initAdminDashboardPage();
                if (page === "bookings") initBookingsPage();
                if (page === "vehicles") initVehiclesPage();
                if (page === "ratecard") initRateCardPage();
                if (page === "reports") initReportsPage();
                if (page === "profile") initProfilePage();
            })
            .catch(err => {
                console.error('Error loading page:', err);
                content.innerHTML = `<div style="padding:20px;color:#ef4444;">
                    <h3>Error Loading Page</h3>
                    <p>Failed to load ${page}.html</p>
                    <p style="font-size:12px;color:#666;">${err.message}</p>
                </div>`;
            });
    }

    // Sidebar click
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const page = btn.getAttribute("data-page");
            loadPage(page);

            const title = page === "ratecard" ? "Rate Card" :
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
});

// Mobile Menu Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Create mobile menu toggle button
    const topbar = document.querySelector('.topbar');
    if (topbar) {
        // Create mobile menu structure
        const topbarLeft = document.createElement('div');
        topbarLeft.className = 'topbar-left';
        
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-menu-toggle';
        mobileToggle.innerHTML = '<span class="material-symbols-outlined">menu</span>';
        
        // Move page title to topbar-left
        const pageTitle = topbar.querySelector('.page-title');
        if (pageTitle) {
            topbarLeft.appendChild(mobileToggle);
            topbarLeft.appendChild(pageTitle);
        } else {
            topbarLeft.appendChild(mobileToggle);
        }
        
        // Insert topbar-left as first child
        topbar.insertBefore(topbarLeft, topbar.firstChild);
        
        // Create mobile overlay
        const mobileOverlay = document.createElement('div');
        mobileOverlay.className = 'mobile-overlay';
        document.body.appendChild(mobileOverlay);
        
        const sidebar = document.querySelector('.sidebar');
        
        // Toggle mobile menu
        mobileToggle.addEventListener('click', function() {
            sidebar.classList.toggle('mobile-open');
            mobileOverlay.classList.toggle('active');
            document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : '';
        });
        
        // Close menu when clicking overlay
        mobileOverlay.addEventListener('click', function() {
            sidebar.classList.remove('mobile-open');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Close menu when clicking nav items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('mobile-open');
                    mobileOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('mobile-open');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
});