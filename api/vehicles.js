// Convert vehicles-router.js to work with Vercel
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

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
            // GET /api/vehicles - SAME AS YOUR ORIGINAL CODE
            const { data, error } = await supabase
                .from('vehicles')
                .select(`
                    *,
                    driver:drivers(id, name, phone),
                    assigned_bookings:bookings!assigned_vehicle_id(
                        id,
                        lr_number,
                        consignee_name,
                        destination,
                        status
                    )
                `)
                .order('registration_number');

            if (error) throw error;

            // Calculate status based on assigned bookings - SAME AS YOUR ORIGINAL CODE
            const vehiclesWithStatus = (data || []).map(vehicle => {
                const assignedCount = vehicle.assigned_bookings?.length || 0;
                return {
                    ...vehicle,
                    status: assignedCount > 0 ? 'Assigned' : 'Available',
                    assigned_parcels_count: assignedCount
                };
            });

            res.json({
                success: true,
                data: vehiclesWithStatus
            });
            
        } else if (req.method === 'POST') {
            // POST /api/vehicles - Create new vehicle - SAME AS YOUR ORIGINAL CODE
            const vehicleData = req.body;
            
            const { data, error } = await supabase
                .from('vehicles')
                .insert([vehicleData])
                .select();

            if (error) throw error;

            res.json({
                success: true,
                message: 'Vehicle created successfully',
                data: data[0]
            });
            
        } else if (req.method === 'PUT') {
            // PUT /api/vehicles - Update vehicle - SAME AS YOUR ORIGINAL CODE
            const { id } = req.query;
            const updateData = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Vehicle ID is required'
                });
            }
            
            const { data, error } = await supabase
                .from('vehicles')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) throw error;

            res.json({
                success: true,
                message: 'Vehicle updated successfully',
                data: data[0]
            });
            
        } else {
            res.status(405).json({
                success: false,
                error: 'Method not allowed'
            });
        }
        
    } catch (error) {
        console.error('Error in vehicles API:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process vehicle request',
            message: error.message
        });
    }
};