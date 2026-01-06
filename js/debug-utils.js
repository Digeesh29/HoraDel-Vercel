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
        // Check URL parameter first
        const urlDebug = new URLSearchParams(window.location.search).get('debug');
        if (urlDebug === 'true') return true;
        if (urlDebug === 'false') return false;
        
        // Check localStorage
        const storageDebug = localStorage.getItem('debugMode');
        if (storageDebug === 'true') return true;
        if (storageDebug === 'false') return false;
        
        // Default: enable for localhost, disable for production
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
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
    if (DEBUG_MODE && typeof console !== 'undefined') {
        console.log('🔧 Debug mode enabled');
    } else if (typeof console !== 'undefined') {
        console.log('🚀 Production mode - debug logging disabled');
    }
} catch (error) {
    // Silently fail if console is not available
}