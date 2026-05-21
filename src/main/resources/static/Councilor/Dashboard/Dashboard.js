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
    
    // Show/hide main role views
    const councilorView = document.getElementById('councilorView');
    const treasurerView = document.getElementById('treasurerView');
    const chairmanView = document.getElementById('chairmanView');
    
    if (councilorView) councilorView.style.display = (!isChairman && !isTreasurer && !isAdminOrDeveloper) ? 'block' : 'none';
    if (treasurerView) treasurerView.style.display = (isTreasurer || isAdminOrDeveloper) ? 'block' : 'none';
    if (chairmanView) chairmanView.style.display = (isChairman || isAdminOrDeveloper) ? 'block' : 'none';
    
    // Load the appropriate dashboard data
    if (isTreasurer || isAdminOrDeveloper) {
        loadTreasurerDashboard();
    } else if (isChairman) {
        loadChairmanDashboard();
    } else {
        loadCouncilorDashboard();
    }
    
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
    const response = await authFetch(`/getProjectsByCouncilor?councilor=${encodeURIComponent(localStorage.getItem('sk_name'))}&barangay=${encodeURIComponent(userBarangay)}`);
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
        const response = await authFetch(`/getBudget?barangay=${encodeURIComponent(userBarangay)}`);
        const text = await response.text();
        
        if (text === 'ERROR' || !text) {
            document.getElementById('budget-panel').innerHTML = '<div class="empty-state">No budget data available.</div>';
            return;
        }
        
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
    const response = await authFetch(`/getProjectsByCouncilor?councilor=${encodeURIComponent(localStorage.getItem('sk_name'))}&barangay=${encodeURIComponent(userBarangay)}`);
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
  await loadExpenditureBar();
  await loadCommitteeCharts();
  await loadRecentExpenditures();
  await loadTreasurerBudget();
}

async function loadExpenditureBar() {
  try {
    const response = await authFetch(`/getBudget?barangay=${encodeURIComponent(userBarangay)}`);
    const data = await response.json();
    
    const totalBudget = data.totalBudget || 0;
    const committees = data.committees || [];
    const totalSpent = committees.reduce((sum, c) => sum + (c.spent || 0), 0);
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;
    
    const barEl = document.getElementById('expenditureBar');
    if (barEl) barEl.style.width = `${Math.min(percentage, 100)}%`;
    const spentEl = document.getElementById('totalSpent');
    if (spentEl) spentEl.textContent = `₱${totalSpent.toLocaleString()}`;
    const remainingEl = document.getElementById('totalRemaining');
    if (remainingEl) remainingEl.textContent = `₱${(totalBudget - totalSpent).toLocaleString()}`;
    const percentEl = document.getElementById('expenditurePercent');
    if (percentEl) percentEl.textContent = `${percentage.toFixed(1)}%`;
  } catch (error) {
    console.error('Error loading expenditure bar:', error);
  }
}

async function loadTreasurerBudget() {
    try {
        const barangay = Session.barangay;
        if (!barangay) return;
        
        const response = await authFetch(`/getBudget?barangay=${encodeURIComponent(barangay)}`);
        const data = await response.json();
        console.log('Budget data for Treasurer:', data);
        
        const budgetCard = document.getElementById('budgetCard');
        if (!budgetCard) return;
        
        const totalBudget = data.totalBudget || 0;
        const committees = data.committees || [];
        const totalSpent = committees.reduce((sum, c) => sum + (c.spent || 0), 0);
        const remaining = totalBudget - totalSpent;
        
        if (totalBudget === 0 && committees.length === 0) {
            budgetCard.innerHTML = `
                <div style="color:var(--muted);font-size:0.85rem; text-align: center; padding: 1rem;">
                    No budget has been set yet. Click "Set Budget" to get started.
                </div>
                <div style="text-align: center; margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="openBudgetModal()">Set Budget</button>
                </div>
            `;
            return;
        }
        
        const percentageSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        
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
            
            <div class="committee-rows" style="margin-top: 1.5rem;">
                <div class="section-heading" style="margin-bottom: 0.75rem;">Committee Allocations</div>
                ${committees.length === 0 ? 
                    '<div style="color:var(--muted);font-size:0.82rem">No committee allocations yet.</div>' : 
                    committees.map(c => {
                        const pct = c.allocated > 0 ? Math.min((c.spent / c.allocated) * 100, 100) : 0;
                        const over = c.spent > c.allocated;
                        return `
                            <div class="committee-row">
                                <div class="committee-row-header">
                                    <span class="committee-row-name">${escapeHtml(c.committeeName)}</span>
                                    <span class="committee-row-amounts">
                                        ₱${(c.spent || 0).toLocaleString('en-PH')} /
                                        ₱${(c.allocated || 0).toLocaleString('en-PH')}
                                    </span>
                                </div>
                                <div class="progress-track">
                                    <div class="progress-fill ${over ? 'over' : ''}" style="width: ${pct}%"></div>
                                </div>
                            </div>
                        `;
                    }).join('')
                }
            </div>
            
            <div style="margin-top: 1.5rem; text-align: right;">
                <button class="btn btn-outline" onclick="openBudgetModal()">Edit Budget</button>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading budget:', error);
        const budgetCard = document.getElementById('budgetCard');
        if (budgetCard) {
            budgetCard.innerHTML = `
                <div style="color:var(--muted);font-size:0.85rem; text-align: center; padding: 1rem;">
                    Could not load budget data. Please try again.
                </div>
            `;
        }
    }
}

// Show budget section only for Treasurer
function showBudgetForTreasurer() {
    const privilege = Session.privilege;
    const userType = Session.userType;
    
    const isTreasurer = privilege === 'TREASURER';
    const isAdmin = privilege === 'ADMIN' || userType === 'developer';
    
    const budgetSection = document.getElementById('treasurerBudgetSection');
    if (budgetSection) {
        budgetSection.style.display = (isTreasurer || isAdmin) ? 'block' : 'none';
    }
    
    if (isTreasurer || isAdmin) {
        loadTreasurerBudget();
    }
}

function openBudgetModal() {
    window.location.href = '/Councilor/Budget/Budget';
}

async function loadCommitteeCharts() {
  try {
    const response = await authFetch(`/getBudget?barangay=${encodeURIComponent(userBarangay)}`);
    const data = await response.json();
    const committees = data.committees || [];
    
    const container = document.getElementById('committeeCharts');
    if (!container) return;
    
    if (committees.length === 0) {
      container.innerHTML = '<div class="empty-state">No committee budget data available.</div>';
      return;
    }
    
    container.innerHTML = committees.map(c => {
      const percentage = c.allocated > 0 ? (c.spent / c.allocated * 100) : 0;
      return `
        <div class="chart-card">
          <div class="chart-title">${escapeHtml(c.committeeName)}</div>
          <div class="chart-bar-container">
            <div class="chart-bar" style="width: ${percentage}%; background: linear-gradient(90deg, #0BBFB5, #10B981);"></div>
          </div>
          <div class="chart-numbers">
            <span>₱${(c.spent || 0).toLocaleString()} / ₱${(c.allocated || 0).toLocaleString()}</span>
            <span>${percentage.toFixed(1)}%</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading committee charts:', error);
  }
}

async function loadRecentExpenditures() {
  try {
    const response = await authFetch(`/getRecentExpenditures?barangay=${encodeURIComponent(userBarangay)}&limit=5`);
    const expenditures = await response.json();
    
    const container = document.getElementById('recentExpensesBody');
    if (!container) return;
    
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
    const response = await authFetch(`/getCommittees?barangay=${encodeURIComponent(userBarangay)}`);
    const committees = await response.json();
    window.allCommittees = committees;
    console.log('Committees loaded:', committees);
  } catch (error) {
    console.error('Error loading committees:', error);
    window.allCommittees = [];
  }
}

async function loadChairmanStats() {
  try {
    const response = await authFetch(`/getAllProjects?barangay=${encodeURIComponent(userBarangay)}`);
    const projects = await response.json();
    
    const total = projects.length;
    const pending = projects.filter(p => p.status === 'PENDING').length;
    const approved = projects.filter(p => p.status === 'APPROVED').length;
    const rejected = projects.filter(p => p.status === 'REJECTED').length;
    
    const totalEl = document.getElementById('chairman-total-projects');
    const pendingEl = document.getElementById('chairman-pending-projects');
    const approvedEl = document.getElementById('chairman-approved-projects');
    const rejectedEl = document.getElementById('chairman-rejected-projects');
    
    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (approvedEl) approvedEl.textContent = approved;
    if (rejectedEl) rejectedEl.textContent = rejected;
  } catch (error) {
    console.error('Error loading chairman stats:', error);
  }
}

async function loadCommitteesTable() {
  const tbody = document.getElementById('committeesTableBody');
  if (!tbody) return;

  const committees = window.allCommittees || [];

  if (!Array.isArray(committees) || committees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No committees found.</td></tr>';
    return;
  }

  tbody.innerHTML = '<tr><td colspan="7"><div class="loader"></div></td></tr>';

  try {
    const budgetResponse = await authFetch(`/getBudget?barangay=${encodeURIComponent(userBarangay)}`);
    const budgetData = await budgetResponse.json();
    const committeesBudget = budgetData.committees || [];

    const committeesWithData = await Promise.all(committees.map(async (committee) => {
      try {
        const projectsResponse = await authFetch(`/getCommitteeProjects?barangay=${encodeURIComponent(userBarangay)}&committeeName=${encodeURIComponent(committee.committeeName)}`);
        const projectsText = await projectsResponse.text();
        
        let projects = [];
        if (projectsText !== 'ERROR' && projectsText) {
          try {
            projects = JSON.parse(projectsText);
          } catch (parseError) {
            projects = [];
          }
        }
        
        const pendingProjects = projects.filter(p => p.status === 'PENDING').length;
        const approvedProjects = projects.filter(p => p.status === 'APPROVED').length;
        
        const committeeBudget = committeesBudget.find(b => b.committeeName === committee.committeeName);
        const totalBudget = committeeBudget?.allocated || 0;
        const spent = committeeBudget?.spent || 0;
        const remaining = totalBudget - spent;
        
        return { ...committee, pendingProjects, approvedProjects, totalBudget, spent, remaining };
      } catch (error) {
        return { ...committee, pendingProjects: 0, approvedProjects: 0, totalBudget: 0, spent: 0, remaining: 0 };
      }
    }));
    
    tbody.innerHTML = committeesWithData.map(c => `
      <tr>
        <td>${escapeHtml(c.committeeName)}</td>
        <td>${c.headName ? escapeHtml(c.headName) : '<span style="color:var(--muted)">Not assigned</span>'}</td>
        <td>${c.pendingProjects}</td>
        <td>${c.approvedProjects}</td>
        <td>₱${(c.totalBudget || 0).toLocaleString()}</td>
        <td>₱${(c.spent || 0).toLocaleString()}</td>
        <td>₱${(c.remaining || 0).toLocaleString()}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading committees table:', error);
    tbody.innerHTML = '<tr><td colspan="7">Error loading data.</td></tr>';
  }
}

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

// DOMContentLoaded - Token-based auth check
document.addEventListener('DOMContentLoaded', async () => {
  // Check if we have a token
  const token = localStorage.getItem('auth_token');
  
  if (!token || !localStorage.getItem('sk_name')) {
    window.location.href = '/Councilor/Log-in/Login';
    return;
  }
  
  try {
    const response = await fetch('https://sklinaw.onrender.com/api/check-auth', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (!data.authenticated) {
      Session.clear();
      window.location.href = '/Councilor/Log-in/Login';
      return;
    }
    
    // Update UI
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
    
    showBudgetForTreasurer();
    showRoleView();
    
  } catch (error) {
    console.error('Auth check error:', error);
    Session.clear();
    window.location.href = '/Councilor/Log-in/Login';
  }
});