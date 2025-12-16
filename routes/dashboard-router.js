// Dashboard Router
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/dashboard - Get dashboard data (total bookings + recent 10 bookings)
router.get('/', async (req, res) => {
    try {
        const { companyId } = req.query;
        
        // Build query with optional company filter
        let countQuery = supabase.from('bookings').select('*', { count: 'exact', head: true });
        if (companyId) {
            countQuery = countQuery.eq('company_id', companyId);
        }
        
        // Get total bookings count
        const { count: totalBookings, error: countError } = await countQuery;

        if (countError) throw countError;

        // Build recent bookings query with optional company filter
        let bookingsQuery = supabase
            .from('bookings')
            .select(`
                id,
                lr_number,
                booking_date,
                consignee_name,
                destination,
                article_count,
                parcel_type,
                status,
                grand_total,
                company:companies (
                    id,
                    name,
                    phone
                ),
                vehicle:vehicles (
                    id,
                    registration_number,
                    vehicle_type
                ),
                driver:drivers (
                    id,
                    name,
                    phone
                )
            `);
            
        if (companyId) {
            bookingsQuery = bookingsQuery.eq('company_id', companyId);
        }
        
        // Get recent 10 bookings with related data
        const { data: recentBookings, error: bookingsError } = await bookingsQuery
            .order('booking_date', { ascending: false })
            .limit(10);

        if (bookingsError) throw bookingsError;

        res.json({
            success: true,
            data: {
                totalBookings: totalBookings || 0,
                recentBookings: recentBookings || []
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            message: error.message
        });
    }
});

// GET /api/dashboard/test-data - Quick test to see if bookings exist
router.get('/test-data', async (req, res) => {
    try {
        const { data: allBookings, error } = await supabase
            .from('bookings')
            .select('id, lr_number, status, booking_date')
            .limit(10);

        if (error) throw error;

        const statusCounts = {};
        (allBookings || []).forEach(booking => {
            statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
        });

        res.json({
            success: true,
            data: {
                totalFound: allBookings?.length || 0,
                bookings: allBookings || [],
                statusCounts,
                hasData: (allBookings?.length || 0) > 0
            }
        });
    } catch (error) {
        console.error('❌ Test data error:', error);
        res.status(500).json({
            success: false,
            error: 'Test failed',
            message: error.message
        });
    }
});

// GET /api/dashboard/summary - Get complete dashboard summary with growth rates
router.get('/summary', async (req, res) => {
    try {
        const { companyId } = req.query;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        console.log('📊 Dashboard summary request for company:', companyId || 'All companies');
        console.log('📅 Date filters:', { today, yesterday });

        // Helper function to add company filter
        const addCompanyFilter = (query) => {
            return companyId ? query.eq('company_id', companyId) : query;
        };

        // Fetch all data in parallel
        const [
            todayBookingsResult,
            yesterdayBookingsResult,
            pendingDeliveriesResult,
            deliveredBookingsResult,
            inTransitBookingsResult,
            totalBookingsResult,
            totalInTransitResult,
            totalDeliveredResult
        ] = await Promise.all([
            // Today's bookings
            addCompanyFilter(
                supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .gte('booking_date', today)
            ),
            
            // Yesterday's bookings
            addCompanyFilter(
                supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .gte('booking_date', yesterday)
                    .lt('booking_date', today)
            ),
            
            // Pending deliveries (IN-TRANSIT)
            addCompanyFilter(
                supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'IN-TRANSIT')
            ),
            
            // Delivered bookings
            addCompanyFilter(
                supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'DELIVERED')
            ),
            
            // In transit bookings
            addCompanyFilter(
                supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'IN-TRANSIT')
            ),
            
            // Total bookings (all time)
            addCompanyFilter(
                supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
            ),
            
            // Total in-transit (all time)
            addCompanyFilter(
                supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'IN-TRANSIT')
            ),
            
            // Total delivered (all time)
            addCompanyFilter(
                supabase
                    .from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'DELIVERED')
            )
        ]);

        // Debug: Log all query results
        console.log('📊 Query Results:', {
            todayBookings: todayBookingsResult.count,
            yesterdayBookings: yesterdayBookingsResult.count,
            pendingDeliveries: pendingDeliveriesResult.count,
            deliveredBookings: deliveredBookingsResult.count,
            inTransitBookings: inTransitBookingsResult.count,
            totalBookings: totalBookingsResult.count,
            totalInTransit: totalInTransitResult.count,
            totalDelivered: totalDeliveredResult.count
        });

        // Calculate growth rates
        const calculateGrowth = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        // Get all vehicles count (simplified active vehicles)
        const { data: allVehicles } = await supabase
            .from('vehicles')
            .select('id');

        const activeVehiclesCount = (allVehicles || []).length;

        // Debug: Log what we're about to send
        const statsToSend = {
            todayBookings: todayBookingsResult.count || 0,
            pendingDeliveries: pendingDeliveriesResult.count || 0,
            totalDelivered: deliveredBookingsResult.count || 0,
            inTransit: inTransitBookingsResult.count || 0,
            activeVehicles: activeVehiclesCount || 0,
            parcelsInTransit: inTransitBookingsResult.count || 0,
            // Total stats (all time)
            totalBookings: totalBookingsResult.count || 0,
            totalInTransit: totalInTransitResult.count || 0,
            allTimeDelivered: totalDeliveredResult.count || 0,
            // Growth rates
            todayBookingsGrowth: calculateGrowth(todayBookingsResult.count || 0, yesterdayBookingsResult.count || 0),
            activeVehiclesGrowth: 0, // Placeholder
            parcelsInTransitGrowth: 0, // Placeholder
            pendingDeliveriesGrowth: 0 // Placeholder
        };
        console.log('📊 Stats being sent:', statsToSend);

        // Get recent bookings (BOOKED status without assigned vehicles)
        let recentBookingsQuery = supabase
            .from('bookings')
            .select(`
                id,
                lr_number,
                booking_date,
                consignee_name,
                destination,
                article_count,
                parcel_type,
                status,
                grand_total,
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

        // Get trend data (last 7 days)
        const trendData = await getTrendData(companyId);
        
        // Get company distribution
        const companyDistData = await getCompanyDistribution(companyId);

        // Status overview
        const statusOverview = {
            booked: todayBookingsResult.count || 0,
            inTransit: inTransitBookingsResult.count || 0,
            delivered: deliveredBookingsResult.count || 0
        };

        res.json({
            success: true,
            data: {
                stats: statsToSend,
                recentBookings: recentBookings || [],
                trend: trendData,
                companyDistribution: companyDistData,
                statusOverview: statusOverview
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard summary',
            message: error.message
        });
    }
});

// GET /api/dashboard/bookings-trend - Get bookings trend for charts
router.get('/bookings-trend', async (req, res) => {
    try {
        const { companyId } = req.query;
        const days = parseInt(req.query.days) || 7;
        
        // Calculate start date
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days - 1));
        const startDateStr = startDate.toISOString().split('T')[0];

        // Build query with optional company filter
        let query = supabase
            .from('bookings')
            .select('booking_date')
            .gte('booking_date', startDateStr);
            
        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Count bookings per day
        const countsByDate = {};
        (data || []).forEach(booking => {
            const dateStr = booking.booking_date.split('T')[0];
            countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
        });

        // Generate labels and values for last N days
        const labels = [];
        const values = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const label = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            labels.push(label);
            values.push(countsByDate[dateStr] || 0);
        }

        res.json({
            success: true,
            data: {
                labels: labels,
                values: values
            }
        });
    } catch (error) {
        console.error('Error fetching bookings trend:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bookings trend',
            message: error.message
        });
    }
});

// GET /api/dashboard/company-distribution - Get company-wise booking distribution
router.get('/company-distribution', async (req, res) => {
    try {
        const { companyId } = req.query;
        
        // If companyId is provided, only show that company's data
        let query = supabase
            .from('bookings')
            .select('company_id, company:companies(name)');
            
        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Count bookings per company
        const distribution = {};
        (data || []).forEach(booking => {
            const companyName = booking.company?.name || 'Unknown';
            distribution[companyName] = (distribution[companyName] || 0) + 1;
        });

        // Sort companies by booking count and limit to top 5
        const sortedCompanies = Object.entries(distribution)
            .sort((a, b) => b[1] - a[1]);

        let labels = [];
        let values = [];

        if (sortedCompanies.length <= 5) {
            // If 5 or fewer companies, show all
            labels = sortedCompanies.map(([name]) => name);
            values = sortedCompanies.map(([, count]) => count);
        } else {
            // Show top 5 and group rest as "Others"
            const top5 = sortedCompanies.slice(0, 5);
            const others = sortedCompanies.slice(5);
            const othersCount = others.reduce((sum, [, count]) => sum + count, 0);

            labels = [...top5.map(([name]) => name), 'Others'];
            values = [...top5.map(([, count]) => count), othersCount];
        }

        res.json({
            success: true,
            data: {
                labels: labels,
                values: values
            }
        });
    } catch (error) {
        console.error('Error fetching company distribution:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company distribution',
            message: error.message
        });
    }
});

// Helper function to get trend data
async function getTrendData(companyId) {
    try {
        const days = 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days - 1));
        const startDateStr = startDate.toISOString().split('T')[0];

        let query = supabase
            .from('bookings')
            .select('booking_date')
            .gte('booking_date', startDateStr);
            
        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        const { data } = await query;

        // Count bookings per day
        const countsByDate = {};
        (data || []).forEach(booking => {
            const dateStr = booking.booking_date.split('T')[0];
            countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
        });

        // Generate labels and values for last 7 days
        const labels = [];
        const values = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const label = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            labels.push(label);
            values.push(countsByDate[dateStr] || 0);
        }

        return { labels, values };
    } catch (error) {
        console.error('Error getting trend data:', error);
        return { labels: [], values: [] };
    }
}

// Helper function to get company distribution
async function getCompanyDistribution(companyId) {
    try {
        let query = supabase
            .from('bookings')
            .select('company_id, company:companies(name)');
            
        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        const { data } = await query;

        // Count bookings per company
        const distribution = {};
        (data || []).forEach(booking => {
            const companyName = booking.company?.name || 'Unknown';
            distribution[companyName] = (distribution[companyName] || 0) + 1;
        });

        // Sort companies by booking count and limit to top 5
        const sortedCompanies = Object.entries(distribution)
            .sort((a, b) => b[1] - a[1]);

        let labels = [];
        let values = [];

        if (sortedCompanies.length <= 5) {
            // If 5 or fewer companies, show all
            labels = sortedCompanies.map(([name]) => name);
            values = sortedCompanies.map(([, count]) => count);
        } else {
            // Show top 5 and group rest as "Others"
            const top5 = sortedCompanies.slice(0, 5);
            const others = sortedCompanies.slice(5);
            const othersCount = others.reduce((sum, [, count]) => sum + count, 0);

            labels = [...top5.map(([name]) => name), 'Others'];
            values = [...top5.map(([, count]) => count), othersCount];
        }

        return { labels, values };
    } catch (error) {
        console.error('Error getting company distribution:', error);
        return { labels: [], values: [] };
    }
}

module.exports = router;