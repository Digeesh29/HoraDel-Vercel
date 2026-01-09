// Supabase Client Configuration
const { createClient } = require('@supabase/supabase-js');

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

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    debugError('❌ Missing Supabase environment variables!');
    debugError('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
    throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with optimized settings for production
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    global: {
        headers: {
            'X-Client-Info': 'horadel-transport'
        },
        fetch: (url, options = {}) => {
            // Add 30-second timeout to all requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            return fetch(url, {
                ...options,
                signal: controller.signal
            }).finally(() => clearTimeout(timeoutId));
        }
    },
    db: {
        schema: 'public'
    },
    realtime: {
        params: {
            eventsPerSecond: 2
        }
    }
});

debugLog('✅ Supabase client initialized with 30s timeout');

module.exports = supabase;
