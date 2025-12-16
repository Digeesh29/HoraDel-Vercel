// Convert reports-router.js to work with Vercel
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { endpoint } = req.query;
        
        switch (endpoint) {
            case 'summary':
                return await handleSummary(req, res);
            case 'revenue-trend':
                return await handleRevenueTrend(req, res);
            case 'company-summary':
                return await handleCompanySummary(req, res);
            case 'parcel-type-distribution':
                return await handleParcelTypeDistribution(req, res);
            case 'vehicle-dispatch':
                return await handleVehicleDispatch(req, res);
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid endpoint parameter',
                    availableEndpoints: ['summary', 'revenue-trend', 'company-summary', 'parcel-type-distribution', 'vehicle-dispatch']
                });
        }
        
    } catch (error) {
        console.error('Error in reports API:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process report request',
            message: error.message
        });
    }
};

// Handle summary report
async function handleSummary(req, res) {
    const { dateFrom, dateTo, companyId, city } = req.query;
    
    let query = supabase
        .from('bookings')
        .select('*', { count: 'exact' });
    
    // Apply filters
    if (dateFrom) query = query.gte('booking_date', dateFrom);
    if (dateTo) query = query.lte('booking_date', dateTo);
    if (companyId && companyId !== 'All') query = query.eq('company_id', companyId);
    if (city && city !== 'All') query = query.eq('destination', city);
    
    const { count, error } = await query;
    if (error) throw error;
    
    res.json({
        success: true,
        data: {
            totalBookings: count || 0,
            totalRevenue: 0, // Placeholder
            averageRevenue: 0 // Placeholder
        }
    });
}

// Handle revenue trend
async function handleRevenueTrend(req, res) {
    const { dateFrom, dateTo, companyId, city } = req.query;
    
    // Simple placeholder data
    res.json({
        success: true,
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            values: [0, 0, 0, 0, 0, 0]
        }
    });
}

// Handle company summary
async function handleCompanySummary(req, res) {
    const { dateFrom, dateTo, companyId, city } = req.query;
    
    let query = supabase
        .from('bookings')
        .select(`
            company_id,
            grand_total,
            company:companies(name)
        `);
    
    // Apply filters
    if (dateFrom) query = query.gte('booking_date', dateFrom);
    if (dateTo) query = query.lte('booking_date', dateTo);
    if (companyId && companyId !== 'All') query = query.eq('company_id', companyId);
    if (city && city !== 'All') query = query.eq('destination', city);
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Group by company
    const companySummary = {};
    (data || []).forEach(booking => {
        const companyName = booking.company?.name || 'Unknown';
        if (!companySummary[companyName]) {
            companySummary[companyName] = {
                bookings: 0,
                revenue: 0
            };
        }
        companySummary[companyName].bookings++;
        companySummary[companyName].revenue += booking.grand_total || 0;
    });
    
    res.json({
        success: true,
        data: Object.entries(companySummary).map(([name, stats]) => ({
            company: name,
            bookings: stats.bookings,
            revenue: stats.revenue
        }))
    });
}

// Handle parcel type distribution
async function handleParcelTypeDistribution(req, res) {
    const { dateFrom, dateTo, companyId, city } = req.query;
    
    let query = supabase
        .from('bookings')
        .select('parcel_type');
    
    // Apply filters
    if (dateFrom) query = query.gte('booking_date', dateFrom);
    if (dateTo) query = query.lte('booking_date', dateTo);
    if (companyId && companyId !== 'All') query = query.eq('company_id', companyId);
    if (city && city !== 'All') query = query.eq('destination', city);
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Count by parcel type
    const distribution = {};
    (data || []).forEach(booking => {
        const type = booking.parcel_type || 'Unknown';
        distribution[type] = (distribution[type] || 0) + 1;
    });
    
    res.json({
        success: true,
        data: {
            labels: Object.keys(distribution),
            values: Object.values(distribution)
        }
    });
}

// Handle vehicle dispatch
async function handleVehicleDispatch(req, res) {
    const { dateFrom, dateTo, companyId, city } = req.query;
    
    // Simple placeholder data
    res.json({
        success: true,
        data: []
    });
}