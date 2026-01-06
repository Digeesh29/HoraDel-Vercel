// Companies Router
const express = require('express');
const router = express.Router();
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

// GET /api/companies - Get all companies
router.get('/', async (req, res) => {
    try {
        debugLog('🏢 Fetching companies...');
        
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('name');

        if (error) {
            debugError('❌ Supabase error:', error);
            throw error;
        }

        debugLog(`✅ Found ${data?.length || 0} companies`);

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        debugError('❌ Error fetching companies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch companies',
            message: error.message
        });
    }
});

// POST /api/companies - Create new company
router.post('/', async (req, res) => {
    try {
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

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        debugError('Error creating company:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create company',
            message: error.message
        });
    }
});

module.exports = router;
