// SHARED DEBUG UTILITY
// Conditional logging system for all JavaScript files

// Safety check - ensure console exists
if (typeof console === 'undefined') {
    window.console = {
        log: function() {},
        error: function() {},
        warn: function() {},
        info: function() {}
    };
}

// Debug configuration with flexible control
const DEBUG_MODE = (() => {
    try {
        // Check URL parameter first (highest priority)
        const urlDebug = new URLSearchParams(window.location.search).get('debug');
        if (urlDebug === 'true') return true;
        if (urlDebug === 'false') return false;
        
        // Check localStorage (second priority)
        const storageDebug = localStorage.getItem('debugMode');
        if (storageDebug === 'true') return true;
        if (storageDebug === 'false') return false;
        
        // Default: enable only for localhost/development, disable for all production domains
        const hostname = window.location.hostname;
        
        // Development environments
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.endsWith('.local')) {
            return true;
        }
        
        // Production environments (Vercel, custom domains, etc.)
        if (hostname.includes('vercel.app') || 
            hostname.includes('.com') || 
            hostname.includes('.net') || 
            hostname.includes('.org') ||
            hostname.includes('.app') ||
            hostname.includes('.dev') ||
            !hostname.includes('localhost')) {
            return false;
        }
        
        // Default to production mode (safe fallback)
        return false;
    } catch (error) {
        // Fallback to production mode if any error occurs
        return false;
    }
})();

// Conditional logging functions
window.debugLog = function(...args) {
    try {
        if (DEBUG_MODE && typeof console !== 'undefined' && console.log) {
            console.log(...args);
        }
    } catch (error) {
        // Silently fail in production
    }
};

window.debugError = function(...args) {
    try {
        if (DEBUG_MODE && typeof console !== 'undefined' && console.error) {
            console.error(...args);
        }
    } catch (error) {
        // Silently fail in production
    }
};

window.debugWarn = function(...args) {
    try {
        if (DEBUG_MODE && typeof console !== 'undefined' && console.warn) {
            console.warn(...args);
        }
    } catch (error) {
        // Silently fail in production
    }
};

window.debugInfo = function(...args) {
    try {
        if (DEBUG_MODE && typeof console !== 'undefined' && console.info) {
            console.info(...args);
        }
    } catch (error) {
        // Silently fail in production
    }
};

// Debug mode status
window.isDebugMode = () => DEBUG_MODE;

// Manual debug control functions
window.enableDebug = () => {
    localStorage.setItem('debugMode', 'true');
    location.reload();
};

window.disableDebug = () => {
    localStorage.setItem('debugMode', 'false');
    location.reload();
};

// Log debug mode status
try {
    if (typeof console !== 'undefined') {
        const hostname = window.location.hostname;
        if (DEBUG_MODE) {
            console.log('🔧 Debug mode enabled for:', hostname);
        } else {
            console.log('🚀 Production mode - debug logging disabled for:', hostname);
        }
    }
} catch (error) {
    // Silently fail if console is not available
}