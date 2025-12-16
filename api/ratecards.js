// Use your exact ratecards router for Vercel
const express = require('express');
const ratecardsRouter = require('../routes/ratecards-router');

// Create a mini Express app to handle the router
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

// Use your exact router
app.use('/', ratecardsRouter);

// Export for Vercel
module.exports = app;