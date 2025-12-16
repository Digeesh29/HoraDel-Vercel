// Simple Dashboard API for Vercel
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('📊 Simple dashboard API called');
        
        // Get basic counts
        const { count: totalBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true });

        const { count: totalCompanies } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true });

        const { count: inTransitCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'IN-TRANSIT');

        const { count: deliveredCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'DELIVERED');

        // Get recent bookings
        const { data: recentBookings } = await supabase
            .from('bookings')
            .select(`
                id,
                lr_number,
                booking_date,
                consignee_name,
                destination,
                article_count,
                status,
                grand_total,
                company:companies(name)
            `)
            .eq('status', 'BOOKED')
            .is('assigned_vehicle_id', null)
            .order('booking_date', { ascending: false })
            .limit(10);

        console.log('✅ Dashboard data:', { 
            totalBookings, 
            totalCompanies, 
            inTransitCount, 
            deliveredCount,
            recentCount: recentBookings?.length 
        });

        res.json({
            success: true,
            data: {
                stats: {
                    todayBookings: 0,
                    totalBookings: totalBookings || 0,
                    totalInTransit: inTransitCount || 0,
                    allTimeDelivered: deliveredCount || 0,
                    activeVehicles: 5, // Placeholder
                    parcelsInTransit: inTransitCount || 0,
                    pendingDeliveries: inTransitCount || 0
                },
                recentBookings: recentBookings || [],
                trend: {
                    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                    values: [0, 0, 0, 0, 0, 0, 0]
                },
                companyDistribution: {
                    labels: ['Companies'],
                    values: [totalCompanies || 0]
                }
            }
        });
    } catch (error) {
        console.error('❌ Simple dashboard error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.stack
        });
    }
};