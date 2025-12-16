// HoraDel Transport Server
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment-based CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.VERCEL_URL, process.env.PRODUCTION_URL].filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    if (process.env.NODE_ENV === 'production') {
        // In production, be more restrictive
        if (allowedOrigins.some(allowed => origin?.includes(allowed.replace('https://', '').replace('http://', '')))) {
            res.header('Access-Control-Allow-Origin', origin);
        }
    } else {
        // In development, allow all origins
        res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serve all static files

// API Routes
app.use('/api/dashboard', require('./routes/dashboard-router'));
app.use('/api/bookings', require('./routes/bookings-router'));
app.use('/api/vehicles', require('./routes/vehicles-router'));
app.use('/api/ratecards', require('./routes/ratecards-router'));
app.use('/api/companies', require('./routes/companies-router'));
app.use('/api/drivers', require('./routes/drivers-router'));
app.use('/api/reports', require('./routes/reports-router'));
app.use('/api/auth', require('./routes/auth-router'));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve auth page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth.html'));
});

// Serve client redirect page
app.get('/client.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'client.html'));
});

// Serve client dashboard
app.get('/client', (req, res) => {
    res.sendFile(path.join(__dirname, 'Client/dashboard.html'));
});

app.get('/Client/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Client/dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT} `);
});

