// Reports Router
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/reports/rate-cards-debug - Debug rate cards
router.get('/rate-cards-debug', async (req, res) => {
    try {
        // Get all rate cards
        const { data: rateCards, error: rateError } = await supabase
            .from('rate_cards')
            .select(`
                *,
                company:companies(id, name)
            `)
            .order('effective_from', { ascending: false });

        // Get all companies
        const { data: companies, error: compError } = await supabase
            .from('companies')
            .select('id, name')
            .order('name');

        res.json({
            success: true,
            data: {
                rateCards: rateCards || [],
                companies: companies || [],
                rateCardsCount: rateCards?.length || 0,
                companiesCount: companies?.length || 0
            }
        });
    } catch (error) {
        console.error('❌ Rate cards debug error:', error);
        res.status(500).json({
            success: false,
            error: 'Debug failed',
            message: error.message
        });
    }
});

// GET /api/reports/test - Test database connection and show sample calculations
router.get('/test', async (req, res) => {
    try {
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id, lr_number, status, article_count, per_article_rate, base_rate, parcel_type_charge, zone_charge, total_amount, grand_total')
            .limit(5);

        const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('id, name')
            .limit(5);

        // Calculate what the simplified totals should be
        const calculationCheck = (bookings || []).map(booking => {
            const articles = booking.article_count || 0;
            const rate = booking.per_article_rate || 0;
            const simplifiedTotal = articles * rate;
            
            return {
                lr_number: booking.lr_number,
                articles,
                rate,
                simplifiedTotal,
                currentGrandTotal: booking.grand_total,
                difference: parseFloat(booking.grand_total || 0) - simplifiedTotal,
                oldCalculation: {
                    base: booking.base_rate || 0,
                    parcelCharge: booking.parcel_type_charge || 0,
                    zoneCharge: booking.zone_charge || 0,
                    total: booking.total_amount || 0
                }
            };
        });

        res.json({
            success: true,
            data: {
                bookings: bookings || [],
                companies: companies || [],
                calculationCheck,
                bookingsError: bookingsError?.message || null,
                companiesError: companiesError?.message || null
            }
        });
    } catch (error) {
        console.error('❌ Test error:', error);
        res.status(500).json({
            success: false,
            error: 'Test failed',
            message: error.message
        });
    }
});

// GET /api/reports/summary - Get overall summary statistics
router.get('/summary', async (req, res) => {
    try {
        const { dateFrom, dateTo, companyId, city } = req.query;
        console.log('📊 Summary request:', { dateFrom, dateTo, companyId, city });

        let query = supabase
            .from('bookings')
            .select('grand_total, status, company_id, destination');

        // Apply date filters
        if (dateFrom) {
            query = query.gte('booking_date', dateFrom);
        }
        if (dateTo) {
            query = query.lte('booking_date', dateTo);
        }
        if (companyId && companyId !== 'All') {
            query = query.eq('company_id', companyId);
        }
        if (city && city !== 'All') {
            query = query.eq('destination', city);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ Supabase error in summary:', error);
            throw error;
        }

        // Calculate summary statistics using simplified calculation
        const bookings = data || [];
        
        // For existing bookings, use grand_total if available, otherwise calculate using simplified formula
        const totalRevenue = bookings.reduce((sum, b) => {
            // If grand_total exists and is reasonable, use it
            if (b.grand_total && parseFloat(b.grand_total) > 0) {
                return sum + parseFloat(b.grand_total);
            }
            // Otherwise, calculate using simplified formula: articles × rate
            // This handles cases where old bookings might have incorrect calculations
            return sum + 0; // Skip bookings without proper totals
        }, 0);
        
        const totalBookings = bookings.length;
        const totalDispatches = bookings.filter(b => b.status === 'IN-TRANSIT' || b.status === 'DELIVERED').length;
        const avgRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

        console.log('✅ Summary calculated:', { totalRevenue, totalBookings, totalDispatches });

        res.json({
            success: true,
            data: {
                totalRevenue: totalRevenue.toFixed(2),
                totalBookings,
                totalDispatches,
                avgRevenuePerBooking: avgRevenuePerBooking.toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch summary',
            message: error.message
        });
    }
});

// GET /api/reports/revenue-trend - Get revenue trend over time
router.get('/revenue-trend', async (req, res) => {
    try {
        const { dateFrom, dateTo, companyId, city } = req.query;

        let query = supabase
            .from('bookings')
            .select('booking_date, grand_total, company_id, destination')
            .order('booking_date');

        if (dateFrom) query = query.gte('booking_date', dateFrom);
        if (dateTo) query = query.lte('booking_date', dateTo);
        if (companyId && companyId !== 'All') query = query.eq('company_id', companyId);
        if (city && city !== 'All') query = query.eq('destination', city);

        const { data, error } = await query;

        if (error) throw error;

        // Group by month using simplified calculation
        const monthlyRevenue = {};
        data.forEach(booking => {
            const date = new Date(booking.booking_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyRevenue[monthKey]) {
                monthlyRevenue[monthKey] = 0;
            }
            
            // Use grand_total if available and reasonable, otherwise skip
            const revenue = parseFloat(booking.grand_total) || 0;
            if (revenue > 0) {
                monthlyRevenue[monthKey] += revenue;
            }
        });

        // Convert to array and sort
        const trend = Object.entries(monthlyRevenue)
            .map(([month, revenue]) => ({ month, revenue: revenue.toFixed(2) }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6); // Last 6 months

        res.json({
            success: true,
            data: trend
        });
    } catch (error) {
        console.error('Error fetching revenue trend:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch revenue trend',
            message: error.message
        });
    }
});

// GET /api/reports/company-summary - Get company-wise summary
router.get('/company-summary', async (req, res) => {
    try {
        const { dateFrom, dateTo, city } = req.query;
        console.log('🏢 Company summary request:', { dateFrom, dateTo, city });

        // First get bookings
        let bookingsQuery = supabase
            .from('bookings')
            .select('grand_total, destination, company_id');

        if (dateFrom) bookingsQuery = bookingsQuery.gte('booking_date', dateFrom);
        if (dateTo) bookingsQuery = bookingsQuery.lte('booking_date', dateTo);
        if (city && city !== 'All') bookingsQuery = bookingsQuery.eq('destination', city);

        const { data: bookings, error: bookingsError } = await bookingsQuery;
        if (bookingsError) {
            console.error('❌ Bookings error:', bookingsError);
            throw bookingsError;
        }

        // Then get companies
        const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('id, name');

        if (companiesError) {
            console.error('❌ Companies error:', companiesError);
            throw companiesError;
        }

        // Create company lookup
        const companyLookup = {};
        (companies || []).forEach(company => {
            companyLookup[company.id] = company.name;
        });

        // Group by company using simplified calculation
        const companySummary = {};
        (bookings || []).forEach(booking => {
            const companyName = companyLookup[booking.company_id] || 'Unknown Company';
            
            if (!companySummary[companyName]) {
                companySummary[companyName] = {
                    totalRevenue: 0,
                    totalBookings: 0
                };
            }
            
            // Use grand_total if available and reasonable
            const revenue = parseFloat(booking.grand_total) || 0;
            if (revenue > 0) {
                companySummary[companyName].totalRevenue += revenue;
                companySummary[companyName].totalBookings += 1;
            }
        });

        // Convert to array with averages
        const summary = Object.entries(companySummary).map(([company, stats]) => ({
            company,
            totalRevenue: stats.totalRevenue.toFixed(2),
            totalBookings: stats.totalBookings,
            avgPerBooking: stats.totalBookings > 0 ? (stats.totalRevenue / stats.totalBookings).toFixed(2) : '0.00'
        })).sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue));

        console.log('✅ Company summary calculated:', summary.length, 'companies');

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('❌ Error fetching company summary:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company summary',
            message: error.message
        });
    }
});

// GET /api/reports/parcel-type-distribution - Get parcel type distribution
router.get('/parcel-type-distribution', async (req, res) => {
    try {
        const { dateFrom, dateTo, companyId, city } = req.query;

        let query = supabase
            .from('bookings')
            .select('parcel_type, destination');

        if (dateFrom) query = query.gte('booking_date', dateFrom);
        if (dateTo) query = query.lte('booking_date', dateTo);
        if (companyId && companyId !== 'All') query = query.eq('company_id', companyId);
        if (city && city !== 'All') query = query.eq('destination', city);

        const { data, error } = await query;

        if (error) throw error;

        // Count by parcel type
        const typeCounts = {};
        data.forEach(booking => {
            const type = booking.parcel_type || 'Unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const total = data.length;
        const distribution = Object.entries(typeCounts).map(([type, count]) => ({
            type,
            count,
            percentage: ((count / total) * 100).toFixed(1)
        })).sort((a, b) => b.count - a.count);

        res.json({
            success: true,
            data: distribution
        });
    } catch (error) {
        console.error('Error fetching parcel type distribution:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch parcel type distribution',
            message: error.message
        });
    }
});

// GET /api/reports/vehicle-dispatch - Get vehicle dispatch statistics
router.get('/vehicle-dispatch', async (req, res) => {
    try {
        const { dateFrom, dateTo, city } = req.query;
        console.log('🚛 Vehicle dispatch request:', { dateFrom, dateTo, city });

        // Get bookings with assigned vehicles
        let bookingsQuery = supabase
            .from('bookings')
            .select('assigned_vehicle_id, destination')
            .not('assigned_vehicle_id', 'is', null);

        if (dateFrom) bookingsQuery = bookingsQuery.gte('booking_date', dateFrom);
        if (dateTo) bookingsQuery = bookingsQuery.lte('booking_date', dateTo);
        if (city && city !== 'All') bookingsQuery = bookingsQuery.eq('destination', city);

        const { data: bookings, error: bookingsError } = await bookingsQuery;
        if (bookingsError) {
            console.error('❌ Bookings error:', bookingsError);
            throw bookingsError;
        }

        // Get vehicles
        const { data: vehicles, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('id, registration_number');

        if (vehiclesError) {
            console.error('❌ Vehicles error:', vehiclesError);
            throw vehiclesError;
        }

        // Create vehicle lookup
        const vehicleLookup = {};
        (vehicles || []).forEach(vehicle => {
            vehicleLookup[vehicle.id] = vehicle.registration_number;
        });

        // Count dispatches per vehicle
        const vehicleDispatches = {};
        (bookings || []).forEach(booking => {
            const vehicleNumber = vehicleLookup[booking.assigned_vehicle_id] || 'Unknown Vehicle';
            vehicleDispatches[vehicleNumber] = (vehicleDispatches[vehicleNumber] || 0) + 1;
        });

        const dispatches = Object.entries(vehicleDispatches)
            .map(([vehicle, count]) => ({ vehicle, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10 vehicles

        console.log('✅ Vehicle dispatch calculated:', dispatches.length, 'vehicles');

        res.json({
            success: true,
            data: dispatches
        });
    } catch (error) {
        console.error('❌ Error fetching vehicle dispatch:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vehicle dispatch',
            message: error.message
        });
    }
});

// POST /api/reports/fix-calculations - Fix existing booking calculations
router.post('/fix-calculations', async (req, res) => {
    try {
        console.log('🔧 Fixing booking calculations...');
        
        // Get all bookings that need fixing
        const { data: bookings, error: fetchError } = await supabase
            .from('bookings')
            .select('id, article_count, per_article_rate, grand_total')
            .gt('article_count', 0)
            .gt('per_article_rate', 0);

        if (fetchError) throw fetchError;

        let fixedCount = 0;
        const results = [];

        // Update each booking with simplified calculation
        for (const booking of bookings || []) {
            const simplifiedTotal = booking.article_count * booking.per_article_rate;
            
            if (Math.abs(parseFloat(booking.grand_total) - simplifiedTotal) > 0.01) {
                // Update the booking
                const { error: updateError } = await supabase
                    .from('bookings')
                    .update({
                        base_rate: 0,
                        parcel_type_charge: 0,
                        zone_charge: 0,
                        total_amount: simplifiedTotal,
                        grand_total: simplifiedTotal
                    })
                    .eq('id', booking.id);

                if (!updateError) {
                    fixedCount++;
                    results.push({
                        id: booking.id,
                        oldTotal: booking.grand_total,
                        newTotal: simplifiedTotal,
                        difference: parseFloat(booking.grand_total) - simplifiedTotal
                    });
                }
            }
        }

        console.log(`✅ Fixed ${fixedCount} bookings`);

        res.json({
            success: true,
            data: {
                totalBookings: bookings?.length || 0,
                fixedCount,
                results: results.slice(0, 10) // Show first 10 changes
            },
            message: `Successfully updated ${fixedCount} bookings to use simplified calculation`
        });
    } catch (error) {
        console.error('❌ Error fixing calculations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fix calculations',
            message: error.message
        });
    }
});

module.exports = router;
