// Test API for Vercel - Simple health check
const supabase = require('../config/supabase');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Test Supabase connection
        const { data: companies, error } = await supabase
            .from('companies')
            .select('count');

        if (error) throw error;

        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('count');

        if (bookingsError) throw bookingsError;

        return res.json({
            success: true,
            message: 'API is working!',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            supabase: {
                connected: true,
                companies: companies?.[0]?.count || 0,
                bookings: bookings?.[0]?.count || 0
            },
            availableEndpoints: [
                '/api/test',
                '/api/companies',
                '/api/dashboard',
                '/api/vehicles',
                '/api/bookings',
                '/api/reports'
            ]
        });

    } catch (error) {
        console.error('❌ Test API error:', error);
        res.status(500).json({
            success: false,
            error: 'Test failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};