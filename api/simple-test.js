// Simple test endpoint for Vercel
module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    res.json({
        success: true,
        message: 'Simple API endpoint working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
    });
};