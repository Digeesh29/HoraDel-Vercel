// Vercel catch-all API handler that mounts existing Express routers
const express = require('express');

// Create app
const app = express();

// Smart CORS similar to server.js
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (process.env.NODE_ENV === 'production') {
    if (
      origin &&
      (
        origin.includes('.vercel.app') ||
        (process.env.VERCEL_URL && origin.includes(process.env.VERCEL_URL)) ||
        (process.env.PRODUCTION_URL && origin.includes(process.env.PRODUCTION_URL)) ||
        origin === `https://${process.env.VERCEL_URL}` ||
        origin === process.env.PRODUCTION_URL
      )
    ) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Body parser
app.use(express.json());

// Mount routers at both with and without '/api' prefix to account for Vercel path stripping
const prefixes = ['', '/api'];
for (const prefix of prefixes) {
  try { app.use(`${prefix}/dashboard`, require('../routes/dashboard-router')); } catch (e) {}
  try { app.use(`${prefix}/bookings`, require('../routes/bookings-router')); } catch (e) {}
  try { app.use(`${prefix}/vehicles`, require('../routes/vehicles-router')); } catch (e) {}
  try { app.use(`${prefix}/ratecards`, require('../routes/ratecards-router')); } catch (e) {}
  try { app.use(`${prefix}/companies`, require('../routes/companies-router')); } catch (e) {}
  try { app.use(`${prefix}/drivers`, require('../routes/drivers-router')); } catch (e) {}
  try { app.use(`${prefix}/reports`, require('../routes/reports-router')); } catch (e) {}
  try { app.use(`${prefix}/consignees`, require('../routes/consignees-router')); } catch (e) {}
  try { app.use(`${prefix}/auth`, require('../routes/auth-router')); } catch (e) {}
}

// Lightweight health and test endpoints
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV || 'development' });
});

app.get(['/test', '/api/test'], (req, res) => {
  res.json({ success: true, message: 'API function is working', timestamp: new Date().toISOString() });
});

// Debug route
try {
  const debugHandler = require('../api/debug');
  app.get(['/debug', '/api/debug'], debugHandler);
} catch (_) {}

// Backward-compat alias for older clients hitting /api/login
app.post(['/login', '/api/login'], (req, res) => {
  // Ensure absolute path for Vercel function
  res.setHeader('Location', '/api/auth/login');
  res.status(308).end();
});

// Fallback for unknown API routes
app.use((req, res) => {
  // Only respond JSON for API-like paths
  if (req.url.startsWith('/api') || req.url.startsWith('/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.status(404).end();
});

module.exports = (req, res) => {
  return app(req, res);
};
