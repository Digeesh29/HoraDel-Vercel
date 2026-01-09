// js/ratecard.js

let rateCards = [];
let companies = [];
let tbody, exportBtn, openModalBtn, rateModal, closeModalBtn, cancelModalBtn, saveRateBtn, modalTitle;
let rCompany, rCompanyNew, addNewCompanyBtn, rBase, rPerArticle, rTypePrice, rZonePrice;
let previewArticles, breakdownDetails;
let editingCompany = null;
let isAddingNewCompany = false;

function initRateCardPage() {
    debugLog('💳 Initializing Rate Card page...');
    
    // Get DOM elements
    tbody = document.getElementById("rateCardTableBody");
    openModalBtn = document.getElementById("openRateModal");
    rateModal = document.getElementById("rateModal");
    closeModalBtn = document.getElementById("closeRateModal");
    cancelModalBtn = document.getElementById("cancelRateModal");
    saveRateBtn = document.getElementById("saveRateCard");
    modalTitle = document.getElementById("rateModalTitle");
    
    rCompany = document.getElementById("rCompany");
    rCompanyNew = document.getElementById("rCompanyNew");
    addNewCompanyBtn = document.getElementById("addNewCompanyBtn");
    rPerArticle = document.getElementById("rPerArticle");
    
    // Calculation preview elements
    previewArticles = document.getElementById("previewArticles");
    breakdownDetails = document.getElementById("breakdownDetails");
    
    // Setup event listeners
    setupEventListeners();
    
    // Load data
    loadCompanies();
    loadRateCards();
}

function formatRs(v) {
    return "₹" + v.toString();
}

function renderRateCards() {
    if (!tbody) {
        debugError('tbody element not found');
        return;
    }

    debugLog('Rendering', rateCards.length, 'rate cards');

    tbody.innerHTML = rateCards.map(card => `
        <div class="rate-card-row">
            <div class="rate-card-col">${card.company}</div>
            <div class="rate-card-col">${formatRs(card.perArticle)}</div>
            <div class="rate-card-col">
                <button class="btn js-edit-rate" data-company="${card.company}" style="margin-right: 8px;">
                    <span class="material-symbols-outlined">edit</span>
                    Edit Rate Card
                </button>
                <button class="btn btn-outline btn-sm js-recalc-rate" data-company="${card.company}" data-id="${card.id}" title="Recalculate all bookings with current rate">
                    <span class="material-symbols-outlined" style="font-size: 16px;">calculate</span>
                    Recalculate Bookings
                </button>
            </div>
        </div>
    `).join("");
}

async function loadCompanies() {
    try {
        debugLog('🏢 Loading companies...');
        const response = await fetch(`${API_BASE_URL}/companies`);
        const result = await response.json();
        
        if (result.success) {
            companies = result.data;
            debugLog('✅ Loaded', companies.length, 'companies');
            
            // Populate company dropdown
            const companySelect = document.getElementById('rCompany');
            if (companySelect) {
                companySelect.innerHTML = '<option value="">Select a company...</option>' +
                    companies.map(company => 
                        `<option value="${company.id}" data-name="${company.name}">${company.name}</option>`
                    ).join('');
            }
        }
    } catch (error) {
        debugError('❌ Error loading companies:', error);
    }
}

async function loadRateCards() {
    try {
        debugLog('📋 Fetching rate cards from API...');
        const response = await fetch(`${API_BASE_URL}/ratecards`);
        const result = await response.json();
        
        debugLog('API Response:', result);
        
        if (result.success && result.data.length > 0) {
            // Transform API data to match our format
            rateCards = result.data.map(card => {
                // Parse parcel_type_charges JSON
                const parcelCharges = typeof card.parcel_type_charges === 'string' 
                    ? JSON.parse(card.parcel_type_charges) 
                    : card.parcel_type_charges;
                
                return {
                    id: card.id,
                    company: card.company?.name || 'Unknown',
                    company_id: card.company_id,
                    base: card.base_rate,
                    perArticle: card.per_article_rate,
                    parcelType: parcelCharges?.Standard || 0,
                    zoneRate: parcelCharges?.Express || 0,
                    updated: card.effective_from
                };
            });
            
            debugLog('✅ Loaded', rateCards.length, 'rate cards');
        } else {
            debugLog('⚠️ No rate cards found, using sample data');
            // Fallback to sample data
            rateCards = [
                { company: "TechCorp",      base: 500, perArticle: 15, parcelType: 25, zoneRate: 100, updated: "2024-12-01" },
                { company: "GlobalTrade",   base: 450, perArticle: 12, parcelType: 20, zoneRate:  90, updated: "2024-11-28" },
                { company: "FastShip",      base: 600, perArticle: 18, parcelType: 30, zoneRate: 120, updated: "2024-12-02" },
                { company: "QuickMove",     base: 550, perArticle: 16, parcelType: 28, zoneRate: 110, updated: "2024-11-30" },
                { company: "EasyLogistics", base: 480, perArticle: 14, parcelType: 22, zoneRate:  95, updated: "2024-12-03" }
            ];
        }
        
        renderRateCards();
    } catch (error) {
        debugError('❌ Error loading rate cards:', error);
        // Fallback to sample data
        rateCards = [
            { company: "TechCorp",      base: 500, perArticle: 15, parcelType: 25, zoneRate: 100, updated: "2024-12-01" },
            { company: "GlobalTrade",   base: 450, perArticle: 12, parcelType: 20, zoneRate:  90, updated: "2024-11-28" },
            { company: "FastShip",      base: 600, perArticle: 18, parcelType: 30, zoneRate: 120, updated: "2024-12-02" },
            { company: "QuickMove",     base: 550, perArticle: 16, parcelType: 28, zoneRate: 110, updated: "2024-11-30" },
            { company: "EasyLogistics", base: 480, perArticle: 14, parcelType: 22, zoneRate:  95, updated: "2024-12-03" }
        ];
        renderRateCards();
    }
}

function openModal(editCompanyName) {
    editingCompany = editCompanyName || null;
    isAddingNewCompany = false;

    if (editingCompany) {
        const card = rateCards.find(r => r.company === editingCompany);
        if (card) {
            modalTitle.textContent = `Edit Rate Card - ${card.company}`;
            
            // Find company in dropdown and select it
            const companyOption = Array.from(rCompany.options).find(option => 
                option.dataset.name === card.company
            );
            if (companyOption) {
                rCompany.value = companyOption.value;
            }
            
            rCompany.disabled = true;
            rCompany.style.backgroundColor = '#f3f4f6';
            addNewCompanyBtn.style.display = 'none';
            rPerArticle.value = card.perArticle;
        }
    } else {
        modalTitle.textContent = "Add New Rate Card";
        rCompany.value = "";
        rCompany.disabled = false;
        rCompany.style.backgroundColor = '';
        rCompany.style.display = 'block';
        rCompanyNew.style.display = 'none';
        rCompanyNew.value = '';
        addNewCompanyBtn.style.display = 'block';
        addNewCompanyBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px;">add</span>Add New Company';
        rPerArticle.value = "";
    }

    rateModal.style.display = "flex";
}

function closeModal() {
    rateModal.style.display = "none";
    editingCompany = null;
}

async function saveRateCard() {
    let companyId = null;
    let companyName = '';
    
    if (isAddingNewCompany) {
        companyName = rCompanyNew.value.trim();
        if (!companyName) {
            alert("Please enter a company name.");
            return;
        }
    } else {
        companyId = rCompany.value;
        const selectedOption = rCompany.options[rCompany.selectedIndex];
        companyName = selectedOption ? selectedOption.dataset.name : '';
        
        if (!companyId) {
            alert("Please select a company.");
            return;
        }
    }
    
    const perArt = parseInt(rPerArticle.value, 10) || 0;

    if (!perArt) {
        alert("Please enter Per Article Rate.");
        return;
    }

    try {
        // Disable save button to prevent double-clicks
        saveRateBtn.disabled = true;
        saveRateBtn.textContent = 'Saving...';

        const today = new Date().toISOString().split('T')[0];

        // Check if we're editing an existing rate card
        const existingCard = rateCards.find(r => r.company === companyName);

        let rateCardId = null;

        if (existingCard && existingCard.id) {
            // Update existing rate card
            debugLog('Updating rate card:', existingCard.id);
            
            const response = await fetch(`${API_BASE_URL}/ratecards/${existingCard.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    base_rate: 0,
                    per_article_rate: perArt,
                    parcel_type_charges: { Standard: 0, Express: 0 },
                    effective_from: today
                })
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to update rate card');
            }

            rateCardId = existingCard.id;
            debugLog('✅ Rate card updated successfully');
        } else {
            // Create new rate card
            debugLog('Creating new rate card for:', companyName);
            
            if (isAddingNewCompany) {
                // Create new company first
                debugLog('Creating new company:', companyName);
                
                const createCompanyResponse = await fetch(`${API_BASE_URL}/companies`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: companyName,
                        contact_person: 'Admin',
                        phone: '+91-0000000000',
                        email: `${companyName.toLowerCase().replace(/\s+/g, '')}@example.com`,
                        company_type: 'Corporate',
                        status: 'Active'
                    })
                });
                
                const createCompanyResult = await createCompanyResponse.json();
                
                if (!createCompanyResult.success) {
                    throw new Error('Failed to create company');
                }
                
                companyId = createCompanyResult.data.id;
                debugLog('Created new company:', companyId);
            }
            
            if (!companyId) {
                throw new Error('Could not find or create company');
            }
            
            // Now create the rate card
            const createRateCardResponse = await fetch(`${API_BASE_URL}/ratecards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    company_id: companyId,
                    base_rate: 0,
                    per_article_rate: perArt,
                    parcel_type_charges: { Standard: 0, Express: 0 },
                    effective_from: today
                })
            });
            
            const createRateCardResult = await createRateCardResponse.json();
            
            if (!createRateCardResult.success) {
                throw new Error(createRateCardResult.error || 'Failed to create rate card');
            }
            
            rateCardId = createRateCardResult.data.id;
            debugLog('✅ Rate card created successfully');
        }

        // Reload data from API
        await loadRateCards();
        closeModal();
        
        // Show success message and offer to recalculate existing bookings
        if (rateCardId && existingCard) {
            // For existing rate cards, check if there are bookings to update
            const shouldRecalculate = confirm(
                `Rate card updated successfully!\n\n` +
                `Do you want to recalculate all existing bookings for "${companyName}" ` +
                `with the new rate (₹${perArt}/article)?\n\n` +
                `This will update the pricing on all past bookings to reflect the new rate.`
            );
            
            if (shouldRecalculate) {
                await recalculateBookingsForRateCard(rateCardId, companyName);
            } else {
                alert('Rate card saved! New bookings will use the updated rate.');
            }
        } else {
            alert('Rate card saved successfully!');
        }
        
    } catch (error) {
        debugError('❌ Error saving rate card:', error);
        alert('Failed to save rate card: ' + error.message);
    } finally {
        saveRateBtn.disabled = false;
        saveRateBtn.textContent = 'Save Changes';
    }
}

// Recalculate all bookings for a rate card
async function recalculateBookingsForRateCard(rateCardId, companyName) {
    try {
        debugLog('🔄 Recalculating bookings for rate card:', rateCardId);
        
        const response = await fetch(`${API_BASE_URL}/ratecards/${rateCardId}/recalculate-bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const { updatedCount, totalBookings, newRate } = result.data;
            
            alert(
                `✅ Successfully updated ${updatedCount} of ${totalBookings} bookings!\n\n` +
                `Company: ${companyName}\n` +
                `New Rate: ₹${newRate}/article\n\n` +
                `Reports will now show the updated pricing for all bookings.`
            );
            
            debugLog('✅ Bookings recalculated:', result.data);
        } else {
            throw new Error(result.error || 'Failed to recalculate bookings');
        }
    } catch (error) {
        debugError('❌ Error recalculating bookings:', error);
        alert('Failed to recalculate bookings: ' + error.message);
    }
}

function exportRateCardsPDF() {
    const win = window.open("", "_blank", "width=1000,height=700");
    if (!win) {
        alert("Please allow pop-ups to export the PDF.");
        return;
    }

    const rowsHtml = rateCards.map(c => `
        <tr>
            <td>${c.company}</td>
            <td>${formatRs(c.base)}</td>
            <td>${formatRs(c.perArticle)}</td>
            <td>${formatRs(c.parcelType)}</td>
            <td>${formatRs(c.zoneRate)}</td>
            <td>${c.updated}</td>
        </tr>
    `).join("");

    win.document.write(`
        <html>
        <head>
            <title>Rate Card - HoraDel Transport</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 32px; color:#111827; }
                h1   { font-size: 20px; margin-bottom: 4px; }
                p    { font-size: 12px; color:#6b7280; margin-bottom: 16px; }
                table { width:100%; border-collapse:collapse; margin-top:16px; }
                th, td { border:1px solid #e5e7eb; padding:8px 10px; font-size:12px; text-align:left; }
                th { background:#f9fafb; }
            </style>
        </head>
        <body>
            <h1>Rate Card</h1>
            <p>Generated from HoraDel Admin Panel</p>

            <table>
                <thead>
                    <tr>
                        <th>Company Name</th>
                        <th>Base Rate</th>
                        <th>Per Article Rate</th>
                        <th>Parcel Type Extra</th>
                        <th>Zone/City Rate</th>
                        <th>Last Updated</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <script>
                window.onload = function () { window.print(); };
            <\/script>
        </body>
        </html>
    `);

    win.document.close();
}

function setupEventListeners() {
    // Open modal (Add)
    if (openModalBtn) {
        openModalBtn.addEventListener("click", () => openModal(null));
    }

    // Close modal buttons
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);

    // Save
    if (saveRateBtn) saveRateBtn.addEventListener("click", saveRateCard);

    // Calculation preview event listeners
    if (rPerArticle) {
        rPerArticle.addEventListener('input', updateCalculationPreview);
    }
    if (previewArticles) {
        previewArticles.addEventListener('input', updateCalculationPreview);
    }

    // Add new company button
    if (addNewCompanyBtn) {
        addNewCompanyBtn.addEventListener("click", () => {
            isAddingNewCompany = !isAddingNewCompany;
            
            if (isAddingNewCompany) {
                rCompany.style.display = 'none';
                rCompanyNew.style.display = 'block';
                addNewCompanyBtn.textContent = 'Select Existing Company';
                addNewCompanyBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px;">list</span>Select Existing Company';
            } else {
                rCompany.style.display = 'block';
                rCompanyNew.style.display = 'none';
                rCompanyNew.value = '';
                addNewCompanyBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px;">add</span>Add New Company';
            }
        });
    }

    // Edit buttons (event delegation)
    document.body.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".js-edit-rate");
        if (editBtn) {
            const company = editBtn.dataset.company;
            openModal(company);
            return;
        }
        
        const recalcBtn = e.target.closest(".js-recalc-rate");
        if (recalcBtn) {
            const company = recalcBtn.dataset.company;
            const rateCardId = recalcBtn.dataset.id;
            handleRecalculateBookings(rateCardId, company);
            return;
        }
    });

}

// Recalculate all bookings for a rate card
async function recalculateBookingsForRateCard(rateCardId, companyName) {
    try {
        debugLog('🔄 Recalculating bookings for rate card:', rateCardId);
        
        const response = await fetch(`${API_BASE_URL}/ratecards/${rateCardId}/recalculate-bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const { updatedCount, totalBookings, newRate } = result.data;
            
            alert(
                `✅ Successfully updated ${updatedCount} of ${totalBookings} bookings!\n\n` +
                `Company: ${companyName}\n` +
                `New Rate: ₹${newRate}/article\n\n` +
                `Reports will now show the updated pricing for all bookings.`
            );
            
            debugLog('✅ Bookings recalculated:', result.data);
        } else {
            throw new Error(result.error || 'Failed to recalculate bookings');
        }
    } catch (error) {
        debugError('❌ Error recalculating bookings:', error);
        alert('Failed to recalculate bookings: ' + error.message);
    }
}

// Handle manual recalculation request
async function handleRecalculateBookings(rateCardId, companyName) {
    if (!rateCardId) {
        alert('Rate card ID not found. Please refresh the page and try again.');
        return;
    }
    
    const card = rateCards.find(r => r.id == rateCardId);
    if (!card) {
        alert('Rate card not found. Please refresh the page and try again.');
        return;
    }
    
    const shouldRecalculate = confirm(
        `Recalculate all bookings for "${companyName}"?\n\n` +
        `This will update all existing bookings to use the current rate (₹${card.perArticle}/article).\n\n` +
        `The reports will then reflect the updated pricing.\n\n` +
        `Do you want to continue?`
    );
    
    if (shouldRecalculate) {
        await recalculateBookingsForRateCard(rateCardId, companyName);
    }
}

// Update calculation preview in real-time
function updateCalculationPreview() {
    if (!rPerArticle || !previewArticles || !breakdownDetails) return;
    
    const perArticleRate = parseFloat(rPerArticle.value) || 0;
    const articles = parseInt(previewArticles.value) || 0;
    
    if (perArticleRate === 0 || articles === 0) {
        breakdownDetails.innerHTML = 'Enter per article rate and articles to see calculation';
        return;
    }
    
    // Simple calculation: Articles × Rate = Total
    const totalAmount = articles * perArticleRate;
    
    // Debug logging
    debugLog('🧮 Rate Card Calculation Debug:', {
        articles: `${articles} (type: ${typeof articles})`,
        perArticleRate: `${perArticleRate} (type: ${typeof perArticleRate})`,
        calculation: `${articles} × ${perArticleRate} = ${totalAmount}`,
        totalAmount
    });
    
    // Format currency
    const formatCurrency = (amount) => `₹${amount.toLocaleString('en-IN')}`;
    
    // Update breakdown display with simple calculation
    breakdownDetails.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 12px;">
            <span style="font-size: 14px;">Articles × Rate:</span>
            <span style="font-weight: 600;">${articles} × ${formatCurrency(perArticleRate)}</span>
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px;">
                <span style="font-weight: 700; color: #111827; font-size: 16px;">Total Amount:</span>
                <span style="font-weight: 700; color: #16a34a; font-size: 18px;">${formatCurrency(totalAmount)}</span>
            </div>
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
            Debug: ${articles} × ${perArticleRate} = ${totalAmount}
        </div>
    `;
}
