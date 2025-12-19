// ADMIN CLIENT APPROVAL PAGE

let pendingRequests = [];
let currentRequest = null;

async function initClientApprovalPage() {
    console.log('👥 Loading client approval page...');
    
    try {
        await loadPendingRequests();
        setupApprovalEventListeners();
        renderRequests();
    } catch (error) {
        console.error('❌ Error initializing client approval page:', error);
        showToast('Failed to load approval requests', 'error');
    }
}

// Load pending consignee requests
async function loadPendingRequests() {
    try {
        const response = await fetch(`${API_BASE_URL}/consignees/pending`);
        const result = await response.json();

        if (result.success) {
            pendingRequests = result.data || [];
            console.log(`✅ Loaded ${pendingRequests.length} pending requests`);
            updateStats();
        } else {
            throw new Error(result.error || 'Failed to load pending requests');
        }
    } catch (error) {
        console.error('❌ Error loading pending requests:', error);
        pendingRequests = [];
        updateStats();
        
        // Show helpful message if it's likely a database schema issue
        if (error.message.includes('column') || error.message.includes('status')) {
            showToast('Database migration may be needed. Check CONSIGNEE_APPROVAL_SETUP.md', 'info');
        }
    }
}

// Update statistics
function updateStats() {
    const pendingCount = pendingRequests.length;
    
    // Update pending count
    document.getElementById('pendingCount').textContent = pendingCount;
    
    // For approved/rejected today, we'd need additional API calls
    // For now, showing 0 as placeholder
    document.getElementById('approvedCount').textContent = '0';
    document.getElementById('rejectedCount').textContent = '0';
    
    // Update request count
    document.getElementById('requestCount').textContent = `${pendingCount} request${pendingCount !== 1 ? 's' : ''}`;
}

// Setup event listeners
function setupApprovalEventListeners() {
    // Refresh button
    document.getElementById('refreshRequestsBtn').addEventListener('click', async () => {
        await loadPendingRequests();
        renderRequests();
        showToast('Requests refreshed', 'success');
    });

    // Modal close buttons
    document.getElementById('closeModalBtn').addEventListener('click', closeApprovalModal);
    document.getElementById('cancelBtn').addEventListener('click', closeApprovalModal);

    // Initial action buttons
    document.getElementById('approveBtn').addEventListener('click', () => {
        console.log('🔍 Approve button clicked');
        // Show consignee number section and hide rejection section
        document.getElementById('rejectionReasonSection').style.display = 'none';
        document.getElementById('consigneeNumberSection').style.display = 'block';
        // Switch to final buttons
        document.getElementById('initialButtons').style.display = 'none';
        document.getElementById('finalButtons').style.display = 'flex';
        // Focus on the input field
        const inputField = document.getElementById('consigneeNumber');
        if (inputField) {
            inputField.focus();
            console.log('✅ Consignee number input field found and focused');
        } else {
            console.error('❌ Consignee number input field not found!');
        }
    });

    document.getElementById('rejectBtn').addEventListener('click', () => {
        // Show rejection section and hide consignee number section
        document.getElementById('rejectionReasonSection').style.display = 'block';
        document.getElementById('consigneeNumberSection').style.display = 'none';
        // Switch to final buttons
        document.getElementById('initialButtons').style.display = 'none';
        document.getElementById('finalButtons').style.display = 'flex';
    });

    // Cancel final action
    document.getElementById('cancelFinalBtn').addEventListener('click', () => {
        // Hide both sections
        document.getElementById('rejectionReasonSection').style.display = 'none';
        document.getElementById('consigneeNumberSection').style.display = 'none';
        // Switch back to initial buttons
        document.getElementById('initialButtons').style.display = 'flex';
        document.getElementById('finalButtons').style.display = 'none';
    });

    // Final approval/rejection buttons
    document.getElementById('finalApproveBtn').addEventListener('click', () => {
        console.log('🔍 Final approve button clicked');
        const inputField = document.getElementById('consigneeNumber');
        if (inputField) {
            console.log('🔍 Input field value before approval:', inputField.value);
        }
        handleApproval(true);
    });
    document.getElementById('finalRejectBtn').addEventListener('click', () => handleApproval(false));



    // Close modal on outside click
    document.getElementById('approvalModal').addEventListener('click', (e) => {
        if (e.target.id === 'approvalModal') {
            closeApprovalModal();
        }
    });
}

// Render requests table
function renderRequests() {
    const emptyState = document.getElementById('requestsEmpty');
    const tableWrapper = document.getElementById('requestsTableWrapper');
    const tableBody = document.getElementById('requestsTableBody');

    if (pendingRequests.length === 0) {
        emptyState.style.display = 'block';
        tableWrapper.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    tableWrapper.style.display = 'block';

    tableBody.innerHTML = pendingRequests.map(request => `
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 16px 24px;">
                <div style="font-weight: 600; color: #111827;">${request.company?.name || 'Unknown Company'}</div>
                <div style="font-size: 13px; color: #6b7280;">${request.company?.email || ''}</div>
            </td>
            <td style="padding: 16px 24px;">
                <div style="font-weight: 500; color: #111827;">${request.name}</div>
                ${request.contact_person ? `<div style="font-size: 13px; color: #6b7280;">Contact: ${request.contact_person}</div>` : ''}
            </td>
            <td style="padding: 16px 24px; color: #6b7280; max-width: 200px;">
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${request.address}">
                    ${request.address}
                </div>
            </td>
            <td style="padding: 16px 24px; color: #6b7280;">
                ${request.city}${request.state ? `, ${request.state}` : ''}
            </td>
            <td style="padding: 16px 24px; color: #6b7280;">
                ${request.phone}
            </td>
            <td style="padding: 16px 24px; color: #6b7280;">
                ${new Date(request.created_at).toLocaleDateString()}
            </td>
            <td style="padding: 16px 24px; text-align: center;">
                <button onclick="reviewRequest('${request.id}')" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 500;">
                    Review
                </button>
            </td>
        </tr>
    `).join('');
}

// Review a specific request
function reviewRequest(requestId) {
    currentRequest = pendingRequests.find(r => r.id === requestId);
    if (!currentRequest) return;

    // Populate modal with request details
    const detailsHtml = `
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 16px 0; color: #374151;">Consignee Details</h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 13px; color: #6b7280; font-weight: 500;">Company</label>
                    <div style="font-weight: 600; color: #111827;">${currentRequest.company?.name || 'Unknown'}</div>
                </div>
                <div>
                    <label style="font-size: 13px; color: #6b7280; font-weight: 500;">Consignee Name</label>
                    <div style="font-weight: 600; color: #111827;">${currentRequest.name}</div>
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="font-size: 13px; color: #6b7280; font-weight: 500;">Address</label>
                <div style="color: #374151;">${currentRequest.address}</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                    <label style="font-size: 13px; color: #6b7280; font-weight: 500;">City</label>
                    <div style="color: #374151;">${currentRequest.city}</div>
                </div>
                <div>
                    <label style="font-size: 13px; color: #6b7280; font-weight: 500;">State</label>
                    <div style="color: #374151;">${currentRequest.state || 'Not specified'}</div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                    <label style="font-size: 13px; color: #6b7280; font-weight: 500;">Phone</label>
                    <div style="color: #374151;">${currentRequest.phone}</div>
                </div>
                <div>
                    <label style="font-size: 13px; color: #6b7280; font-weight: 500;">Email</label>
                    <div style="color: #374151;">${currentRequest.email || 'Not provided'}</div>
                </div>
            </div>
            
            ${currentRequest.gst_number ? `
                <div style="margin-top: 16px;">
                    <label style="font-size: 13px; color: #6b7280; font-weight: 500;">GST Number</label>
                    <div style="color: #374151;">${currentRequest.gst_number}</div>
                </div>
            ` : ''}
            
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                <label style="font-size: 13px; color: #6b7280; font-weight: 500;">Requested On</label>
                <div style="color: #374151;">${new Date(currentRequest.created_at).toLocaleString()}</div>
            </div>
        </div>
    `;

    document.getElementById('consigneeDetails').innerHTML = detailsHtml;
    document.getElementById('rejectionReasonSection').style.display = 'none';
    document.getElementById('consigneeNumberSection').style.display = 'none';
    document.getElementById('rejectionReason').value = '';
    document.getElementById('consigneeNumber').value = '';
    document.getElementById('approvalModal').style.display = 'flex';
}



// Handle approval/rejection
async function handleApproval(isApproval) {
    if (!currentRequest) return;

    const actionBtn = isApproval ? document.getElementById('finalApproveBtn') : document.getElementById('finalRejectBtn');
    const originalText = actionBtn.textContent;

    try {
        actionBtn.disabled = true;
        actionBtn.textContent = isApproval ? 'Approving...' : 'Rejecting...';

        const endpoint = isApproval ? 'approve' : 'reject';
        const payload = {};
        
        // Only add adminId if it exists and looks like a valid UUID
        const adminId = localStorage.getItem('userId');
        if (adminId && adminId.length > 30) { // Basic UUID length check
            payload.adminId = adminId;
        }

        if (isApproval) {
            const consigneeNumber = document.getElementById('consigneeNumber').value.trim();
            if (!consigneeNumber) {
                showToast('Please provide a consignee number', 'error');
                actionBtn.disabled = false;
                actionBtn.textContent = originalText;
                return;
            }
            payload.consigneeNumber = consigneeNumber;
        } else {
            const reason = document.getElementById('rejectionReason').value.trim();
            if (!reason) {
                showToast('Please provide a reason for rejection', 'error');
                actionBtn.disabled = false;
                actionBtn.textContent = originalText;
                return;
            }
            payload.reason = reason;
        }

        const response = await fetch(`${API_BASE_URL}/consignees/${currentRequest.id}/${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            if (isApproval) {
                if (result.data?.consignee_number) {
                    showToast(`Consignee approved successfully! Assigned number: ${result.data.consignee_number}`, 'success');
                } else {
                    showToast('Consignee approved successfully', 'success');
                }
            } else {
                showToast('Consignee rejected successfully', 'success');
            }
            closeApprovalModal();
            await loadPendingRequests();
            renderRequests();
        } else {
            throw new Error(result.error || `Failed to ${isApproval ? 'approve' : 'reject'} consignee`);
        }
    } catch (error) {
        console.error(`❌ Error ${isApproval ? 'approving' : 'rejecting'} consignee:`, error);
        showToast(error.message, 'error');
    } finally {
        actionBtn.disabled = false;
        actionBtn.textContent = originalText;
    }
}

// Close approval modal
function closeApprovalModal() {
    document.getElementById('approvalModal').style.display = 'none';
    currentRequest = null;
    document.getElementById('rejectionReason').value = '';
    document.getElementById('consigneeNumber').value = '';
    document.getElementById('rejectionReasonSection').style.display = 'none';
    document.getElementById('consigneeNumberSection').style.display = 'none';
    // Reset button states
    document.getElementById('initialButtons').style.display = 'flex';
    document.getElementById('finalButtons').style.display = 'none';
}