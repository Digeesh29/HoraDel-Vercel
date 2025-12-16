// Convert ratecards-router.js to work with Vercel
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // GET /api/ratecards
            const { data, error } = await supabase
                .from('ratecards')
                .select(`
                    *,
                    company:companies(id, name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json({
                success: true,
                data: data || []
            });
            
        } else if (req.method === 'POST') {
            // POST /api/ratecards - Create new rate card
            const ratecardData = req.body;
            
            const { data, error } = await supabase
                .from('ratecards')
                .insert([ratecardData])
                .select(`
                    *,
                    company:companies(id, name)
                `);

            if (error) throw error;

            res.json({
                success: true,
                message: 'Rate card created successfully',
                data: data[0]
            });
            
        } else if (req.method === 'PUT') {
            // PUT /api/ratecards - Update rate card
            const { id } = req.query;
            const updateData = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Rate card ID is required'
                });
            }
            
            const { data, error } = await supabase
                .from('ratecards')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) throw error;

            res.json({
                success: true,
                message: 'Rate card updated successfully',
                data: data[0]
            });
            
        } else if (req.method === 'DELETE') {
            // DELETE /api/ratecards - Delete rate card
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Rate card ID is required'
                });
            }
            
            const { error } = await supabase
                .from('ratecards')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.json({
                success: true,
                message: 'Rate card deleted successfully'
            });
            
        } else {
            res.status(405).json({
                success: false,
                error: 'Method not allowed'
            });
        }
        
    } catch (error) {
        console.error('Error in ratecards API:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process rate card request',
            message: error.message
        });
    }
};