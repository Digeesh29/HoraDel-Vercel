// Vercel API Route: /api/vehicles
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
            console.log('🚛 Fetching vehicles...');
            
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .order('registration_number');

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            console.log(`✅ Found ${data?.length || 0} vehicles`);

            res.json({
                success: true,
                data: data || []
            });

        } else if (req.method === 'POST') {
            const vehicleData = req.body;
            
            const { data, error } = await supabase
                .from('vehicles')
                .insert([vehicleData])
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data: data
            });

        } else if (req.method === 'PUT') {
            const { id } = req.query;
            const updateData = req.body;
            
            const { data, error } = await supabase
                .from('vehicles')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json({
                success: true,
                data: data
            });

        } else if (req.method === 'DELETE') {
            const { id } = req.query;
            
            const { error } = await supabase
                .from('vehicles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.json({
                success: true,
                message: 'Vehicle deleted successfully'
            });

        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('❌ Error in vehicles API:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process vehicles request',
            message: error.message
        });
    }
};