// Most basic API test for Vercel
module.exports = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Hello from Vercel!',
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    });
}