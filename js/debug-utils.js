// SHARED DEBUG UTILITY
// Conditional logging system for all JavaScript files

// Debug configuration with flexible control
const DEBUG_MODE = (() => {
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
})();

// Conditional logging functions
window.debugLog = function(...args) {
    if (DEBUG_MODE) {
        console.log(...args);
    }
};

window.debugError = function(...args) {
    if (DEBUG_MODE) {
        console.error(...args);
    }
};

window.debugWarn = function(...args) {
    if (DEBUG_MODE) {
        console.warn(...args);
    }
};

window.debugInfo = function(...args) {
    if (DEBUG_MODE) {
        console.info(...args);
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
if (DEBUG_MODE) {
    console.log('🔧 Debug mode enabled');
} else {
    console.log('🚀 Production mode - debug logging disabled');
}