// Authentication Router
const express = require('express');
const bcrypt = require('bcrypt');
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

const SALT_ROUNDS = 10;

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // For demo purposes, we'll use simple password checking
        // In production, use proper password hashing (bcrypt)
        const { data: users, error } = await supabase
            .from('auth_users')
            .select(`
                *,
                company:companies(id, name, email, phone)
            `)
            .eq('email', email.toLowerCase().trim())
            .eq('is_active', true)
            .maybeSingle();

        if (error || !users) {
            debugLog('Login failed for:', email);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Use bcrypt to compare password with hash
        const validPassword = await bcrypt.compare(password, users.password_hash);

        if (!validPassword) {
            debugLog('Invalid password for:', email);
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
        
        debugLog('Login successful for:', email);
        
        res.json({
            success: true,
            user: userData,
            message: 'Login successful'
        });

    } catch (error) {
        debugError('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// POST /api/auth/register - User registration
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, phone, company } = req.body;

        // Detailed validation with specific error messages
        if (!email || !password || !full_name) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, and full name are required',
                details: {
                    email: !email ? 'Email is required' : null,
                    password: !password ? 'Password is required' : null,
                    full_name: !full_name ? 'Full name is required' : null
                }
            });
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
        }

        // Handle company data - make it optional with defaults
        const companyData = company || {};
        if (!companyData.name) {
            companyData.name = `${full_name}'s Company`;
        }
        if (!companyData.email) {
            companyData.email = email;
        }
        if (!companyData.phone) {
            companyData.phone = phone || '0000000000';
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('auth_users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        // First, check if company already exists (case-insensitive)
        let existingCompany = null;
        const { data: companyCheck } = await supabase
            .from('companies')
            .select('*')
            .ilike('name', companyData.name)
            .single();

        if (companyCheck) {
            // Company name already exists, create with unique suffix
            const timestamp = Date.now();
            const uniqueName = `${companyData.name} (${timestamp})`;
            
            const { data: newCompany, error: companyError } = await supabase
                .from('companies')
                .insert([{
                    name: uniqueName,
                    email: companyData.email,
                    phone: companyData.phone,
                    company_type: 'Corporate',
                    status: 'Active'
                }])
                .select()
                .single();

            if (companyError) {
                debugError('Company creation error:', companyError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create company',
                    details: companyError.message
                });
            }
            existingCompany = newCompany;
            debugLog('Created new company with unique name:', existingCompany.name);
        } else {
            // Create new company with original name
            const { data: newCompany, error: companyError } = await supabase
                .from('companies')
                .insert([{
                    name: companyData.name,
                    email: companyData.email,
                    phone: companyData.phone,
                    company_type: 'Corporate',
                    status: 'Active'
                }])
                .select()
                .single();

            if (companyError) {
                debugError('Company creation error:', companyError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create company',
                    details: companyError.message
                });
            }
            existingCompany = newCompany;
            debugLog('Created new company:', existingCompany.name);
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        const { data: newUser, error } = await supabase
            .from('auth_users')
            .insert([{
                email: email.toLowerCase().trim(),
                password_hash,
                full_name: full_name.trim(),
                phone: phone ? phone.trim() : null,
                role: 'client',
                company_id: existingCompany.id,
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            debugError('User creation error:', error);
            
            // Handle duplicate email error
            if (error.code === '23505') {
                return res.status(409).json({
                    success: false,
                    error: 'User with this email already exists'
                });
            }
            
            return res.status(500).json({
                success: false,
                error: 'Failed to create user',
                details: error.message
            });
        }

        // Return user data (excluding password)
        const { password_hash: _, ...userData } = newUser;
        
        res.status(201).json({
            success: true,
            user: userData,
            message: 'Registration successful'
        });

    } catch (error) {
        debugError('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET /api/auth/users - Get all users (admin only)
router.get('/users', async (req, res) => {
    try {
        debugLog('🔍 Fetching users with company data...');
        
        const { data: users, error } = await supabase
            .from('auth_users')
            .select(`
                id, email, full_name, phone, role, is_active, created_at, last_login, company_id,
                company:companies(id, name, email, phone)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            debugError('❌ Supabase error:', error);
            throw error;
        }

        debugLog(`✅ Found ${users?.length || 0} users`);
        debugLog('📄 Sample user data:', users?.[0]);
        debugLog('🔍 Users with company_id:', users?.filter(u => u.company_id).length);
        debugLog('📄 Users with company data:', users?.filter(u => u.company).length);

        res.json({
            success: true,
            users
        });

    } catch (error) {
        debugError('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});

// PUT /api/auth/users/:id - Update user (admin only)
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, phone, role, is_active } = req.body;

        const { data: updatedUser, error } = await supabase
            .from('auth_users')
            .update({
                full_name,
                phone,
                role,
                is_active,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        const { password_hash, ...userData } = updatedUser;
        
        res.json({
            success: true,
            user: userData,
            message: 'User updated successfully'
        });

    } catch (error) {
        debugError('Error updating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
});

// PUT /api/auth/change-password - Change user password
router.put('/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'User ID, current password, and new password are required'
            });
        }

        // Get user
        const { data: user, error: fetchError } = await supabase
            .from('auth_users')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Verify current password
        const validCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validCurrentPassword) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update password
        const { error: updateError } = await supabase
            .from('auth_users')
            .update({
                password_hash: newPasswordHash,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        debugError('Error changing password:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password'
        });
    }
});

// PUT /api/auth/admin-change-password - Admin change client password
router.put('/admin-change-password', async (req, res) => {
    try {
        const { userId, newPassword, adminEmail } = req.body;

        if (!userId || !newPassword || !adminEmail) {
            return res.status(400).json({
                success: false,
                error: 'User ID, new password, and admin email are required'
            });
        }

        // Verify admin user
        const { data: admin, error: adminError } = await supabase
            .from('auth_users')
            .select('*')
            .eq('email', adminEmail.toLowerCase())
            .eq('role', 'admin')
            .single();

        if (adminError || !admin) {
            return res.status(403).json({
                success: false,
                error: 'Admin verification failed'
            });
        }

        // Get target user
        const { data: user, error: fetchError } = await supabase
            .from('auth_users')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Ensure target user is a client
        if (user.role !== 'client') {
            return res.status(403).json({
                success: false,
                error: 'Can only change passwords for client users'
            });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Update password
        const { error: updateError } = await supabase
            .from('auth_users')
            .update({
                password_hash: newPasswordHash,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        debugLog(`✅ Admin ${adminEmail} changed password for client ${user.email}`);

        res.json({
            success: true,
            message: 'Client password changed successfully'
        });

    } catch (error) {
        debugError('Error changing client password:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change client password'
        });
    }
});

module.exports = router;