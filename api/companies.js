// Vercel API Route: /api/companies
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
        console.log('🏢 Fetching companies...');
        
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name');

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        console.log(`✅ Found ${data?.length || 0} companies`);

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('❌ Error fetching companies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch companies',
            message: error.message
        });
    }
};