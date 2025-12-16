// Companies API endpoint
const supabase = require('../config/supabase');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .order('name');

            if (error) throw error;

            res.json({
                success: true,
                data: data || []
            });
        } else if (req.method === 'POST') {
            const companyData = req.body;
            
            const { data, error } = await supabase
                .from('companies')
                .insert([companyData])
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
        console.error('Companies API error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};