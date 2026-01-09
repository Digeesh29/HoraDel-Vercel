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
        
        const { limit, page } = req.query;
        const queryLimit = limit ? Math.min(parseInt(limit), 500) : 200;
        const currentPage = page ? parseInt(page) : 1;
        const offset = (currentPage - 1) * queryLimit;
        
        const { data, error, count } = await supabase
            .from('companies')
            .select('*', { count: 'exact' })
            .order('name')
            .range(offset, offset + queryLimit - 1);

        if (error) {
            debugError('❌ Supabase error:', error);
            throw error;
        }

        debugLog(`✅ Found ${data?.length || 0} companies (page ${currentPage})`);

        res.json({
            success: true,
            data: data || [],
            total: count,
            page: currentPage,
            limit: queryLimit
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
        // Validate request body exists
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Request body is required',
                details: 'No data provided in request body'
            });
        }

        const { name, contact_person, phone, email, company_type, status } = req.body;

        // Validate required fields with detailed feedback
        if (!name || !phone) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                required: ['name', 'phone'],
                received: {
                    name: !!name,
                    phone: !!phone
                }
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
