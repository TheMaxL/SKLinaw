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
document.getElementById('dash-user-name').textContent = session.name;
document.getElementById('dash-barangay').textContent = session.barangay;
document.getElementById('dash-avatar').textContent = session.name.charAt(0).toUpperCase();

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
    const committees = await res.json();
    committeeData = committees.find(c => c.name === committeeName);
    
    if (!committeeData) {
      Toast.show('Committee not found', true);
      setTimeout(() => window.location.href = 'Committee.html', 2000);
      return;
    }
    
    document.getElementById('committeeName').textContent = committeeData.name;
    document.getElementById('committeeHead').innerHTML = `Head: <span>${committeeData.headName || 'Not assigned'}</span>`;
    
  } catch (e) {
    console.error('Error loading committee:', e);
    Toast.show('Could not load committee data', true);
  }
}

async function loadMembers() {
  try {
    const res = await fetch(`${API}/getCommitteeMembers?committeeName=${encodeURIComponent(committeeName)}&barangay=${encodeURIComponent(session.barangay)}`);
    const members = await res.json();
    
    const membersList = document.getElementById('membersList');
    
    if (!members || members.length === 0) {
      membersList.innerHTML = '<p class="empty-state">No members yet. Click "+ Add Member" to add councilors.</p>';
      return;
    }
    
    membersList.innerHTML = members.map(m => `
      <div class="member-card">
        <div class="member-info">
          <div class="member-avatar">${m.name.charAt(0).toUpperCase()}</div>
          <div>
            <div class="member-name">${esc(m.name)}</div>
            <div class="member-role">${m.isHead ? 'Committee Head' : 'Member'}</div>
          </div>
        </div>
        ${!m.isHead ? `<button class="action-btn" onclick="removeMember(${m.id})">Remove</button>` : ''}
      </div>
    `).join('');
    
  } catch (e) {
    console.error('Error loading members:', e);
  }
}

async function loadProjects() {
  try {
    const res = await fetch(`${API}/getProjects?barangay=${encodeURIComponent(session.barangay)}&committeeName=${encodeURIComponent(committeeName)}`);
    const projects = await res.json();
    
    const projectsList = document.getElementById('projectsList');
    document.getElementById('projectCount').textContent = projects.length || 0;
    
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
                <td><strong>${esc(p.projectName)}</strong></td>
                <td class="purpose-cell">${esc(p.purpose || '—')}</td>
                <td>₱${(p.totalCost || 0).toLocaleString('en-PH')}</td>
                <td><span class="status-pill status-${p.status}">${p.status}</span></td>
                <td>${esc(p.councilorName)}</td>
                <td><button class="action-btn" onclick="viewProject(${p.id})">View</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
  } catch (e) {
    console.error('Error loading projects:', e);
  }
}

async function loadBudget() {
  try {
    const res = await fetch(`${API}/getBudget?barangay=${encodeURIComponent(session.barangay)}`);
    const data = await res.json();
    
    const committeeBudget = data.committees?.find(c => c.committeeName === committeeName);
    const allocated = committeeBudget?.allocated || 0;
    const spent = committeeBudget?.spent || 0;
    const remaining = allocated - spent;
    
    document.getElementById('totalBudget').textContent = `₱${allocated.toLocaleString('en-PH')}`;
    document.getElementById('spentBudget').textContent = `₱${spent.toLocaleString('en-PH')}`;
    document.getElementById('remainingBudget').textContent = `₱${remaining.toLocaleString('en-PH')}`;
    
  } catch (e) {
    console.error('Error loading budget:', e);
  }
}

async function addMember() {
  const memberName = document.getElementById('memberName').value.trim();
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
    projectName: document.getElementById('projectName').value.trim(),
    purpose: document.getElementById('projectPurpose').value.trim(),
    committeeName: committeeName,
    barangay: session.barangay,
    councilorName: session.name,
    totalCost: parseFloat(document.getElementById('projectCost').value) || 0
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
      document.getElementById('projectName').value = '';
      document.getElementById('projectPurpose').value = '';
      document.getElementById('projectCost').value = '';
    } else {
      Toast.show('Error: ' + text, true);
    }
  } catch (e) {
    console.error('Error submitting project:', e);
    Toast.show('Could not submit project', true);
  }
}

function openAddMemberModal() {
  document.getElementById('memberModal').classList.add('open');
}

function closeMemberModal() {
  document.getElementById('memberModal').classList.remove('open');
  document.getElementById('memberName').value = '';
}

function openAddProjectModal() {
  document.getElementById('projectModal').classList.add('open');
}

function closeProjectModal() {
  document.getElementById('projectModal').classList.remove('open');
}

function viewProject(id) {
  // Navigate to project detail page or open modal
  window.location.href = `/Project/project-detail.html?id=${id}`;
}

async function removeMember(memberId) {
  if (!confirm('Remove this member from the committee?')) return;
  
  try {
    const res = await fetch(`${API}/removeCommitteeMember`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, committeeName })
    });
    
    const text = await res.text();
    
    if (text === 'SUCCESS') {
      Toast.show('Member removed successfully!');
      await loadMembers();
    } else {
      Toast.show('Error removing member', true);
    }
  } catch (e) {
    console.error('Error removing member:', e);
    Toast.show('Could not remove member', true);
  }
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

init();