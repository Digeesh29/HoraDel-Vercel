// Simple dashboard endpoint for Vercel
module.exports = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    // Return minimal dashboard data
    res.json({
        success: true,
        data: {
            stats: {
                todayBookings: 0,
                totalBookings: 0,
                totalInTransit: 0,
                allTimeDelivered: 0,
                activeVehicles: 0,
                parcelsInTransit: 0,
                pendingDeliveries: 0
            },
            recentBookings: [],
            trend: {
                labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                data: [0, 0, 0, 0, 0, 0, 0]
            },
            companyDistribution: {
                labels: ['No Data'],
                data: [0]
            }
        }
    });
};