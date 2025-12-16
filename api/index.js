// Main API handler for Vercel - handles all routes
const express = require('express');
const cors = require('cors');

// Import your routers
const dashboardRouter = require('../routes/dashboard-router');
const authRouter = require('../routes/auth-router');
const bookingsRouter = require('../routes/bookings-router');
const vehiclesRouter = require('../routes/vehicles-router');
const companiesRouter = require('../routes/companies-router');
const ratecardsRouter = require('../routes/ratecards-router');
const reportsRouter = require('../routes/reports-router');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Use your exact routers - same as localhost
app.use('/dashboard', dashboardRouter);
app.use('/auth', authRouter);
app.use('/bookings', bookingsRouter);
app.use('/vehicles', vehiclesRouter);
app.use('/companies', companiesRouter);
app.use('/ratecards', ratecardsRouter);
app.use('/reports', reportsRouter);

// Test endpoint
app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API working!',
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Export for Vercel
module.exports = app;