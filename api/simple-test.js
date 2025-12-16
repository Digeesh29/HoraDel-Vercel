// Simple test API for Vercel
module.exports = (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    console.log('🔍 Simple test API called:', req.method, req.url);

    res.json({
        success: true,
        message: 'Simple test API working!',
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString(),
        vercel: true,
        environment: process.env.NODE_ENV || 'development'
    });
};