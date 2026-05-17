// ── SESSION (read from localStorage set at login) ──
const session = {
  name: localStorage.getItem('sk_name') || 'Councilor',
  barangay: localStorage.getItem('sk_barangay') || 'Lahug',
  privilege: localStorage.getItem('sk_privilege') || ''
};

// Check if user is Chairman
const isChairman = session.privilege === 'CHAIRMAN';

// Update sidebar user info
const nameEl = document.getElementById('nameEl');
const avatarEl = document.getElementById('avatarEl');
const roleEl = document.getElementById('roleEl');

if (nameEl) nameEl.textContent = session.name;
if (avatarEl) avatarEl.textContent = session.name.charAt(0).toUpperCase();
if (roleEl) roleEl.textContent = isChairman ? 'Chairman' : 'Councilor';

// Show Chairman badge and section if applicable
if (isChairman) {
  const badge = document.getElementById('chairmanBadge');
  const chairmanSection = document.getElementById('chairmanSection');
  if (badge) badge.style.display = 'inline-block';
  if (chairmanSection) chairmanSection.style.display = 'block';
  
  // Update page subtitle for Chairman
  const subtitle = document.getElementById('pageSubtitle');
  if (subtitle) subtitle.textContent = 'Review and approve project proposals from councilors.';
}

let allProjects = [];
let committees = [];
let pendingProjects = [];

// ── INIT ──
async function init() {
  await loadCommittees();
  await loadProjects();
  await loadBudget();
  if (isChairman) {
    await loadPendingProjects();
  }
}

async function loadCommittees() {
  try {
    const res = await fetch(`${API}/getCommittees?barangay=${encodeURIComponent(session.barangay)}`);
    const text = await res.text();
    if (text === 'ERROR') {
      committees = [];
    } else {
      committees = JSON.parse(text);
    }

    const filter = document.getElementById('committeeFilter');
    const formSel = document.getElementById('formCommittee');
    if (filter) {
      filter.innerHTML = '<option value="">All committees</option>';
      committees.forEach(c => {
        filter.innerHTML += `<option value="${escHtml(c.committeeName)}">${escHtml(c.committeeName)}</option>`;
      });
    }
    if (formSel) {
      formSel.innerHTML = '';
      committees.forEach(c => {
        formSel.innerHTML += `<option value="${escHtml(c.committeeName)}">${escHtml(c.committeeName)}</option>`;
      });
    }
  } catch (e) {
    console.error('Error loading committees:', e);
    if (document.getElementById('committeeFilter')) {
      document.getElementById('committeeFilter').innerHTML = '<option>Could not load</option>';
    }
  }
}

async function loadProjects(committeeName) {
  const tbody = document.getElementById('projectTableBody');
  if (tbody) {
    tbody.innerHTML = `<tr class="loader-row"><td colspan="6"><div class="loader"><span></span><span></span><span></span></div></td></tr>`;
  }

  try {
    allProjects = [];

    if (committeeName) {
      const res = await fetch(`${API}/getProjects?barangay=${encodeURIComponent(session.barangay)}&committeeName=${encodeURIComponent(committeeName)}`);
      const text = await res.text();
      if (text !== 'ERROR') {
        const data = JSON.parse(text);
        if (Array.isArray(data)) allProjects = data.map(p => ({ ...p, committeeName }));
      }
    } else {
      for (const c of committees) {
        const res = await fetch(`${API}/getProjects?barangay=${encodeURIComponent(session.barangay)}&committeeName=${encodeURIComponent(c.committeeName)}`);
        const text = await res.text();
        if (text !== 'ERROR') {
          const data = JSON.parse(text);
          if (Array.isArray(data)) data.forEach(p => allProjects.push({ ...p, committeeName: c.committeeName }));
        }
      }
    }
    applyFilters();
  } catch (e) {
    console.error('Error loading projects:', e);
    if (tbody) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">⚠️ Could not connect to the server. </td></tr>`;
    }
  }
}

// Load pending projects for Chairman approval
async function loadPendingProjects() {
  try {
    const response = await fetch(`${API}/getPendingProjects?barangay=${encodeURIComponent(session.barangay)}`);
    const text = await response.text();
    
    if (text === 'ERROR') {
      showToast('Could not load pending projects', true);
      return;
    }
    
    pendingProjects = JSON.parse(text);
    displayPendingProjects();
    
  } catch (error) {
    console.error('Error loading pending projects:', error);
    showToast('Could not load pending projects', true);
  }
}

function displayPendingProjects() {
    const container = document.getElementById('pendingProjectsContainer');
    if (!container) return;
    
    if (pendingProjects.length === 0) {
        container.innerHTML = '<div class="empty-state">No pending projects awaiting approval.</div>';
        return;
    }
    
    container.innerHTML = pendingProjects.map(project => `
        <div class="project-card pending" data-project-id="${project.id}">
            <div class="project-header">
                <h4>${escHtml(project.projectName)}</h4>
                <span class="status-badge status-pending">PENDING</span>
            </div>
            <div class="project-details">
                <p><strong>Committee:</strong> ${escHtml(project.committeeName)}</p>
                <p><strong>Submitted by:</strong> ${escHtml(project.councilorName)}</p>
                <p><strong>Purpose:</strong> ${escHtml(project.purpose)}</p>
                <p><strong>Budget Required:</strong> ₱${(project.totalCost || 0).toLocaleString('en-PH')}</p>
                <p><strong>Submitted:</strong> ${formatDate(project.createdAt)}</p>
                ${project.committeeHead ? `<p><strong>Committee Head:</strong> ${escHtml(project.committeeHead)}</p>` : ''}
            </div>
            <div class="project-actions">
                <button class="btn-approve" onclick="openApproveModal(${project.id}, '${escHtml(project.projectName)}', ${project.totalCost})">
                    ✅ Approve
                </button>
                <button class="btn-reject" onclick="openRejectModal(${project.id}, '${escHtml(project.projectName)}')">
                    ❌ Reject
                </button>
            </div>
        </div>
    `).join('');
}

async function loadBudget(committeeName) {
  try {
    const res = await fetch(`${API}/getBudget?barangay=${encodeURIComponent(session.barangay)}`);
    const text = await res.text();
    if (text === 'ERROR') {
      document.getElementById('budgetCard').innerHTML = `<div style="color:var(--muted);font-size:0.85rem">Budget data unavailable.</div>`;
      return;
    }
    const data = JSON.parse(text);
    renderBudget(data, committeeName);
  } catch (e) {
    document.getElementById('budgetCard').innerHTML = `<div style="color:var(--muted);font-size:0.85rem">Budget data unavailable.</div>`;
  }
}

function renderBudget(data, filterCommittee) {
  let rows = data.committees || [];
  if (filterCommittee) rows = rows.filter(c => c.committeeName === filterCommittee);

  const totalBudget = data.totalBudget || 0;
  const totalSpent = rows.reduce((s, c) => s + (c.spent || 0), 0);

  document.getElementById('budgetCard').innerHTML = `
    <div class="budget-top">
      <div>
        <div class="budget-total-label">Total SK Budget</div>
        <div class="budget-total-value">₱${totalBudget.toLocaleString('en-PH')}</div>
      </div>
      <div class="budget-meta">
        Spent: ₱${totalSpent.toLocaleString('en-PH')}<br>
        Remaining: ₱${(totalBudget - totalSpent).toLocaleString('en-PH')}
      </div>
    </div>
    <div class="committee-rows">
      ${rows.map(c => {
        const pct = c.allocated > 0 ? Math.min((c.spent / c.allocated) * 100, 100) : 0;
        const over = c.spent > c.allocated;
        return `
          <div class="committee-row">
            <div class="committee-row-header">
              <span class="committee-row-name">${escHtml(c.committeeName)}</span>
              <span class="committee-row-amounts">₱${(c.spent || 0).toLocaleString('en-PH')} / ₱${(c.allocated || 0).toLocaleString('en-PH')}</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${over ? 'over' : ''}" style="width:${pct}%"></div>
            </div>
          </div>`;
      }).join('')}
      ${rows.length === 0 ? '<div style="color:var(--muted);font-size:0.82rem">No budget data for this committee yet.</div>' : ''}
    </div>
  `;
}

function applyFilters() {
  const status = document.getElementById('statusFilter')?.value || '';
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
  let filtered = allProjects;
  if (status) filtered = filtered.filter(p => p.status === status);
  if (search) filtered = filtered.filter(p =>
    p.projectName.toLowerCase().includes(search) ||
    (p.purpose || '').toLowerCase().includes(search)
  );
  renderTable(filtered);
}

function renderTable(projects) {
    const tbody = document.getElementById('projectTableBody');
    if (!tbody) return;
    
    if (projects.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No projects found.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = projects.map((p, i) => `
        <tr style="animation-delay:${i * 0.04}s">
            <td class="project-name-cell">${escHtml(p.projectName)}</td>
            <td class="project-purpose-cell">
                ${escHtml(p.purpose || '—')}
                ${p.status === 'REJECTED' && p.rejectionReason ? `
                    <div class="rejection-reason">
                        <strong>Rejection reason:</strong> ${escHtml(p.rejectionReason)}
                    </div>
                ` : ''}
            </td>
            <td class="cost-cell">₱${(p.totalCost || 0).toLocaleString('en-PH')}</td>
            <td><span class="status-pill status-${p.status}">${p.status}</span></td>
            <td style="color:var(--muted);font-size:0.78rem">${formatDate(p.createdAt)}</td>
            <td><button class="action-btn" onclick="viewProject(${p.id})">View</button></td>
        </tr>
    `).join('');
}

function onCommitteeChange() {
  const val = document.getElementById('committeeFilter')?.value;
  loadProjects(val || null);
  loadBudget(val || null);
}

// ── ADD PROJECT MODAL ──
function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

async function submitProject() {
  const body = {
    projectName: document.getElementById('formProjectName').value.trim(),
    purpose: document.getElementById('formPurpose').value.trim(),
    committeeName: document.getElementById('formCommittee').value,
    barangay: session.barangay,
    councilorName: session.name,
    totalCost: parseFloat(document.getElementById('formCost').value) || 0
  };

  if (!body.projectName || !body.purpose || !body.committeeName) {
    showToast('Please fill in all required fields.', true);
    return;
  }

  try {
    const res = await fetch(`${API}/addProject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await res.text();

    if (text === 'SUCCESS') {
      showToast('Project submitted! Awaiting chairman approval.');
      closeModal();
      ['formProjectName', 'formPurpose', 'formCost'].forEach(id => document.getElementById(id).value = '');
      await loadProjects(document.getElementById('committeeFilter')?.value || null);
      if (isChairman) {
        await loadPendingProjects();
      }
    } else {
      showToast('Submission failed: ' + text, true);
    }
  } catch (e) {
    showToast('Could not connect to server.', true);
  }
}

// Global variables for rejection
let currentRejectProjectId = null;
let currentRejectProjectName = null;

// ── CHAIRMAN APPROVAL FUNCTIONS ──
function openApproveModal(projectId, projectName, projectCost) {
  const modal = document.getElementById('approveModal');
  const projectNameSpan = document.getElementById('approveProjectName');
  const projectCostSpan = document.getElementById('approveProjectCost');
  
  if (projectNameSpan) projectNameSpan.textContent = projectName;
  if (projectCostSpan) projectCostSpan.textContent = `₱${(projectCost || 0).toLocaleString('en-PH')}`;
  
  const confirmBtn = document.getElementById('confirmApproveBtn');
  if (confirmBtn) confirmBtn.onclick = () => approveProject(projectId, projectName);
  
  if (modal) modal.style.display = 'flex';
}

function closeApproveModal() {
  const modal = document.getElementById('approveModal');
  if (modal) modal.style.display = 'none';
}

async function approveProject(projectId, projectName) {
    try {
        const response = await fetch(`${API}/approveProject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: projectId,
                barangay: session.barangay,
                approvedBy: session.name
            })
        });
        
        const result = await response.text();
        
        if (result === 'SUCCESS') {
            showToast(`Project "${projectName}" has been approved and is now public!`);
            closeApproveModal();
            await loadPendingProjects();
            await loadProjects(document.getElementById('committeeFilter')?.value || null);
            await loadBudget();
        } else if (result.startsWith('INSUFFICIENT_BUDGET')) {
            showToast(result, true);
        } else {
            showToast('Error approving project: ' + result, true);
        }
        
    } catch (error) {
        console.error('Error approving project:', error);
        showToast('Could not approve project', true);
    }
}

function openRejectModal(projectId, projectName) {
    console.log('=== openRejectModal called ===');
    console.log('Project ID:', projectId);
    console.log('Project Name:', projectName);
    
    currentRejectProjectId = projectId;
    currentRejectProjectName = projectName;
    
    const reasonTextarea = document.getElementById('rejectionReason');
    if (reasonTextarea) {
        reasonTextarea.value = '';
    }
    
    const modal = document.getElementById('rejectModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeRejectModal() {
    console.log('=== closeRejectModal called ===');
    
    const modal = document.getElementById('rejectModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentRejectProjectId = null;
    currentRejectProjectName = null;
}

async function confirmReject() {
    console.log('=== confirmReject called ===');
    console.log('currentRejectProjectId:', currentRejectProjectId);
    console.log('currentRejectProjectName:', currentRejectProjectName);
    
    const reasonTextarea = document.getElementById('rejectionReason');
    let reason = reasonTextarea ? reasonTextarea.value.trim() : '';
    
    console.log('Reason:', reason);
    
    if (!reason) {
        showToast('Please provide a reason for rejection', true);
        return;
    }
    
    if (!currentRejectProjectId) {
        showToast('Error: No project selected', true);
        return;
    }
    
    const requestBody = {
        projectId: currentRejectProjectId,
        barangay: session.barangay,
        rejectionReason: reason,
        rejectedBy: session.name
    };
    
    console.log('Request body:', requestBody);
    
    try {
        const response = await fetch(`${API}/rejectProject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.text();
        console.log('Server response:', result);
        
        if (result === 'SUCCESS') {
            showToast(`Project "${currentRejectProjectName}" has been rejected.`);
            closeRejectModal();
            await loadPendingProjects();
            await loadProjects();
        } else {
            showToast('Error rejecting project: ' + result, true);
        }
    } catch (error) {
        console.error('Error rejecting project:', error);
        showToast('Could not reject project', true);
    }
}

async function loadProjectFeedback(projectId) {
  try {
    const response = await fetch(`${API}/getProjectComments?projectId=${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch feedback');
    
    const feedback = await response.json();
    return feedback;
  } catch (error) {
    console.error('Error loading feedback:', error);
    return [];
  }
}

function toggleFeedback(projectId) {
  const row = document.getElementById(`feedback-row-${projectId}`);
  if (row) {
    if (row.style.display === 'none') {
      row.style.display = 'table-row';
    } else {
      row.style.display = 'none';
    }
  }
}

function viewProject(id) {
  const project = allProjects.find(p => p.id === id);
  if (!project) return;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal project-detail-modal">
      <h2>${escHtml(project.projectName)}</h2>
      <div class="project-info">
        <p><strong>Committee:</strong> ${escHtml(project.committeeName)}</p>
        <p><strong>Submitted by:</strong> ${escHtml(project.councilorName)}</p>
        <p><strong>Purpose:</strong> ${escHtml(project.purpose)}</p>
        <p><strong>Cost:</strong> ₱${(project.totalCost || 0).toLocaleString('en-PH')}</p>
        <p><strong>Status:</strong> <span class="status-pill status-${project.status}">${project.status}</span></p>
        ${project.rejectionReason ? `<p><strong>Rejection Reason:</strong> ${escHtml(project.rejectionReason)}</p>` : ''}
      </div>
      <div class="feedback-section-modal">
        <h3>💬 Community Feedback</h3>
        <div id="modal-feedback-${id}" class="modal-feedback-list">
          <div class="loading-feedback">Loading feedback...</div>
        </div>
      </div>
      <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Close</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Load feedback for this project
  loadProjectFeedback(id).then(feedback => {
    const container = document.getElementById(`modal-feedback-${id}`);
    if (!container) return;
    
    if (!feedback || feedback.length === 0) {
      container.innerHTML = '<p class="feedback-empty">No feedback yet for this project.</p>';
      return;
    }
    
    container.innerHTML = feedback.map(f => `
      <div class="feedback-item">
        <div class="feedback-meta">
          <strong>${escHtml(f.authorName || 'Anonymous')}</strong>
          <span class="feedback-date">${formatDate(f.createdAt)}</span>
        </div>
        <div class="feedback-message">${escHtml(f.message)}</div>
        ${f.rating && f.rating > 0 ? `
          <div class="feedback-rating">
            ${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}
          </div>
        ` : ''}
      </div>
    `).join('');
  });
}

// ── HELPERS ──
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return str;
  }
}

// Close modal on overlay click
document.getElementById('modalOverlay')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

document.getElementById('approveModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeApproveModal();
});

document.getElementById('rejectModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeRejectModal();
});

// Make functions global
window.onCommitteeChange = onCommitteeChange;
window.applyFilters = applyFilters;
window.openModal = openModal;
window.closeModal = closeModal;
window.submitProject = submitProject;
window.viewProject = viewProject;
window.openApproveModal = openApproveModal;
window.closeApproveModal = closeApproveModal;
window.openRejectModal = openRejectModal;
window.closeRejectModal = closeRejectModal;
window.approveProject = approveProject;
window.confirmReject = confirmReject;

// Start the app
init();