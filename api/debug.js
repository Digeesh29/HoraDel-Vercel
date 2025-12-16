// Debug API endpoint
module.exports = (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const debug = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        supabase: {
            url: process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
            anon_key: process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
            service_key: process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing'
        },
        request: {
            method: req.method,
            url: req.url,
            headers: Object.keys(req.headers)
        }
    };

    res.json({
        success: true,
        debug
    });
};