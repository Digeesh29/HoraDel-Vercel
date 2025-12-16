// Login Test API Endpoint
const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Serve the login test HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Login Test - HoraDel</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; }
        button:disabled { background: #ccc; }
        .result { margin-top: 20px; padding: 15px; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
    </style>
</head>
<body>
    <h1>🔐 HoraDel Login Test</h1>
    
    <div class="form-group">
        <label>Email:</label>
        <input type="email" id="email" value="admin@horadel.com" placeholder="Enter email">
    </div>
    
    <div class="form-group">
        <label>Password:</label>
        <input type="password" id="password" value="admin123" placeholder="Enter password">
    </div>
    
    <button onclick="testLogin()" id="loginBtn">Test Login</button>
    <button onclick="testAPI()" id="apiBtn">Test API</button>
    <button onclick="testDatabase()" id="dbBtn">Test Database</button>
    
    <div id="results"></div>
    
    <h3>Demo Credentials:</h3>
    <p><strong>Admin:</strong> admin@horadel.com / admin123</p>
    <p><strong>Client:</strong> client@company.com / client123</p>
    
    <h3>Quick Links:</h3>
    <p><a href="/">Main Login Page</a> | <a href="/admin">Admin Dashboard</a> | <a href="/client">Client Dashboard</a></p>
    
    <script>
        const API_BASE_URL = window.location.origin;
        
        async function testDatabase() {
            const results = document.getElementById('results');
            results.innerHTML = '<div class="info">Testing database connection...</div>';
            
            try {
                const response = await fetch('/api/test-client');
                const data = await response.json();
                
                if (data.success) {
                    let html = '<div class="success"><h3>✅ Database Connection Working</h3>';
                    html += '<p><strong>Companies:</strong> ' + (data.results.tests.companies.count || 0) + '</p>';
                    html += '<p><strong>Bookings:</strong> ' + (data.results.tests.bookings.count || 0) + '</p>';
                    html += '<p><strong>Users:</strong> ' + (data.results.tests.auth_users.count || 0) + '</p>';
                    html += '</div>';
                    results.innerHTML = html;
                } else {
                    results.innerHTML = '<div class="error">❌ Database test failed: ' + data.error + '</div>';
                }
            } catch (error) {
                results.innerHTML = '<div class="error">❌ Database test error: ' + error.message + '</div>';
            }
        }
        
        async function testAPI() {
            const results = document.getElementById('results');
            results.innerHTML = '<div class="info">Testing API endpoints...</div>';
            
            try {
                // Test health endpoint
                const healthResponse = await fetch('/api/health');
                const healthData = await healthResponse.json();
                results.innerHTML += '<div class="success">✅ Health Check: ' + healthData.status + '</div>';
                
                // Test companies endpoint
                const companiesResponse = await fetch('/api/companies');
                if (companiesResponse.ok) {
                    const companiesData = await companiesResponse.json();
                    results.innerHTML += '<div class="success">✅ Companies API: ' + (companiesData.data?.length || 0) + ' companies found</div>';
                } else {
                    results.innerHTML += '<div class="error">❌ Companies API failed: ' + companiesResponse.status + '</div>';
                }
                
                // Test bookings endpoint
                const bookingsResponse = await fetch('/api/bookings');
                if (bookingsResponse.ok) {
                    const bookingsData = await bookingsResponse.json();
                    results.innerHTML += '<div class="success">✅ Bookings API: ' + (bookingsData.data?.length || 0) + ' bookings found</div>';
                } else {
                    results.innerHTML += '<div class="error">❌ Bookings API failed: ' + bookingsResponse.status + '</div>';
                }
                
            } catch (error) {
                results.innerHTML += '<div class="error">❌ API Test Error: ' + error.message + '</div>';
            }
        }
        
        async function testLogin() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const results = document.getElementById('results');
            const loginBtn = document.getElementById('loginBtn');
            
            if (!email || !password) {
                results.innerHTML = '<div class="error">Please enter email and password</div>';
                return;
            }
            
            loginBtn.disabled = true;
            loginBtn.textContent = 'Testing...';
            results.innerHTML = '<div class="info">Testing login...</div>';
            
            try {
                console.log('🔐 Testing login with:', { email, password: '***' });
                console.log('🌐 API URL:', API_BASE_URL + '/api/auth/login');
                
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                console.log('📡 Response status:', response.status);
                
                const result = await response.json();
                console.log('📊 Response data:', result);
                
                if (result.success) {
                    results.innerHTML = \`
                        <div class="success">
                            <h3>✅ Login Successful!</h3>
                            <p><strong>User:</strong> \${result.user.full_name}</p>
                            <p><strong>Email:</strong> \${result.user.email}</p>
                            <p><strong>Role:</strong> \${result.user.role}</p>
                            <p><strong>Company:</strong> \${result.user.company?.name || 'No company'}</p>
                            <p><strong>Company ID:</strong> \${result.user.company?.id || result.user.company_id || 'No ID'}</p>
                        </div>
                    \`;
                    
                    // Store data and show redirect options
                    localStorage.setItem('userRole', result.user.role);
                    localStorage.setItem('userEmail', result.user.email);
                    localStorage.setItem('userName', result.user.full_name);
                    localStorage.setItem('userId', result.user.id);
                    
                    if (result.user.company) {
                        localStorage.setItem('companyId', result.user.company.id);
                        localStorage.setItem('companyName', result.user.company.name);
                        localStorage.setItem('companyEmail', result.user.company.email);
                    } else if (result.user.company_id) {
                        localStorage.setItem('companyId', result.user.company_id);
                    }
                    
                    results.innerHTML += \`
                        <div class="info">
                            <p><strong>Ready to redirect!</strong></p>
                            <p><a href="/admin">Go to Admin Dashboard</a></p>
                            <p><a href="/client">Go to Client Dashboard</a></p>
                        </div>
                    \`;
                    
                } else {
                    results.innerHTML = '<div class="error">❌ Login Failed: ' + result.error + '</div>';
                }
                
            } catch (error) {
                console.error('Login error:', error);
                results.innerHTML = '<div class="error">❌ Network Error: ' + error.message + '</div>';
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Test Login';
            }
        }
        
        // Auto-test API on load
        window.onload = () => {
            testAPI();
        };
    </script>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
};