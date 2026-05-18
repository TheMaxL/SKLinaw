// Get committee name from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const committeeName = urlParams.get('name');

if (!committeeName) {
  window.location.href = 'Committee';
}

const session = {
  name: localStorage.getItem('sk_name') || 'Councilor',
  barangay: localStorage.getItem('sk_barangay') || 'Lahug'
};

// Update sidebar
const userNameEl = document.getElementById('dash-user-name');
const barangayEl = document.getElementById('dash-barangay');
const avatarEl = document.getElementById('dash-avatar');

if (userNameEl) userNameEl.textContent = session.name;
if (barangayEl) barangayEl.textContent = session.barangay;
if (avatarEl) avatarEl.textContent = session.name.charAt(0).toUpperCase();

let committeeData = null;

async function init() {
  await loadCommitteeData();
  await loadMembers();
  await loadProjects();
  await loadBudget();
}

async function loadCommitteeData() {
  try {
    const res = await fetch(`${API}/getCommittees?barangay=${encodeURIComponent(session.barangay)}`);
    const text = await res.text();
    
    if (text === 'ERROR') {
      Toast.show('Could not load committee data', true);
      return;
    }
    
    const committees = JSON.parse(text);
    committeeData = committees.find(c => c.committeeName === committeeName);
    
    if (!committeeData) {
      Toast.show('Committee not found', true);
      setTimeout(() => window.location.href = 'Committee', 2000);
      return;
    }
    
    const committeeNameEl = document.getElementById('committeeName');
    const committeeHeadEl = document.getElementById('committeeHead');
    
    if (committeeNameEl) committeeNameEl.textContent = committeeData.committeeName;
    if (committeeHeadEl) committeeHeadEl.innerHTML = `Head: <span>${committeeData.headName || 'Not assigned'}</span>`;
    
  } catch (e) {
    console.error('Error loading committee:', e);
    Toast.show('Could not load committee data', true);
  }
}

async function loadMembers() {
  try {
    const res = await fetch(`${API}/getCommitteeMembers?committeeName=${encodeURIComponent(committeeName)}&barangay=${encodeURIComponent(session.barangay)}`);
    const text = await res.text();
    
    console.log('Members response:', text);
    
    if (text === 'ERROR') {
      Toast.show('Could not load members', true);
      return;
    }
    
    const data = JSON.parse(text);
    const membersList = document.getElementById('membersList');
    
    if (!membersList) return;
    
    const members = [];
    if (data.head && data.head !== '') {
      members.push({ name: data.head, isHead: true, id: 'head' });
    }
    
    if (data.members && Array.isArray(data.members)) {
      data.members.forEach((m, index) => {
        members.push({ name: m.name, isHead: false, id: index });
      });
    }
    
    if (members.length === 0) {
      membersList.innerHTML = '<p class="empty-state">No members yet. Click "+ Add Member" to add councilors.</p>';
      return;
    }
    
    membersList.innerHTML = members.map(m => `
      <div class="member-card">
        <div class="member-info">
          <div class="member-avatar">${escapeHtml(m.name.charAt(0).toUpperCase())}</div>
          <div>
            <div class="member-name">${escapeHtml(m.name)}</div>
            <div class="member-role">${m.isHead ? 'Committee Head' : 'Member'}</div>
          </div>
        </div>
        ${!m.isHead ? `<button class="action-btn" onclick="removeMember('${escapeHtml(m.name)}')">Remove</button>` : ''}
      </div>
    `).join('');
    
  } catch (e) {
    console.error('Error loading members:', e);
    Toast.show('Could not load members', true);
  }
}

async function loadProjects() {
  try {
    const res = await fetch(`${API}/getProjects?barangay=${encodeURIComponent(session.barangay)}&committeeName=${encodeURIComponent(committeeName)}`, {
      credentials: 'include'
    });
    const text = await res.text();
    
    if (text === 'ERROR') {
      Toast.show('Could not load projects', true);
      return;
    }
    
    const projects = JSON.parse(text);
    const projectsList = document.getElementById('projectsList');
    const projectCountEl = document.getElementById('projectCount');
    
    if (projectCountEl) projectCountEl.textContent = projects.length || 0;
    
    if (!projectsList) return;
    
    if (!projects || projects.length === 0) {
      projectsList.innerHTML = '<p class="empty-state">No projects yet. Click "+ Add Project" to create one.</p>';
      return;
    }
    
    projectsList.innerHTML = `
      <div class="projects-table-wrap">
        <table class="projects-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Purpose</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Submitted By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${projects.map(p => `
              <tr>
                <td><strong>${escapeHtml(p.projectName)}</strong></td>
                <td class="purpose-cell">${escapeHtml(p.purpose || '—')}</td>
                <td>₱${(p.totalCost || 0).toLocaleString('en-PH')}</td>
                <td><span class="status-pill status-${p.status}">${p.status}</span></td>
                <td>${escapeHtml(p.councilorName)}</td>
                <td>
                  <div style="display: flex; gap: 0.5rem;">
                    ${p.status === 'PENDING' ? 
                      `<button class="action-btn edit-btn" onclick="editProject(${p.id})">✏️ Edit</button>
                       <button class="action-btn delete-btn" onclick="deleteProject(${p.id}, '${escapeHtml(p.projectName)}')">🗑️ Delete</button>` : 
                      `<button class="action-btn view-btn" onclick="viewProject(${p.id})">👁️ View</button>`
                    }
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
  } catch (e) {
    console.error('Error loading projects:', e);
    Toast.show('Could not load projects', true);
  }
}

async function loadBudget() {
  try {
    const res = await fetch(`${API}/getBudget?barangay=${encodeURIComponent(session.barangay)}`);
    const text = await res.text();
    
    if (text === 'ERROR') {
      Toast.show('Could not load budget', true);
      return;
    }
    
    const data = JSON.parse(text);
    const committeeBudget = data.committees?.find(c => c.committeeName === committeeName);
    const allocated = committeeBudget?.allocated || 0;
    const spent = committeeBudget?.spent || 0;
    const remaining = allocated - spent;
    
    const totalBudgetEl = document.getElementById('totalBudget');
    const spentBudgetEl = document.getElementById('spentBudget');
    const remainingBudgetEl = document.getElementById('remainingBudget');
    
    if (totalBudgetEl) totalBudgetEl.textContent = `₱${allocated.toLocaleString('en-PH')}`;
    if (spentBudgetEl) spentBudgetEl.textContent = `₱${spent.toLocaleString('en-PH')}`;
    if (remainingBudgetEl) remainingBudgetEl.textContent = `₱${remaining.toLocaleString('en-PH')}`;
    
  } catch (e) {
    console.error('Error loading budget:', e);
    Toast.show('Could not load budget', true);
  }
}

// ==================== DELETE PROJECT ====================
async function deleteProject(projectId, projectName) {
  if (!confirm(`Are you sure you want to delete project "${projectName}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API}/deleteProject`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        projectId: projectId,
        barangay: session.barangay
      })
    });
    
    const result = await response.text();
    
    if (result === 'SUCCESS') {
      Toast.show(`Project "${projectName}" has been deleted.`);
      await loadProjects();
      await loadBudget();
    } else if (result === 'PROJECT_NOT_FOUND') {
      Toast.show('Project not found', true);
    } else if (result === 'CANNOT_DELETE_APPROVED_PROJECT') {
      Toast.show('Cannot delete an approved project', true);
    } else {
      Toast.show('Error deleting project: ' + result, true);
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    Toast.show('Could not delete project', true);
  }
}

async function addMember() {
  const memberName = document.getElementById('memberName')?.value.trim();
  if (!memberName) {
    Toast.show('Please enter a councilor name', true);
    return;
  }
  
  try {
    const res = await fetch(`${API}/addCommitteeMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        committeeName: committeeName,
        barangay: session.barangay,
        councilorName: memberName
      })
    });
    
    const text = await res.text();
    
    if (text === 'SUCCESS') {
      Toast.show('Member added successfully!');
      closeMemberModal();
      await loadMembers();
    } else if (text === 'COUNCILOR_NOT_IN_BARANGAY') {
      Toast.show('Councilor not found in this barangay', true);
    } else if (text === 'ALREADY_A_MEMBER') {
      Toast.show('Councilor is already a member', true);
    } else {
      Toast.show('Error: ' + text, true);
    }
  } catch (e) {
    console.error('Error adding member:', e);
    Toast.show('Could not add member', true);
  }
}

async function submitProject() {
  const projectData = {
    projectName: document.getElementById('projectName')?.value.trim(),
    purpose: document.getElementById('projectPurpose')?.value.trim(),
    committeeName: committeeName,
    barangay: session.barangay,
    councilorName: session.name,
    totalCost: parseFloat(document.getElementById('projectCost')?.value) || 0
  };
  
  if (!projectData.projectName) {
    Toast.show('Project name is required', true);
    return;
  }
  
  try {
    const res = await fetch(`${API}/addProject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(projectData)
    });
    
    const text = await res.text();
    console.log('Add project response:', text);  // Debug log
    
    if (text === 'SUCCESS') {
      Toast.show('Project submitted for approval!');
      closeProjectModal();
      await loadProjects();
      await loadBudget();
      
      // Reset form
      const projectNameInput = document.getElementById('projectName');
      const projectPurposeInput = document.getElementById('projectPurpose');
      const projectCostInput = document.getElementById('projectCost');
      
      if (projectNameInput) projectNameInput.value = '';
      if (projectPurposeInput) projectPurposeInput.value = '';
      if (projectCostInput) projectCostInput.value = '';
      
    } else if (text.includes('INSUFFICIENT_BUDGET')) {
      // Use includes() instead of startsWith() to be safe
      Toast.show(text, true);
    } else if (text === 'NO_BUDGET_ALLOCATED') {
      Toast.show('No budget has been allocated for this committee yet.', true);
    } else if (text === 'NOT_A_COMMITTEE_MEMBER') {
      Toast.show('You are not a member of this committee.', true);
    } else if (text === 'COUNCILOR_NOT_IN_BARANGAY') {
      Toast.show('Councilor not found in this barangay.', true);
    } else if (text === 'COMMITTEE_NOT_FOUND') {
      Toast.show('Committee not found.', true);
    } else {
      Toast.show('Error: ' + text, true);
    }
  } catch (e) {
    console.error('Error submitting project:', e);
    Toast.show('Could not submit project', true);
  }
}

function openAddMemberModal() {
  const modal = document.getElementById('memberModal');
  if (modal) modal.classList.add('open');
}

function closeMemberModal() {
  const modal = document.getElementById('memberModal');
  if (modal) modal.classList.remove('open');
  const memberNameInput = document.getElementById('memberName');
  if (memberNameInput) memberNameInput.value = '';
}

function openAddProjectModal() {
  const modal = document.getElementById('projectModal');
  if (modal) modal.classList.add('open');
}

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  if (modal) modal.classList.remove('open');
}

async function viewProject(projectId) {
  console.log('Viewing project ID:', projectId);
  
  try {
    // Fetch project details directly from API
    const response = await fetch(`${API}/getProjectById?projectId=${projectId}`, {
      credentials: 'include'
    });
    const project = await response.json();
    
    console.log('Project data:', project);
    
    if (!project || project === 'PROJECT_NOT_FOUND') {
      Toast.show('Project not found', true);
      return;
    }
    
    // Create modal to show project details
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    
    // Show rejection reason if project is rejected
    let rejectionReasonHtml = '';
    if (project.status === 'REJECTED' && project.rejectionReason) {
      rejectionReasonHtml = `
        <div class="rejection-box">
          <h4>❌ Rejection Reason</h4>
          <div class="rejection-message">${escapeHtml(project.rejectionReason)}</div>
          <div class="rejection-note">This project has been rejected by the Chairman.</div>
        </div>
      `;
    }
    
    // For rejected projects, don't show community feedback section
    let feedbackSectionHtml = '';
    if (project.status !== 'REJECTED') {
      feedbackSectionHtml = `
        <div class="feedback-section-modal">
          <h3>💬 Community Feedback</h3>
          <div id="modal-feedback-${project.id}" class="modal-feedback-list">
            <div class="loading-feedback">Loading feedback...</div>
          </div>
        </div>
      `;
    }
    
    modal.innerHTML = `
      <div class="modal project-detail-modal">
        <h2>${escapeHtml(project.projectName)}</h2>
        <div class="project-info">
          <p><strong>Committee:</strong> ${escapeHtml(project.committeeName)}</p>
          <p><strong>Submitted by:</strong> ${escapeHtml(project.councilorName)}</p>
          <p><strong>Purpose:</strong> ${escapeHtml(project.purpose)}</p>
          <p><strong>Cost:</strong> ₱${(project.totalCost || 0).toLocaleString('en-PH')}</p>
          <p><strong>Status:</strong> <span class="status-pill status-${project.status}">${project.status}</span></p>
          ${rejectionReasonHtml}
        </div>
        ${feedbackSectionHtml}
        <div class="modal-actions">
          <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Only load feedback for non-rejected projects
    if (project.status !== 'REJECTED') {
      loadProjectFeedback(project.id).then(feedback => {
        const container = document.getElementById(`modal-feedback-${project.id}`);
        if (!container) return;
        
        if (!feedback || feedback.length === 0) {
          container.innerHTML = '<p class="feedback-empty">No feedback yet for this project.</p>';
          return;
        }
        
        container.innerHTML = feedback.map(f => `
          <div class="feedback-item">
            <div class="feedback-meta">
              <strong>${escapeHtml(f.authorName || 'Anonymous')}</strong>
              <span class="feedback-date">${formatDate(f.createdAt)}</span>
            </div>
            <div class="feedback-message">${escapeHtml(f.message)}</div>
            ${f.rating && f.rating > 0 ? `
              <div class="feedback-rating">
                ${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}
              </div>
            ` : ''}
          </div>
        `).join('');
      });
    }
    
  } catch (error) {
    console.error('Error loading project:', error);
    Toast.show('Could not load project details', true);
  }
}

function openEditModal(project) {
  const modal = document.getElementById('editProjectModal');
  if (!modal) return;
  
  document.getElementById('editProjectId').value = project.id;
  document.getElementById('editProjectName').value = project.projectName;
  document.getElementById('editProjectPurpose').value = project.purpose || '';
  document.getElementById('editProjectCost').value = project.totalCost || 0;
  
  modal.style.display = 'flex';
}

function closeEditModal() {
  const modal = document.getElementById('editProjectModal');
  if (modal) modal.style.display = 'none';
}

function renderTable(projects) {
  const tbody = document.getElementById('projectTableBody');
  if (!tbody) return;
  
  if (projects.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No projects found. </td></tr>`;
    return;
  }
  
  tbody.innerHTML = projects.map((p, i) => `
    <tr style="animation-delay:${i * 0.04}s" data-project-id="${p.id}">
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
      <td>
        <button class="action-btn view-btn" onclick="viewProject(${p.id})">👁️ View</button>
      </td>
    </tr>
  `).join('');
}

async function editProject(projectId) {
  console.log('Editing project ID:', projectId);
  try {
    const response = await fetch(`${API}/getProjectById?projectId=${projectId}`, {
      credentials: 'include'
    });
    const project = await response.json();
    console.log('Project data:', project);
    openEditModal(project);
  } catch (error) {
    console.error('Error loading project:', error);
    Toast.show('Could not load project details', true);
  }
}

async function updateProject() {
  const projectId = document.getElementById('editProjectId').value;
  const projectName = document.getElementById('editProjectName').value.trim();
  const purpose = document.getElementById('editProjectPurpose').value.trim();
  const totalCost = parseFloat(document.getElementById('editProjectCost').value) || 0;
  
  console.log('=== UPDATE PROJECT DEBUG ===');
  console.log('Project ID:', projectId);
  console.log('Project Name:', projectName);
  console.log('Purpose:', purpose);
  console.log('Total Cost:', totalCost);
  
  if (!projectName) {
    Toast.show('Project name is required', true);
    return;
  }
  
  // ✅ Make sure barangay is included
  const barangay = localStorage.getItem('sk_barangay') || 'Lahug';
  console.log('Barangay being sent:', barangay);
  
  const requestBody = {
    id: parseInt(projectId),
    projectName: projectName,
    purpose: purpose,
    totalCost: totalCost,
    barangay: barangay  // ← Add this line
  };
  
  console.log('Request body:', requestBody);
  
  try {
    const response = await fetch(`${API}/updateProject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });
    
    const result = await response.text();
    console.log('Server response:', result);
    
    if (result === 'SUCCESS') {
      Toast.show('Project updated successfully!');
      closeEditModal();
      await loadProjects();
      await loadBudget();
    } else {
      Toast.show('Error updating project: ' + result, true);
    }
  } catch (error) {
    console.error('Error updating project:', error);
    Toast.show('Could not update project', true);
  }
}

async function removeMember(memberName) {
  if (!confirm(`Remove "${memberName}" from the committee?`)) return;
  
  try {
    const res = await fetch(`${API}/removeCommitteeMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        committeeName: committeeName,
        barangay: session.barangay,
        councilorName: memberName
      })
    });
    
    const text = await res.text();
    
    if (text === 'SUCCESS') {
      Toast.show('Member removed successfully!');
      await loadMembers();
    } else if (text === 'CANNOT_REMOVE_COMMITTEE_HEAD') {
      Toast.show('Cannot remove the committee head', true);
    } else {
      Toast.show('Error removing member', true);
    }
  } catch (e) {
    console.error('Error removing member:', e);
    Toast.show('Could not remove member', true);
  }
}

async function loadProjectFeedback(projectId) {
  try {
    const response = await fetch(`${API}/getProjectComments?projectId=${projectId}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch feedback');
    
    const feedback = await response.json();
    return feedback;
  } catch (error) {
    console.error('Error loading feedback:', error);
    return [];
  }
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Make functions global
window.openAddMemberModal = openAddMemberModal;
window.closeMemberModal = closeMemberModal;
window.addMember = addMember;
window.openAddProjectModal = openAddProjectModal;
window.closeProjectModal = closeProjectModal;
window.submitProject = submitProject;
window.viewProject = viewProject;
window.removeMember = removeMember;
window.deleteProject = deleteProject;  

// Start initialization
init();