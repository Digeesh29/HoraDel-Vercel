// Bookings Router
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/bookings - Get all bookings with filters
router.get('/', async (req, res) => {
    try {
        const { company, companyId, status, lrNumber, dateFrom, dateTo, limit } = req.query;

        let query = supabase
            .from('bookings')
            .select(`
                *,
                company:companies(id, name, phone, email),
                vehicle:vehicles(id, registration_number, vehicle_type, capacity),
                driver:drivers(id, name, phone)
            `)
            .order('booking_date', { ascending: false });

        // Apply filters
        if (companyId) {
            query = query.eq('company_id', companyId);
        }
        
        if (status && status !== 'All') {
            query = query.eq('status', status);
        }
        
        if (lrNumber) {
            query = query.ilike('lr_number', `%${lrNumber}%`);
        }
        
        if (dateFrom) {
            query = query.gte('booking_date', dateFrom);
        }
        
        if (dateTo) {
            query = query.lte('booking_date', dateTo);
        }
        
        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filter by company name in memory (faster than extra query)
        let filteredData = data || [];
        if (company && company !== 'All') {
            filteredData = filteredData.filter(booking => 
                booking.company?.name === company
            );
        }

        res.json({
            success: true,
            data: filteredData,
            count: filteredData.length
        });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bookings',
            message: error.message
        });
    }
});

// PUT /api/bookings/:id - Update booking
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { assigned_vehicle_id, assigned_driver_id, status } = req.body;

        const updateData = {};
        if (assigned_vehicle_id !== undefined) updateData.assigned_vehicle_id = assigned_vehicle_id;
        if (assigned_driver_id !== undefined) updateData.assigned_driver_id = assigned_driver_id;
        if (status !== undefined) updateData.status = status;

        const { data, error } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update booking',
            message: error.message
        });
    }
});

// GET /api/bookings/:id - Get single booking
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                company:companies(*),
                vehicle:vehicles(*),
                driver:drivers(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch booking',
            message: error.message
        });
    }
});

// POST /api/bookings - Create a single booking
router.post('/', async (req, res) => {
    try {
        const { companyId, companyName, consigneeName, consigneeContact, destination, articleCount, parcelType, address } = req.body;

        if (!companyId || !consigneeName || !destination || !articleCount) {
            return res.status(400).json({
                success: false,
                error: 'Company ID, consignee name, destination, and article count are required'
            });
        }

        console.log(`📦 Creating single booking for company: ${companyName} (${companyId})`);

        const today = new Date().toISOString().split('T')[0];
        const lrNumber = `LR${Date.now()}`;

        const bookingData = {
            lr_number: lrNumber,
            booking_date: today,
            company_id: companyId,
            consignee_name: consigneeName,
            consignee_contact: consigneeContact || '',
            origin: 'Warehouse', // Default origin
            destination: destination,
            destination_pincode: '000000', // Default pincode
            article_count: parseInt(articleCount),
            parcel_type: parcelType || 'Standard',
            weight: parseInt(articleCount) * 1.0, // Assume 1kg per article
            description: `${parcelType || 'Standard'} parcel for ${consigneeName}`,
            base_rate: 0.00,
            per_article_rate: 10.00,
            parcel_type_charge: 0.00,
            zone_charge: 0.00,
            total_amount: (parseInt(articleCount) * 10),
            gst_amount: 0.00,
            grand_total: (parseInt(articleCount) * 10),
            status: 'BOOKED'
        };

        // Get rate card for company to calculate pricing
        const rateCard = await getRateCardForCompany(companyId);
        
        // Calculate pricing using rate card or default rates
        const pricing = calculateBookingPricing(parseInt(articleCount), parcelType, rateCard);
        
        // Update booking data with calculated pricing
        bookingData.base_rate = pricing.baseRate;
        bookingData.per_article_rate = pricing.perArticleRate;
        bookingData.parcel_type_charge = pricing.parcelTypeCharge;
        bookingData.zone_charge = pricing.zoneCharge;
        bookingData.total_amount = pricing.totalAmount;
        bookingData.grand_total = pricing.grandTotal;

        // Insert booking
        const { data: createdBooking, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating booking:', error);
            throw error;
        }

        console.log(`✅ Created booking ${lrNumber} for company: ${companyName}`);

        res.status(201).json({
            success: true,
            data: createdBooking,
            message: `Successfully created booking ${lrNumber}`
        });

    } catch (error) {
        console.error('❌ Error in booking creation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create booking',
            message: error.message
        });
    }
});

// POST /api/bookings/batch - Create multiple bookings for a company
router.post('/batch', async (req, res) => {
    try {
        const { companyId, companyName, parcels, lrNumber } = req.body;

        if (!companyId || !parcels || !Array.isArray(parcels) || parcels.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Company ID and parcels array are required'
            });
        }

        console.log(`📦 Creating batch booking for company: ${companyName} (${companyId})`);
        console.log(`📦 Number of parcels: ${parcels.length}`);

        const bookings = [];
        const today = new Date().toISOString().split('T')[0];
        let rateCard = null;

        // Create individual bookings for each parcel
        for (let i = 0; i < parcels.length; i++) {
            const parcel = parcels[i];
            const individualLR = `${lrNumber}-${String(i + 1).padStart(2, '0')}`;

            // Get rate card for company (only once per batch)
            if (i === 0) {
                rateCard = await getRateCardForCompany(companyId);
            }
            
            // Calculate pricing using rate card
            const pricing = calculateBookingPricing(parcel.articles, parcel.parcelType, rateCard);

            const bookingData = {
                lr_number: individualLR,
                booking_date: today,
                company_id: companyId,
                consignee_name: parcel.company, // This is actually consignee name now
                consignee_contact: parcel.phone,
                origin: 'Warehouse', // Default origin
                destination: parcel.city,
                destination_pincode: '000000', // Default pincode
                article_count: parcel.articles,
                parcel_type: parcel.parcelType,
                weight: parcel.articles * 1.0, // Assume 1kg per article
                description: `${parcel.parcelType} parcel for ${parcel.company}`,
                base_rate: pricing.baseRate,
                per_article_rate: pricing.perArticleRate,
                parcel_type_charge: pricing.parcelTypeCharge,
                zone_charge: pricing.zoneCharge,
                total_amount: pricing.totalAmount,
                gst_amount: pricing.gstAmount,
                grand_total: pricing.grandTotal,
                status: 'BOOKED'
            };

            bookings.push(bookingData);
        }

        // Insert all bookings
        const { data: createdBookings, error } = await supabase
            .from('bookings')
            .insert(bookings)
            .select();

        if (error) {
            console.error('❌ Error creating batch bookings:', error);
            throw error;
        }

        console.log(`✅ Created ${createdBookings.length} bookings for company: ${companyName}`);

        res.status(201).json({
            success: true,
            data: {
                bookings: createdBookings,
                count: createdBookings.length,
                companyId: companyId,
                companyName: companyName
            },
            message: `Successfully created ${createdBookings.length} bookings`
        });

    } catch (error) {
        console.error('❌ Error in batch booking creation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create batch bookings',
            message: error.message
        });
    }
});

// Helper function to get rate card for a company
async function getRateCardForCompany(companyId) {
    try {
        console.log(`🔍 Looking for rate card for company ID: ${companyId}`);
        
        const { data, error } = await supabase
            .from('rate_cards')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('effective_from', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            console.log(`❌ No rate card found for company ${companyId}:`, error?.message || 'No data');
            console.log(`🔄 Using default rate: ₹10 per article`);
            return null;
        }

        console.log(`✅ Found rate card for company ${companyId}:`, {
            id: data.id,
            per_article_rate: data.per_article_rate,
            base_rate: data.base_rate,
            effective_from: data.effective_from
        });
        return data;
    } catch (error) {
        console.error('❌ Error fetching rate card:', error);
        return null;
    }
}

// Helper function to calculate booking pricing - SIMPLIFIED
function calculateBookingPricing(articleCount, parcelType, rateCard) {
    let perArticleRate = 10.00; // Default rate

    // Use rate card if available
    if (rateCard && rateCard.per_article_rate) {
        perArticleRate = rateCard.per_article_rate;
    }

    // Simple calculation: Articles × Rate = Total
    const totalAmount = articleCount * perArticleRate;
    const grandTotal = totalAmount;

    console.log(`💰 Simple pricing calculation:`, {
        articleCount: `${articleCount} (type: ${typeof articleCount})`,
        perArticleRate: `${perArticleRate} (type: ${typeof perArticleRate})`,
        calculation: `${articleCount} × ${perArticleRate} = ${totalAmount}`,
        totalAmount,
        grandTotal,
        usingRateCard: !!rateCard
    });

    return {
        baseRate: 0,
        perArticleRate,
        parcelTypeCharge: 0,
        zoneCharge: 0,
        totalAmount,
        gstAmount: 0,
        grandTotal
    };
}

module.exports = router;