const API = 'http://localhost:8080/api';

  // ── SESSION (read from localStorage set at login) ──
  const session = {
    name:     localStorage.getItem('sk_name')     || 'Councilor',
    barangay: localStorage.getItem('sk_barangay') || 'Lahug'
  };

  // Update sidebar user info
  document.getElementById('sidebarName').textContent = session.name;
  document.getElementById('sidebarBarangay').textContent = session.barangay;
  document.getElementById('avatarInitial').textContent = session.name.charAt(0).toUpperCase();

  document.querySelectorAll('.nav-item').forEach(a => {
    if (a.textContent.trim() === 'Committee') {
      a.addEventListener('click', () => {
        window.location.href = 'Committee.html';
      });
    }
  });


  let allProjects = [];
  let committees  = [];

  // ── INIT ──
  async function init() {
    await loadCommittees();
    await loadProjects();
    await loadBudget();
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

  async function loadProjects(committeeName) {
    const tbody = document.getElementById('projectTableBody');
    tbody.innerHTML = `<tr class="loader-row"><td colspan="6"><div class="loader"><span></span><span></span><span></span></div></td></tr>`;

    try {
      allProjects = [];

      if (committeeName) {
        const res = await fetch(`${API}/getProjects?barangay=${encodeURIComponent(session.barangay)}&committeeName=${encodeURIComponent(committeeName)}`);
        const data = await res.json();
        if (Array.isArray(data)) allProjects = data.map(p => ({ ...p, committeeName }));
      } else {
        for (const c of committees) {
          const res = await fetch(`${API}/getProjects?barangay=${encodeURIComponent(session.barangay)}&committeeName=${encodeURIComponent(c.name)}`);
          const data = await res.json();
          if (Array.isArray(data)) data.forEach(p => allProjects.push({ ...p, committeeName: c.name }));
        }
      }
      applyFilters();
    } catch (e) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">⚠️ Could not connect to the server.</td></tr>`;
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

  async function submitProject() {
    const body = {
      projectName:   document.getElementById('formProjectName').value.trim(),
      purpose:       document.getElementById('formPurpose').value.trim(),
      committeeName: document.getElementById('formCommittee').value,
      barangay:      session.barangay,
      councilorName: session.name,
      totalCost:     parseFloat(document.getElementById('formCost').value) || 0
    };

    if (!body.projectName || !body.purpose || !body.committeeName) {
      showToast('Please fill in all required fields.', true);
      return;
    }

    try {
      const res  = await fetch(`${API}/addProject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const text = await res.text();

      if (text === 'SUCCESS') {
        showToast('Project submitted! Awaiting chairman approval.');
        closeModal();
        // Reset form
        ['formProjectName','formPurpose','formCost'].forEach(id => document.getElementById(id).value = '');
        await loadProjects(document.getElementById('committeeFilter').value || null);
      } else {
        showToast('Submission failed: ' + text, true);
      }
    } catch (e) {
      showToast('Could not connect to server.', true);
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