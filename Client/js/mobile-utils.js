// Client Mobile Responsiveness Utilities
// Add this script to help with mobile responsive behavior

(function() {
    'use strict';
    
    // Add mobile class to body for easier targeting
    function addMobileClass() {
        const isMobile = window.innerWidth <= 768;
        const isSmallMobile = window.innerWidth <= 480;
        
        document.body.classList.toggle('mobile', isMobile);
        document.body.classList.toggle('small-mobile', isSmallMobile);
        document.body.classList.toggle('desktop', !isMobile);
    }
    
    // Fix inline styles that are problematic on mobile
    function fixInlineStyles() {
        if (window.innerWidth <= 768) {
            // Fix grid layouts
            const gridElements = document.querySelectorAll('[style*="grid-template-columns"]');
            gridElements.forEach(el => {
                if (el.style.gridTemplateColumns.includes('repeat') || 
                    el.style.gridTemplateColumns.includes('1fr 1fr') ||
                    el.style.gridTemplateColumns.includes('2fr 1fr') ||
                    el.style.gridTemplateColumns.includes('auto-fit')) {
                    el.style.gridTemplateColumns = '1fr';
                }
            });
            
            // Fix flex layouts
            const flexElements = document.querySelectorAll('[style*="display: flex"]');
            flexElements.forEach(el => {
                if (el.style.justifyContent === 'space-between' || 
                    el.style.alignItems === 'center') {
                    el.style.flexDirection = 'column';
                    el.style.alignItems = 'flex-start';
                    el.style.gap = '12px';
                }
            });
            
            // Fix large gaps and padding
            const elementsWithGap = document.querySelectorAll('[style*="gap:"]');
            elementsWithGap.forEach(el => {
                const gap = parseInt(el.style.gap);
                if (gap > 16) {
                    el.style.gap = '12px';
                }
            });
            
            // Fix large padding
            const elementsWithPadding = document.querySelectorAll('[style*="padding:"]');
            elementsWithPadding.forEach(el => {
                if (el.style.padding.includes('24px') || el.style.padding.includes('32px')) {
                    el.style.padding = '16px';
                }
            });
        }
    }
    
    // Initialize on load
    function init() {
        addMobileClass();
        fixInlineStyles();
    }
    
    // Update on resize
    function handleResize() {
        addMobileClass();
        // Debounce the style fixes
        clearTimeout(window.mobileUtilsTimeout);
        window.mobileUtilsTimeout = setTimeout(fixInlineStyles, 100);
    }
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Run on resize
    window.addEventListener('resize', handleResize);
    
    // Run when new content is added (for dynamic pages)
    const observer = new MutationObserver(function(mutations) {
        let shouldFix = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldFix = true;
            }
        });
        
        if (shouldFix && window.innerWidth <= 768) {
            setTimeout(fixInlineStyles, 50);
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
})();

// Mobile hamburger menu functionality
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (!mobileMenuBtn || !sidebar || !sidebarOverlay) return;
    
    // Toggle sidebar
    function toggleSidebar() {
        const isOpen = sidebar.classList.contains('open');
        
        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }
    
    // Open sidebar
    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
        mobileMenuBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Close sidebar
    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Event listeners
    mobileMenuBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // Close sidebar when clicking nav items on mobile
    const navItems = sidebar.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                setTimeout(closeSidebar, 150);
            }
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
    
    // Show/hide mobile menu button based on screen size
    function updateMobileMenuVisibility() {
        const isMobile = window.innerWidth <= 768;
        mobileMenuBtn.style.display = isMobile ? 'block' : 'none';
    }
    
    updateMobileMenuVisibility();
    window.addEventListener('resize', updateMobileMenuVisibility);
}

// Initialize mobile menu
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
    initMobileMenu();
}