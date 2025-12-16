// Vehicles API for Vercel - Serverless function
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
        console.log('🚛 Vehicles API called:', req.method, req.url);

        if (req.method === 'GET') {
            // GET /api/vehicles - Get all vehicles
            const { data, error } = await supabase
                .from('vehicles')
                .select(`
                    *,
                    driver:drivers!current_driver_id(id, name, phone)
                `)
                .order('registration_number');

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            console.log(`✅ Found ${data?.length || 0} vehicles`);

            // Get all IN-TRANSIT bookings (assigned to vehicles)
            const { data: bookings, error: bookingsError } = await supabase
                .from('bookings')
                .select('assigned_vehicle_id')
                .eq('status', 'IN-TRANSIT');

            if (bookingsError) {
                console.error('Error fetching bookings:', bookingsError);
            }

            // Count bookings per vehicle
            const bookingCounts = {};
            (bookings || []).forEach(b => {
                if (b.assigned_vehicle_id) {
                    bookingCounts[b.assigned_vehicle_id] = (bookingCounts[b.assigned_vehicle_id] || 0) + 1;
                }
            });

            // Add counts to vehicles and update status based on assignments
            const vehiclesWithBookings = (data || []).map(vehicle => {
                const assignedCount = bookingCounts[vehicle.id] || 0;
                
                // Auto-update status based on assigned parcels
                let updatedStatus = vehicle.status;
                if (assignedCount > 0 && vehicle.status === 'Available') {
                    updatedStatus = 'Assigned';
                } else if (assignedCount === 0 && (vehicle.status === 'Assigned' || vehicle.status === 'Dispatched')) {
                    updatedStatus = 'Available';
                }
                
                return {
                    ...vehicle,
                    status: updatedStatus,
                    assignedParcels: assignedCount
                };
            });

            return res.json({
                success: true,
                data: vehiclesWithBookings
            });
        }

        if (req.method === 'POST') {
            // POST /api/vehicles - Create new vehicle
            const { registration_number, vehicle_type, capacity, capacity_kg, make, model, year, status, current_driver_id } = req.body;

            const { data, error } = await supabase
                .from('vehicles')
                .insert([{
                    registration_number,
                    vehicle_type,
                    capacity,
                    capacity_kg,
                    make,
                    model,
                    year,
                    status: status || 'Available',
                    current_driver_id
                }])
                .select(`
                    *,
                    driver:drivers!current_driver_id(id, name, phone)
                `)
                .single();

            if (error) throw error;

            return res.json({
                success: true,
                data: data
            });
        }

        if (req.method === 'PUT') {
            // PUT /api/vehicles/:id - Update vehicle
            // Extract ID from URL path
            const pathParts = req.url.split('/');
            const id = pathParts[pathParts.length - 1];
            
            if (!id || id === 'vehicles') {
                return res.status(400).json({
                    success: false,
                    error: 'Vehicle ID is required for update'
                });
            }

            const updateData = req.body;

            const { data, error } = await supabase
                .from('vehicles')
                .update(updateData)
                .eq('id', id)
                .select(`
                    *,
                    driver:drivers!current_driver_id(id, name, phone)
                `)
                .single();

            if (error) throw error;

            return res.json({
                success: true,
                data: data
            });
        }

        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });

    } catch (error) {
        console.error('❌ Vehicles API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process vehicles request',
            message: error.message
        });
    }
};