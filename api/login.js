// Login API for Vercel - CommonJS format
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        console.log('🔐 Login attempt for:', email);

        // Get user from database
        const { data: users, error } = await supabase
            .from('auth_users')
            .select(`
                *,
                company:companies(id, name, email, phone)
            `)
            .eq('email', email.toLowerCase())
            .eq('is_active', true)
            .single();

        if (error || !users) {
            console.log('❌ User not found:', email);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Use bcrypt to compare password with hash
        const validPassword = await bcrypt.compare(password, users.password_hash);

        if (!validPassword) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Update last login
        await supabase
            .from('auth_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', users.id);

        // Return user data (excluding password)
        const { password_hash, ...userData } = users;
        
        console.log('✅ Login successful for:', email);

        res.json({
            success: true,
            message: 'Login successful',
            user: userData
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed',
            message: error.message
        });
    }
}