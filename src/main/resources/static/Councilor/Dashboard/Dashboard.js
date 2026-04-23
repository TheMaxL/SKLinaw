document.addEventListener('DOMContentLoaded', () => {
  if (!Session.name) { location.href = 'dashboard.html'; return; }

  // Populate user info
  document.getElementById('dash-avatar').textContent     = Session.name.charAt(0).toUpperCase();
  document.getElementById('dash-user-name').textContent  = Session.name;
  document.getElementById('dash-barangay').textContent   = Session.barangay;
  document.getElementById('dash-greet-name').textContent = Session.name.split(' ')[0];
  document.getElementById('dash-greet-sub').textContent  = `SK Councilor · ${Session.barangay}`;
  document.getElementById('dash-today').textContent      = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  document.getElementById('logout-btn').addEventListener('click', () => {
    Session.clear();
    Toast.show('Logged out successfully.');
    setTimeout(() => location.href = 'index.html', 800);
  });

  loadProjects();
  loadBudget();
});

async function loadProjects() {
  try {
    const cRes = await fetch(`${API}/getCommittees?barangay=${encodeURIComponent(Session.barangay)}`);
    const coms = await cRes.json();
    let all = [];
    for (const c of coms) {
      const pRes = await fetch(`${API}/getProjects?barangay=${encodeURIComponent(Session.barangay)}&committeeName=${encodeURIComponent(c.name)}`);
      const ps   = await pRes.json();
      if (Array.isArray(ps)) ps.forEach(p => all.push({ ...p, committeeName: c.name }));
    }
    const mine = all.filter(p => p.councilorName === Session.name);
    document.getElementById('qs-total').textContent    = mine.length;
    document.getElementById('qs-pending').textContent  = mine.filter(p => p.status === 'PENDING').length;
    document.getElementById('qs-approved').textContent = mine.filter(p => p.status === 'APPROVED').length;
    renderRecent(mine.slice(0, 5));
  } catch {
    // Sample data
    const sample = [
      { projectName: 'Youth Sports Fest',   committeeName: 'Sports',      totalCost: 12500, status: 'APPROVED', createdAt: new Date() },
      { projectName: 'Leadership Training', committeeName: 'Education',   totalCost: 8000,  status: 'PENDING',  createdAt: new Date() },
      { projectName: 'Eco Drive 2025',      committeeName: 'Environment', totalCost: 5000,  status: 'APPROVED', createdAt: new Date() },
    ];
    document.getElementById('qs-total').textContent    = sample.length;
    document.getElementById('qs-pending').textContent  = 1;
    document.getElementById('qs-approved').textContent = 2;
    renderRecent(sample);
  }
}

function renderRecent(projects) {
  const el = document.getElementById('recent-projects');
  if (!projects.length) {
    el.innerHTML = '<p style="color:var(--muted);font-size:0.84rem;padding:0.5rem 0">No projects submitted yet.</p>';
    return;
  }
  el.innerHTML = projects.map(p => `
    <div class="project-row">
      <div>
        <div class="pr-name">${esc(p.projectName)}</div>
        <div class="pr-meta">${esc(p.committeeName)} · ${fmtDateShort(p.createdAt)}</div>
      </div>
      <div class="pr-right">
        <div class="pr-cost">₱${(p.totalCost || 0).toLocaleString('en-PH')}</div>
        <span class="pill pill-${(p.status || 'pending').toLowerCase()}">${p.status}</span>
      </div>
    </div>`).join('');
}

async function loadBudget() {
  try {
    const res  = await fetch(`${API}/getBudget?barangay=${encodeURIComponent(Session.barangay)}`);
    const data = await res.json();
    const remaining = (data.totalBudget || 0) - (data.committees || []).reduce((s, c) => s + (c.spent || 0), 0);
    document.getElementById('qs-budget').textContent = '₱' + Math.max(0, remaining).toLocaleString('en-PH');
    renderBudget(data);
  } catch {
    const sample = {
      totalBudget: 250000,
      committees: [
        { committeeName: 'Sports',      allocated: 60000, spent: 42000 },
        { committeeName: 'Education',   allocated: 80000, spent: 35000 },
        { committeeName: 'Environment', allocated: 50000, spent: 18000 },
      ]
    };
    const remaining = sample.totalBudget - sample.committees.reduce((s, c) => s + c.spent, 0);
    document.getElementById('qs-budget').textContent = '₱' + remaining.toLocaleString('en-PH');
    renderBudget(sample);
  }
}

function renderBudget(data) {
  const panel = document.getElementById('budget-panel');
  panel.innerHTML = `
    <div class="budget-total">₱${(data.totalBudget || 0).toLocaleString('en-PH')}</div>
    <div class="budget-sub">Total SK budget · ${esc(Session.barangay)}</div>
    ${(data.committees || []).map(c => {
      const pct = c.allocated > 0 ? Math.min((c.spent / c.allocated) * 100, 100) : 0;
      return `
        <div class="budget-bar-item">
          <div class="bbar-header">
            <span class="bbar-name">${esc(c.committeeName)}</span>
            <span class="bbar-amounts">₱${(c.spent || 0).toLocaleString('en-PH')} / ₱${(c.allocated || 0).toLocaleString('en-PH')}</span>
          </div>
          <div class="bbar-track"><div class="bbar-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('')}
    ${!data.committees?.length ? '<p style="color:var(--muted);font-size:0.82rem;margin-top:0.5rem">No budget data.</p>' : ''}
  `;
}
