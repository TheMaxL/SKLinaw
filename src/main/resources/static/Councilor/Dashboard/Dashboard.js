// Get user role from localStorage
const userPrivilege = localStorage.getItem('sk_privilege') || '';
const userBarangay = localStorage.getItem('sk_barangay') || '';

// Show appropriate view based on role
function showRoleView() {
  // Hide all views first
  document.getElementById('councilorView').style.display = 'none';
  document.getElementById('treasurerView').style.display = 'none';
  document.getElementById('chairmanView').style.display = 'none';
  
  // Update role label
  const roleLabel = document.getElementById('dash-greet-sub');
  
  if (userPrivilege === 'TREASURER') {
    document.getElementById('treasurerView').style.display = 'block';
    roleLabel.textContent = 'Treasurer';
    loadTreasurerDashboard();
  } else if (userPrivilege === 'CHAIRMAN') {
    document.getElementById('chairmanView').style.display = 'block';
    roleLabel.textContent = 'Chairman';
    loadChairmanDashboard();
  } else {
    document.getElementById('councilorView').style.display = 'block';
    roleLabel.textContent = 'Councilor';
    loadCouncilorDashboard();
  }
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