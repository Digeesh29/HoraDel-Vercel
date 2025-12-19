// ADMIN CLIENT REGISTRATION PAGE

let recentRegistrations = [];

async function initClientRegisterPage() {
    console.log('👥 Loading client registration page...');
    console.log('🔍 API_BASE_URL:', API_BASE_URL);
    console.log('🔍 Current URL:', window.location.href);
    
    try {
        // Check if the form exists
        const form = document.getElementById('clientRegisterForm');
        console.log('🔍 Form found:', !!form);
        
        if (!form) {
            console.error('❌ Client register form not found in DOM');
            showRegisterMessage('Registration form failed to load', 'error');
            return;
        }
        
        setupRegisterEventListeners();
        setupPasswordChangeListeners();
        
        // Test API connectivity first
        console.log('🔍 Testing API connectivity...');
        try {
            const testResponse = await fetch(`${API_BASE_URL}/auth/users`);
            console.log('🔍 API test response status:', testResponse.status);
            if (testResponse.ok) {
                console.log('✅ API is accessible');
            } else {
                console.log('⚠️ API returned error status:', testResponse.status);
            }
        } catch (apiError) {
            console.error('❌ API connectivity test failed:', apiError);
        }
        
        await loadRecentRegistrations();
        renderRecentRegistrations();
        
        console.log('✅ Client registration page loaded successfully');
    } catch (error) {
        console.error('❌ Error initializing client registration page:', error);
        showRegisterMessage('Failed to load registration page', 'error');
    }
}

// Setup event listeners
function setupRegisterEventListeners() {
    // Form submission
    const form = document.getElementById('clientRegisterForm');
    if (form) {
        form.addEventListener('submit', handleClientRegistration);
        
        // Add click listener to form to ensure it's always responsive
        form.addEventListener('click', () => {
            restoreFormFunctionality();
        });
    } else {
        console.error('❌ Client register form not found');
    }

    // Reset form button
    const resetBtn = document.getElementById('resetFormBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetRegistrationForm);
        
        // Ensure reset button always works
        resetBtn.addEventListener('click', () => {
            setTimeout(restoreFormFunctionality, 100);
        });
    } else {
        console.error('❌ Reset form button not found');
    }
    
    // Add double-click recovery to submit button
    const submitBtn = document.getElementById('registerClientBtn');
    if (submitBtn) {
        submitBtn.addEventListener('dblclick', () => {
            console.log('🔧 Double-click recovery triggered');
            restoreFormFunctionality();
        });
    }
}

// Handle client registration form submission
async function handleClientRegistration(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('registerClientBtn');
    const originalText = submitBtn?.innerHTML || 'Register Client';
    
    console.log('🔍 Form submission started');
    console.log('🔍 Submit button found:', !!submitBtn);
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">hourglass_empty</span> Registering...';

        // Get form elements with null checks
        const userEmailEl = document.getElementById('userEmail');
        const userPasswordEl = document.getElementById('userPassword');
        // Fix: Use placeholder selector since ID selector returns undefined value
        const userNameEl = document.querySelector('input[placeholder*="full name"]') || document.getElementById('userName');
        const userPhoneEl = document.getElementById('userPhone');
        const companyNameEl = document.getElementById('companyName');
        const companyEmailEl = document.getElementById('companyEmail');
        const companyPhoneEl = document.getElementById('companyPhone');
        const companyTypeEl = document.getElementById('companyType');
        const companyAddressEl = document.getElementById('companyAddress');

        // Debug: Log element existence and values
        console.log('🔍 Form elements check:', {
            userEmailEl: !!userEmailEl,
            userEmailValue: userEmailEl?.value,
            userPasswordEl: !!userPasswordEl,
            userPasswordValue: userPasswordEl?.value ? '[HIDDEN]' : 'EMPTY',
            userNameEl: !!userNameEl,
            userNameValue: userNameEl?.value,
            userNameValueLength: userNameEl?.value?.length,
            companyNameEl: !!companyNameEl,
            companyNameValue: companyNameEl?.value,
            companyEmailEl: !!companyEmailEl,
            companyEmailValue: companyEmailEl?.value,
            companyPhoneEl: !!companyPhoneEl,
            companyPhoneValue: companyPhoneEl?.value
        });

        // Additional debug: Check if userName element exists in DOM
        const userNameTest = document.querySelector('#userName');
        const userNameTest2 = document.querySelector('input[placeholder*="full name"]');
        console.log('🔍 Additional userName checks:', {
            byId: !!userNameTest,
            byIdValue: userNameTest?.value,
            byPlaceholder: !!userNameTest2,
            byPlaceholderValue: userNameTest2?.value,
            allUserNameInputs: document.querySelectorAll('input[id="userName"]').length
        });

        // Validate all required elements exist
        if (!userEmailEl || !userPasswordEl || !userNameEl || !companyNameEl || !companyEmailEl || !companyPhoneEl) {
            throw new Error('Required form fields are missing');
        }

        // Collect form data with safe value extraction
        // Extra safety: get userName value multiple ways
        let userNameValue = '';
        if (userNameEl && userNameEl.value) {
            userNameValue = userNameEl.value.trim();
        } else {
            // Fallback: try to find the element again
            const userNameFallback = document.getElementById('userName');
            if (userNameFallback && userNameFallback.value) {
                userNameValue = userNameFallback.value.trim();
                console.log('⚠️ Used fallback to get userName value');
            }
        }

        const formData = {
            // User data
            email: (userEmailEl?.value || '').trim(),
            password: userPasswordEl?.value || '',
            full_name: userNameValue,
            phone: (userPhoneEl?.value || '').trim(),
            role: 'client',
            // Company data
            company: {
                name: (companyNameEl?.value || '').trim(),
                email: (companyEmailEl?.value || '').trim(),
                phone: (companyPhoneEl?.value || '').trim(),
                company_type: companyTypeEl?.value || 'Corporate',
                address: (companyAddressEl?.value || '').trim() || 'Not specified'
            }
        };

        // Debug: Log the exact values being processed
        console.log('🔍 Raw values before trim:', {
            userNameEl: !!userNameEl,
            userNameRaw: userNameEl?.value,
            userNameRawLength: userNameEl?.value?.length,
            userNameAfterTrim: userNameValue,
            userNameAfterTrimLength: userNameValue.length,
            formDataFullName: formData.full_name,
            formDataFullNameLength: formData.full_name.length
        });

        // Debug: Log form data to see what's missing
        console.log('🔍 Form data collected:', {
            email: formData.email,
            password: formData.password ? '[HIDDEN]' : 'MISSING',
            full_name: formData.full_name,
            phone: formData.phone,
            company_name: formData.company.name,
            company_email: formData.company.email,
            company_phone: formData.company.phone,
            company_type: formData.company.company_type,
            company_address: formData.company.address
        });

        // Validate required fields with detailed error messages
        const missingFields = [];
        
        console.log('🔍 Validation check:', {
            email: `"${formData.email}" (${formData.email.length} chars)`,
            password: formData.password ? `"[HIDDEN]" (${formData.password.length} chars)` : 'EMPTY',
            full_name: `"${formData.full_name}" (${formData.full_name.length} chars)`,
            company_name: `"${formData.company.name}" (${formData.company.name.length} chars)`,
            company_email: `"${formData.company.email}" (${formData.company.email.length} chars)`,
            company_phone: `"${formData.company.phone}" (${formData.company.phone.length} chars)`
        });
        
        if (!formData.email || formData.email.length === 0) missingFields.push('User Email');
        if (!formData.password || formData.password.length === 0) missingFields.push('User Password');
        if (!formData.full_name || formData.full_name.length === 0) missingFields.push('User Full Name');
        if (!formData.company.name || formData.company.name.length === 0) missingFields.push('Company Name');
        if (!formData.company.email || formData.company.email.length === 0) missingFields.push('Company Email');
        if (!formData.company.phone || formData.company.phone.length === 0) missingFields.push('Company Phone');

        if (missingFields.length > 0) {
            console.log('❌ Validation failed for fields:', missingFields);
            
            // Temporary workaround: if only full_name is missing, try to get it from the form directly
            if (missingFields.length === 1 && missingFields[0] === 'User Full Name') {
                const directUserName = document.getElementById('userName')?.value?.trim();
                if (directUserName) {
                    console.log('🔧 Applying workaround for full_name:', directUserName);
                    formData.full_name = directUserName;
                    // Clear the missing fields and continue
                    missingFields.length = 0;
                }
            }
            
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }
        }
        
        console.log('✅ All validation checks passed!');

        console.log('📝 Registering client:', formData);
        console.log('🔍 API_BASE_URL:', API_BASE_URL);
        console.log('🔍 Full URL:', `${API_BASE_URL}/api/auth/register`);

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response headers:', response.headers.get('content-type'));
        
        const responseText = await response.text();
        console.log('🔍 Raw response:', responseText.substring(0, 200));
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            throw new Error(`Server returned invalid response: ${response.status} ${response.statusText}`);
        }

        if (result.success) {
            showRegisterMessage('Client registered successfully! Account is ready to use.', 'success');
            resetRegistrationForm();
            await loadRecentRegistrations();
            renderRecentRegistrations();
        } else {
            throw new Error(result.error || 'Registration failed');
        }
    } catch (error) {
        console.error('❌ Error registering client:', error);
        showRegisterMessage(error.message, 'error');
        
        // Ensure button is re-enabled on error
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    } finally {
        // Double-check button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    }
}

// Reset registration form
function resetRegistrationForm() {
    const form = document.getElementById('clientRegisterForm');
    if (form) {
        form.reset();
    }
    
    // Reset button state
    const submitBtn = document.getElementById('registerClientBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">person_add</span> Register Client';
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    }
    
    // Re-enable all form inputs
    const inputs = form?.querySelectorAll('input, textarea, select');
    if (inputs) {
        inputs.forEach(input => {
            input.disabled = false;
            input.style.opacity = '1';
        });
    }
    
    hideRegisterMessage();
}

// Load recent registrations
async function loadRecentRegistrations() {
    try {
        console.log('🔍 Loading all registered clients...');
        console.log('🔍 API URL:', `${API_BASE_URL}/auth/users`);
        
        // Fetch all users from the auth system
        const response = await fetch(`${API_BASE_URL}/auth/users`);
        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response headers:', response.headers.get('content-type'));
        
        const result = await response.json();
        console.log('🔍 Full API response:', result);
        
        if (result.success && result.users) {
            // Filter for client users only and sort by creation date
            recentRegistrations = result.users
                .filter(user => user.role === 'client')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 20); // Show last 20 registrations
            
            console.log(`✅ Loaded ${recentRegistrations.length} client registrations`);
            console.log('🔍 Sample user data:', recentRegistrations[0]);
            console.log('🔍 All users data:', recentRegistrations);
        } else {
            console.log('⚠️ No users found or API error:', result.error);
            recentRegistrations = [];
        }
    } catch (error) {
        console.error('❌ Error loading recent registrations:', error);
        recentRegistrations = [];
    }
}

// Render recent registrations table
function renderRecentRegistrations() {
    const tableBody = document.getElementById('recentRegistrationsBody');
    
    if (recentRegistrations.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 40px; text-align: center; color: #6b7280;">
                    <span class="material-symbols-outlined" style="font-size: 48px; color: #d1d5db; margin-bottom: 16px;">person_add</span>
                    <div>No recent registrations</div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = recentRegistrations.map(user => {
        console.log('🔍 Rendering user:', user.full_name, 'Company:', user.company);
        
        return `
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 16px 24px;">
                <div style="font-weight: 600; color: #111827;">${user.company?.name || `Company ID: ${user.company_id || 'None'}`}</div>
                <div style="font-size: 13px; color: #6b7280;">${user.company?.email || user.email}</div>
            </td>
            <td style="padding: 16px 24px;">
                <div style="font-weight: 500; color: #111827;">${user.full_name}</div>
            </td>
            <td style="padding: 16px 24px; color: #6b7280;">
                ${user.email}
            </td>
            <td style="padding: 16px 24px; color: #6b7280;">
                ${user.phone || user.company?.phone || '-'}
            </td>
            <td style="padding: 16px 24px; color: #6b7280;">
                ${new Date(user.created_at).toLocaleDateString()}
            </td>
            <td style="padding: 16px 24px;">
                <button onclick="openPasswordChangeModal('${user.id}', '${user.full_name}')" style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 6px; transition: all 0.2s ease;">
                    <span class="material-symbols-outlined" style="font-size: 16px;">lock_reset</span>
                    Change Password
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// Show registration message
function showRegisterMessage(message, type = 'success') {
    const messageEl = document.getElementById('registerMessage');
    messageEl.style.display = 'block';
    messageEl.textContent = message;
    
    if (type === 'success') {
        messageEl.style.background = '#dcfce7';
        messageEl.style.color = '#16a34a';
        messageEl.style.border = '1px solid #bbf7d0';
    } else {
        messageEl.style.background = '#fecaca';
        messageEl.style.color = '#dc2626';
        messageEl.style.border = '1px solid #fca5a5';
    }
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            hideRegisterMessage();
        }, 5000);
    }
}

// Hide registration message
function hideRegisterMessage() {
    const messageEl = document.getElementById('registerMessage');
    if (messageEl) {
        messageEl.style.display = 'none';
    }
}

// Recovery function to restore form functionality
function restoreFormFunctionality() {
    console.log('🔧 Restoring form functionality...');
    
    const form = document.getElementById('clientRegisterForm');
    const submitBtn = document.getElementById('registerClientBtn');
    const resetBtn = document.getElementById('resetFormBtn');
    
    // Restore submit button
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 20px;">person_add</span> Register Client';
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        submitBtn.style.pointerEvents = 'auto';
    }
    
    // Restore reset button
    if (resetBtn) {
        resetBtn.disabled = false;
        resetBtn.style.opacity = '1';
        resetBtn.style.cursor = 'pointer';
        resetBtn.style.pointerEvents = 'auto';
    }
    
    // Restore all form inputs
    if (form) {
        const inputs = form.querySelectorAll('input, textarea, select, button');
        inputs.forEach(input => {
            input.disabled = false;
            input.style.opacity = '1';
            input.style.pointerEvents = 'auto';
        });
    }
    
    console.log('✅ Form functionality restored');
}

// Password change functionality
let currentClientId = null;
let currentClientName = null;

function openPasswordChangeModal(userId, userName) {
    currentClientId = userId;
    currentClientName = userName;
    
    // Reset modal state
    document.getElementById('adminVerificationStep').style.display = 'block';
    document.getElementById('newPasswordStep').style.display = 'none';
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('newPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
    
    // Show modal
    const modal = document.getElementById('passwordChangeModal');
    modal.style.display = 'flex';
    
    console.log('🔐 Opening password change modal for:', userName, 'ID:', userId);
}

function closePasswordChangeModal() {
    document.getElementById('passwordChangeModal').style.display = 'none';
    currentClientId = null;
    currentClientName = null;
}

async function verifyAdminPassword() {
    const adminPassword = document.getElementById('adminPasswordInput').value.trim();
    const verifyBtn = document.getElementById('verifyAdminBtn');
    
    if (!adminPassword) {
        showPasswordChangeMessage('Please enter your admin password', 'error');
        return;
    }
    
    try {
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = 'Verifying...';
        
        // Get current admin user info
        const adminEmail = localStorage.getItem('userEmail');
        if (!adminEmail) {
            throw new Error('Admin session not found');
        }
        
        // Verify admin password by attempting login
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: adminEmail,
                password: adminPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.user.role === 'admin') {
            // Admin verified, show password change step
            document.getElementById('adminVerificationStep').style.display = 'none';
            document.getElementById('newPasswordStep').style.display = 'block';
            document.getElementById('clientNameDisplay').textContent = currentClientName;
            console.log('✅ Admin verified successfully');
        } else {
            throw new Error('Invalid admin password');
        }
        
    } catch (error) {
        console.error('❌ Admin verification failed:', error);
        showPasswordChangeMessage('Invalid admin password', 'error');
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = 'Verify & Continue';
    }
}

async function changeClientPassword() {
    const newPassword = document.getElementById('newPasswordInput').value.trim();
    const confirmPassword = document.getElementById('confirmPasswordInput').value.trim();
    const changeBtn = document.getElementById('changePasswordBtn');
    
    if (!newPassword || !confirmPassword) {
        showPasswordChangeMessage('Please fill in both password fields', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showPasswordChangeMessage('Passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showPasswordChangeMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    try {
        changeBtn.disabled = true;
        changeBtn.innerHTML = 'Changing Password...';
        
        // Create a custom endpoint for admin password changes
        const response = await fetch(`${API_BASE_URL}/auth/admin-change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentClientId,
                newPassword: newPassword,
                adminEmail: localStorage.getItem('userEmail')
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showPasswordChangeMessage('Password changed successfully!', 'success');
            setTimeout(() => {
                closePasswordChangeModal();
            }, 2000);
            console.log('✅ Client password changed successfully');
        } else {
            throw new Error(result.error || 'Failed to change password');
        }
        
    } catch (error) {
        console.error('❌ Password change failed:', error);
        showPasswordChangeMessage(error.message, 'error');
    } finally {
        changeBtn.disabled = false;
        changeBtn.innerHTML = 'Change Password';
    }
}

function showPasswordChangeMessage(message, type) {
    // Create or update message element in modal
    let messageEl = document.getElementById('passwordChangeMessage');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'passwordChangeMessage';
        messageEl.style.cssText = 'margin-bottom: 16px; padding: 12px 16px; border-radius: 8px; font-weight: 500; font-size: 14px;';
        document.getElementById('passwordChangeContent').insertBefore(messageEl, document.getElementById('passwordChangeContent').firstChild);
    }
    
    messageEl.style.display = 'block';
    messageEl.textContent = message;
    
    if (type === 'success') {
        messageEl.style.background = '#dcfce7';
        messageEl.style.color = '#16a34a';
        messageEl.style.border = '1px solid #bbf7d0';
    } else {
        messageEl.style.background = '#fecaca';
        messageEl.style.color = '#dc2626';
        messageEl.style.border = '1px solid #fca5a5';
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (messageEl) {
            messageEl.style.display = 'none';
        }
    }, 5000);
}

// Setup password change modal event listeners
function setupPasswordChangeListeners() {
    // Cancel button
    document.getElementById('cancelPasswordChangeBtn').addEventListener('click', closePasswordChangeModal);
    
    // Verify admin button
    document.getElementById('verifyAdminBtn').addEventListener('click', verifyAdminPassword);
    
    // Back button
    document.getElementById('backToVerificationBtn').addEventListener('click', () => {
        document.getElementById('newPasswordStep').style.display = 'none';
        document.getElementById('adminVerificationStep').style.display = 'block';
    });
    
    // Change password button
    document.getElementById('changePasswordBtn').addEventListener('click', changeClientPassword);
    
    // Close modal when clicking outside
    document.getElementById('passwordChangeModal').addEventListener('click', (e) => {
        if (e.target.id === 'passwordChangeModal') {
            closePasswordChangeModal();
        }
    });
    
    // Enter key handlers
    document.getElementById('adminPasswordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyAdminPassword();
        }
    });
    
    document.getElementById('confirmPasswordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            changeClientPassword();
        }
    });
}

// Make functions globally accessible
window.initClientRegisterPage = initClientRegisterPage;
window.restoreFormFunctionality = restoreFormFunctionality;
window.openPasswordChangeModal = openPasswordChangeModal;
window.closePasswordChangeModal = closePasswordChangeModal;

// Auto-recovery mechanism - restore form after any error
setInterval(() => {
    const submitBtn = document.getElementById('registerClientBtn');
    if (submitBtn && submitBtn.disabled && submitBtn.textContent !== 'Registering...') {
        console.log('🔧 Auto-recovering disabled form...');
        restoreFormFunctionality();
    }
}, 2000); // Check every 2 seconds