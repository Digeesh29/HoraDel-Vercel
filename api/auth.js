// Direct auth handler for Vercel - uses your router logic
const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Parse the URL to determine the route
    const url = req.url || '';
    const isLogin = url.includes('/login') || url.endsWith('/login');
    const isRegister = url.includes('/register') || url.endsWith('/register');

    try {
        if (req.method === 'POST' && isLogin) {
            // LOGIN LOGIC - COPIED FROM YOUR auth-router.js
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and password are required'
                });
            }

            console.log('🔐 Login attempt for:', email);

            // Get user from database - EXACT SAME AS YOUR ROUTER
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

            // Use bcrypt to compare password with hash - EXACT SAME AS YOUR ROUTER
            const validPassword = await bcrypt.compare(password, users.password_hash);

            if (!validPassword) {
                console.log('❌ Invalid password for:', email);
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password'
                });
            }

            // Update last login - EXACT SAME AS YOUR ROUTER
            await supabase
                .from('auth_users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', users.id);

            // Return user data (excluding password) - EXACT SAME AS YOUR ROUTER
            const { password_hash, ...userData } = users;
            
            console.log('✅ Login successful for:', email);

            return res.json({
                success: true,
                message: 'Login successful',
                user: userData
            });

        } else if (req.method === 'POST' && isRegister) {
            // REGISTER LOGIC - Add if needed
            return res.status(501).json({
                success: false,
                error: 'Registration not implemented yet'
            });

        } else {
            return res.status(404).json({
                success: false,
                error: 'Route not found'
            });
        }

    } catch (error) {
        console.error('❌ Auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed',
            message: error.message
        });
    }
};