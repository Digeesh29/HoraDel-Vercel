// HoraDel Transport Server
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Smart CORS configuration that works with Vercel
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    if (process.env.NODE_ENV === 'production') {
        // In production, allow Vercel domains and custom domains
        if (origin && (
            origin.includes('.vercel.app') || 
            origin.includes(process.env.VERCEL_URL || '') ||
            origin.includes(process.env.PRODUCTION_URL || '') ||
            origin === `https://${process.env.VERCEL_URL}` ||
            origin === process.env.PRODUCTION_URL
        )) {
            res.header('Access-Control-Allow-Origin', origin);
        } else {
            // For same-origin requests (when frontend and backend are on same domain)
            res.header('Access-Control-Allow-Origin', origin || '*');
        }
    } else {
        // In development, allow all origins
        res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve all static files

// Explicit static file routes for Vercel
app.use('/Client', express.static(path.join(__dirname, 'Client')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/pages', express.static(path.join(__dirname, 'pages')));

// API Routes - with error handling for Vercel
try {
    app.use('/api/dashboard', require('./routes/dashboard-router'));
    console.log('✅ Dashboard router loaded');
} catch (err) {
    console.error('❌ Dashboard router failed:', err.message);
}

try {
    app.use('/api/bookings', require('./routes/bookings-router'));
    console.log('✅ Bookings router loaded');
} catch (err) {
    console.error('❌ Bookings router failed:', err.message);
}

try {
    app.use('/api/vehicles', require('./routes/vehicles-router'));
    console.log('✅ Vehicles router loaded');
} catch (err) {
    console.error('❌ Vehicles router failed:', err.message);
    // Fallback to direct API
    app.use('/api/vehicles', require('./api/vehicles'));
}

try {
    app.use('/api/ratecards', require('./routes/ratecards-router'));
    console.log('✅ Ratecards router loaded');
} catch (err) {
    console.error('❌ Ratecards router failed:', err.message);
    app.use('/api/ratecards', require('./api/ratecards'));
}

try {
    app.use('/api/companies', require('./routes/companies-router'));
    console.log('✅ Companies router loaded');
} catch (err) {
    console.error('❌ Companies router failed:', err.message);
    app.use('/api/companies', require('./api/companies'));
}

try {
    app.use('/api/drivers', require('./routes/drivers-router'));
    console.log('✅ Drivers router loaded');
} catch (err) {
    console.error('❌ Drivers router failed:', err.message);
    app.use('/api/drivers', require('./api/drivers'));
}

try {
    app.use('/api/reports', require('./routes/reports-router'));
    console.log('✅ Reports router loaded');
} catch (err) {
    console.error('❌ Reports router failed:', err.message);
    app.use('/api/reports', require('./api/reports'));
}

try {
    app.use('/api/auth', require('./routes/auth-router'));
    console.log('✅ Auth router loaded');
} catch (err) {
    console.error('❌ Auth router failed:', err.message);
    app.use('/api/auth', require('./api/auth/login'));
}

// Additional API endpoints
app.get('/api/debug', require('./api/debug'));
app.get('/api/test-client', require('./api/test-client'));
app.get('/login-test', require('./api/login-test'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Route handlers for different pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/client', (req, res) => {
    res.sendFile(path.join(__dirname, 'Client/dashboard.html'));
});

app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

app.get('/login-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'login-test.html'));
});

// Handle client routes
app.get('/Client/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Client/dashboard.html'));
});

// Catch-all handler for SPA routing - must be last
app.get('*', (req, res) => {
    // If it's an API request that wasn't handled, return 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // For all other routes, serve the login page
    res.sendFile(path.join(__dirname, 'auth.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT} `);
});

