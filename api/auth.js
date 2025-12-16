// Authentication API for Vercel
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
        if (req.method === 'POST') {
            const { action, email, password, full_name, phone, company_name, company_phone, company_email, company_address } = req.body;
            
            if (action === 'login') {
                // Handle login
                console.log('🔐 Login attempt for:', email);
                
                const { data: user, error } = await supabase
                    .from('auth_users')
                    .select('*')
                    .eq('email', email)
                    .eq('is_active', true)
                    .single();

                if (error || !user) {
                    console.log('❌ User not found:', email);
                    return res.status(401).json({
                        success: false,
                        error: 'Invalid email or password'
                    });
                }

                // Verify password using bcrypt
                const passwordMatch = await bcrypt.compare(password, user.password_hash);
                
                if (!passwordMatch) {
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
                    .eq('id', user.id);

                console.log('✅ Login successful for:', email, 'Role:', user.role);

                return res.json({
                    success: true,
                    message: 'Login successful',
                    user: {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        full_name: user.full_name,
                        company_id: user.company_id
                    }
                });
                
            } else if (action === 'register') {
                // Handle registration
                console.log('📝 Registration attempt for:', email);
                
                // Check if user already exists
                const { data: existingUser } = await supabase
                    .from('auth_users')
                    .select('email')
                    .eq('email', email)
                    .single();

                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        error: 'Email already registered'
                    });
                }

                // Create company first
                const { data: newCompany, error: companyError } = await supabase
                    .from('companies')
                    .insert([{
                        name: company_name,
                        phone: company_phone,
                        email: company_email,
                        address: company_address,
                        status: 'active'
                    }])
                    .select()
                    .single();

                if (companyError) {
                    console.error('❌ Company creation error:', companyError);
                    throw companyError;
                }

                // Hash password
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                // Create user
                const { data: newUser, error: userError } = await supabase
                    .from('auth_users')
                    .insert([{
                        email: email,
                        password_hash: hashedPassword,
                        full_name: full_name,
                        phone: phone,
                        company_id: newCompany.id,
                        role: 'client',
                        is_active: true
                    }])
                    .select()
                    .single();

                if (userError) {
                    console.error('❌ User creation error:', userError);
                    throw userError;
                }

                console.log('✅ Registration successful for:', email);

                return res.json({
                    success: true,
                    message: 'Registration successful',
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        role: newUser.role,
                        full_name: newUser.full_name,
                        company_id: newUser.company_id
                    }
                });
                
            } else {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action. Use "login" or "register"'
                });
            }
            
        } else {
            return res.status(405).json({
                success: false,
                error: 'Method not allowed'
            });
        }
        
    } catch (error) {
        console.error('❌ Auth API error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed',
            message: error.message
        });
    }
};