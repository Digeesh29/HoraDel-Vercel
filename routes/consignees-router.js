// Consignees Router
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET /api/consignees - Get all consignees for a company
router.get('/', async (req, res) => {
    try {
        const { companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                error: 'Company ID is required'
            });
        }

        const { data, error } = await supabase
            .from('consignees')
            .select('*')
            .eq('company_id', companyId)
            .order('name');

        if (error) throw error;

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Error fetching consignees:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch consignees',
            message: error.message
        });
    }
});

// GET /api/consignees/pending - Get pending consignees for admin approval
router.get('/pending', async (req, res) => {
    try {
        let { data, error } = await supabase
            .from('consignees')
            .select(`
                *,
                company:companies(name, email)
            `)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });

        // If status column doesn't exist, return empty array (no pending requests)
        if (error && error.message.includes('column') && error.message.includes('status')) {
            console.log('Status column not found, returning empty pending list...');
            data = [];
            error = null;
        }

        if (error) throw error;

        res.json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Error fetching pending consignees:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending consignees',
            message: error.message
        });
    }
});

// GET /api/consignees/debug - Debug endpoint to check table state
router.get('/debug', async (req, res) => {
    try {
        // Try to get a sample record to see what columns exist
        const { data: sampleData, error: sampleError } = await supabase
            .from('consignees')
            .select('*')
            .limit(1);

        // Also try to get count of records
        const { count, error: countError } = await supabase
            .from('consignees')
            .select('*', { count: 'exact', head: true });

        res.json({
            success: true,
            debug: {
                sampleRecord: sampleData?.[0] || null,
                totalRecords: count || 0,
                sampleError: sampleError?.message || null,
                countError: countError?.message || null,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error in debug endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to debug table',
            message: error.message
        });
    }
});

// POST /api/consignees - Create new consignee
router.post('/', async (req, res) => {
    try {
        const {
            name,
            contact_person,
            address,
            city,
            state,
            phone,
            email,
            pincode,
            gst_number,
            company_id
        } = req.body;

        // Validate required fields
        if (!name || !address || !city || !phone || !company_id) {
            return res.status(400).json({
                success: false,
                error: 'Name, address, city, phone, and company ID are required'
            });
        }

        // First, try to insert with approval columns
        let { data, error } = await supabase
            .from('consignees')
            .insert([{
                name: name.trim(),
                contact_person: contact_person?.trim() || null,
                address: address.trim(),
                city: city.trim(),
                state: state?.trim() || null,
                phone: phone.trim(),
                email: email?.trim() || null,
                pincode: pincode?.trim() || null,
                gst_number: gst_number?.trim() || null,
                company_id,
                status: 'PENDING', // New consignees need approval
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        // If error due to missing columns, try without approval columns
        if (error && error.message.includes('column') && error.message.includes('does not exist')) {
            console.log('Approval columns not found, inserting without them...');
            const result = await supabase
                .from('consignees')
                .insert([{
                    name: name.trim(),
                    contact_person: contact_person?.trim() || null,
                    address: address.trim(),
                    city: city.trim(),
                    state: state?.trim() || null,
                    phone: phone.trim(),
                    email: email?.trim() || null,
                    pincode: pincode?.trim() || null,
                    gst_number: gst_number?.trim() || null,
                    company_id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            data = result.data;
            error = result.error;
        }

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error creating consignee:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create consignee',
            message: error.message
        });
    }
});

// PUT /api/consignees/:id - Update consignee
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            contact_person,
            address,
            city,
            state,
            phone,
            email,
            pincode,
            gst_number
        } = req.body;

        // Validate required fields
        if (!name || !address || !city || !phone) {
            return res.status(400).json({
                success: false,
                error: 'Name, address, city, and phone are required'
            });
        }

        const { data, error } = await supabase
            .from('consignees')
            .update({
                name: name.trim(),
                contact_person: contact_person?.trim() || null,
                address: address.trim(),
                city: city.trim(),
                state: state?.trim() || null,
                phone: phone.trim(),
                email: email?.trim() || null,
                pincode: pincode?.trim() || null,
                gst_number: gst_number?.trim() || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Consignee not found'
            });
        }

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error updating consignee:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update consignee',
            message: error.message
        });
    }
});

// DELETE /api/consignees/:id - Delete consignee
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('consignees')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Consignee deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting consignee:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete consignee',
            message: error.message
        });
    }
});

// PUT /api/consignees/:id/last-used - Update last used timestamp
router.put('/:id/last-used', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('consignees')
            .update({
                last_used: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error updating consignee last used:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update consignee',
            message: error.message
        });
    }
});

// PUT /api/consignees/:id/approve - Approve a consignee (admin only)
router.put('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId, consigneeNumber } = req.body; // Should come from authenticated admin user

        // Debug logging
        console.log('🔍 Approval request received for consignee:', id);
        console.log('  - Consignee Number:', consigneeNumber);

        // Validate consignee number if provided
        if (consigneeNumber) {
            // Check if consignee number already exists
            const { data: existingConsignee, error: checkError } = await supabase
                .from('consignees')
                .select('id, consignee_number')
                .eq('consignee_number', consigneeNumber)
                .neq('id', id) // Exclude current consignee
                .single();

            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('Error checking consignee number:', checkError);
            }

            if (existingConsignee) {
                return res.status(400).json({
                    success: false,
                    error: `Consignee number ${consigneeNumber} is already assigned to another consignee`
                });
            }
        }

        // Prepare update data
        let updateData = {
            status: 'APPROVED',
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Add consignee number if provided
        if (consigneeNumber) {
            updateData.consignee_number = consigneeNumber;
        }

        // Only add approved_by if adminId is provided and valid
        if (adminId && adminId.length > 0) {
            updateData.approved_by = adminId;
        }

        // Perform the update
        let { data, error } = await supabase
            .from('consignees')
            .update(updateData)
            .eq('id', id)
            .eq('status', 'PENDING') // Only approve pending consignees
            .select('id, name, status, consignee_number, approved_at, updated_at')
            .single();

        // If approval columns don't exist, just update the timestamp (consignee is already "approved")
        if (error && error.message.includes('column') && (error.message.includes('status') || error.message.includes('approved'))) {
            console.log('Approval columns not found, treating as already approved...');
            const result = await supabase
                .from('consignees')
                .update({
                    consignee_number: consigneeNumber || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('*')
                .single();
            
            data = result.data;
            error = result.error;
        }

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Consignee not found or already processed'
            });
        }

        res.json({
            success: true,
            data: data,
            message: 'Consignee approved successfully'
        });
    } catch (error) {
        console.error('Error approving consignee:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to approve consignee',
            message: error.message
        });
    }
});

// PUT /api/consignees/:id/reject - Reject a consignee (admin only)
router.put('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId, reason } = req.body;

        // First try with approval columns (without foreign key reference if adminId is invalid)
        let updateData = {
            status: 'REJECTED',
            approved_at: new Date().toISOString(),
            rejection_reason: reason || 'No reason provided',
            updated_at: new Date().toISOString()
        };

        // Only add approved_by if adminId is provided and valid
        if (adminId && adminId.length > 0) {
            updateData.approved_by = adminId;
        }

        let { data, error } = await supabase
            .from('consignees')
            .update(updateData)
            .eq('id', id)
            .eq('status', 'PENDING')
            .select()
            .single();

        // If approval columns don't exist, delete the consignee instead (simulate rejection)
        if (error && error.message.includes('column') && (error.message.includes('status') || error.message.includes('approved'))) {
            console.log('Approval columns not found, deleting consignee to simulate rejection...');
            const result = await supabase
                .from('consignees')
                .delete()
                .eq('id', id)
                .select()
                .single();
            
            if (result.error) throw result.error;
            
            return res.json({
                success: true,
                data: result.data,
                message: 'Consignee rejected and removed successfully'
            });
        }

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Consignee not found or already processed'
            });
        }

        res.json({
            success: true,
            data: data,
            message: 'Consignee rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting consignee:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reject consignee',
            message: error.message
        });
    }
});

module.exports = router;