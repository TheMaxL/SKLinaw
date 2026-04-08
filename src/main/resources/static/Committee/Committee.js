// ── SESSION (from shared.js) ──
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
let committees = [];

// ── INIT ──
async function init() {
  try {
    await loadCommittees();
    await loadCommitteesTable();
    await loadBudget();
  } catch (error) {
    console.error('Init error:', error);
    Toast.show('Error loading initial data', true);
  }
}

// ── LOAD COMMITTEES ──
async function loadCommittees() {
  try {
    const url = `${API}/getCommittees?barangay=${encodeURIComponent(session.barangay)}`;
    const res = await fetch(url);
    const text = await res.text();

    if (text === 'ERROR') {
      committees = [];
      Toast.show('Could not load committees from server', true);
      return;
    }

    try {
      committees = JSON.parse(text) || [];
    } catch {
      committees = [];
      Toast.show('Invalid data received from server', true);
      return;
    }

    // Populate dropdown
    const filter = document.getElementById('committeeFilter');
    if (filter) {
      filter.innerHTML = '<option value="">All committees</option>';
      committees.forEach(c => {
        filter.innerHTML += `<option value="${esc(c.name)}">${esc(c.name)}</option>`;
      });
    }

  } catch (e) {
    console.error('Error in loadCommittees:', e);
    committees = [];
    const filter = document.getElementById('committeeFilter');
    if (filter) filter.innerHTML = '<option>Could not load committees</option>';
    Toast.show('Could not connect to server', true);
  }
}

// ── LOAD COMMITTEES TABLE ──
async function loadCommitteesTable() {
  const tbody = document.getElementById('projectTableBody');
  if (!tbody) return;

  if (!Array.isArray(committees) || committees.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">
          No committees found. Click "+ Add Committees" to create one!
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = committees.map((c, i) => `
    <tr style="animation-delay:${i * 0.05}s">
      <td class="project-name-cell">${esc(c.name)}</td>
      <td style="color:var(--muted)">—</td>
      <td>
        ${c.headName 
          ? esc(c.headName) 
          : '<span style="color:var(--muted)">No head assigned</span>'}
      </td>
      <td style="color:var(--muted)">—</td>
      <td>
        <button class="action-btn"
          data-name="${esc(c.name)}"
          onclick="assignHead(this.dataset.name)">
          Assign Head
        </button>
      </td>
    </tr>
  `).join('');
}

// ── LOAD BUDGET ──
async function loadBudget(committeeName) {
  try {
    const res = await fetch(`${API}/getBudget?barangay=${encodeURIComponent(session.barangay)}`);
    const data = await res.json();
    renderBudget(data, committeeName);
  } catch (e) {
    console.error('Error loading budget:', e);
    const budgetCard = document.getElementById('budgetCard');
    if (budgetCard) {
      budgetCard.innerHTML = `
        <div style="color:var(--muted);font-size:0.85rem">
          Budget data unavailable.
        </div>`;
    }
  }
}

// ── RENDER BUDGET ──
function renderBudget(data, filterCommittee) {
  const budgetCard = document.getElementById('budgetCard');
  if (!budgetCard) return;

  let rows = data.committees || [];
  if (filterCommittee) {
    rows = rows.filter(c => c.committeeName === filterCommittee);
  }

  const totalBudget = Number(data.totalBudget) || 0;
  const totalSpent  = rows.reduce((s, c) => s + (c.spent || 0), 0);

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
      ${rows.map(c => {
        const pct = c.allocated > 0
          ? Math.min((c.spent / c.allocated) * 100, 100)
          : 0;

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
              <div class="progress-fill ${over ? 'over' : ''}"
                   style="width:${pct}%"></div>
            </div>
          </div>`;
      }).join('')}
    </div>
  `;
}

// ── FILTER CHANGE ──
function onCommitteeChange() {
  const selected = document.getElementById('committeeFilter').value;

  if (selected) {
    window.location.href = `committee-detail.html?name=${encodeURIComponent(selected)}`;
  }
}

// ── BASIC FILTER (placeholder) ──
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
    name: nameInput?.value.trim(),
    barangay: session.barangay,
    headName: headInput?.value.trim() || ""
  };

  if (!body.name) {
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

      await loadCommittees();
      await loadCommitteesTable();
      await loadBudget();

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
        name: committeeName,
        barangay: session.barangay,
        headName: headName.trim()
      })
    });

    const text = await res.text();

    if (text === 'SUCCESS') {
      Toast.show('Head assigned successfully!');
      await loadCommittees();
      await loadCommitteesTable();
    } else if (text === 'COUNCILOR_NOT_FOUND') {
      Toast.show('Councilor not found.', true);
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

// ── CLOSE MODAL ON OUTSIDE CLICK ──
document.getElementById('modalOverlay')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ── GLOBAL EXPORTS ──
window.openModal = openModal;
window.closeModal = closeModal;
window.submitCommittee = submitCommittee;
window.assignHead = assignHead;
window.onCommitteeChange = onCommitteeChange;
window.applyFilters = applyFilters;

// ── START ──
init();
  // ── SESSION (read from localStorage set at login) ──
  const session = {
    name:     localStorage.getItem('sk_name')     || 'Councilor',
    barangay: localStorage.getItem('sk_barangay') || 'Lahug'
  };

  // Update sidebar user info
  document.getElementById('dash-user-name').textContent = session.name;
  document.getElementById('dash-barangay').textContent = session.barangay;
  document.getElementById('dash-avatar').textContent = session.name.charAt(0).toUpperCase();

  let allProjects = [];
  let committees  = [];

  // ── INIT ──
  async function init() {
    await loadCommittees();
    await loadCommitteesTable();
    await loadBudget();

    // Auto-load first committee's projects
    if (committees.length > 0) {
      const first = committees[0].name;
      document.getElementById('committeeFilter').value = first;
      await loadProjects(first);
      await loadBudget(first);
    }
  }

  async function loadCommittees() {
    try {
      const res = await fetch(`${API}/getCommittees?barangay=${encodeURIComponent(session.barangay)}`);
      committees = await res.json();

      const filter = document.getElementById('committeeFilter');
      const formSel = document.getElementById('formCommittee');
      filter.innerHTML = '<option value="">All committees</option>';
      formSel.innerHTML = '';

      committees.forEach(c => {
        filter.innerHTML += `<option value="${escHtml(c.name)}">${escHtml(c.name)}</option>`;
        formSel.innerHTML += `<option value="${escHtml(c.name)}">${escHtml(c.name)}</option>`;
      });
    } catch (e) {
      document.getElementById('committeeFilter').innerHTML = '<option>Could not load</option>';
    }
  }

  async function loadCommitteesTable() {
    const tbody = document.getElementById('projectTableBody');

    try {
        const res = await fetch(`${API}/getCommittees?barangay=${encodeURIComponent(session.barangay)}`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No committees found.</td></tr>`;
        return;
        }

        tbody.innerHTML = data.map((c, i) => `
        <tr style="animation-delay:${i * 0.05}s">
            <td class="project-name-cell">${escHtml(c.name)}</td>
            <td style="color:var(--muted)">—</td>
            <td>${c.headName ? escHtml(c.headName) : '<span style="color:var(--muted)">No head</span>'}</td>
            <td style="color:var(--muted)">—</td>
            <td>
            <button class="action-btn" onclick="assignHead('${c.name}')">Assign Head</button>
            </td>
        </tr>
        `).join('');

    } catch (e) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="5">⚠️ Could not load committees.</td></tr>`;
    }
    }

  async function loadBudget(committeeName) {
    try {
      const res = await fetch(`${API}/getBudget?barangay=${encodeURIComponent(session.barangay)}`);
      const data = await res.json();
      renderBudget(data, committeeName);
    } catch (e) {
      document.getElementById('budgetCard').innerHTML = `<div style="color:var(--muted);font-size:0.85rem">Budget data unavailable.</div>`;
    }
  }

  function renderBudget(data, filterCommittee) {
    let rows = data.committees || [];
    if (filterCommittee) rows = rows.filter(c => c.committeeName === filterCommittee);

    const totalBudget = data.totalBudget || 0;
    const totalSpent  = rows.reduce((s, c) => s + (c.spent || 0), 0);

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
                <span class="committee-row-amounts">₱${(c.spent||0).toLocaleString('en-PH')} / ₱${(c.allocated||0).toLocaleString('en-PH')}</span>
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
    const status = document.getElementById('statusFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
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
    if (projects.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No projects found.</td></tr>`;
      return;
    }
    tbody.innerHTML = projects.map((p, i) => `
      <tr style="animation-delay:${i * 0.04}s">
        <td class="project-name-cell">${escHtml(p.projectName)}</td>
        <td class="project-purpose-cell">${escHtml(p.purpose || '—')}</td>
        <td class="cost-cell">₱${(p.totalCost||0).toLocaleString('en-PH')}</td>
        <td><span class="status-pill status-${p.status}">${p.status}</span></td>
        <td style="color:var(--muted);font-size:0.78rem">${formatDate(p.createdAt)}</td>
        <td><button class="action-btn" onclick="viewProject(${p.id})">View</button></td>
      </tr>
    `).join('');
  }

  function onCommitteeChange() {
    const val = document.getElementById('committeeFilter').value;
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

  async function submitCommittee() {
    const body = {
        name: document.getElementById('formProjectName').value.trim(),
        barangay: session.barangay,                // automatically set from session
        headName: document.getElementById('formPurpose').value.trim() || "" // allow empty
    };

    if (!body.name) {
        showToast('Committee name is required.', true);
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
            showToast('Committee created successfully!');
            closeModal();
            document.getElementById('formProjectName').value = '';
            document.getElementById('formPurpose').value = '';
            await loadCommittees();
            await loadCommitteesTable();
        } else if (text === 'COMMITTEE_ALREADY_EXISTS') {
            showToast('Committee already exists.', true);
        } else {
            showToast('Error: ' + text, true);
        }
    } catch (e) {
        showToast('Could not connect to server.', true);
        console.error(e);
    }
  }

  async function loadProjects(committeeName) {
    if (!committeeName) {
      allProjects = [];
      renderTable([]);
      return;
    }

    try {
      const res = await fetch(
        `${API}/getProjects?barangay=${encodeURIComponent(session.barangay)}&committeeName=${encodeURIComponent(committeeName)}`
      );

      const data = await res.json();

      if (!Array.isArray(data)) {
        allProjects = [];
      } else {
        allProjects = data;
      }

      renderTable(allProjects);

    } catch (e) {
      console.error(e);
      showToast('Could not load projects.', true);
    }
  }

  async function assignHead(committeeName) {
    const headName = prompt(`Enter head name for "${committeeName}":`);

    if (!headName) return;

    const body = {
      name: committeeName,
      barangay: session.barangay,
      headName: headName.trim()
    };

    try {
      const res = await fetch(`${API}/assignCommitteeHead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const text = await res.text();

      if (text === 'SUCCESS') {
        showToast('Head assigned successfully!');
        await loadCommittees();
        await loadCommitteesTable();
      } else if (text === 'COUNCILOR_NOT_FOUND') {
        showToast('Councilor not found or not approved.', true);
      } else if (text === 'ALREADY_HEADS_A_COMMITTEE') {
        showToast('This councilor already heads another committee.', true);
      } else if (text === 'COMMITTEE_NOT_FOUND') {
        showToast('Committee not found.', true);
      } else {
        showToast('Error: ' + text, true);
      }

    } catch (e) {
      console.error(e);
      showToast('Server error while assigning head.', true);
    }
  }

  function viewProject(id) {
    // Placeholder — expand to open a detail modal
    alert(`Viewing project ID: ${id}\n(Connect to your project detail endpoint here.)`);
  }

  // ── HELPERS ──
  function showToast(msg, isError = false) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (isError ? ' error' : '');
    setTimeout(() => t.classList.remove('show'), 3500);
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function formatDate(str) {
    if (!str) return '—';
    try { return new Date(str).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }); }
    catch { return str; }
  }

  // Close modal on overlay click
  document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  init();
