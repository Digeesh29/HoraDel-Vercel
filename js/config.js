// Global API Configuration
// Dynamic API base URL that works in both development and production
const API_BASE_URL = (() => {
    const origin = window.location.origin;
    
    // For Vercel deployment, use the current origin
    if (origin.includes('vercel.app') || origin.includes('localhost')) {
        return `${origin}/api`;
    }
    
    // For custom domains, use the current origin
    return `${origin}/api`;
})();

// Company context functions
function getCompanyId() {
    return localStorage.getItem('companyId');
}

function getCompanyName() {
    return localStorage.getItem('companyName');
}

function getUserCompanyContext() {
    return {
        companyId: getCompanyId(),
        companyName: getCompanyName(),
        userId: localStorage.getItem('userId'),
        userRole: localStorage.getItem('userRole')
    };
}
