// Vercel API Route: /api/auth/login
const express = require('express');
const bcrypt = require('bcrypt');
const supabase = require('../../config/supabase');

const SALT_ROUNDS = 10;

module.exports = async (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
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

        // Get user with company info
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
            console.log('❌ User not found:', error);
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, users.password_hash);

        if (!validPassword) {
            console.log('❌ Invalid password');
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
            user: userData,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};