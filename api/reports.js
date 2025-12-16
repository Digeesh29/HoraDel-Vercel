// Vercel API Route: /api/reports
const supabase = require('../config/supabase');

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const { company, companyId, dateFrom, dateTo, city } = req.query;
            
            console.log('📊 Fetching reports with filters:', { company, companyId, dateFrom, dateTo, city });
            
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
            
            if (company && company !== 'All') {
                query = query.ilike('company.name', `%${company}%`);
            }
            
            if (dateFrom) {
                query = query.gte('booking_date', dateFrom);
            }
            
            if (dateTo) {
                query = query.lte('booking_date', dateTo);
            }
            
            if (city && city !== 'All') {
                query = query.ilike('destination_city', `%${city}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Calculate totals
            const totalRevenue = data?.reduce((sum, booking) => {
                return sum + (parseFloat(booking.total_amount) || 0);
            }, 0) || 0;

            const totalArticles = data?.reduce((sum, booking) => {
                return sum + (parseInt(booking.articles) || 0);
            }, 0) || 0;

            res.json({
                success: true,
                data: data || [],
                summary: {
                    totalBookings: data?.length || 0,
                    totalRevenue: totalRevenue,
                    totalArticles: totalArticles
                }
            });

        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('❌ Error in reports API:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reports',
            message: error.message
        });
    }
};