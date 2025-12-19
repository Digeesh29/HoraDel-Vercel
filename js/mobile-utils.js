// Mobile Responsiveness Utilities
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
            // Fix grid layouts - be more aggressive
            const gridElements = document.querySelectorAll('[style*="grid-template-columns"]');
            gridElements.forEach(el => {
                const currentGrid = el.style.gridTemplateColumns;
                // Check for any multi-column grid pattern
                if (currentGrid.includes('repeat') || 
                    currentGrid.includes('1fr 1fr') ||
                    currentGrid.includes('2fr 1fr') ||
                    currentGrid.includes('1fr 1fr 1fr') ||
                    currentGrid.includes('auto-fit') ||
                    currentGrid.includes('auto-fill') ||
                    (currentGrid.match(/1fr/g) || []).length > 1) {
                    el.style.gridTemplateColumns = '1fr';
                    el.style.gap = '12px';
                }
            });
            
            // Specifically target dashboard cards
            const dashboardCards = document.querySelectorAll('.dashboard-cards, .stats-row');
            dashboardCards.forEach(el => {
                el.style.gridTemplateColumns = '1fr';
                el.style.gap = '12px';
            });
            
            // Target any element with the specific problematic inline style
            const problematicElements = document.querySelectorAll('[style*="grid-template-columns: 1fr 1fr 1fr"]');
            problematicElements.forEach(el => {
                el.style.gridTemplateColumns = '1fr';
                el.style.gap = '12px';
                console.log('🔧 Fixed problematic 3-column grid:', el);
            });
            
            // Target any element with 2-column grid
            const twoColumnElements = document.querySelectorAll('[style*="grid-template-columns: 1fr 1fr"]');
            twoColumnElements.forEach(el => {
                el.style.gridTemplateColumns = '1fr';
                el.style.gap = '12px';
                console.log('🔧 Fixed problematic 2-column grid:', el);
            });
            
            // Force fix for any grid with multiple 1fr values
            const allGridElements = document.querySelectorAll('[style*="grid-template-columns"]');
            allGridElements.forEach(el => {
                const gridValue = el.style.gridTemplateColumns;
                const frCount = (gridValue.match(/1fr/g) || []).length;
                if (frCount > 1) {
                    el.style.gridTemplateColumns = '1fr';
                    el.style.gap = '12px';
                    console.log('🔧 Fixed multi-column grid:', el, 'was:', gridValue);
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
            const elementsWithGap = document.querySelectorAll('[style*="gap"]');
            elementsWithGap.forEach(el => {
                const gapValue = el.style.gap;
                if (gapValue && (gapValue.includes('24px') || gapValue.includes('32px'))) {
                    el.style.gap = '12px';
                }
            });
            
            // Fix large margins
            const elementsWithMargin = document.querySelectorAll('[style*="margin"]');
            elementsWithMargin.forEach(el => {
                if (el.style.marginTop && (el.style.marginTop.includes('32px') || el.style.marginTop.includes('24px'))) {
                    el.style.marginTop = '16px';
                }
                if (el.style.marginBottom && (el.style.marginBottom.includes('32px') || el.style.marginBottom.includes('24px'))) {
                    el.style.marginBottom = '16px';
                }
            });
        }
    }
    
    // Initialize on load
    function init() {
        addMobileClass();
        fixInlineStyles();
        
        // Run fixes again after a short delay to catch dynamically loaded content
        setTimeout(fixInlineStyles, 500);
        setTimeout(fixInlineStyles, 1000);
    }
    
    // Update on resize
    function handleResize() {
        addMobileClass();
        // Debounce the style fixes
        clearTimeout(window.mobileUtilsTimeout);
        window.mobileUtilsTimeout = setTimeout(fixInlineStyles, 100);
    }
    
    // Force fix styles (can be called manually)
    window.forceMobileFix = function() {
        console.log('🔧 Forcing mobile style fixes...');
        fixInlineStyles();
    };
    
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
    const sidebar = document.getElementById('sidebar');
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