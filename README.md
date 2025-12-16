# 🚚 HORADEL Transport Management System

Simple transport management system with admin dashboard and API server.

## 📁 Project Structure

```
HORADEL/
├── server.js              # API Server
├── package.json           # Dependencies
├── .env                   # Configuration (create from .env.example)
├── config/
│   └── supabase.js       # Database connection
├── routes/
│   └── dashboard-router.js  # Dashboard API routes
├── js/                   # Frontend JavaScript
├── css/                  # Styles
├── pages/                # HTML pages
└── index.html            # Main page
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd HORADEL
npm install
```

### 2. Configure Environment
Create `.env` file (copy from `.env.example`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3000
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
```

### 3. Start Server
```bash
npm run dev
```

### 4. Open in Browser
```
http://localhost:3000
```

**That's it!** Everything runs from one server. Dashboard automatically loads and fetches data from API.

## 📡 Endpoints

- `GET /` - Main dashboard (index.html)
- `GET /health` - Server health check
- `GET /api` - API documentation
- `GET /api/dashboard/summary` - Complete dashboard data
- `GET /api/dashboard/stats` - Statistics only
- `GET /api/dashboard/recent-bookings` - Recent bookings

## 📝 Database Setup

1. Create Supabase project
2. Run `supabase-schema.sql` in SQL Editor
3. Run `supabase-seed.sql` for sample data
4. Add credentials to `.env`

---

**That's it! Simple and clean.** 🎉