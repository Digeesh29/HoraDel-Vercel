// Simple test API for Vercel
module.exports = (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    res.json({
        success: true,
        message: 'Simple test API working!',
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    });
};