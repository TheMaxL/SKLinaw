// ── SESSION HELPERS ──
const userPrivilege = localStorage.getItem('sk_privilege') || '';
const userBarangay = localStorage.getItem('sk_barangay') || '';

const session = {
  name: Session.name || 'Councilor',
  barangay: Session.barangay || 'Lahug'
};

// ── SIDEBAR USER INFO ──
const dashUserName = document.getElementById('dash-user-name');
const dashBarangay = document.getElementById('dash-barangay');
const dashAvatar   = document.getElementById('dash-avatar');

if (dashUserName) dashUserName.textContent = session.name;
if (dashBarangay) dashBarangay.textContent = session.barangay;
if (dashAvatar)   dashAvatar.textContent   = session.name.charAt(0).toUpperCase();

// ── STATE ──
let allCommittees = [];      // All committees in barangay (for table display)
let myCommittees = [];       // Committees user is a member of (for dropdown)

// ── HELPER FUNCTIONS ──
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── ROLE-BASED UI ──
function showRoleView() {
    // Use localStorage directly since Session methods might not be available
    const privilege = localStorage.getItem('sk_privilege') || '';
    const userType = localStorage.getItem('sk_user_type') || '';
    
    console.log('showRoleView called - Privilege:', privilege, 'UserType:', userType);
    
    const isAdminOrDeveloper = privilege === 'ADMIN' || userType === 'developer';
    const isChairman = privilege === 'CHAIRMAN';
    const isTreasurer = privilege === 'TREASURER';
    
    // Hide/show create committee button (only Chairman or Admin can create)
    const createBtn = document.getElementById('createCommitteeBtn');
    if (createBtn) {
        createBtn.style.display = (isChairman || isAdminOrDeveloper) ? 'flex' : 'none';
    }
    
    // Hide/show budget section (only Treasurer or Admin)
    const budgetSection = document.querySelector('.budget-section');
    if (budgetSection) {
        budgetSection.style.display = (isTreasurer || isAdminOrDeveloper) ? 'block' : 'none';
    }
    
    // Hide/show add member buttons
    const addMemberBtns = document.querySelectorAll('.add-member-btn');
    addMemberBtns.forEach(btn => {
        btn.style.display = (isChairman || isAdminOrDeveloper) ? 'inline-flex' : 'none';
    });
    
    // Hide/show edit/delete committee buttons
    const editBtns = document.querySelectorAll('.edit-committee-btn');
    editBtns.forEach(btn => {
        btn.style.display = (isChairman || isAdminOrDeveloper) ? 'inline-flex' : 'none';
    });
    
    console.log('Role view updated:', { isAdminOrDeveloper, isChairman, isTreasurer });
}

// ── INIT ──
async function init() {
  try {
    await loadAllCommittees();      // Load all committees for the table
    await loadMyCommittees();       // Load user's committees for dropdown
    await loadCommitteesTable();    // Display the table
    await loadTotalBudget();        // Load total budget for the barangay
    showRoleView();                 // Apply role-based UI
  } catch (error) {
    console.error('Init error:', error);
    Toast.show('Error loading initial data', true);
  }
}

async function loadAllCommittees() {
  try {
    const res = await fetch(`${API}/getCommittees?barangay=${encodeURIComponent(session.barangay)}`, {
      credentials: 'include'
    });
    const data = await res.json();
    allCommittees = data;
    console.log('All committees loaded:', allCommittees);
  } catch (e) {
    console.error('Error loading all committees:', e);
    allCommittees = [];
  }
}

// ── LOAD MY COMMITTEES (for dropdown - only committees user is member of) ──
async function loadMyCommittees() {
  try {
    const res = await fetch(`${API}/getMyCommittees?barangay=${encodeURIComponent(session.barangay)}&councilor=${encodeURIComponent(session.name)}`, {
      credentials: 'include'
    });
    const data = await res.json();
    myCommittees = data;
    console.log('My committees loaded:', myCommittees);
    
    // Populate committee select dropdown (for navigation)
    const committeeSelect = document.getElementById('committeeSelect');
    if (committeeSelect) {
      committeeSelect.innerHTML = '<option value="">-- Select Committee --</option>';
      myCommittees.forEach(c => {
        committeeSelect.innerHTML += `<option value="${esc(c.committeeName)}">${esc(c.committeeName)}</option>`;
      });
    }
    
    // Populate filter dropdown
    const filter = document.getElementById('committeeFilter');
    if (filter) {
      filter.innerHTML = '<option value="">All committees</option>';
      myCommittees.forEach(c => {
        filter.innerHTML += `<option value="${esc(c.committeeName)}">${esc(c.committeeName)}</option>`;
      });
    }
    
    // Populate form committee dropdown
    const formSel = document.getElementById('formCommittee');
    if (formSel) {
      formSel.innerHTML = '';
      myCommittees.forEach(c => {
        formSel.innerHTML += `<option value="${esc(c.committeeName)}">${esc(c.committeeName)}</option>`;
      });
    }
  } catch (e) {
    console.error('Error loading my committees:', e);
    myCommittees = [];
  }
}

async function loadCommitteesTable() {
  const tbody = document.getElementById('projectTableBody');
  if (!tbody) return;

  if (!Array.isArray(allCommittees) || allCommittees.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="4">
          No committees found. Click "+ Add Committee" to create one!
        </tr>
      </table>`;
    return;
  }

  const privilege = localStorage.getItem('sk_privilege') || '';
  const isChairman = privilege === 'CHAIRMAN';
  const isAdmin = privilege === 'ADMIN';

  tbody.innerHTML = allCommittees.map((c, i) => `
    <tr style="animation-delay:${i * 0.05}s" onclick="goToCommitteeDetail('${esc(c.committeeName)}')" style="cursor: pointer;">
      <td class="project-name-cell">${esc(c.committeeName)}</td>
      <td style="color:var(--muted);text-align:center">${c.memberCount !== undefined ? c.memberCount : '0'}</td>
      <td>
        ${c.headName 
          ? esc(c.headName) 
          : '<span style="color:var(--muted)">No head assigned</span>'}
      </td>
      <td>
        ${(isChairman || isAdmin) ? 
          `<button class="action-btn delete-committee-btn" 
            onclick="event.stopPropagation(); deleteCommittee('${esc(c.committeeName)}')">
            🗑️ Delete
          </button>` :
          ''
        }
      </td>
    </tr>
  `).join('');
}

// ── NAVIGATION TO COMMITTEE DETAIL ──
function goToCommitteeDetail(committeeName) {
    console.log('Navigating to committee detail:', committeeName);
    if (committeeName) {
        window.location.href = `/Councilor/Committee/committee-detail.html?name=${encodeURIComponent(committeeName)}`;
    }
}

// ── COMMITTEE CHANGE HANDLER (for dropdown) ──
function onCommitteeChange() {
    const select = document.getElementById('committeeSelect');
    if (!select) {
        console.error('committeeSelect element not found');
        return;
    }
    const committeeName = select.value;
    console.log('Selected committee from dropdown:', committeeName);
    if (committeeName) {
        window.location.href = `/Councilor/Committee/committee-detail.html?name=${encodeURIComponent(committeeName)}`;
    }
}

async function loadCommitteeBudget(committeeName) {
  try {
    const url = `${API}/getBudgetByCommittee?barangay=${encodeURIComponent(session.barangay)}&committeeName=${encodeURIComponent(committeeName)}`;
    console.log('Fetching budget from:', url);
    
    const res = await fetch(url, {
      credentials: 'include'
    });
    const data = await res.json();
    console.log('Committee budget data:', data);
    
    const budgetCard = document.getElementById('budgetCard');
    if (budgetCard && data && data.allocated !== undefined) {
      const allocated = data.allocated || 0;
      const spent = data.spent || 0;
      const remaining = data.remaining || 0;
      const percentage = allocated > 0 ? (spent / allocated * 100) : 0;
      
      budgetCard.innerHTML = `
        <div class="budget-top">
          <div>
            <div class="budget-total-label">Committee Budget: ${esc(committeeName)}</div>
            <div class="budget-total-value">₱${allocated.toLocaleString('en-PH')}</div>
          </div>
          <div class="budget-meta">
            Spent: ₱${spent.toLocaleString('en-PH')}<br>
            Remaining: ₱${remaining.toLocaleString('en-PH')}
          </div>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${percentage > 100 ? 'over' : ''}" style="width:${Math.min(percentage, 100)}%"></div>
        </div>
        <div class="budget-percentage">${percentage.toFixed(1)}% utilized</div>
      `;
    }
  } catch (e) {
    console.error('Error loading committee budget:', e);
  }
}

// ── LOAD TOTAL BUDGET ──
async function loadTotalBudget() {
  try {
    console.log('loadTotalBudget called');
    
    const res = await fetch(`${API}/getBudget?barangay=${encodeURIComponent(session.barangay)}`, {
      credentials: 'include'
    });
    const data = await res.json();
    
    console.log('Budget data received:', data);
    
    const budgetCard = document.getElementById('budgetCard');
    if (!budgetCard) {
      console.error('Budget card element not found!');
      return;
    }
    
    const totalBudget = data.totalBudget || 0;
    const committees = data.committees || [];
    const totalSpent = committees.reduce((sum, c) => sum + (c.spent || 0), 0);
    
    if (totalBudget === 0 && committees.length === 0) {
      budgetCard.innerHTML = `
        <div style="color:var(--muted);font-size:0.85rem">
          No budget has been set yet. The treasurer can set the budget.
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
          Remaining: ₱${(totalBudget - totalSpent).toLocaleString('en-PH')}
        </div>
      </div>
      <div class="committee-rows">
        ${committees.length === 0 ? '<div style="color:var(--muted);font-size:0.82rem">No committee allocations yet.</div>' : committees.map(c => {
          const pct = c.allocated > 0 ? Math.min((c.spent / c.allocated) * 100, 100) : 0;
          const over = c.spent > c.allocated;
          return `
            <div class="committee-row">
              <div class="committee-row-header">
                <span class="committee-row-name">${esc(c.committeeName)}</span>
                <span class="committee-row-amounts">
                  ₱${(c.spent||0).toLocaleString('en-PH')} /
                  ₱${(c.allocated||0).toLocaleString('en-PH')}
                </span>
              </div>
              <div class="progress-track">
                <div class="progress-fill ${over ? 'over' : ''}" style="width:${pct}%"></div>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
    
    console.log('Budget display updated successfully');
  } catch (e) {
    console.error('Error loading budget:', e);
    const budgetCard = document.getElementById('budgetCard');
    if (budgetCard) {
      budgetCard.innerHTML = `<div style="color:var(--muted);font-size:0.85rem">Could not load budget data.</div>`;
    }
  }
}

function applyFilters() {
  loadCommitteesTable();
}

// ── MODAL ──
function openModal() {
  document.getElementById('modalOverlay')?.classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay')?.classList.remove('open');
}

// ── SUBMIT COMMITTEE ──
async function submitCommittee() {
  const nameInput = document.getElementById('formProjectName');
  const headInput = document.getElementById('formPurpose');

  const body = {
    committeeName: nameInput?.value.trim(),
    barangay: session.barangay,
    headName: headInput?.value.trim() || ""
  };

  if (!body.committeeName) {
    Toast.show('Committee name is required.', true);
    return;
  }

  try {
    const res = await fetch(`${API}/createCommittee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const text = await res.text();

    if (text === 'SUCCESS') {
      Toast.show('Committee created successfully!');
      closeModal();

      nameInput.value = '';
      headInput.value = '';

      await loadAllCommittees();
      await loadMyCommittees();
      await loadCommitteesTable();
      await loadTotalBudget();  

    } else if (text === 'COMMITTEE_ALREADY_EXISTS') {
      Toast.show('Committee already exists.', true);
    } else {
      Toast.show('Error: ' + text, true);
    }

  } catch (e) {
    console.error(e);
    Toast.show('Could not connect to server.', true);
  }
}

// ── ASSIGN HEAD ──
async function assignHead(committeeName) {
  const headName = prompt(`Enter councilor name for "${committeeName}":`);
  if (!headName) return;

  try {
    const res = await fetch(`${API}/assignCommitteeHead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        committeeName: committeeName,
        barangay: session.barangay,
        headName: headName.trim()
      })
    });

    const text = await res.text();

    if (text === 'SUCCESS') {
      Toast.show('Head assigned successfully!');
      await loadAllCommittees();
      await loadCommitteesTable();
    } else if (text === 'COUNCILOR_NOT_IN_BARANGAY') {
      Toast.show('Councilor not found in this barangay.', true);
    } else if (text === 'ALREADY_HEADS_A_COMMITTEE') {
      Toast.show('Councilor already heads another committee.', true);
    } else {
      Toast.show('Error: ' + text, true);
    }

  } catch (e) {
    console.error(e);
    Toast.show('Server error while assigning head.', true);
  }
}

async function deleteCommittee(committeeName) {
  console.log('deleteCommittee called for:', committeeName);
  
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
    console.log('Delete response:', result);
    
    if (result === 'SUCCESS') {
      Toast.show(`Committee "${committeeName}" has been deleted successfully.`);
      await loadAllCommittees();
      await loadMyCommittees();
      await loadCommitteesTable();
      await loadTotalBudget();
    } else if (result === 'COMMITTEE_NOT_FOUND') {
      Toast.show('Committee not found', true);
    } else {
      Toast.show('Error deleting committee: ' + result, true);
    }
  } catch (error) {
    console.error('Error deleting committee:', error);
    Toast.show('Could not delete committee', true);
  }
}

// ── CLOSE MODAL ON OUTSIDE CLICK ──
document.getElementById('modalOverlay')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ── DOM CONTENT LOADED ──
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
  
  // Start the app
  init();
});

// ── GLOBAL EXPORTS ──
window.openModal = openModal;
window.closeModal = closeModal;
window.submitCommittee = submitCommittee;
window.assignHead = assignHead;
window.onCommitteeChange = onCommitteeChange;
window.applyFilters = applyFilters;
window.deleteCommittee = deleteCommittee;
window.goToCommitteeDetail = goToCommitteeDetail;