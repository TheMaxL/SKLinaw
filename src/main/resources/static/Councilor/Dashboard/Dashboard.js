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
        loadTreasurerDashboard();  // This will now call loadTreasurerBudget()
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
  await loadExpenditureBar();
  await loadCommitteeCharts();
  await loadRecentExpenditures();
  await loadTreasurerBudget();
}

async function loadExpenditureBar() {
  try {
    const response = await fetch(`/api/getBudget?barangay=${encodeURIComponent(userBarangay)}`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    const totalBudget = data.totalBudget || 0;
    const committees = data.committees || [];
    const totalSpent = committees.reduce((sum, c) => sum + (c.spent || 0), 0);
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;
    
    document.getElementById('expenditureBar').style.width = `${Math.min(percentage, 100)}%`;
    document.getElementById('totalSpent').textContent = `₱${totalSpent.toLocaleString()}`;
    document.getElementById('totalRemaining').textContent = `₱${(totalBudget - totalSpent).toLocaleString()}`;
    document.getElementById('expenditurePercent').textContent = `${percentage.toFixed(1)}%`;
  } catch (error) {
    console.error('Error loading expenditure bar:', error);
  }
}

async function loadTreasurerBudget() {
    try {
        const barangay = Session.barangay;
        if (!barangay) return;
        
        const response = await fetch(`${API}/getBudget?barangay=${encodeURIComponent(barangay)}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        
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
        
        // Calculate percentage spent
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

// Open budget modal (you'll need to implement this or link to Budget page)
function openBudgetModal() {
    window.location.href = '/Councilor/Budget/Budget';
}

async function loadCommitteeCharts() {
  try {
    const response = await fetch(`/api/getBudget?barangay=${encodeURIComponent(userBarangay)}`, {
      credentials: 'include'
    });
    const data = await response.json();
    const committees = data.committees || [];
    
    const container = document.getElementById('committeeCharts');
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
  const tbody = document.getElementById('committeesTableBody');
  if (!tbody) {
    console.error('committeesTableBody not found!');
    return;
  }

  const committees = window.allCommittees || [];
  console.log('Committees for table:', committees);

  if (!Array.isArray(committees) || committees.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">No committees found.耸
      </tr>
    `;
    return;
  }

  // Show loading state
  tbody.innerHTML = '<tr><td colspan="7"><div class="loader"><span></span><span></span><span></span></div></td></tr>';

  // Fetch data for each committee in parallel
  const committeePromises = committees.map(async (committee) => {
    try {
      // Fetch projects for this committee
      const projectsResponse = await fetch(`/api/getProjectsByCommittee?barangay=${encodeURIComponent(userBarangay)}&committeeName=${encodeURIComponent(committee.committeeName)}`, {
        credentials: 'include'
      });
      const projects = await projectsResponse.json();
      
      // Calculate project stats
      const pendingProjects = projects.filter(p => p.status === 'PENDING').length;
      const approvedProjects = projects.filter(p => p.status === 'APPROVED').length;
      
      // Fetch budget data for this committee
      const budgetResponse = await fetch(`/api/getBudgetByCommittee?barangay=${encodeURIComponent(userBarangay)}&committeeName=${encodeURIComponent(committee.committeeName)}`, {
        credentials: 'include'
      });
      const budgetData = await budgetResponse.json();
      
      const totalBudget = budgetData.allocated || 0;
      const spent = budgetData.spent || 0;
      const remaining = budgetData.remaining || (totalBudget - spent);
      
      return {
        ...committee,
        pendingProjects,
        approvedProjects,
        totalBudget,
        spent,
        remaining
      };
    } catch (error) {
      console.error(`Error loading data for committee ${committee.committeeName}:`, error);
      return {
        ...committee,
        pendingProjects: 0,
        approvedProjects: 0,
        totalBudget: 0,
        spent: 0,
        remaining: 0
      };
    }
  });
  
  // Wait for all committee data to load
  const committeesWithData = await Promise.all(committeePromises);
  
  // Render the table
  tbody.innerHTML = committeesWithData.map((c, i) => `
    <tr style="animation-delay:${i * 0.05}s">
      <td class="project-name-cell">${escapeHtml(c.committeeName)}</td>
      <td>${c.headName ? escapeHtml(c.headName) : '<span style="color:var(--muted)">Not assigned</span>'}</td>
      <td class="pending-count">${c.pendingProjects}</td>
      <td class="approved-count">${c.approvedProjects}</td>
      <td>₱${(c.totalBudget || 0).toLocaleString()}</td>
      <td>₱${(c.spent || 0).toLocaleString()}</td>
      <td>₱${(c.remaining || 0).toLocaleString()}</td>
    </tr>
  `).join('');
  
  console.log('Table rendered with', committeesWithData.length, 'committees and their data');
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
  showBudgetForTreasurer();
  showRoleView();
});