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