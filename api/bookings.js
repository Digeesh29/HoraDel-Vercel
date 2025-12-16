// Vercel API Route: /api/bookings
const supabase = require('../config/supabase');

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const { companyId, status, limit } = req.query;

            let query = supabase
                .from('bookings')
                .select(`
                    *,
                    company:companies(id, name, phone, email)
                `)
                .order('booking_date', { ascending: false });

            // Apply filters
            if (companyId) {
                query = query.eq('company_id', companyId);
            }
            
            if (status && status !== 'All') {
                query = query.eq('status', status);
            }
            
            if (limit) {
                query = query.limit(parseInt(limit));
            }

            const { data, error } = await query;

            if (error) throw error;

            res.json({
                success: true,
                data: data || []
            });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('❌ Bookings API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bookings',
            message: error.message
        });
    }
};