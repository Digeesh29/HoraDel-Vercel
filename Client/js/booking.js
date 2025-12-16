// CLIENT BOOKING PAGE

let batch = [];

async function initClientBookingPage() {
    console.log('📦 Initializing Client Booking page...');
    
    // Generate new LR number
    const lrNumber = `LR${Date.now()}`;
    document.getElementById('lrChip').textContent = lrNumber;
    document.getElementById('lrBottom').textContent = lrNumber;
    
    // Initialize batch functionality
    initBatchFunctionality();
    
    // Handle responsive LR chip display
    initResponsiveLRChip();
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

        batch.push({company, address, city, phone, articles, parcelType});
        renderBatch();
        document.getElementById('parcelForm').reset();
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