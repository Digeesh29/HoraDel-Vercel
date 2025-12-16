// Combined Reports & Ratecards API for Vercel
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
        const url = req.url || '';
        
        // Handle ratecards endpoints
        if (url.includes('ratecards') || url.includes('ratecard')) {
            if (req.method === 'GET') {
                try {
                    const { data, error } = await supabase
                        .from('ratecards')
                        .select(`*, company:companies(id, name)`)
                        .order('created_at', { ascending: false });

                    if (error) {
                        console.log('⚠️ Ratecards table not found, returning empty array');
                        return res.json({
                            success: true,
                            data: [],
                            message: 'Ratecards table not found - using sample data'
                        });
                    }

                    return res.json({
                        success: true,
                        data: data || []
                    });
                } catch (tableError) {
                    console.log('⚠️ Ratecards table error, returning empty array');
                    return res.json({
                        success: true,
                        data: [],
                        message: 'Ratecards functionality not available'
                    });
                }
            }
            
            if (req.method === 'POST') {
                try {
                    const { data, error } = await supabase
                        .from('ratecards')
                        .insert([req.body])
                        .select(`*, company:companies(id, name)`);

                    if (error) throw error;

                    return res.json({
                        success: true,
                        message: 'Rate card created successfully',
                        data: data[0]
                    });
                } catch (tableError) {
                    return res.json({
                        success: false,
                        error: 'Ratecards table not available',
                        message: 'Please create the ratecards table in Supabase'
                    });
                }
            }
        }
        
        // Handle reports endpoints
        else if (url.includes('/summary')) {
            // Reports Summary
            const { dateFrom, dateTo, companyId, city } = req.query;
            
            let query = supabase.from('bookings').select('*');
            if (dateFrom) query = query.gte('booking_date', dateFrom);
            if (dateTo) query = query.lte('booking_date', dateTo);
            if (companyId && companyId !== 'All') query = query.eq('company_id', companyId);
            if (city && city !== 'All') query = query.eq('destination', city);
            
            const { data: bookings, error } = await query;
            if (error) throw error;
            
            const totalBookings = bookings?.length || 0;
            const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.grand_total || 0), 0) || 0;
            const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
            
            const statusCounts = {};
            bookings?.forEach(booking => {
                statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
            });

            return res.json({
                success: true,
                data: {
                    totalBookings,
                    totalRevenue,
                    avgBookingValue,
                    statusBreakdown: statusCounts,
                    period: { dateFrom, dateTo }
                }
            });
        }
        else if (url.includes('/company-summary')) {
            // Company Summary
            const { dateFrom, dateTo, companyId, city } = req.query;
            
            let query = supabase.from('bookings').select(`*, company:companies(id, name)`);
            if (dateFrom) query = query.gte('booking_date', dateFrom);
            if (dateTo) query = query.lte('booking_date', dateTo);
            if (companyId && companyId !== 'All') query = query.eq('company_id', companyId);
            if (city && city !== 'All') query = query.eq('destination', city);
            
            const { data: bookings, error } = await query;
            if (error) throw error;
            
            const companySummary = {};
            bookings?.forEach(booking => {
                const companyName = booking.company?.name || 'Unknown';
                if (!companySummary[companyName]) {
                    companySummary[companyName] = {
                        name: companyName,
                        totalBookings: 0,
                        totalRevenue: 0,
                        avgBookingValue: 0
                    };
                }
                
                companySummary[companyName].totalBookings++;
                companySummary[companyName].totalRevenue += booking.grand_total || 0;
            });
            
            Object.values(companySummary).forEach(company => {
                company.avgBookingValue = company.totalBookings > 0 
                    ? company.totalRevenue / company.totalBookings 
                    : 0;
            });
            
            const sortedCompanies = Object.values(companySummary)
                .sort((a, b) => b.totalRevenue - a.totalRevenue);

            return res.json({
                success: true,
                data: sortedCompanies
            });
        }
        else if (url.includes('/revenue-trend')) {
            // Revenue Trend
            const { dateFrom, dateTo, companyId, city } = req.query;
            
            let query = supabase.from('bookings').select('booking_date, grand_total');
            if (dateFrom) query = query.gte('booking_date', dateFrom);
            if (dateTo) query = query.lte('booking_date', dateTo);
            if (companyId && companyId !== 'All') query = query.eq('company_id', companyId);
            if (city && city !== 'All') query = query.eq('destination', city);
            
            const { data: bookings, error } = await query;
            if (error) throw error;
            
            const dailyRevenue = {};
            bookings?.forEach(booking => {
                const date = booking.booking_date.split('T')[0];
                dailyRevenue[date] = (dailyRevenue[date] || 0) + (booking.grand_total || 0);
            });
            
            const dates = Object.keys(dailyRevenue).sort();
            const revenues = dates.map(date => dailyRevenue[date]);

            return res.json({
                success: true,
                data: {
                    labels: dates,
                    values: revenues,
                    total: revenues.reduce((sum, val) => sum + val, 0)
                }
            });
        }
        else if (url.includes('/parcel-type-distribution')) {
            // Parcel Type Distribution
            const { dateFrom, dateTo, companyId, city } = req.query;
            
            let query = supabase.from('bookings').select('parcel_type, article_count');
            if (dateFrom) query = query.gte('booking_date', dateFrom);
            if (dateTo) query = query.lte('booking_date', dateTo);
            if (companyId && companyId !== 'All') query = query.eq('company_id', companyId);
            if (city && city !== 'All') query = query.eq('destination', city);
            
            const { data: bookings, error } = await query;
            if (error) throw error;
            
            const parcelTypes = {};
            bookings?.forEach(booking => {
                const type = booking.parcel_type || 'Unknown';
                const count = booking.article_count || 1;
                parcelTypes[type] = (parcelTypes[type] || 0) + count;
            });
            
            const labels = Object.keys(parcelTypes);
            const values = Object.values(parcelTypes);

            return res.json({
                success: true,
                data: {
                    labels,
                    values,
                    total: values.reduce((sum, val) => sum + val, 0)
                }
            });
        }
        else if (url.includes('/vehicle-dispatch')) {
            // Vehicle Dispatch
            const { dateFrom, dateTo, companyId, city } = req.query;
            
            let query = supabase.from('bookings').select(`*, vehicle:vehicles(id, registration_number, vehicle_type)`);
            if (dateFrom) query = query.gte('booking_date', dateFrom);
            if (dateTo) query = query.lte('booking_date', dateTo);
            if (companyId && companyId !== 'All') query = query.eq('company_id', companyId);
            if (city && city !== 'All') query = query.eq('destination', city);
            
            const { data: bookings, error } = await query;
            if (error) throw error;
            
            const vehicleStats = {};
            bookings?.forEach(booking => {
                if (booking.vehicle) {
                    const vehicleKey = booking.vehicle.registration_number || 'Unknown';
                    if (!vehicleStats[vehicleKey]) {
                        vehicleStats[vehicleKey] = {
                            registration: vehicleKey,
                            type: booking.vehicle.vehicle_type || 'Unknown',
                            totalBookings: 0,
                            totalRevenue: 0
                        };
                    }
                    
                    vehicleStats[vehicleKey].totalBookings++;
                    vehicleStats[vehicleKey].totalRevenue += booking.grand_total || 0;
                }
            });
            
            const vehicleArray = Object.values(vehicleStats)
                .sort((a, b) => b.totalBookings - a.totalBookings);

            return res.json({
                success: true,
                data: vehicleArray
            });
        }
        else {
            // Default reports response
            return res.json({
                success: true,
                data: {
                    message: 'Reports API - Available endpoints: /summary, /company-summary, /revenue-trend, /parcel-type-distribution, /vehicle-dispatch',
                    endpoint: url
                }
            });
        }

    } catch (error) {
        console.error('❌ Reports/Ratecards error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process request',
            message: error.message
        });
    }
};