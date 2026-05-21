// Get user role from localStorage
const userPrivilege = localStorage.getItem('sk_privilege') || '';
const userBarangay = localStorage.getItem('sk_barangay') || '';

// Show appropriate view based on role
function showRoleView() {
    const privilege = localStorage.getItem('sk_privilege') || '';
    const userType = localStorage.getItem('sk_user_type') || '';
    
    const isAdminOrDeveloper = privilege === 'ADMIN' || userType === 'developer';
    const isChairman = privilege === 'CHAIRMAN';
    const isTreasurer = privilege === 'TREASURER';
    
    // Hide/show elements based on role - ALWAYS check if element exists first
    
    // Hide/show create committee button (for Chairman or Admin)
    const createCommitteeBtn = document.getElementById('createCommitteeBtn');
    if (createCommitteeBtn) {
        createCommitteeBtn.style.display = (isChairman || isAdminOrDeveloper) ? 'flex' : 'none';
    }
    
    // Hide/show add project button (for Councilors)
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
        addProjectBtn.style.display = (isChairman || isAdminOrDeveloper) ? 'flex' : 'none';
    }
    
    // Budget section - only show for Treasurer or Admin
    const budgetSection = document.getElementById('treasurerBudgetSection');
    if (budgetSection) {
        budgetSection.style.display = (isTreasurer || isAdminOrDeveloper) ? 'block' : 'none';
    }
    
    // Edit budget buttons
    const editBudgetBtns = document.querySelectorAll('.edit-budget-btn');
    editBudgetBtns.forEach(btn => {
        if (btn) {
            btn.style.display = (isTreasurer || isAdminOrDeveloper) ? 'inline-flex' : 'none';
        }
    });
    
    // Approve/reject buttons (only for Chairman/Admin)
    const approveBtns = document.querySelectorAll('.approve-btn, .reject-btn');
    approveBtns.forEach(btn => {
        if (btn) {
            btn.style.display = (isChairman || isAdminOrDeveloper) ? 'inline-flex' : 'none';
        }
    });
    
    console.log('Role view updated:', { isAdminOrDeveloper, isChairman, isTreasurer });
}

// ==================== COUNCILOR VIEW ====================
async function loadCouncilorDashboard() {
  await loadRecentProjects();
  await loadBudgetPanel();
  await loadQuickStats();
}

async function loadRecentProjects() {
  try {
    const response = await fetch(`/api/getProjectsByCouncilor?councilor=${encodeURIComponent(localStorage.getItem('sk_name'))}&barangay=${encodeURIComponent(userBarangay)}`, {
      credentials: 'include'
    });
    const projects = await response.json();
    const recent = projects.slice(0, 5);
    
    const container = document.getElementById('recent-projects');
    if (recent.length === 0) {
      container.innerHTML = '<div class="empty-state">No projects yet.</div>';
      return;
    }
    
    container.innerHTML = recent.map(p => `
      <div class="project-item">
        <div class="project-name">${escapeHtml(p.projectName)}</div>
        <div class="project-status status-${p.status}">${p.status}</div>
        <div class="project-cost">₱${(p.totalCost || 0).toLocaleString()}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading recent projects:', error);
  }
}

async function loadBudgetPanel() {
    try {
        const response = await fetch(`/api/getBudget?barangay=${encodeURIComponent(userBarangay)}`, {
            credentials: 'include'
        });
        const text = await response.text();
        
        // Check if response is ERROR or empty
        if (text === 'ERROR' || !text) {
            document.getElementById('budget-panel').innerHTML = '<div class="empty-state">No budget data available.</div>';
            return;
        }
        
        // Parse JSON safely
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('Failed to parse budget response:', text);
            document.getElementById('budget-panel').innerHTML = '<div class="empty-state">Error loading budget data.</div>';
            return;
        }
        
        const committees = data.committees || [];
        const container = document.getElementById('budget-panel');
        
        if (committees.length === 0) {
            container.innerHTML = '<div class="empty-state">No budget data available.</div>';
            return;
        }
        
        container.innerHTML = committees.map(c => `
            <div class="budget-item">
                <div class="budget-name">${escapeHtml(c.committeeName)}</div>
                <div class="budget-bar-container">
                    <div class="budget-bar" style="width: ${c.allocated > 0 ? (c.spent / c.allocated * 100) : 0}%"></div>
                </div>
                <div class="budget-numbers">
                    <span>₱${(c.spent || 0).toLocaleString()} / ₱${(c.allocated || 0).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading budget panel:', error);
        document.getElementById('budget-panel').innerHTML = '<div class="empty-state">Error loading budget data.</div>';
    }
}

async function loadQuickStats() {
  try {
    const response = await fetch(`/api/getProjectsByCouncilor?councilor=${encodeURIComponent(localStorage.getItem('sk_name'))}&barangay=${encodeURIComponent(userBarangay)}`, {
      credentials: 'include'
    });
    const projects = await response.json();
    
    const total = projects.length;
    const pending = projects.filter(p => p.status === 'PENDING').length;
    const approved = projects.filter(p => p.status === 'APPROVED').length;
    
    document.getElementById('qs-total').textContent = total;
    document.getElementById('qs-pending').textContent = pending;
    document.getElementById('qs-approved').textContent = approved;
  } catch (error) {
    console.error('Error loading quick stats:', error);
  }
}

// ==================== TREASURER VIEW ====================
async function loadTreasurerDashboard() {
  await loadBudgetOverview();  // Main budget card
  await loadCommitteeBudgetTable(); // Keep the table
  await loadRecentExpenditures();
}

// Main budget card - simplified (only total budget and progress)
async function loadBudgetOverview() {
  try {
    const response = await fetch(`/api/getBudget?barangay=${encodeURIComponent(userBarangay)}`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    const budgetCard = document.getElementById('budgetOverviewCard');
    if (!budgetCard) return;
    
    const totalBudget = data.totalBudget || 0;
    const committees = data.committees || [];
    const totalSpent = committees.reduce((sum, c) => sum + (c.spent || 0), 0);
    const remaining = totalBudget - totalSpent;
    const percentageSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    if (totalBudget === 0 && committees.length === 0) {
      budgetCard.innerHTML = `
        <div style="color:var(--muted);font-size:0.85rem; text-align: center; padding: 1rem;">
          No budget has been set yet. 
          <button class="btn btn-link" onclick="window.location.href='/Councilor/Budget/Budget.html'">Set Budget</button>
        </div>
      `;
      return;
    }
    
    budgetCard.innerHTML = `
      <div class="budget-top">
        <div>
          <div class="budget-total-label">Total SK Budget</div>
          <div class="budget-total-value">
            ₱${totalBudget.toLocaleString('en-PH')}
          </div>
        </div>
        <div class="budget-meta">
          Spent: ₱${totalSpent.toLocaleString('en-PH')}<br>
          Remaining: ₱${remaining.toLocaleString('en-PH')}
        </div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${Math.min(percentageSpent, 100)}%"></div>
      </div>
      <div class="budget-percentage">${percentageSpent.toFixed(1)}% utilized</div>
    `;
    
  } catch (error) {
    console.error('Error loading budget overview:', error);
    const budgetCard = document.getElementById('budgetOverviewCard');
    if (budgetCard) {
      budgetCard.innerHTML = `
        <div style="color:var(--muted);font-size:0.85rem; text-align: center; padding: 1rem;">
          Could not load budget data.
        </div>
      `;
    }
  }
}

// Committee Budget Table - keep this (replaces the redundant charts)
async function loadCommitteeBudgetTable() {
  try {
    const response = await fetch(`/api/getBudget?barangay=${encodeURIComponent(userBarangay)}`, {
      credentials: 'include'
    });
    const data = await response.json();
    const committees = data.committees || [];
    
    const container = document.getElementById('committeeBudgetTable');
    if (!container) return;
    
    if (committees.length === 0) {
      container.innerHTML = '<div class="empty-state">No committee budget data available.</div>';
      return;
    }
    
    // Use a table format instead of individual cards
    container.innerHTML = `
      <div class="table-container">
        <table class="budget-table">
          <thead>
            <tr>
              <th>Committee</th>
              <th>Allocated Budget</th>
              <th>Spent</th>
              <th>Remaining</th>
              <th>Utilization</th>
            </tr>
          </thead>
          <tbody>
            ${committees.map(c => {
              const allocated = c.allocated || 0;
              const spent = c.spent || 0;
              const remaining = allocated - spent;
              const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
              return `
                <tr>
                  <td class="committee-name">${escapeHtml(c.committeeName)}</td>
                  <td>₱${allocated.toLocaleString('en-PH')}</td>
                  <td>₱${spent.toLocaleString('en-PH')}</td>
                  <td class="${remaining < 0 ? 'negative' : ''}">₱${remaining.toLocaleString('en-PH')}</td>
                  <td>
                    <div class="progress-track small">
                      <div class="progress-fill ${percentage > 100 ? 'over' : ''}" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <span class="percentage-text">${percentage.toFixed(1)}%</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="text-align: right; margin-top: 1rem;">
        <button class="btn btn-outline" onclick="window.location.href='/Councilor/Budget/Budget.html'">Manage Budget →</button>
      </div>
    `;
    
  } catch (error) {
    console.error('Error loading committee budget table:', error);
    const container = document.getElementById('committeeBudgetTable');
    if (container) {
      container.innerHTML = '<div class="empty-state">Could not load budget data.</div>';
    }
  }
}

async function loadRecentExpenditures() {
  try {
    const response = await fetch(`/api/getRecentExpenditures?barangay=${encodeURIComponent(userBarangay)}&limit=5`, {
      credentials: 'include'
    });
    const expenditures = await response.json();
    
    const container = document.getElementById('recentExpensesBody');
    if (expenditures.length === 0) {
      container.innerHTML = '<tr><td colspan="4" class="empty-state">No recent expenditures.</td></tr>';
      return;
    }
    
    container.innerHTML = expenditures.map(e => `
      <tr>
        <td>${escapeHtml(e.projectName)}</td>
        <td>${escapeHtml(e.committeeName)}</td>
        <td class="exp-amount">₱${(e.totalCost || 0).toLocaleString()}</td>
        <td>${formatDate(e.approvedAt)}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading recent expenditures:', error);
  }
}

// ==================== CHAIRMAN VIEW ====================
async function loadChairmanDashboard() {
  await loadChairmanStats();
  await loadCommitteesList();  
  await loadCommitteesTable(); 
}

async function loadCommitteesList() {
  try {
    const response = await fetch(`/api/getCommittees?barangay=${encodeURIComponent(userBarangay)}`, {
      credentials: 'include'
    });
    const committees = await response.json();
    window.allCommittees = committees;  // Store globally
    console.log('Committees loaded:', committees);
  } catch (error) {
    console.error('Error loading committees:', error);
    window.allCommittees = [];
  }
}

async function loadChairmanStats() {
  try {
    const response = await fetch(`/api/getAllProjects?barangay=${encodeURIComponent(userBarangay)}`, {
      credentials: 'include'
    });
    const projects = await response.json();
    
    const total = projects.length;
    const pending = projects.filter(p => p.status === 'PENDING').length;
    const approved = projects.filter(p => p.status === 'APPROVED').length;
    const rejected = projects.filter(p => p.status === 'REJECTED').length;
    
    document.getElementById('chairman-total-projects').textContent = total;
    document.getElementById('chairman-pending-projects').textContent = pending;
    document.getElementById('chairman-approved-projects').textContent = approved;
    document.getElementById('chairman-rejected-projects').textContent = rejected;
  } catch (error) {
    console.error('Error loading chairman stats:', error);
  }
}

async function loadCommitteesTable() {
  const tbody = document.getElementById('committeesTableBody');  // ← Changed from 'projectTableBody'
  if (!tbody) {
    console.error('committeesTableBody not found!');
    return;
  }

  const committees = window.allCommittees || [];
  console.log('Committees for table:', committees);

  if (!Array.isArray(committees) || committees.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">No committees found.</td>
      </tr>
    `;
    return;
  }

  const userPrivilege = localStorage.getItem('sk_privilege') || '';
  const isChairman = userPrivilege === 'CHAIRMAN';

  tbody.innerHTML = committees.map((c, i) => `
    <tr style="animation-delay:${i * 0.05}s">
      <td class="project-name-cell">${escapeHtml(c.committeeName)}</td>
      <td>${c.headName ? escapeHtml(c.headName) : '<span style="color:var(--muted)">Not assigned</span>'}</td>
      <td class="pending-count">—</td>
      <td class="approved-count">—</td>
      <td>—</td>
      <td>—</td>
      <td>—</td>
    </tr>
  `).join('');
  
  console.log('Table rendered with', committees.length, 'committees');
}

async function deleteCommittee(committeeName) {
  // Confirmation dialog
  const confirmMessage = `⚠️ PERMANENT ACTION ⚠️\n\n` +
    `You are about to delete the committee "${committeeName}".\n\n` +
    `This will also delete:\n` +
    `• All committee members\n` +
    `• All projects (both PENDING and APPROVED)\n` +
    `• Committee budget allocations\n\n` +
    `This action CANNOT be undone!\n\n` +
    `Type "${committeeName}" to confirm:`;
  
  const confirmation = prompt(confirmMessage);
  
  if (confirmation !== committeeName) {
    Toast.show('Committee deletion cancelled - confirmation did not match', true);
    return;
  }
  
  const finalConfirm = confirm(`Are you ABSOLUTELY sure? This will permanently delete all data for committee "${committeeName}".`);
  if (!finalConfirm) return;
  
  try {
    const response = await fetch(`${API}/deleteCommittee`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        committeeName: committeeName,
        barangay: session.barangay
      })
    });
    
    const result = await response.text();
    
    if (result === 'SUCCESS') {
      Toast.show(`Committee "${committeeName}" has been deleted successfully.`);
      // Refresh all data
      await loadAllCommittees();
      await loadMyCommittees();
      await loadCommitteesTable();
      await loadBudget();
    } else if (result === 'COMMITTEE_NOT_FOUND') {
      Toast.show('Committee not found', true);
    } else if (result === 'NOT_AUTHORIZED') {
      Toast.show('You are not authorized to delete committees', true);
    } else {
      Toast.show('Error deleting committee: ' + result, true);
    }
  } catch (error) {
    console.error('Error deleting committee:', error);
    Toast.show('Could not delete committee', true);
  }
}

// Helper functions
function formatDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('en-PH', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch { return str; }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('sk_name')) {
    window.location.href = '/Councilor/Log-in/Login';
    return;
  }
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    Session.clear();
    window.location.href = '/Councilor/Log-in/Login';
    return;
  }
  const nameEl = document.getElementById('nameEl');
  const roleEl = document.getElementById('roleEl');
  const avatarEl = document.getElementById('avatarEl');
  
  if (nameEl) nameEl.textContent = localStorage.getItem('sk_name');
  if (roleEl) roleEl.textContent = userPrivilege || 'Councilor';
  if (avatarEl) avatarEl.textContent = (localStorage.getItem('sk_name') || '?').charAt(0).toUpperCase();
  const greetingName = localStorage.getItem('sk_name');
  const greetNameEl = document.getElementById('dash-greet-name');
  if (greetNameEl && greetingName) {
    greetNameEl.textContent = greetingName.split(' ')[0];
  }
  const today = new Date();
  const dateEl = document.getElementById('dash-today');
  if (dateEl) {
    dateEl.textContent = today.toLocaleDateString('en-PH', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  
  showRoleView();
});