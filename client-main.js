// CLIENT MAIN JS - Page Loading System (like admin main.js)

// NAV + PAGE LOADING
document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");

    function loadPage(page) {
        fetch(`/Client/pages/${page}.html`)
            .then(r => r.text())
            .then(html => {
                content.innerHTML = html;

                // Call page-specific init function
                if (page === "client-dashboard") initClientDashboardPage();
                if (page === "client-booking") initClientBookingPage();
                if (page === "client-bookings") initClientBookingsPage();
                if (page === "client-profile") initClientProfilePage();
            })
            .catch(error => {
                console.error('Error loading page:', error);
                content.innerHTML = `
                    <div style="text-align: center; padding: 60px; color: #6b7280;">
                        <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 16px;">error</span>
                        <h3>Page not found</h3>
                        <p>The requested page could not be loaded.</p>
                    </div>
                `;
            });
    }

    // Sidebar click
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const page = btn.getAttribute("data-page");
            loadPage(page);

            // Update page title
            const title = page === "client-dashboard" ? "Dashboard" :
                          page === "client-booking" ? "New Booking" :
                          page === "client-bookings" ? "Parcel Management" :
                          page === "client-profile" ? "Profile" :
                          page.charAt(0).toUpperCase() + page.slice(1);
            document.getElementById("pageTitle").innerText = title;
        });
    });

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
                window.location.href = '/login';
            }
        });
    }

    // Load default page (dashboard)
    console.log('📊 Loading client dashboard...');
    loadPage("client-dashboard");
});

// Global functions for client pages
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

// Track shipment function
function trackShipment(lrNumber) {
    showToast(`Tracking shipment: ${lrNumber}`, "info");
    // In a real app, this would open detailed tracking
}

// Placeholder init functions for pages
function initClientBookingsPage() {
    console.log('📦 Initializing Client Parcel Management page...');
}

// initClientProfilePage is now defined in client-profile.js