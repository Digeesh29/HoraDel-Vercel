// Vercel API Route: /api/dashboard/summary
const supabase = require('../../config/supabase');

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { companyId } = req.query;
        console.log('📊 Dashboard summary request for company:', companyId || 'All companies');

        // Helper function to add company filter
        const addCompanyFilter = (query) => {
            return companyId ? query.eq('company_id', companyId) : query;
        };

        // Get basic stats
        const today = new Date().toISOString().split('T')[0];
        
        // Today's bookings
        let todayBookingsQuery = supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .gte('booking_date', today);
        todayBookingsQuery = addCompanyFilter(todayBookingsQuery);
        
        const { count: todayBookings } = await todayBookingsQuery;

        // Total bookings
        let totalBookingsQuery = supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true });
        totalBookingsQuery = addCompanyFilter(totalBookingsQuery);
        
        const { count: totalBookings } = await totalBookingsQuery;

        // In transit
        let inTransitQuery = supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'IN_TRANSIT');
        inTransitQuery = addCompanyFilter(inTransitQuery);
        
        const { count: inTransit } = await inTransitQuery;

        // Delivered
        let deliveredQuery = supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'DELIVERED');
        deliveredQuery = addCompanyFilter(deliveredQuery);
        
        const { count: delivered } = await deliveredQuery;

        // Recent bookings
        let recentBookingsQuery = supabase
            .from('bookings')
            .select(`
                *,
                company:companies(name)
            `)
            .order('booking_date', { ascending: false })
            .limit(10);
        recentBookingsQuery = addCompanyFilter(recentBookingsQuery);
        
        const { data: recentBookings } = await recentBookingsQuery;

        const response = {
            success: true,
            data: {
                stats: {
                    todayBookings: todayBookings || 0,
                    totalBookings: totalBookings || 0,
                    totalInTransit: inTransit || 0,
                    allTimeDelivered: delivered || 0,
                    activeVehicles: 0, // Simplified for now
                    parcelsInTransit: inTransit || 0,
                    pendingDeliveries: 0
                },
                recentBookings: recentBookings || [],
                trend: {
                    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    data: [0, 0, 0, 0, 0, 0, todayBookings || 0]
                },
                companyDistribution: {
                    labels: ['Your Company'],
                    data: [totalBookings || 0]
                },
                statusOverview: {
                    booked: 0,
                    inTransit: inTransit || 0,
                    delivered: delivered || 0
                }
            }
        };

        console.log('✅ Dashboard summary response:', response.data.stats);
        res.json(response);

    } catch (error) {
        console.error('❌ Dashboard summary error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            message: error.message
        });
    }
};