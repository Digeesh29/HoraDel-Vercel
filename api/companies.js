// Companies API for Vercel - Serverless function
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
        console.log('🏢 Companies API called:', req.method, req.url);

        if (req.method === 'GET') {
            // GET /api/companies - Get all companies
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .order('name');

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            console.log(`✅ Found ${data?.length || 0} companies`);

            return res.json({
                success: true,
                data: data || []
            });
        }

        if (req.method === 'POST') {
            // POST /api/companies - Create new company
            const { name, contact_person, phone, email, company_type, status } = req.body;

            const { data, error } = await supabase
                .from('companies')
                .insert([{
                    name,
                    contact_person,
                    phone,
                    email,
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
        console.error('❌ Companies API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process companies request',
            message: error.message
        });
    }
};