// Bookings API for Vercel - Direct function
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
        if (req.method === 'GET') {
            const { companyId, limit, status } = req.query;
            
            let query = supabase
                .from('bookings')
                .select(`
                    id, lr_number, booking_date, consignee_name, consignee_contact,
                    origin, destination, destination_pincode, article_count, parcel_type,
                    weight, description, grand_total, status, assigned_vehicle_id,
                    company:companies(id, name, phone),
                    vehicle:vehicles(id, registration_number, vehicle_type),
                    driver:drivers(id, name, phone)
                `)
                .order('booking_date', { ascending: false });

            if (companyId) query = query.eq('company_id', companyId);
            if (status) query = query.eq('status', status);
            if (limit) query = query.limit(parseInt(limit));

            const { data, error } = await query;
            if (error) throw error;

            return res.json({
                success: true,
                data: data || []
            });
            
        } else if (req.method === 'POST') {
            const bookingData = req.body;
            
            // Calculate pricing: Articles × Rate = Total
            if (bookingData.article_count && bookingData.per_article_rate) {
                bookingData.grand_total = bookingData.article_count * bookingData.per_article_rate;
            }
            
            bookingData.status = bookingData.status || 'BOOKED';
            bookingData.booking_date = bookingData.booking_date || new Date().toISOString();
            
            const { data, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select(`*, company:companies(name), vehicle:vehicles(registration_number), driver:drivers(name)`);

            if (error) throw error;

            return res.json({
                success: true,
                message: 'Booking created successfully',
                data: data[0]
            });
            
        } else if (req.method === 'PUT') {
            const { id } = req.query;
            const updateData = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Booking ID is required'
                });
            }
            
            const { data, error } = await supabase
                .from('bookings')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) throw error;

            return res.json({
                success: true,
                message: 'Booking updated successfully',
                data: data[0]
            });
        }

        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
        
    } catch (error) {
        console.error('❌ Bookings error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process booking request',
            message: error.message
        });
    }
};