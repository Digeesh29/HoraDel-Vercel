// Dashboard API for Vercel - Direct serverless function
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
        console.log('📊 Dashboard API called:', req.method, req.url);
        
        // Handle different dashboard endpoints
        const url = req.url || '';
        
        if (url.includes('/summary') || req.method === 'GET') {
            // Dashboard summary - COPIED FROM YOUR dashboard-router.js
            const { companyId } = req.query;
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            console.log('📊 Dashboard summary request for company:', companyId || 'All companies');

            // Helper function to add company filter
            const addCompanyFilter = (query) => {
                return companyId ? query.eq('company_id', companyId) : query;
            };

            // Get basic counts - SAME AS YOUR ROUTER
            const [
                todayBookingsResult,
                yesterdayBookingsResult,
                totalBookingsResult,
                inTransitResult,
                deliveredResult
            ] = await Promise.all([
                addCompanyFilter(
                    supabase
                        .from('bookings')
                        .select('*', { count: 'exact', head: true })
                        .gte('booking_date', today)
                ),
                addCompanyFilter(
                    supabase
                        .from('bookings')
                        .select('*', { count: 'exact', head: true })
                        .gte('booking_date', yesterday)
                        .lt('booking_date', today)
                ),
                addCompanyFilter(
                    supabase
                        .from('bookings')
                        .select('*', { count: 'exact', head: true })
                ),
                addCompanyFilter(
                    supabase
                        .from('bookings')
                        .select('*', { count: 'exact', head: true })
                        .eq('status', 'IN-TRANSIT')
                ),
                addCompanyFilter(
                    supabase
                        .from('bookings')
                        .select('*', { count: 'exact', head: true })
                        .eq('status', 'DELIVERED')
                )
            ]);

            // Calculate growth rates - SAME AS YOUR ROUTER
            const calculateGrowth = (current, previous) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return Math.round(((current - previous) / previous) * 100);
            };

            const stats = {
                todayBookings: todayBookingsResult.count || 0,
                totalBookings: totalBookingsResult.count || 0,
                totalInTransit: inTransitResult.count || 0,
                allTimeDelivered: deliveredResult.count || 0,
                activeVehicles: 5, // Placeholder
                parcelsInTransit: inTransitResult.count || 0,
                pendingDeliveries: inTransitResult.count || 0,
                todayBookingsGrowth: calculateGrowth(todayBookingsResult.count || 0, yesterdayBookingsResult.count || 0),
                activeVehiclesGrowth: 0,
                parcelsInTransitGrowth: 0,
                pendingDeliveriesGrowth: 0
            };

            // Get recent bookings - SAME AS YOUR ROUTER
            let recentBookingsQuery = supabase
                .from('bookings')
                .select(`
                    id, lr_number, booking_date, consignee_name, destination,
                    article_count, parcel_type, status, grand_total,
                    company:companies(name)
                `)
                .eq('status', 'BOOKED')
                .is('assigned_vehicle_id', null)
                .order('booking_date', { ascending: false })
                .limit(10);

            if (companyId) {
                recentBookingsQuery = recentBookingsQuery.eq('company_id', companyId);
            }

            const { data: recentBookings } = await recentBookingsQuery;

            console.log('✅ Dashboard data prepared');

            return res.json({
                success: true,
                data: {
                    stats,
                    recentBookings: recentBookings || [],
                    trend: {
                        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                        values: [0, 0, 0, 0, 0, 0, 0]
                    },
                    companyDistribution: {
                        labels: ['Companies'],
                        values: [1]
                    },
                    statusOverview: {
                        booked: todayBookingsResult.count || 0,
                        inTransit: inTransitResult.count || 0,
                        delivered: deliveredResult.count || 0
                    }
                }
            });
        }

        return res.status(404).json({
            success: false,
            error: 'Dashboard endpoint not found'
        });

    } catch (error) {
        console.error('❌ Dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            message: error.message
        });
    }
};