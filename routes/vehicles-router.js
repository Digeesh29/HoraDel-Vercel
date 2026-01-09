// Vehicles Router
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

// POST /api/vehicles - Create new vehicle
router.post('/', async (req, res) => {
    try {
        // Validate request body exists
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Request body is required',
                details: 'No data provided in request body'
            });
        }

        const { registration_number, vehicle_type, capacity, capacity_kg, make, model, year, status, current_driver_id } = req.body;

        // Validate required fields with detailed feedback
        if (!registration_number || !vehicle_type) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                required: ['registration_number', 'vehicle_type'],
                received: {
                    registration_number: !!registration_number,
                    vehicle_type: !!vehicle_type
                }
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

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        debugError('Error creating vehicle:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create vehicle',
            message: error.message
        });
    }
});

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
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

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        debugError('Error updating vehicle:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update vehicle',
            message: error.message
        });
    }
});

// GET /api/vehicles - Get all vehicles
router.get('/', async (req, res) => {
    try {
        debugLog('📍 Fetching vehicles...');
        
        const { limit, page } = req.query;
        const queryLimit = limit ? Math.min(parseInt(limit), 500) : 200;
        const currentPage = page ? parseInt(page) : 1;
        const offset = (currentPage - 1) * queryLimit;
        
        const { data, error, count } = await supabase
            .from('vehicles')
            .select(`
                *,
                driver:drivers!current_driver_id(id, name, phone)
            `, { count: 'exact' })
            .order('registration_number')
            .range(offset, offset + queryLimit - 1);

        if (error) {
            debugError('❌ Supabase error:', error);
            throw error;
        }

        debugLog(`✅ Found ${data?.length || 0} vehicles (page ${currentPage})`);

        // Get all IN-TRANSIT bookings (assigned to vehicles) - limit to 1000
        const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('assigned_vehicle_id')
            .eq('status', 'IN-TRANSIT')
            .limit(1000);

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

        res.json({
            success: true,
            data: vehiclesWithBookings,
            total: count,
            page: currentPage,
            limit: queryLimit
        });
    } catch (error) {
        debugError('❌ Error fetching vehicles:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch vehicles',
            message: error.message,
            details: error.toString()
        });
    }
});

module.exports = router;
