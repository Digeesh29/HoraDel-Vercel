// Authentication Router
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const supabase = require('../config/supabase');

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

        // For demo purposes, we'll use simple password checking
        // In production, use proper password hashing (bcrypt)
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
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Use bcrypt to compare password with hash
        const validPassword = await bcrypt.compare(password, users.password_hash);

        if (!validPassword) {
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
        
        res.json({
            success: true,
            user: userData,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
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

        if (!email || !password || !full_name) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, and full name are required'
            });
        }

        if (!company || !company.name || !company.email) {
            return res.status(400).json({
                success: false,
                error: 'Company name and email are required'
            });
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
            .ilike('name', company.name)
            .single();

        if (companyCheck) {
            // Company name already exists, create with unique suffix
            const timestamp = Date.now();
            const uniqueName = `${company.name} (${timestamp})`;
            
            const { data: newCompany, error: companyError } = await supabase
                .from('companies')
                .insert([{
                    name: uniqueName,
                    email: company.email,
                    phone: company.phone
                }])
                .select()
                .single();

            if (companyError) {
                console.error('Company creation error:', companyError);
                throw companyError;
            }
            existingCompany = newCompany;
            console.log('Created new company with unique name:', existingCompany.name);
        } else {
            // Create new company with original name
            const { data: newCompany, error: companyError } = await supabase
                .from('companies')
                .insert([{
                    name: company.name,
                    email: company.email,
                    phone: company.phone
                }])
                .select()
                .single();

            if (companyError) {
                console.error('Company creation error:', companyError);
                throw companyError;
            }
            existingCompany = newCompany;
            console.log('Created new company:', existingCompany.name);
        }

        // Hash password with bcrypt (salt rounds: 10)
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert new user (always as client) with company_id
        const { data: newUser, error } = await supabase
            .from('auth_users')
            .insert([{
                email: email.toLowerCase(),
                password_hash,
                full_name,
                phone,
                role: 'client', // All registrations are client accounts
                company_id: existingCompany.id
            }])
            .select()
            .single();

        if (error) {
            throw error;
        }

        // Return user data (excluding password)
        const { password_hash: _, ...userData } = newUser;
        
        res.status(201).json({
            success: true,
            user: userData,
            message: 'Registration successful'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET /api/auth/users - Get all users (admin only)
router.get('/users', async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('auth_users')
            .select('id, email, full_name, phone, role, is_active, created_at, last_login')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            users
        });

    } catch (error) {
        console.error('Error fetching users:', error);
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
        console.error('Error updating user:', error);
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
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password'
        });
    }
});

module.exports = router;