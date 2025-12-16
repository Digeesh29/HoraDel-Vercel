// Use your exact vehicles router - same as localhost
const express = require('express');
const vehiclesRouter = require('../routes/vehicles-router');

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
app.use('/', vehiclesRouter);

// Export the app for Vercel
module.exports = app;