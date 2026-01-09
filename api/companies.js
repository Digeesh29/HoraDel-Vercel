// Companies API for Vercel - Serverless function
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
        debugLog('🏢 Companies API called:', req.method, req.url);

        if (req.method === 'GET') {
            // GET /api/companies - Get all companies
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .order('name');

            if (error) {
                debugError('❌ Supabase error:', error);
                throw error;
            }

            debugLog(`✅ Found ${data?.length || 0} companies`);

            return res.json({
                success: true,
                data: data || []
            });
        }

        if (req.method === 'POST') {
            // POST /api/companies - Create new company
            const { name, contact_person, phone, email, company_type, status } = req.body;

            // Validate required fields
            if (!name || !phone) {
                return res.status(400).json({
                    success: false,
                    error: 'Company name and phone are required'
                });
            }

            // Validate email format if provided
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid email format'
                });
            }

            const { data, error } = await supabase
                .from('companies')
                .insert([{
                    name: name.trim(),
                    contact_person: contact_person ? contact_person.trim() : null,
                    phone: phone.trim(),
                    email: email ? email.trim().toLowerCase() : null,
                    company_type: company_type || 'Corporate',
                    status: status || 'Active'
                }])
                .select()
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
        debugError('❌ Companies API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process companies request',
            message: error.message
        });
    }
};