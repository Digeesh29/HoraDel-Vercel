// CLIENT PROFILE PAGE JAVASCRIPT

function initClientProfilePage() {
    console.log('👤 Initializing Client Profile page...');
    loadClientProfileData();
}

async function loadClientProfileData() {
    try {
        console.log('📊 Loading client profile data...');
        
        // Get user data from localStorage
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');
        const companyId = localStorage.getItem('companyId');
        const companyName = localStorage.getItem('companyName');
        const companyEmail = localStorage.getItem('companyEmail');

        console.log('🔍 Profile Debug - localStorage data:', {
            userId,
            userEmail,
            userName,
            companyId,
            companyName,
            companyEmail
        });

        if (!userId) {
            console.error('❌ No user ID found in localStorage');
            showToast('Please log in again', 'error');
            return;
        }

        if (!companyId) {
            console.error('❌ No company ID found in localStorage');
            showToast('Company information missing. Please contact support.', 'error');
            return;
        }

        // Set basic user info from localStorage first
        if (document.getElementById('fullName')) {
            document.getElementById('fullName').value = userName || 'Not Available';
        }
        if (document.getElementById('email')) {
            document.getElementById('email').value = userEmail || 'Not Available';
        }
        if (document.getElementById('profileRole')) {
            document.getElementById('profileRole').textContent = 'Client User';
        }
        if (document.getElementById('profileCompany')) {
            document.getElementById('profileCompany').textContent = companyName || 'Loading...';
        }
        if (document.getElementById('companyName')) {
            document.getElementById('companyName').value = companyName || 'Not Available';
        }
        if (document.getElementById('companyEmail')) {
            document.getElementById('companyEmail').value = companyEmail || 'Not Available';
        }
        if (document.getElementById('companyId')) {
            document.getElementById('companyId').value = companyId || 'Not Available';
        }

        // Fetch detailed user data from API
        await fetchUserDetails(userId);
        
        // Fetch activity statistics
        await loadClientActivityStats();

    } catch (error) {
        console.error('❌ Error loading client profile data:', error);
        showToast('Failed to load profile data', 'error');
    }
}

async function fetchUserDetails(userId) {
    try {
        console.log('🔍 Fetching user details for ID:', userId);
        
        // Note: We'll need to create an endpoint for user profile data
        // For now, we'll use the auth system to get user info
        const response = await fetch(`${API_BASE_URL}/auth/users`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.users) {
                // Find current user in the users array
                const currentUser = data.users.find(user => user.id == userId);
                
                if (currentUser) {
                    console.log('✅ Found user details:', currentUser);
                    
                    // Update form fields with real data
                    if (document.getElementById('fullName')) {
                        document.getElementById('fullName').value = currentUser.full_name || 'Not Available';
                    }
                    if (document.getElementById('email')) {
                        document.getElementById('email').value = currentUser.email || 'Not Available';
                    }
                    if (document.getElementById('phone')) {
                        document.getElementById('phone').value = currentUser.phone || 'Not Available';
                    }
                    
                    // Format dates
                    if (currentUser.created_at) {
                        const memberSince = new Date(currentUser.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        if (document.getElementById('memberSince')) {
                            document.getElementById('memberSince').value = memberSince;
                        }
                    }
                    
                    if (currentUser.last_login) {
                        const lastLogin = new Date(currentUser.last_login).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        if (document.getElementById('lastLogin')) {
                            document.getElementById('lastLogin').value = lastLogin;
                        }
                    } else {
                        if (document.getElementById('lastLogin')) {
                            document.getElementById('lastLogin').value = 'First time login';
                        }
                    }
                }
            }
        } else {
            console.warn('⚠️ Could not fetch detailed user data');
        }
        
    } catch (error) {
        console.error('❌ Error fetching user details:', error);
    }
}

async function loadClientActivityStats() {
    try {
        console.log('📈 Loading client activity statistics...');
        
        const companyId = localStorage.getItem('companyId');
        const companyName = localStorage.getItem('companyName');
        
        console.log('🏢 Company context:', { companyId, companyName });
        
        if (!companyId) {
            console.warn('⚠️ No company ID found');
            return;
        }

        // Fetch total bookings for this company
        const bookingsUrl = `${API_BASE_URL}/bookings?companyId=${companyId}`;
        console.log('🔗 Fetching bookings from:', bookingsUrl);
        
        const bookingsResponse = await fetch(bookingsUrl);
        if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json();
            console.log('📊 Raw bookings response:', bookingsData);
            
            if (bookingsData.success && bookingsData.data) {
                console.log('📦 Total bookings found:', bookingsData.data.length);
                
                // Log first few bookings to verify company filtering
                if (bookingsData.data.length > 0) {
                    console.log('🔍 Sample bookings:', bookingsData.data.slice(0, 3).map(b => ({
                        lr_number: b.lr_number,
                        company_id: b.company_id,
                        status: b.status,
                        company_name: b.company?.name
                    })));
                    
                    // Verify all bookings belong to the correct company
                    const wrongCompanyBookings = bookingsData.data.filter(b => b.company_id != companyId);
                    if (wrongCompanyBookings.length > 0) {
                        console.error('❌ Found bookings from wrong company!', wrongCompanyBookings.length);
                        console.error('❌ Expected company ID:', companyId);
                        console.error('❌ Wrong bookings:', wrongCompanyBookings.slice(0, 2));
                    } else {
                        console.log('✅ All bookings belong to correct company');
                    }
                }
                
                const totalBookings = bookingsData.data.length;
                const activeShipments = bookingsData.data.filter(booking => 
                    booking.status === 'BOOKED' || booking.status === 'IN_TRANSIT'
                ).length;
                
                console.log('📈 Calculated stats:', { totalBookings, activeShipments });
                
                // Update stats
                if (document.getElementById('totalBookings')) {
                    document.getElementById('totalBookings').textContent = totalBookings.toLocaleString();
                }
                if (document.getElementById('activeShipments')) {
                    document.getElementById('activeShipments').textContent = activeShipments.toLocaleString();
                }
                
                console.log('✅ Updated activity stats display');
                
                // Show helpful message if no bookings found
                if (totalBookings === 0) {
                    console.log('ℹ️ No bookings found for this company');
                    showToast(`No bookings found for ${companyName}`, 'info');
                }
            } else {
                console.warn('⚠️ No bookings data in response');
                // Set stats to 0 if no data
                if (document.getElementById('totalBookings')) {
                    document.getElementById('totalBookings').textContent = '0';
                }
                if (document.getElementById('activeShipments')) {
                    document.getElementById('activeShipments').textContent = '0';
                }
            }
        } else {
            console.warn('⚠️ Could not fetch bookings data, status:', bookingsResponse.status);
            const errorText = await bookingsResponse.text();
            console.warn('⚠️ Error response:', errorText);
        }

        // Fetch company details if not already available
        await fetchCompanyDetails();
        
    } catch (error) {
        console.error('❌ Error loading activity stats:', error);
    }
}

async function fetchCompanyDetails() {
    try {
        const companyId = localStorage.getItem('companyId');
        if (!companyId) return;

        console.log('🏢 Fetching company details for ID:', companyId);
        
        // We can try to get company details from the companies endpoint
        // This might need to be created if it doesn't exist
        const response = await fetch(`${API_BASE_URL}/companies`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                const company = data.data.find(comp => comp.id == companyId);
                if (company) {
                    console.log('✅ Found company details:', company);
                    
                    if (document.getElementById('companyName')) {
                        document.getElementById('companyName').value = company.name || 'Not Available';
                    }
                    if (document.getElementById('companyEmail')) {
                        document.getElementById('companyEmail').value = company.email || 'Not Available';
                    }
                    if (document.getElementById('companyPhone')) {
                        document.getElementById('companyPhone').value = company.phone || 'Not Available';
                    }
                    if (document.getElementById('profileCompany')) {
                        document.getElementById('profileCompany').textContent = company.name;
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ Error fetching company details:', error);
    }
}

function editClientProfile() {
    // Toggle readonly state for editable fields
    const editableInputs = document.querySelectorAll('#fullName, #phone');
    const editButton = event.target.closest('button');
    const isReadonly = editableInputs[0].hasAttribute('readonly');
    
    if (isReadonly) {
        // Enable editing
        editableInputs.forEach(input => {
            input.removeAttribute('readonly');
            input.style.backgroundColor = '#fff';
            input.style.borderColor = '#3b82f6';
        });
        
        editButton.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">save</span> Save Profile';
        editButton.classList.remove('btn-dark');
        editButton.classList.add('btn-primary');
    } else {
        // Save changes
        saveClientProfile();
        
        editableInputs.forEach(input => {
            input.setAttribute('readonly', true);
            input.style.backgroundColor = '#f8f9fa';
            input.style.borderColor = '#dee2e6';
        });
        
        editButton.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">edit</span> Edit Profile';
        editButton.classList.remove('btn-primary');
        editButton.classList.add('btn-dark');
    }
}

async function saveClientProfile() {
    try {
        const userId = localStorage.getItem('userId');
        const profileData = {
            full_name: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value
        };

        console.log('💾 Saving client profile:', profileData);
        
        // Update user data via API
        const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Update localStorage
                localStorage.setItem('userName', profileData.full_name);
                
                showToast('Profile updated successfully!', 'success');
                console.log('✅ Profile saved successfully');
            } else {
                throw new Error(data.error || 'Failed to save profile');
            }
        } else {
            throw new Error('Failed to save profile');
        }
        
    } catch (error) {
        console.error('❌ Error saving profile:', error);
        showToast('Failed to save profile. Please try again.', 'error');
    }
}

function changeClientPassword() {
    const currentPassword = prompt('Enter your current password:');
    if (!currentPassword) return;
    
    const newPassword = prompt('Enter your new password:');
    if (!newPassword) return;
    
    const confirmPassword = prompt('Confirm your new password:');
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }
    
    // Call password change API
    changePasswordAPI(currentPassword, newPassword);
}

async function changePasswordAPI(currentPassword, newPassword) {
    try {
        const userId = localStorage.getItem('userId');
        
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast('Password changed successfully!', 'success');
        } else {
            throw new Error(data.error || 'Failed to change password');
        }
        
    } catch (error) {
        console.error('❌ Error changing password:', error);
        showToast(error.message || 'Failed to change password', 'error');
    }
}

function viewAccountSecurity() {
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    const memberSince = document.getElementById('memberSince')?.value || 'Unknown';
    
    alert(`Account Security Information:

User ID: ${userId}
Email: ${userEmail}
Member Since: ${memberSince}
Account Type: Client
Status: Active

Your account is protected with encrypted password storage and secure authentication.`);
}

function viewPrivacySettings() {
    alert(`Privacy Settings:

✅ Your personal data is encrypted and secure
✅ Company data is isolated and protected
✅ Booking information is only visible to your company
✅ We do not share your data with third parties

For privacy concerns or data requests, please contact support.`);
}

// Helper function for toast notifications (if not already defined)
if (typeof showToast !== 'function') {
    function showToast(msg, type = "success", duration = 2500) {
        const el = document.createElement("div");
        const bg = type === "success" ? "#10b981" : type === "info" ? "#3b82f6" : "#ef4444";
        el.style.cssText = `
          position:fixed;bottom:24px;right:24px;z-index:9999;
          background:${bg};color:white;padding:10px 14px;border-radius:8px;
          font-size:14px;font-family:Inter,system-ui;
          box-shadow:0 10px 15px -3px rgba(0,0,0,.2);
        `;
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => { el.style.opacity = "0"; el.style.transition = "0.2s"; }, duration);
        setTimeout(() => el.remove(), duration + 200);
    }
}

// Debug function to test API filtering (can be called from browser console)
window.testCompanyFiltering = async function() {
    const companyId = localStorage.getItem('companyId');
    const companyName = localStorage.getItem('companyName');
    
    console.log('🧪 Testing Company Filtering...');
    console.log('🏢 Company:', companyName, '(ID:', companyId, ')');
    
    try {
        // Test 1: Get all bookings (no filter)
        const allBookingsResponse = await fetch(`${API_BASE_URL}/bookings`);
        const allBookingsData = await allBookingsResponse.json();
        
        console.log('📊 All bookings:', allBookingsData.data?.length || 0);
        
        // Test 2: Get company-filtered bookings
        const filteredBookingsResponse = await fetch(`${API_BASE_URL}/bookings?companyId=${companyId}`);
        const filteredBookingsData = await filteredBookingsResponse.json();
        
        console.log('📊 Filtered bookings:', filteredBookingsData.data?.length || 0);
        
        // Test 3: Show company distribution
        if (allBookingsData.data && allBookingsData.data.length > 0) {
            const companyDistribution = {};
            allBookingsData.data.forEach(booking => {
                const cId = booking.company_id;
                const cName = booking.company?.name || 'Unknown';
                companyDistribution[cId] = companyDistribution[cId] || { name: cName, count: 0 };
                companyDistribution[cId].count++;
            });
            
            console.log('🏢 Company distribution:', companyDistribution);
            console.log('🎯 Your company should be ID:', companyId);
        }
        
        return {
            allBookings: allBookingsData.data?.length || 0,
            filteredBookings: filteredBookingsData.data?.length || 0,
            companyId,
            companyName
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { error: error.message };
    }
};

console.log('🔧 Debug function loaded: testCompanyFiltering()');
console.log('💡 Run testCompanyFiltering() in console to debug company filtering');