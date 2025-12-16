// Setup Demo Users API for Vercel
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('👥 Setting up demo users...');
        
        // Check if auth_users table exists and has data
        const { data: existingUsers, error: checkError } = await supabase
            .from('auth_users')
            .select('email, role')
            .limit(5);

        if (checkError) {
            console.error('❌ Error checking users:', checkError);
            return res.status(500).json({
                success: false,
                error: 'Failed to check existing users',
                message: checkError.message,
                hint: 'Make sure auth_users table exists in Supabase'
            });
        }

        console.log('📊 Existing users found:', existingUsers?.length || 0);

        // Check if admin user exists
        const adminExists = existingUsers?.some(user => user.email === 'admin@horadel.com');
        const clientExists = existingUsers?.some(user => user.email === 'client@company.com');

        if (adminExists && clientExists) {
            return res.json({
                success: true,
                message: 'Demo users already exist',
                data: {
                    existingUsers: existingUsers.length,
                    adminExists,
                    clientExists,
                    users: existingUsers
                }
            });
        }

        // Create demo users if they don't exist
        const usersToCreate = [];

        if (!adminExists) {
            const adminPasswordHash = await bcrypt.hash('admin123', 10);
            usersToCreate.push({
                email: 'admin@horadel.com',
                password_hash: adminPasswordHash,
                full_name: 'HoraDel Admin',
                role: 'admin',
                is_active: true
            });
        }

        if (!clientExists) {
            // First create a demo company for the client
            const { data: demoCompany, error: companyError } = await supabase
                .from('companies')
                .insert([{
                    name: 'Demo Company Ltd',
                    phone: '+91-9876543210',
                    email: 'demo@company.com',
                    address: 'Mumbai, Maharashtra',
                    status: 'active'
                }])
                .select()
                .single();

            if (companyError) {
                console.error('❌ Error creating demo company:', companyError);
            }

            const clientPasswordHash = await bcrypt.hash('client123', 10);
            usersToCreate.push({
                email: 'client@company.com',
                password_hash: clientPasswordHash,
                full_name: 'Demo Client User',
                phone: '+91-9876543211',
                company_id: demoCompany?.id || null,
                role: 'client',
                is_active: true
            });
        }

        if (usersToCreate.length > 0) {
            const { data: newUsers, error: createError } = await supabase
                .from('auth_users')
                .insert(usersToCreate)
                .select('email, role, full_name');

            if (createError) {
                console.error('❌ Error creating users:', createError);
                throw createError;
            }

            console.log('✅ Created demo users:', newUsers.length);

            return res.json({
                success: true,
                message: `Created ${newUsers.length} demo users successfully`,
                data: {
                    createdUsers: newUsers,
                    totalUsers: (existingUsers?.length || 0) + newUsers.length
                }
            });
        }

        res.json({
            success: true,
            message: 'No users needed to be created',
            data: {
                existingUsers: existingUsers.length
            }
        });

    } catch (error) {
        console.error('❌ Setup users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to setup demo users',
            message: error.message,
            details: error.stack
        });
    }
};