const ADMIN_API = 'http://localhost:8085/admin';
let currentView = 'pending'; // 'pending', 'approved', or 'all'
let currentMainView = 'user-mgmt'; // 'user-mgmt' or 'turnover'

// ==================== USER MANAGEMENT FUNCTIONS ====================

async function loadPendingUsers() {
    try {
        const res = await fetch(`${ADMIN_API}/users`);
        let users = await res.json();

        // Apply status filter if needed
        const filterEl = document.getElementById('filter');
        const filter = filterEl ? filterEl.value : 'All';

        if (filter !== 'All') {
            users = users.filter(u => {
                return (u.approved === 0 && filter === 'Pending') ||
                       (u.approved === 1 && filter === 'Approved');
            });
        }

        const tbody = document.querySelector('#usersTable tbody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No pending accounts found</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${u.id}${u.name}</td>
              <td>${escapeHtml(u.name)}</td>
              <td>${escapeHtml(u.barangay)}</td>
              <td><span class="status-badge status-pending">Pending</span></td>
              <td>
                <select class="privilege-select" data-id="${u.id}">
                    <option value="">Regular Councilor</option>
                    <option value="CHAIRMAN">👑 Chairman</option>
                    <option value="TREASURER">💰 Treasurer</option>
                    <option value="ADMIN">⚙️ Admin</option>
                </select>
                <button class="btn-assign" onclick="assignPrivilege(${u.id}, '${escapeHtml(u.name)}')">Assign</button>
                </td>
              <td>
                <button class="btn-approve" onclick="approveUser(${u.id}, '${escapeHtml(u.name)}')">✔ Approve</button>
                <button class="btn-reject" onclick="rejectUser(${u.id}, '${escapeHtml(u.name)}')">✘ Reject</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = 'Pending accounts loaded.';
        
    } catch (err) {
        console.error('Error loading pending users:', err);
        Toast.show('Could not load pending users', true);
    }
}

async function loadApprovedUsers() {
    try {
        const response = await fetch(`${ADMIN_API}/councilors`);
        let councilors = await response.json();
        
        // Filter only approved councilors
        councilors = councilors.filter(c => c.approved === 1);
        
        // Apply barangay filter if selected
        const barangayFilter = document.getElementById('barangayFilter');
        const selectedBarangay = barangayFilter ? barangayFilter.value : '';
        
        if (selectedBarangay) {
            councilors = councilors.filter(c => c.barangay === selectedBarangay);
        }

        const tbody = document.querySelector('#usersTable tbody');
        if (!tbody) return;

        if (councilors.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-state">No approved councilors found</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        councilors.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${c.id}</td>
              <td>${escapeHtml(c.name)}</td>
              <td>${escapeHtml(c.barangay)}</td>
              <td>
                <select class="privilege-select" data-id="${c.id}">
                    <option value="" ${!c.privilege ? 'selected' : ''}>Regular Councilor</option>
                    <option value="CHAIRMAN" ${c.privilege === 'CHAIRMAN' ? 'selected' : ''}>👑 Chairman</option>
                    <option value="TREASURER" ${c.privilege === 'TREASURER' ? 'selected' : ''}>💰 Treasurer</option>
                    <option value="ADMIN" ${c.privilege === 'ADMIN' ? 'selected' : ''}>⚙️ Admin</option>
                </select>
                <button class="btn-assign" onclick="assignPrivilege(${c.id}, '${escapeHtml(c.name)}')">Assign</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = 'Approved councilors loaded.';
        
    } catch (error) {
        console.error('Error loading approved users:', error);
        Toast.show('Could not load approved councilors', true);
    }
}

async function loadAllUsers() {
    try {
        // Get pending users
        const pendingRes = await fetch(`${ADMIN_API}/users`);
        const pendingUsers = await pendingRes.json();
        
        // Get approved users
        const approvedRes = await fetch(`${ADMIN_API}/councilors`);
        let approvedUsers = await approvedRes.json();
        approvedUsers = approvedUsers.filter(c => c.approved === 1);
        
        // Combine and mark status
        const allUsers = [
            ...pendingUsers.map(u => ({ ...u, status: 'Pending' })),
            ...approvedUsers.map(c => ({ ...c, status: 'Approved', name: c.name, barangay: c.barangay, id: c.id }))
        ];
        
        // Apply barangay filter if in approved view context
        const barangayFilter = document.getElementById('barangayFilter');
        const selectedBarangay = barangayFilter ? barangayFilter.value : '';
        
        let filteredUsers = allUsers;
        if (selectedBarangay) {
            filteredUsers = allUsers.filter(u => u.barangay === selectedBarangay);
        }

        const tbody = document.querySelector('#usersTable tbody');
        if (!tbody) return;

        if (filteredUsers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No users found</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        filteredUsers.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${u.id}</td>
              <td>${escapeHtml(u.name)}</td>
              <td>${escapeHtml(u.barangay)}</td>
              <td><span class="status-badge status-${u.status.toLowerCase()}">${u.status}</span></td>
              <td>
                ${u.status === 'Approved' ? `
                    <select class="privilege-select" data-id="${u.id}">
                        <option value="">Regular Councilor</option>
                        <option value="CHAIRMAN">👑 Chairman</option>
                        <option value="TREASURER">💰 Treasurer</option>
                        <option value="ADMIN">⚙️ Admin</option>
                    </select>
                    <button class="btn-assign" onclick="assignPrivilege(${u.id}, '${escapeHtml(u.name)}')">Assign</button>
                ` : '—'}
                </td>
              <td>
                ${u.status === 'Pending' ? `
                    <button class="btn-approve" onclick="approveUser(${u.id}, '${escapeHtml(u.name)}')">✔ Approve</button>
                    <button class="btn-reject" onclick="rejectUser(${u.id}, '${escapeHtml(u.name)}')">✘ Reject</button>
                ` : '—'}
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error loading all users:', error);
        Toast.show('Could not load users', true);
    }
}

// Load barangays from Councilors table for filter
async function loadBarangayFilter() {
    try {
        const response = await fetch(`${ADMIN_API}/councilors`);
        const councilors = await response.json();
        
        // Get unique barangays from approved councilors
        const barangays = [...new Set(councilors.map(c => c.barangay))];
        
        const filterSelect = document.getElementById('barangayFilter');
        if (!filterSelect) return;
        
        filterSelect.innerHTML = '<option value="">All Barangays</option>';
        barangays.forEach(barangay => {
            if (barangay) {
                filterSelect.innerHTML += `<option value="${escapeHtml(barangay)}">${escapeHtml(barangay)}</option>`;
            }
        });
        
        console.log('Barangay filter loaded:', barangays.length, 'barangays');
        
    } catch (error) {
        console.error('Error loading barangay filter:', error);
    }
}

// Load barangays for turnover dropdown
async function loadTurnoverBarangays() {
    try {
        const response = await fetch(`${ADMIN_API}/councilors`);
        const councilors = await response.json();
        
        // Get unique barangays with data
        const barangays = [...new Set(councilors.map(c => c.barangay))];
        
        const select = document.getElementById('turnoverBarangay');
        if (!select) return;
        
        if (barangays.length === 0) {
            select.innerHTML = '<option value="">No barangays with data</option>';
            return;
        }
        
        select.innerHTML = '<option value="">Select barangay...</option>';
        barangays.forEach(barangay => {
            if (barangay) {
                select.innerHTML += `<option value="${escapeHtml(barangay)}">${escapeHtml(barangay)}</option>`;
            }
        });
        
        // Add change event listener
        select.removeEventListener('change', onBarangaySelected);
        select.addEventListener('change', onBarangaySelected);
        
        console.log('Turnover barangays loaded:', barangays.length, 'barangays');
        
    } catch (error) {
        console.error('Error loading turnover barangays:', error);
        Toast.show('Could not load barangays', true);
    }
}

// Handle barangay selection for turnover
async function onBarangaySelected() {
    const select = document.getElementById('turnoverBarangay');
    const barangay = select.value;
    const turnoverBtn = document.getElementById('turnoverBtn');
    const statusDiv = document.getElementById('turnoverStatus');
    
    if (!barangay) {
        statusDiv.style.display = 'none';
        turnoverBtn.disabled = true;
        return;
    }
    
    try {
        const response = await fetch(`${ADMIN_API}/turnover/status/${encodeURIComponent(barangay)}`);
        const status = await response.json();
        
        document.getElementById('statusCouncilors').textContent = status.activeCouncilors || 0;
        document.getElementById('statusCommittees').textContent = status.activeCommittees || 0;
        document.getElementById('statusProjects').textContent = status.activeProjects || 0;
        
        statusDiv.style.display = 'block';
        turnoverBtn.disabled = false;
        
    } catch (error) {
        console.error('Error loading turnover status:', error);
        Toast.show('Could not load barangay status', true);
    }
}

// Perform turnover
async function performTurnover() {
    const select = document.getElementById('turnoverBarangay');
    const barangay = select.value;
    
    if (!barangay) {
        Toast.show('Please select a barangay', true);
        return;
    }
    
    const statusCouncilors = document.getElementById('statusCouncilors').textContent;
    
    const confirmMessage = `⚠️ PERMANENT ACTION ⚠️\n\n` +
        `You are about to clear ALL data for ${barangay}:\n` +
        `• ${statusCouncilors} councilor(s)\n` +
        `• Committees, projects, expenses, and budgets\n\n` +
        `This action CANNOT be undone!\n\n` +
        `Type "${barangay}" to confirm:`;
    
    const confirmation = prompt(confirmMessage);
    
    if (confirmation !== barangay) {
        Toast.show('Turnover cancelled - confirmation did not match', true);
        return;
    }
    
    const finalConfirm = confirm(`Are you ABSOLUTELY sure? This will permanently delete all ${barangay} SK data.`);
    if (!finalConfirm) return;
    
    const turnoverBtn = document.getElementById('turnoverBtn');
    const resultDiv = document.getElementById('turnoverResult');
    
    turnoverBtn.disabled = true;
    turnoverBtn.textContent = '⏳ Processing turnover...';
    
    try {
        const response = await fetch(`${ADMIN_API}/turnover/${encodeURIComponent(barangay)}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.status === 'SUCCESS') {
            resultDiv.style.display = 'block';
            resultDiv.className = 'turnover-result success';
            resultDiv.innerHTML = `
                <strong>✅ Turnover Complete for ${result.barangay}!</strong>
                <div class="statistics">
                    <div>📊 Statistics:</div>
                    <ul>
                        <li>Councilors cleared: ${result.statistics.councilorsCleared}</li>
                        <li>Committees cleared: ${result.statistics.committeesCleared}</li>
                        <li>Projects cleared: ${result.statistics.projectsCleared}</li>
                        <li>Expenses cleared: ${result.statistics.expensesCleared}</li>
                        <li>Members cleared: ${result.statistics.membersCleared}</li>
                    </ul>
                </div>
            `;
            Toast.show(`Turnover completed for ${barangay}!`);
            
            // Refresh all data
            loadStats();
            loadBarangayFilter();
            loadTurnoverBarangays();
            if (currentView === 'approved') {
                loadApprovedUsers();
            } else if (currentView === 'pending') {
                loadPendingUsers();
            } else {
                loadAllUsers();
            }
            
            // Reset form
            select.value = '';
            document.getElementById('turnoverStatus').style.display = 'none';
            
        } else {
            throw new Error(result.message || 'Turnover failed');
        }
        
    } catch (error) {
        console.error('Error performing turnover:', error);
        resultDiv.style.display = 'block';
        resultDiv.className = 'turnover-result error';
        resultDiv.innerHTML = `<strong>❌ Turnover Failed:</strong> ${error.message}`;
        Toast.show('Turnover failed: ' + error.message, true);
        
    } finally {
        turnoverBtn.disabled = false;
        turnoverBtn.textContent = '🔄 Perform Turnover';
    }
}

// Update table headers based on view
function updateTableHeaders(view) {
    const thead = document.querySelector('#usersTable thead');
    if (!thead) return;
    
    if (view === 'pending') {
        thead.innerHTML = `
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Barangay</th>
                <th>Status</th>
                <th>Privileges</th>
                <th>Actions</th>
            </tr>
        `;
    } else if (view === 'approved') {
        thead.innerHTML = `
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Barangay</th>
                <th>Privileges</th>
            </tr>
        `;
    } else {
        thead.innerHTML = `
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Barangay</th>
                <th>Status</th>
                <th>Privileges</th>
                <th>Actions</th>
            </tr>
        `;
    }
}

function switchView(view) {
    currentView = view;
    
    const pendingTab = document.getElementById('tab-pending');
    const approvedTab = document.getElementById('tab-approved');
    const allTab = document.getElementById('tab-all');
    const filterContainer = document.getElementById('filterContainer');
    const filterSelect = document.getElementById('filter');
    
    // Update tab active states
    if (pendingTab) pendingTab.classList.toggle('active', view === 'pending');
    if (approvedTab) approvedTab.classList.toggle('active', view === 'approved');
    if (allTab) allTab.classList.toggle('active', view === 'all');
    
    if (view === 'pending') {
        if (filterContainer) filterContainer.style.display = 'none';
        if (filterSelect) filterSelect.style.display = 'block';
        loadPendingUsers();
        updateTableHeaders('pending');
        
    } else if (view === 'approved') {
        if (filterContainer) filterContainer.style.display = 'flex';
        if (filterSelect) filterSelect.style.display = 'block';
        loadApprovedUsers();
        updateTableHeaders('approved');
        
    } else {
        if (filterContainer) filterContainer.style.display = 'flex';
        if (filterSelect) filterSelect.style.display = 'none';
        loadAllUsers();
        updateTableHeaders('all');
    }
}

async function loadStats() {
    try {
        const pendingRes = await fetch(`${ADMIN_API}/users`);
        const pendingUsers = await pendingRes.json();
        
        const councilorsRes = await fetch(`${ADMIN_API}/councilors`);
        const councilors = await councilorsRes.json();
        
        const pendingCount = document.getElementById('admin-stat-pending');
        const approvedCount = document.getElementById('admin-stat-approved');
        const totalCount = document.getElementById('admin-stat-total');
        
        if (pendingCount) pendingCount.textContent = pendingUsers.length;
        if (approvedCount) approvedCount.textContent = councilors.filter(c => c.approved === 1).length;
        if (totalCount) totalCount.textContent = councilors.length;
        
        const pendingBadge = document.getElementById('admin-pending-badge');
        if (pendingBadge) pendingBadge.textContent = pendingUsers.length;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function approveUser(id, name) {
    try {
        const response = await fetch(`${ADMIN_API}/users/${id}/approve`, { method: 'POST' });
        if (response.ok) {
            Toast.show(`${name} has been approved`);
            loadPendingUsers();
            loadApprovedUsers();
            loadStats();
            loadBarangayFilter();
        } else {
            Toast.show(`Error approving ${name}`, true);
        }
    } catch (err) {
        console.error('Error approving user:', err);
        Toast.show('Error approving user', true);
    }
}

async function rejectUser(id, name) {
    try {
        const response = await fetch(`${ADMIN_API}/users/${id}/reject`, { method: 'POST' });
        if (response.ok) {
            Toast.show(`${name} has been rejected.`);
            loadPendingUsers();
            loadStats();
        } else {
            Toast.show(`Error rejecting ${name}`, true);
        }
    } catch (err) {
        console.error('Error rejecting user:', err);
        Toast.show("Error rejecting user", true);
    }
}

async function assignPrivilege(councilorId, councilorName) {
    const select = document.querySelector(`.privilege-select[data-id="${councilorId}"]`);
    if (!select) return;

    const privilege = select.value;
    const privilegeName = privilege === 'CHAIRMAN' ? 'Chairman' : 
                         privilege === 'TREASURER' ? 'Treasurer' : 
                         privilege === 'ADMIN' ? 'Admin' : 'Regular Councilor';
    
    const message = privilege ?
        `Assign ${privilegeName} privilege to ${councilorName}?` :
        `Remove privilege from ${councilorName}? They will become a regular councilor.`;
    
    if (!confirm(message)) return;
    
    try {
        const response = await fetch(`${ADMIN_API}/councilors/${councilorId}/privilege`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({ privilege: privilege})
        });

        const result = await response.text();

        if (result === 'SUCCESS') {
            Toast.show(`Privilege updated for ${councilorName}!`);
            if (currentView === 'approved') {
                loadApprovedUsers();
            } else if (currentView === 'all') {
                loadAllUsers();
            }
            loadStats();
        } else {
            Toast.show('Error updating privilege', true);
        }
    } catch (error) {
        console.error('Error assigning privilege:', error);
        Toast.show('Could not update privilege', true);
    }
}

// ==================== MAIN NAVIGATION ====================

function switchMainSection(section) {
    currentMainView = section;
    
    const userMgmtSection = document.getElementById('userMgmtSection');
    const turnoverSection = document.getElementById('turnoverSection');
    const navUserMgmt = document.getElementById('nav-user-mgmt');
    const navTurnover = document.getElementById('nav-turnover');
    const mainTitle = document.getElementById('main-title');
    const mainSubtitle = document.getElementById('main-subtitle');
    
    if (section === 'user-mgmt') {
        if (userMgmtSection) userMgmtSection.style.display = 'block';
        if (turnoverSection) turnoverSection.style.display = 'none';
        if (navUserMgmt) navUserMgmt.classList.add('active');
        if (navTurnover) navTurnover.classList.remove('active');
        if (mainTitle) mainTitle.textContent = 'User Management';
        if (mainSubtitle) mainSubtitle.textContent = 'Review and approve SK councilor registration requests.';
        
        // Refresh user management data
        loadStats();
        loadBarangayFilter();
        if (currentView === 'pending') {
            loadPendingUsers();
        } else if (currentView === 'approved') {
            loadApprovedUsers();
        } else {
            loadAllUsers();
        }
        
    } else {
        if (userMgmtSection) userMgmtSection.style.display = 'none';
        if (turnoverSection) turnoverSection.style.display = 'block';
        if (navTurnover) navTurnover.classList.add('active');
        if (navUserMgmt) navUserMgmt.classList.remove('active');
        if (mainTitle) mainTitle.textContent = 'Turnover Tool';
        if (mainSubtitle) mainSubtitle.textContent = 'Clear barangay data after elections.';
        
        // Refresh turnover data
        loadTurnoverBarangays();
    }
}

// ==================== INITIALIZATION ====================

function init() {
    // Main navigation
    const navUserMgmt = document.getElementById('nav-user-mgmt');
    const navTurnover = document.getElementById('nav-turnover');
    
    if (navUserMgmt) navUserMgmt.addEventListener('click', () => switchMainSection('user-mgmt'));
    if (navTurnover) navTurnover.addEventListener('click', () => switchMainSection('turnover'));
    
    // Tab buttons for user management
    const pendingTab = document.getElementById('tab-pending');
    const approvedTab = document.getElementById('tab-approved');
    const allTab = document.getElementById('tab-all');
    
    if (pendingTab) pendingTab.addEventListener('click', () => switchView('pending'));
    if (approvedTab) approvedTab.addEventListener('click', () => switchView('approved'));
    if (allTab) allTab.addEventListener('click', () => switchView('all'));
    
    // Barangay filter
    const barangayFilter = document.getElementById('barangayFilter');
    if (barangayFilter) barangayFilter.addEventListener('change', () => {
        if (currentView === 'approved') {
            loadApprovedUsers();
        } else if (currentView === 'all') {
            loadAllUsers();
        }
    });
    
    // Status filter
    const filterEl = document.getElementById('filter');
    if (filterEl) filterEl.addEventListener('change', () => {
        if (currentView === 'pending') {
            loadPendingUsers();
        }
    });
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => {
        if (currentMainView === 'user-mgmt') {
            loadStats();
            loadBarangayFilter();
            if (currentView === 'pending') {
                loadPendingUsers();
            } else if (currentView === 'approved') {
                loadApprovedUsers();
            } else {
                loadAllUsers();
            }
        } else {
            loadTurnoverBarangays();
        }
        Toast.show('Refreshed!');
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '../Log-in/login.html';
    });
    
    // Turnover button
    const turnoverBtn = document.getElementById('turnoverBtn');
    if (turnoverBtn) turnoverBtn.addEventListener('click', performTurnover);
    
    // Initial load - start with user management
    loadStats();
    loadBarangayFilter();
    switchView('pending');
    switchMainSection('user-mgmt');
}

// Helper function
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Make functions global for onclick handlers
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.assignPrivilege = assignPrivilege;
window.switchView = switchView;
window.switchMainSection = switchMainSection;

// Start the app
init();