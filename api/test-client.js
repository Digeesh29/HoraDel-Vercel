// Test Client Dashboard APIs
const supabase = require('../config/supabase');

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const results = {
            timestamp: new Date().toISOString(),
            tests: {}
        };

        // Test 1: Companies
        try {
            const { data: companies, error: companiesError } = await supabase
                .from('companies')
                .select('*')
                .limit(5);
            
            results.tests.companies = {
                success: !companiesError,
                count: companies?.length || 0,
                error: companiesError?.message
            };
        } catch (err) {
            results.tests.companies = {
                success: false,
                error: err.message
            };
        }

        // Test 2: Bookings
        try {
            const { data: bookings, error: bookingsError } = await supabase
                .from('bookings')
                .select('*')
                .limit(5);
            
            results.tests.bookings = {
                success: !bookingsError,
                count: bookings?.length || 0,
                error: bookingsError?.message
            };
        } catch (err) {
            results.tests.bookings = {
                success: false,
                error: err.message
            };
        }

        // Test 3: Auth Users
        try {
            const { data: users, error: usersError } = await supabase
                .from('auth_users')
                .select('id, email, role')
                .limit(3);
            
            results.tests.auth_users = {
                success: !usersError,
                count: users?.length || 0,
                error: usersError?.message
            };
        } catch (err) {
            results.tests.auth_users = {
                success: false,
                error: err.message
            };
        }

        res.json({
            success: true,
            results
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};