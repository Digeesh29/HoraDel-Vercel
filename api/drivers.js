// Vercel API Route: /api/drivers
const supabase = require('../config/supabase');

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            console.log('👨‍💼 Fetching drivers...');
            
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .order('name');

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            console.log(`✅ Found ${data?.length || 0} drivers`);

            res.json({
                success: true,
                data: data || []
            });

        } else if (req.method === 'POST') {
            const driverData = req.body;
            
            const { data, error } = await supabase
                .from('drivers')
                .insert([driverData])
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data: data
            });

        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('❌ Error in drivers API:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process drivers request',
            message: error.message
        });
    }
};