// Add Sample Data API for Vercel
const { createClient } = require('@supabase/supabase-js');

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
        console.log('🔧 Adding sample data...');
        
        // First, check if companies exist
        const { data: existingCompanies } = await supabase
            .from('companies')
            .select('id, name');

        let companyIds = {};
        
        if (!existingCompanies || existingCompanies.length === 0) {
            // Create sample companies
            const { data: newCompanies, error: companyError } = await supabase
                .from('companies')
                .insert([
                    { name: 'TechCorp Solutions', phone: '+91-9876543210', email: 'contact@techcorp.com', address: 'Mumbai, Maharashtra', status: 'active' },
                    { name: 'GlobalTrade Ltd', phone: '+91-9876543211', email: 'info@globaltrade.com', address: 'Delhi, India', status: 'active' },
                    { name: 'FastShip Express', phone: '+91-9876543212', email: 'support@fastship.com', address: 'Bangalore, Karnataka', status: 'active' },
                    { name: 'QuickMove Logistics', phone: '+91-9876543213', email: 'hello@quickmove.com', address: 'Chennai, Tamil Nadu', status: 'active' },
                    { name: 'EasyLogistics Pro', phone: '+91-9876543214', email: 'team@easylogistics.com', address: 'Pune, Maharashtra', status: 'active' }
                ])
                .select();

            if (companyError) throw companyError;
            
            newCompanies.forEach(company => {
                companyIds[company.name.split(' ')[0]] = company.id;
            });
            
            console.log('✅ Created companies:', Object.keys(companyIds));
        } else {
            // Use existing companies
            existingCompanies.forEach(company => {
                const key = company.name.split(' ')[0];
                companyIds[key] = company.id;
            });
            console.log('✅ Using existing companies:', Object.keys(companyIds));
        }

        // Check if bookings already exist
        const { count: existingBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true });

        if (existingBookings > 0) {
            return res.json({
                success: true,
                message: `Sample data already exists (${existingBookings} bookings found)`,
                data: {
                    companies: existingCompanies?.length || Object.keys(companyIds).length,
                    bookings: existingBookings
                }
            });
        }

        // Get first available company ID
        const firstCompanyId = Object.values(companyIds)[0] || existingCompanies[0]?.id;
        
        if (!firstCompanyId) {
            throw new Error('No companies available for sample bookings');
        }

        // Create sample bookings
        const sampleBookings = [
            {
                lr_number: 'LR-2024-101',
                booking_date: new Date().toISOString(),
                company_id: firstCompanyId,
                consignee_name: 'Reliance Industries',
                consignee_contact: '+91-9876501234',
                origin: 'Mumbai',
                destination: 'Delhi',
                destination_pincode: '110001',
                article_count: 50,
                parcel_type: 'Standard',
                weight: 250.0,
                description: 'Electronic components',
                grand_total: 2500,
                status: 'BOOKED'
            },
            {
                lr_number: 'LR-2024-102',
                booking_date: new Date().toISOString(),
                company_id: firstCompanyId,
                consignee_name: 'Tata Motors',
                consignee_contact: '+91-9876502345',
                origin: 'Mumbai',
                destination: 'Bangalore',
                destination_pincode: '560001',
                article_count: 35,
                parcel_type: 'Express',
                weight: 180.0,
                description: 'Auto parts',
                grand_total: 1750,
                status: 'IN-TRANSIT'
            },
            {
                lr_number: 'LR-2024-103',
                booking_date: new Date().toISOString(),
                company_id: firstCompanyId,
                consignee_name: 'Flipkart Warehouse',
                consignee_contact: '+91-9876503456',
                origin: 'Mumbai',
                destination: 'Pune',
                destination_pincode: '411001',
                article_count: 100,
                parcel_type: 'Standard',
                weight: 500.0,
                description: 'E-commerce packages',
                grand_total: 5000,
                status: 'DELIVERED'
            },
            {
                lr_number: 'LR-2024-104',
                booking_date: new Date().toISOString(),
                company_id: firstCompanyId,
                consignee_name: 'Amazon Fulfillment',
                consignee_contact: '+91-9876504567',
                origin: 'Mumbai',
                destination: 'Hyderabad',
                destination_pincode: '500001',
                article_count: 75,
                parcel_type: 'Express',
                weight: 350.0,
                description: 'Consumer goods',
                grand_total: 3750,
                status: 'BOOKED'
            },
            {
                lr_number: 'LR-2024-105',
                booking_date: new Date().toISOString(),
                company_id: firstCompanyId,
                consignee_name: 'Mahindra Logistics',
                consignee_contact: '+91-9876505678',
                origin: 'Mumbai',
                destination: 'Chennai',
                destination_pincode: '600001',
                article_count: 60,
                parcel_type: 'Standard',
                weight: 300.0,
                description: 'Industrial equipment',
                grand_total: 3000,
                status: 'IN-TRANSIT'
            }
        ];

        const { data: newBookings, error: bookingError } = await supabase
            .from('bookings')
            .insert(sampleBookings)
            .select();

        if (bookingError) throw bookingError;

        console.log('✅ Created sample bookings:', newBookings.length);

        res.json({
            success: true,
            message: 'Sample data created successfully!',
            data: {
                companies: Object.keys(companyIds).length,
                bookings: newBookings.length,
                bookingDetails: newBookings.map(b => ({
                    lr_number: b.lr_number,
                    status: b.status,
                    destination: b.destination
                }))
            }
        });

    } catch (error) {
        console.error('❌ Sample data error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.stack
        });
    }
};