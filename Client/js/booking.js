// CLIENT BOOKING PAGE

let batch = [];

async function initClientBookingPage() {
    console.log('📦 Initializing Client Booking page...');
    
    // Set current date
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        currentDateElement.textContent = formattedDate;
    }
    
    // Generate new LR number
    const lrNumber = `LR${Date.now()}`;
    document.getElementById('lrChip').textContent = lrNumber;
    document.getElementById('lrBottom').textContent = lrNumber;
    
    // Load consignees for selection
    await loadConsigneesForBooking();
    
    // Initialize consignee selection functionality
    initConsigneeSelection();
    
    // Initialize batch functionality
    initBatchFunctionality();
    
    // Handle responsive LR chip display
    initResponsiveLRChip();
}

// Load consignees for booking selection
async function loadConsigneesForBooking() {
    try {
        const companyId = getCompanyId();
        if (!companyId) {
            console.warn('No company ID found for loading consignees');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/consignees?companyId=${companyId}`);
        const result = await response.json();

        if (result.success) {
            const consigneeSelect = document.getElementById('consigneeSelect');
            if (consigneeSelect) {
                if (result.data.length === 0) {
                    // No approved consignees available
                    consigneeSelect.innerHTML = '<option value="">No approved consignees available - Add consignees first</option>';
                    consigneeSelect.disabled = true;
                    
                    // Disable the form and show message
                    disableBookingForm('You need to add and get approval for consignees before creating bookings.');
                } else {
                    // Clear existing options except the first one
                    consigneeSelect.innerHTML = '<option value="">Select an approved consignee</option>';
                    consigneeSelect.disabled = false;
                    
                    // Filter and add only APPROVED consignees as options
                    const approvedConsignees = result.data.filter(consignee => 
                        consignee.status === 'APPROVED' || !consignee.status // For backward compatibility
                    );
                    
                    if (approvedConsignees.length === 0) {
                        // No approved consignees available
                        consigneeSelect.innerHTML = '<option value="">No approved consignees available - Waiting for admin approval</option>';
                        consigneeSelect.disabled = true;
                        disableBookingForm('Your consignees are pending approval. Please wait for admin approval before creating bookings.');
                        return;
                    }
                    
                    approvedConsignees.forEach(consignee => {
                        const option = document.createElement('option');
                        option.value = consignee.id;
                        option.textContent = consignee.consignee_number 
                            ? `${consignee.consignee_number} - ${consignee.name} - ${consignee.city}`
                            : `${consignee.name} - ${consignee.city}`;
                        option.dataset.consignee = JSON.stringify(consignee);
                        consigneeSelect.appendChild(option);
                    });
                    
                    console.log(`✅ Loaded ${approvedConsignees.length} approved consignees for booking (${result.data.length} total)`);
                    
                    // Enable the form
                    enableBookingForm();
                }
                
                console.log(`✅ Loaded ${result.data.length} approved consignees for booking`);
            }
        }
    } catch (error) {
        console.error('❌ Error loading consignees for booking:', error);
    }
}

// Disable booking form when no approved consignees
function disableBookingForm(message) {
    const form = document.getElementById('parcelForm');
    const inputs = form.querySelectorAll('input, select, button');
    
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    // Show warning message
    const warningDiv = document.getElementById('consigneeWarning') || createWarningDiv();
    warningDiv.innerHTML = `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 16px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
            <span class="material-symbols-outlined" style="color: #f59e0b;">warning</span>
            <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Consignee Approval Required</div>
                <div style="font-size: 14px;">${message}</div>
                <button onclick="goToConsigneesPage()" style="background: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; margin-top: 8px; cursor: pointer;">
                    Add Consignees
                </button>
            </div>
        </div>
    `;
}

// Enable booking form when approved consignees are available
function enableBookingForm() {
    const form = document.getElementById('parcelForm');
    const inputs = form.querySelectorAll('input, select, button');
    
    inputs.forEach(input => {
        input.disabled = false;
    });
    
    // Hide warning message
    const warningDiv = document.getElementById('consigneeWarning');
    if (warningDiv) {
        warningDiv.innerHTML = '';
    }
}

// Create warning div if it doesn't exist
function createWarningDiv() {
    let warningDiv = document.getElementById('consigneeWarning');
    if (!warningDiv) {
        warningDiv = document.createElement('div');
        warningDiv.id = 'consigneeWarning';
        
        // Insert before the form
        const form = document.getElementById('parcelForm');
        form.parentNode.insertBefore(warningDiv, form);
    }
    return warningDiv;
}

// Navigate to consignees page
function goToConsigneesPage() {
    const consigneesNavBtn = document.querySelector('.nav-item[data-page="client-consignees"]');
    if (consigneesNavBtn) {
        consigneesNavBtn.click();
    }
}

// Initialize consignee selection functionality
function initConsigneeSelection() {
    const consigneeSelect = document.getElementById('consigneeSelect');
    const manageConsigneesBtn = document.getElementById('manageConsigneesBtn');

    // Handle consignee selection
    if (consigneeSelect) {
        consigneeSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.selectedOptions[0];
            
            if (selectedOption && selectedOption.dataset.consignee) {
                const consignee = JSON.parse(selectedOption.dataset.consignee);
                
                // Fill form with consignee data
                document.getElementById('company').value = consignee.name;
                document.getElementById('address').value = consignee.address;
                document.getElementById('city').value = consignee.city;
                document.getElementById('phone').value = consignee.phone;
                
                // Make fields readonly when consignee is selected
                const fields = ['company', 'address', 'city', 'phone'];
                fields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    field.readOnly = true;
                    field.style.backgroundColor = '#f8fafc';
                    field.style.borderColor = '#cbd5e1';
                    field.style.color = '#475569';
                });
                
                // Update last used timestamp
                updateConsigneeLastUsed(consignee.id);
                
                // Focus on articles field
                document.getElementById('articles').focus();
                
                showToast(`Consignee "${consignee.name}" selected`, 'success');
            } else {
                // Clear form but keep fields readonly to prevent manual entry
                clearConsigneeForm();
                showToast('Please select an approved consignee from the dropdown', 'info');
            }
        });
    }

    // Handle manage consignees button
    if (manageConsigneesBtn) {
        manageConsigneesBtn.addEventListener('click', () => {
            // Switch to consignees page
            const consigneesNavBtn = document.querySelector('.nav-item[data-page="client-consignees"]');
            if (consigneesNavBtn) {
                consigneesNavBtn.click();
            }
        });
    }
}

// Clear consignee form and keep fields readonly
function clearConsigneeForm() {
    document.getElementById('company').value = '';
    document.getElementById('address').value = '';
    document.getElementById('city').value = '';
    document.getElementById('phone').value = '';
    
    // Keep fields readonly to prevent manual entry
    const fields = ['company', 'address', 'city', 'phone'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        field.readOnly = true;
        field.style.backgroundColor = '#f8fafc';
        field.style.borderColor = '#cbd5e1';
        field.style.color = '#64748b';
    });
}

// Update consignee last used timestamp
async function updateConsigneeLastUsed(consigneeId) {
    try {
        await fetch(`${API_BASE_URL}/consignees/${consigneeId}/last-used`, {
            method: 'PUT'
        });
    } catch (error) {
        console.error('Error updating consignee last used:', error);
        // Don't show error to user as this is not critical
    }
}



function initBatchFunctionality() {
    const addParcelBtn = document.getElementById('addParcelBtn');
    const createSingleBtn = document.getElementById('createSingleBtn');
    const batchTableBody = document.getElementById('batchTableBody');
    const batchEmpty = document.getElementById('batchEmpty');
    const batchTableWrapper = document.getElementById('batchTableWrapper');
    const submitBatch = document.getElementById('submitBatch');
    const clearBatch = document.getElementById('clearBatch');

    if (!addParcelBtn || !createSingleBtn) return; // Elements not loaded yet

function escapeHtml(str){
  return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

    // Handle single booking creation
    createSingleBtn.addEventListener('click', () => {
        const company = document.getElementById('company').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const articles = parseInt(document.getElementById('articles').value || 0, 10);
        const parcelType = document.getElementById('parcelType').value;

        if (!company || !city || !articles) {
            showToast('Please fill all required fields (Consignee Name, City, Articles).', 'error');
            return;
        }

        // Get company ID for the booking
        const companyId = getCompanyId();
        const companyName = getCompanyName();
        
        if (!companyId) {
            showToast('Company information not found. Please login again.', 'error');
            return;
        }

        // Create single booking
        const bookingData = {
            companyId: companyId,
            companyName: companyName,
            consigneeName: company,
            consigneeContact: phone,
            destination: city,
            articleCount: articles,
            parcelType: parcelType,
            address: address
        };

        submitSingleBooking(bookingData);
    });

    addParcelBtn.addEventListener('click', () => {
        const company = document.getElementById('company').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const articles = parseInt(document.getElementById('articles').value || 0, 10);
        const parcelType = document.getElementById('parcelType').value;

        if (!company || !city || !articles) {
            showToast('Please fill all required fields (Consignee Name, City, Articles).', 'error');
            return;
        }

        // Generate individual LR number for this parcel
        const parcelLR = `LR${Date.now()}-${batch.length + 1}`;
        const currentDate = new Date().toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        
        batch.push({
            company, 
            address, 
            city, 
            phone, 
            articles, 
            parcelType,
            lrNumber: parcelLR,
            date: currentDate
        });
        renderBatch();
        document.getElementById('parcelForm').reset();
        
        // Reset consignee selection
        const consigneeSelect = document.getElementById('consigneeSelect');
        if (consigneeSelect) {
            consigneeSelect.value = '';
        }
        
        // Clear consignee form fields
        clearConsigneeForm();
        
        showToast('Parcel added to batch successfully!', 'success');
    });

    function renderBatch() {
        if (batch.length === 0) {
            batchEmpty.style.display = '';
            batchTableWrapper.style.display = 'none';
            return;
        }
        batchEmpty.style.display = 'none';
        batchTableWrapper.style.display = '';
        batchTableBody.innerHTML = '';
        
        batch.forEach((p, i) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #f3f4f6';
            tr.innerHTML = `
                <td style="padding: 16px 24px; color: #111827;">${i + 1}</td>
                <td style="padding: 16px 24px; color: #111827; font-weight: 500; font-family: monospace;">${p.lrNumber}</td>
                <td style="padding: 16px 24px; color: #6b7280;">${p.date}</td>
                <td style="padding: 16px 24px; color: #111827; font-weight: 500;">${escapeHtml(p.company)}</td>
                <td style="padding: 16px 24px; color: #6b7280;">${escapeHtml(p.city)}</td>
                <td style="padding: 16px 24px; color: #6b7280;">${p.articles}</td>
                <td style="padding: 16px 24px; color: #6b7280;">${escapeHtml(p.parcelType)}</td>
                <td style="padding: 16px 24px;">
                    <button class="remove" data-i="${i}" style="background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">Remove</button>
                </td>
            `;
            batchTableBody.appendChild(tr);
        });

        // Add remove button functionality
        batchTableBody.querySelectorAll('.remove').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = Number(e.currentTarget.getAttribute('data-i'));
                batch.splice(idx, 1);
                renderBatch();
                showToast('Parcel removed from batch', 'info');
            });
        });
    }

    submitBatch.addEventListener('click', () => {
        if (batch.length === 0) {
            showToast('No parcels to submit', 'error');
            return;
        }
        
        // Get company ID for the booking
        const companyId = getCompanyId();
        const companyName = getCompanyName();
        
        if (!companyId) {
            showToast('Company information not found. Please login again.', 'error');
            return;
        }
        
        // Prepare booking data with company ID
        const bookingData = {
            companyId: companyId,
            companyName: companyName,
            parcels: batch,
            lrNumber: document.getElementById('lrChip').textContent
        };
        
        console.log('Booking data with company ID:', bookingData);
        
        // Submit booking to server with company ID
        submitBookingBatch(bookingData);
        
        showToast(`Batch submitted successfully! (${batch.length} parcels for ${companyName})`, 'success');
        batch = [];
        renderBatch();
        
        // Reset consignee selection
        const consigneeSelect = document.getElementById('consigneeSelect');
        if (consigneeSelect) {
            consigneeSelect.value = '';
        }
        
        // Clear consignee form fields
        clearConsigneeForm();
        
        // Clear the main form
        document.getElementById('parcelForm').reset();
        
        // Generate new LR number for next batch
        const newLrNumber = `LR${Date.now()}`;
        document.getElementById('lrChip').textContent = newLrNumber;
        document.getElementById('lrBottom').textContent = newLrNumber;
    });

    clearBatch.addEventListener('click', () => {
        if (!confirm('Clear all parcels in batch?')) return;
        batch = [];
        renderBatch();
        showToast('Batch cleared', 'info');
    });

    renderBatch();
}

// Handle responsive LR chip display
function initResponsiveLRChip() {
    const lrChip = document.getElementById('lrChip');
    if (!lrChip) return; // Element doesn't exist yet
    
    function checkLRDisplay() {
        if (window.innerWidth < 420) {
            lrChip.style.display = 'none';
        } else {
            lrChip.style.display = '';
        }
    }
    
    window.addEventListener('resize', checkLRDisplay);
    checkLRDisplay();
}

// Submit single booking to server
async function submitSingleBooking(bookingData) {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Single booking submitted successfully:', result);
            showToast(`Booking created successfully! LR: ${result.data.lr_number}`, 'success');
            
            // Clear the form
            document.getElementById('parcelForm').reset();
            
            // Reset consignee selection
            const consigneeSelect = document.getElementById('consigneeSelect');
            if (consigneeSelect) {
                consigneeSelect.value = '';
            }
            
            // Clear consignee form fields
            clearConsigneeForm();
            
            // Generate new LR number for next booking
            const newLrNumber = `LR${Date.now()}`;
            document.getElementById('lrChip').textContent = newLrNumber;
            document.getElementById('lrBottom').textContent = newLrNumber;
        } else {
            console.error('❌ Single booking submission failed:', result.error);
            showToast('Failed to create booking: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('❌ Error submitting single booking:', error);
        showToast('Network error while creating booking', 'error');
    }
}

// Submit booking batch to server
async function submitBookingBatch(bookingData) {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Booking batch submitted successfully:', result);
        } else {
            console.error('❌ Booking submission failed:', result.error);
            showToast('Failed to submit booking: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('❌ Error submitting booking:', error);
        showToast('Network error while submitting booking', 'error');
    }
}