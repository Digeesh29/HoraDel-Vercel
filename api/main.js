// Main API Handler for Vercel - Consolidates multiple endpoints
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;
    
    try {
        switch (action) {
            case 'dashboard':
                return await handleDashboard(req, res);
            case 'companies':
                return await handleCompanies(req, res);
            case 'bookings':
                return await handleBookings(req, res);
            case 'vehicles':
                return await handleVehicles(req, res);
            case 'auth':
                return await handleAuth(req, res);
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action parameter',
                    availableActions: ['dashboard', 'companies', 'bookings', 'vehicles', 'auth']
                });
        }
    } catch (error) {
        console.error(`❌ API Error (${action}):`, error);
        res.status(500).json({
            success: false,
            error: error.message,
            action: action
        });
    }
};

// Dashboard handler
async function handleDashboard(req, res) {
    const { companyId } = req.query;
    
    // Get basic counts
    const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

    const { count: inTransitCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'IN-TRANSIT');

    const { count: deliveredCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'DELIVERED');

    // Get recent bookings
    const { data: recentBookings } = await supabase
        .from('bookings')
        .select(`
            id, lr_number, booking_date, consignee_name, destination,
            article_count, status, grand_total, company:companies(name)
        `)
        .eq('status', 'BOOKED')
        .is('assigned_vehicle_id', null)
        .order('booking_date', { ascending: false })
        .limit(10);

    return res.json({
        success: true,
        data: {
            stats: {
                todayBookings: 0,
                totalBookings: totalBookings || 0,
                totalInTransit: inTransitCount || 0,
                allTimeDelivered: deliveredCount || 0,
                activeVehicles: 5,
                parcelsInTransit: inTransitCount || 0,
                pendingDeliveries: inTransitCount || 0
            },
            recentBookings: recentBookings || [],
            trend: {
                labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                values: [0, 0, 0, 0, 0, 0, 0]
            },
            companyDistribution: {
                labels: ['Companies'],
                values: [1]
            }
        }
    });
}

// Companies handler
async function handleCompanies(req, res) {
    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name');

        if (error) throw error;

        return res.json({
            success: true,
            data: data || []
        });
    }
    
    if (req.method === 'POST') {
        const { data, error } = await supabase
            .from('companies')
            .insert([req.body])
            .select();

        if (error) throw error;

        return res.json({
            success: true,
            data: data[0]
        });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}

// Bookings handler
async function handleBookings(req, res) {
    const { companyId, limit } = req.query;
    
    if (req.method === 'GET') {
        let query = supabase
            .from('bookings')
            .select(`*, company:companies(id, name)`)
            .order('booking_date', { ascending: false });

        if (companyId) {
            query = query.eq('company_id', companyId);
        }
        
        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const { data, error } = await query;
        if (error) throw error;

        return res.json({
            success: true,
            data: data || []
        });
    }
    
    if (req.method === 'POST') {
        const { data, error } = await supabase
            .from('bookings')
            .insert([req.body])
            .select();

        if (error) throw error;

        return res.json({
            success: true,
            data: data[0]
        });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}

// Vehicles handler
async function handleVehicles(req, res) {
    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .order('registration_number');

        if (error) throw error;

        return res.json({
            success: true,
            data: data || []
        });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}

// Auth handler
async function handleAuth(req, res) {
    if (req.method === 'POST') {
        const { action: authAction, email, password } = req.body;
        
        if (authAction === 'login') {
            // Simple login check
            const { data: user, error } = await supabase
                .from('auth_users')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .single();

            if (error || !user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials'
                });
            }

            return res.json({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    full_name: user.full_name,
                    company_id: user.company_id
                }
            });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}