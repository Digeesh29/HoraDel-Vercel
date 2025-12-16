// Use your exact bookings router - same as localhost
const express = require('express');
const bookingsRouter = require('../routes/bookings-router');

// Create Express app instance
const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Use your router exactly like in server.js
app.use('/', bookingsRouter);

// Export the app for Vercel
module.exports = app;