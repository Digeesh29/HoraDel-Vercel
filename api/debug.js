// Simple debug endpoint usable by Express and Vercel
module.exports = async (req, res) => {
  const response = {
    success: true,
    message: 'Debug endpoint is working',
    timestamp: new Date().toISOString(),
    node: process.version,
    uptimeSeconds: Math.round(process.uptime()),
    env: {
      nodeEnv: process.env.NODE_ENV || 'development',
      vercel: !!process.env.VERCEL,
      vercelUrl: process.env.VERCEL_URL || null
    }
  };

  // Optional Supabase connectivity check
  try {
    const supabase = require('../config/supabase');
    const { data, error } = await supabase.from('companies').select('id').limit(1);
    response.supabase = {
      ok: !error,
      sampleRows: (data && data.length) || 0,
      error: error ? error.message : null
    };
  } catch (e) {
    // Config missing or table not accessible — report but don't fail
    response.supabase = { ok: false, error: e.message };
  }

  res.json(response);
};
