// Combined Reports & Ratecards API for Vercel
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
        const url = req.url || '';
        
        // Handle ratecards endpoints
        if (url.includes('ratecards') || url.includes('ratecard')) {
            if (req.method === 'GET') {
                const { data, error } = await supabase
                    .from('ratecards')
                    .select(`*, company:companies(id, name)`)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                return res.json({
                    success: true,
                    data: data || []
                });
            }
            
            if (req.method === 'POST') {
                const { data, error } = await supabase
                    .from('ratecards')
                    .insert([req.body])
                    .select(`*, company:companies(id, name)`);

                if (error) throw error;

                return res.json({
                    success: true,
                    message: 'Rate card created successfully',
                    data: data[0]
                });
            }
        }
        
        // Handle reports endpoints
        else {
            // Simple reports placeholder
            return res.json({
                success: true,
                data: {
                    message: 'Reports functionality',
                    endpoint: url
                }
            });
        }

    } catch (error) {
        console.error('❌ Reports/Ratecards error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process request',
            message: error.message
        });
    }
};