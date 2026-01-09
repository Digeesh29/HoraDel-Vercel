// Rate Cards Router
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Server-side debug configuration
const DEBUG_MODE = process.env.NODE_ENV !== 'production';

// Server-side conditional logging functions
function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log(...args);
    }
}

function debugError(...args) {
    if (DEBUG_MODE) {
        console.error(...args);
    }
}

// GET /api/ratecards - Get all rate cards with company info
router.get('/', async (req, res) => {
    try {
        debugLog('📋 Fetching rate cards...');
        
        const { data, error } = await supabase
            .from('rate_cards')
            .select(`
                *,
                company:companies(id, name, phone, email)
            `)
            .eq('is_active', true)
            .order('effective_from', { ascending: false });

        if (error) {
            debugError('❌ Supabase error:', error);
            throw error;
        }

        debugLog(`✅ Found ${data?.length || 0} rate cards`);

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        debugError('❌ Error fetching rate cards:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch rate cards',
            message: error.message
        });
    }
});

// GET /api/ratecards/:id - Get single rate card
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('rate_cards')
            .select(`
                *,
                company:companies(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Rate card not found'
            });
        }

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        debugError('Error fetching rate card:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch rate card',
            message: error.message
        });
    }
});

// POST /api/ratecards - Create new rate card
router.post('/', async (req, res) => {
    try {
        const { company_id, base_rate, per_article_rate, parcel_type_charges, effective_from } = req.body;

        // Deactivate old rate cards for this company
        await supabase
            .from('rate_cards')
            .update({ is_active: false })
            .eq('company_id', company_id);

        // Insert new rate card
        const { data, error } = await supabase
            .from('rate_cards')
            .insert([{
                company_id,
                base_rate,
                per_article_rate,
                parcel_type_charges,
                effective_from: effective_from || new Date().toISOString().split('T')[0],
                is_active: true
            }])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        debugError('Error creating rate card:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create rate card',
            message: error.message
        });
    }
});

// PUT /api/ratecards/:id - Update rate card
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { base_rate, per_article_rate, parcel_type_charges, effective_from } = req.body;

        const { data, error } = await supabase
            .from('rate_cards')
            .update({
                base_rate,
                per_article_rate,
                parcel_type_charges,
                effective_from
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        debugError('Error updating rate card:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update rate card',
            message: error.message
        });
    }
});

// POST /api/ratecards/:id/recalculate-bookings - Recalculate all bookings for this rate card's company
router.post('/:id/recalculate-bookings', async (req, res) => {
    try {
        const { id } = req.params;
        
        debugLog(`🔄 Recalculating bookings for rate card: ${id}`);
        
        // Get the rate card to find the company
        const { data: rateCard, error: rateError } = await supabase
            .from('rate_cards')
            .select('*')
            .eq('id', id)
            .single();
        
        if (rateError || !rateCard) {
            throw new Error('Rate card not found');
        }
        
        debugLog(`📋 Rate card found for company: ${rateCard.company_id}`);
        
        // Get all bookings for this company
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id, article_count')
            .eq('company_id', rateCard.company_id);
        
        if (bookingsError) {
            throw bookingsError;
        }
        
        if (!bookings || bookings.length === 0) {
            return res.json({
                success: true,
                message: 'No bookings found for this company',
                data: {
                    updatedCount: 0,
                    totalBookings: 0
                }
            });
        }
        
        debugLog(`📦 Found ${bookings.length} bookings to recalculate`);
        
        // Recalculate pricing for each booking
        const perArticleRate = rateCard.per_article_rate;
        let updatedCount = 0;
        
        for (const booking of bookings) {
            const articleCount = booking.article_count || 0;
            const newGrandTotal = articleCount * perArticleRate;
            
            // Update the booking with new pricing
            const { error: updateError } = await supabase
                .from('bookings')
                .update({
                    per_article_rate: perArticleRate,
                    base_rate: 0,
                    parcel_type_charge: 0,
                    zone_charge: 0,
                    total_amount: newGrandTotal,
                    grand_total: newGrandTotal
                })
                .eq('id', booking.id);
            
            if (!updateError) {
                updatedCount++;
            } else {
                debugError(`❌ Failed to update booking ${booking.id}:`, updateError);
            }
        }
        
        debugLog(`✅ Updated ${updatedCount} of ${bookings.length} bookings`);
        
        res.json({
            success: true,
            message: `Successfully recalculated ${updatedCount} bookings`,
            data: {
                updatedCount,
                totalBookings: bookings.length,
                newRate: perArticleRate
            }
        });
    } catch (error) {
        debugError('❌ Error recalculating bookings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to recalculate bookings',
            message: error.message
        });
    }
});

// GET /api/ratecards/:id/booking-impact - Get impact of rate card on existing bookings
router.get('/:id/booking-impact', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get the rate card to find the company
        const { data: rateCard, error: rateError } = await supabase
            .from('rate_cards')
            .select(`
                *,
                company:companies(id, name)
            `)
            .eq('id', id)
            .single();
        
        if (rateError || !rateCard) {
            throw new Error('Rate card not found');
        }
        
        // Get all bookings for this company
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id, lr_number, article_count, per_article_rate, grand_total')
            .eq('company_id', rateCard.company_id);
        
        if (bookingsError) {
            throw bookingsError;
        }
        
        // Calculate impact
        const newRate = rateCard.per_article_rate;
        const impactDetails = (bookings || []).map(booking => {
            const oldRate = booking.per_article_rate || 0;
            const oldTotal = booking.grand_total || 0;
            const newTotal = booking.article_count * newRate;
            const difference = newTotal - oldTotal;
            
            return {
                lr_number: booking.lr_number,
                articles: booking.article_count,
                oldRate,
                newRate,
                oldTotal,
                newTotal,
                difference,
                needsUpdate: Math.abs(difference) > 0.01
            };
        });
        
        const needsUpdate = impactDetails.filter(i => i.needsUpdate);
        const totalOldRevenue = impactDetails.reduce((sum, i) => sum + i.oldTotal, 0);
        const totalNewRevenue = impactDetails.reduce((sum, i) => sum + i.newTotal, 0);
        
        res.json({
            success: true,
            data: {
                rateCard: {
                    id: rateCard.id,
                    company: rateCard.company?.name || 'Unknown',
                    newRate: rateCard.per_article_rate
                },
                bookingsCount: bookings?.length || 0,
                needsUpdateCount: needsUpdate.length,
                oldTotalRevenue: totalOldRevenue,
                newTotalRevenue: totalNewRevenue,
                revenueDifference: totalNewRevenue - totalOldRevenue,
                impactDetails: impactDetails.slice(0, 100) // Limit to 100 for performance
            }
        });
    } catch (error) {
        debugError('Error calculating booking impact:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate impact',
            message: error.message
        });
    }
});

module.exports = router;
