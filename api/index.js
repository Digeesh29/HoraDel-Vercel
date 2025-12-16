// Vercel API Handler
const express = require('express');
const path = require('path');
const cors = require('cors');

// Import routes
const dashboardRouter = require('../routes/dashboard-router');
const bookingsRouter = require('../routes/bookings-router');
const vehiclesRouter = require('../routes/vehicles-router');
const ratecardsRouter = require('../routes/ratecards-router');
const companiesRouter = require('../routes/companies-router');
const driversRouter = require('../routes/drivers-router');
const reportsRouter = require('../routes/reports-router');
const authRouter = require('../routes/auth-router');

const app = express();

// CORS
app.use(cors({
    origin: true,
    credentials: true
}));

// Middleware
app.use(express.json());

// API Routes
app.use('/api/dashboard', dashboardRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/ratecards', ratecardsRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Export for Vercel
module.exports = app;