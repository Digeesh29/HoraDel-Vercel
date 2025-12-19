// CLIENT CONSIGNEES MANAGEMENT

let consignees = [];
let filteredConsignees = [];
let editingConsigneeId = null;

// Initialize consignees page
async function initClientConsigneesPage() {
    console.log('🏢 Loading client consignees page...');
    
    try {
        await loadConsignees();
        setupEventListeners();
        renderConsignees();
    } catch (error) {
        console.error('❌ Error initializing consignees page:', error);
        showToast('Failed to load consignees', 'error');
    }
}

// Load consignees from API
async function loadConsignees() {
    try {
        const companyId = localStorage.getItem('companyId');
        if (!companyId) {
            throw new Error('Company ID not found');
        }

        const response = await fetch(`${API_BASE_URL}/consignees?companyId=${companyId}&includeAll=true`);
        const result = await response.json();

        if (result.success) {
            consignees = result.data || [];
            filteredConsignees = [...consignees];
            console.log(`✅ Loaded ${consignees.length} consignees`);
        } else {
            throw new Error(result.error || 'Failed to load consignees');
        }
    } catch (error) {
        console.error('❌ Error loading consignees:', error);
        consignees = [];
        filteredConsignees = [];
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add consignee button
    document.getElementById('addConsigneeBtn').addEventListener('click', () => {
        openConsigneeModal();
    });

    // Search functionality
    document.getElementById('searchConsignees').addEventListener('input', (e) => {
        filterConsignees(e.target.value);
    });

    // Clear search
    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        document.getElementById('searchConsignees').value = '';
        filterConsignees('');
    });

    // Modal close buttons
    document.getElementById('closeModalBtn').addEventListener('click', closeConsigneeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeConsigneeModal);

    // Form submission
    document.getElementById('consigneeForm').addEventListener('submit', handleConsigneeSubmit);

    // Delete modal buttons
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

    // Close modals on outside click
    document.getElementById('consigneeModal').addEventListener('click', (e) => {
        if (e.target.id === 'consigneeModal') {
            closeConsigneeModal();
        }
    });

    document.getElementById('deleteModal').addEventListener('click', (e) => {
        if (e.target.id === 'deleteModal') {
            closeDeleteModal();
        }
    });
}

// Filter consignees based on search term
function filterConsignees(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
        filteredConsignees = [...consignees];
    } else {
        filteredConsignees = consignees.filter(consignee => 
            consignee.name.toLowerCase().includes(term) ||
            consignee.city.toLowerCase().includes(term) ||
            consignee.phone.includes(term) ||
            (consignee.email && consignee.email.toLowerCase().includes(term)) ||
            (consignee.consignee_number && consignee.consignee_number.toLowerCase().includes(term))
        );
    }
    
    renderConsignees();
}

// Render consignees table
function renderConsignees() {
    const emptyState = document.getElementById('consigneesEmpty');
    const tableWrapper = document.getElementById('consigneesTableWrapper');
    const tableBody = document.getElementById('consigneesTableBody');
    const countElement = document.getElementById('consigneeCount');

    // Update count
    countElement.textContent = `${filteredConsignees.length} consignee${filteredConsignees.length !== 1 ? 's' : ''}`;

    if (filteredConsignees.length === 0) {
        emptyState.style.display = 'block';
        tableWrapper.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    tableWrapper.style.display = 'block';

    // Sort consignees: PENDING first, then APPROVED, then REJECTED
    const sortedConsignees = [...filteredConsignees].sort((a, b) => {
        const statusOrder = { 'PENDING': 0, 'APPROVED': 1, 'REJECTED': 2 };
        const aOrder = statusOrder[a.status] ?? 3;
        const bOrder = statusOrder[b.status] ?? 3;
        
        if (aOrder !== bOrder) {
            return aOrder - bOrder;
        }
        
        // If same status, sort alphabetically by name
        return a.name.localeCompare(b.name);
    });

    tableBody.innerHTML = sortedConsignees.map(consignee => `
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 16px 24px;">
                <div style="font-weight: 600; color: #111827;">${consignee.name}</div>
                ${consignee.consignee_number ? `<div style="font-size: 12px; color: #3b82f6; font-weight: 500; margin-top: 4px;">ID: ${consignee.consignee_number}</div>` : ''}
                ${consignee.contact_person ? `<div style="font-size: 13px; color: #6b7280;">Contact: ${consignee.contact_person}</div>` : ''}
            </td>
            <td style="padding: 16px 24px; color: #6b7280; max-width: 200px;">
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${consignee.address}">
                    ${consignee.address}
                </div>
            </td>
            <td style="padding: 16px 24px; color: #6b7280;">
                ${consignee.city}${consignee.state ? `, ${consignee.state}` : ''}
            </td>
            <td style="padding: 16px 24px; color: #6b7280;">
                ${consignee.phone}
            </td>
            <td style="padding: 16px 24px; color: #6b7280;">
                ${consignee.email || '-'}
            </td>
            <td style="padding: 16px 24px;">
                <span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; ${getConsigneeStatusStyle(consignee.status)}">${consignee.status}</span>
            </td>
            <td style="padding: 16px 24px; text-align: center;">
                <div style="display: flex; justify-content: center; gap: 8px;">
                    ${consignee.status === 'PENDING' ? `
                        <span style="color: #f59e0b; font-size: 12px; font-weight: 500;">Awaiting Approval</span>
                    ` : consignee.status === 'APPROVED' ? `
                        <button onclick="editConsignee('${consignee.id}')" style="background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 6px; color: #6b7280;" title="Edit">
                            <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
                        </button>
                        <button onclick="deleteConsignee('${consignee.id}')" style="background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 6px; color: #dc2626;" title="Delete">
                            <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
                        </button>
                    ` : `
                        <span style="color: #dc2626; font-size: 12px; font-weight: 500;">Rejected</span>
                        <button onclick="deleteConsignee('${consignee.id}')" style="background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 6px; color: #dc2626;" title="Delete">
                            <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
                        </button>
                    `}
                </div>
            </td>
        </tr>
    `).join('');
}

// Open consignee modal for adding/editing
function openConsigneeModal(consigneeId = null) {
    editingConsigneeId = consigneeId;
    const modal = document.getElementById('consigneeModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('consigneeForm');

    if (consigneeId) {
        // Edit mode
        const consignee = consignees.find(c => c.id === consigneeId);
        if (!consignee) return;

        title.textContent = 'Edit Consignee';
        document.getElementById('consigneeId').value = consignee.id;
        document.getElementById('consigneeName').value = consignee.name;
        document.getElementById('contactPerson').value = consignee.contact_person || '';
        document.getElementById('consigneeAddress').value = consignee.address;
        document.getElementById('consigneeCity').value = consignee.city;
        document.getElementById('consigneeState').value = consignee.state || '';
        document.getElementById('consigneePhone').value = consignee.phone;
        document.getElementById('consigneeEmail').value = consignee.email || '';
        document.getElementById('consigneePincode').value = consignee.pincode || '';
        document.getElementById('consigneeGst').value = consignee.gst_number || '';
    } else {
        // Add mode
        title.textContent = 'Add New Consignee';
        form.reset();
        document.getElementById('consigneeId').value = '';
    }

    modal.style.display = 'flex';
}

// Close consignee modal
function closeConsigneeModal() {
    document.getElementById('consigneeModal').style.display = 'none';
    editingConsigneeId = null;
}

// Handle consignee form submission
async function handleConsigneeSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('saveConsigneeBtn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = editingConsigneeId ? 'Updating...' : 'Saving...';

        const formData = {
            name: document.getElementById('consigneeName').value.trim(),
            contact_person: document.getElementById('contactPerson').value.trim(),
            address: document.getElementById('consigneeAddress').value.trim(),
            city: document.getElementById('consigneeCity').value.trim(),
            state: document.getElementById('consigneeState').value.trim(),
            phone: document.getElementById('consigneePhone').value.trim(),
            email: document.getElementById('consigneeEmail').value.trim(),
            pincode: document.getElementById('consigneePincode').value.trim(),
            gst_number: document.getElementById('consigneeGst').value.trim(),
            company_id: localStorage.getItem('companyId')
        };

        const url = editingConsigneeId 
            ? `${API_BASE_URL}/consignees/${editingConsigneeId}`
            : `${API_BASE_URL}/consignees`;
        
        const method = editingConsigneeId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showToast(editingConsigneeId ? 'Consignee updated successfully' : 'Consignee added successfully', 'success');
            closeConsigneeModal();
            await loadConsignees();
            renderConsignees();
        } else {
            throw new Error(result.error || 'Failed to save consignee');
        }
    } catch (error) {
        console.error('❌ Error saving consignee:', error);
        showToast(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Edit consignee
function editConsignee(consigneeId) {
    openConsigneeModal(consigneeId);
}

// Delete consignee
function deleteConsignee(consigneeId) {
    editingConsigneeId = consigneeId;
    document.getElementById('deleteModal').style.display = 'flex';
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    editingConsigneeId = null;
}

// Confirm delete
async function confirmDelete() {
    if (!editingConsigneeId) return;

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const originalText = confirmBtn.textContent;

    try {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Deleting...';

        const response = await fetch(`${API_BASE_URL}/consignees/${editingConsigneeId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Consignee deleted successfully', 'success');
            closeDeleteModal();
            await loadConsignees();
            renderConsignees();
        } else {
            throw new Error(result.error || 'Failed to delete consignee');
        }
    } catch (error) {
        console.error('❌ Error deleting consignee:', error);
        showToast(error.message, 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

// Toast notification function (if not already defined)
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9999;
        background: ${type === 'success' ? '#10b981' : '#dc2626'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
    }, 3000);
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3300);
}

// Get status styling for consignees
function getConsigneeStatusStyle(status) {
    switch (status) {
        case 'APPROVED':
            return 'background: #dcfce7; color: #16a34a;';
        case 'PENDING':
            return 'background: #fef3c7; color: #d97706;';
        case 'REJECTED':
            return 'background: #fecaca; color: #dc2626;';
        default:
            return 'background: #f3f4f6; color: #6b7280;';
    }
}