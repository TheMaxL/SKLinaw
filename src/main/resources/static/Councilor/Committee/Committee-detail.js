// Get committee name from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const committeeName = urlParams.get('name');

if (!committeeName) {
  window.location.href = 'Committee.html';
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
    
    // Handle error response
    if (text === 'ERROR') {
      Toast.show('Could not load committee data', true);
      return;
    }
    
    const committees = JSON.parse(text);
    committeeData = committees.find(c => c.committeeName === committeeName);
    
    if (!committeeData) {
      Toast.show('Committee not found', true);
      setTimeout(() => window.location.href = 'Committee.html', 2000);
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
    
    console.log('Members response:', text); // Debug
    
    // Handle error response
    if (text === 'ERROR') {
      Toast.show('Could not load members', true);
      return;
    }
    
    // Parse the response (it's an object with head and members array)
    const data = JSON.parse(text);
    const membersList = document.getElementById('membersList');
    
    if (!membersList) return;
    
    // Create members array including the head as first member
    const members = [];
    if (data.head && data.head !== '') {
      members.push({ name: data.head, isHead: true, id: 'head' });
    }
    
    // Add regular members (data.members is an array)
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
    const res = await fetch(`${API}/getProjects?barangay=${encodeURIComponent(session.barangay)}&committeeName=${encodeURIComponent(committeeName)}`);
    const text = await res.text();
    
    // Handle error response
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
                <td><button class="action-btn" onclick="viewProject(${p.id})">View</button></td>
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
      body: JSON.stringify(projectData)
    });
    
    const text = await res.text();
    
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

function viewProject(id) {
  window.location.href = `/Project/project-detail.html?id=${id}`;
}

async function removeMember(memberName) {
  if (!confirm(`Remove "${memberName}" from the committee?`)) return;
  
  try {
    const res = await fetch(`${API}/removeCommitteeMember`, {
      method: 'POST',  // Change from DELETE to POST
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

// Helper function to escape HTML
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

// Start initialization
init();