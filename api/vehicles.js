// Vehicles API for Vercel - Serverless function
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

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        debugLog('🚛 Vehicles API called:', req.method, req.url);

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
                debugError('❌ Supabase error:', error);
                throw error;
            }

            debugLog(`✅ Found ${data?.length || 0} vehicles`);

            // Get all IN-TRANSIT bookings (assigned to vehicles)
            const { data: bookings, error: bookingsError } = await supabase
                .from('bookings')
                .select('assigned_vehicle_id')
                .eq('status', 'IN-TRANSIT');

            if (bookingsError) {
                debugError('Error fetching bookings:', bookingsError);
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

            // Validate required fields
            if (!registration_number || !vehicle_type) {
                return res.status(400).json({
                    success: false,
                    error: 'Registration number and vehicle type are required'
                });
            }

            // Validate capacity if provided
            if (capacity && (isNaN(capacity) || capacity <= 0)) {
                return res.status(400).json({
                    success: false,
                    error: 'Capacity must be a positive number'
                });
            }

            const { data, error } = await supabase
                .from('vehicles')
                .insert([{
                    registration_number: registration_number.trim().toUpperCase(),
                    vehicle_type: vehicle_type.trim(),
                    capacity: capacity || null,
                    capacity_kg: capacity_kg || null,
                    make: make ? make.trim() : null,
                    model: model ? model.trim() : null,
                    year: year || null,
                    status: status || 'Available',
                    current_driver_id: current_driver_id || null
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
        debugError('❌ Vehicles API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process vehicles request',
            message: error.message
        });
    }
};