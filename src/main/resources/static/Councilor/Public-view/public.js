const COMMITTEES = [
  'Active Citizenship', 'Agriculture',            'Economic',
  'Education',          'Environment',             'Global Mobility',
  'Governance',         'Health',                  'Peace-Building and Security',
  'Social Inclusion and Equity', 'Treasury',       'Secretariat',
];

let currentCommittee = null;

function showCommittees() {
  document.getElementById('screen-committees').classList.add('active');
  document.getElementById('screen-detail').classList.remove('active');
}

function renderGrid() {
  const grid = document.getElementById('committee-grid');
  grid.innerHTML = COMMITTEES.map(name => `
    <button class="pub-committee-btn" onclick="openCommittee('${name.replace(/'/g,"\\'")}')">
      ${esc(name.toUpperCase())}
    </button>`).join('');
}

async function openCommittee(name) {
  currentCommittee = name;
  document.getElementById('detail-name').textContent = name.toUpperCase();
  document.getElementById('screen-committees').classList.remove('active');
  document.getElementById('screen-detail').classList.add('active');

  // Reset tabs
  document.querySelectorAll('.pub-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.querySelectorAll('.pub-tab-panel').forEach((p, i) => p.classList.toggle('active', i === 0));

  await loadProjects(name);
}

async function loadProjects(committeeName) {
  const panel = document.getElementById('panel-projects');
  panel.innerHTML = '<div class="loader"><span></span><span></span><span></span></div>';

  try {
    const res     = await fetch(`${API}/getProjects?barangay=${encodeURIComponent('Komsai B')}&committeeName=${encodeURIComponent(committeeName)}`);
    const data    = await res.json();
    const visible = Array.isArray(data) ? data.filter(p => p.status === 'APPROVED') : [];
    renderProjects(panel, visible);
  } catch {
    // Dev preview — sample data
    const sample = committeeName === 'Active Citizenship' ? [
      { projectName: 'Youth Leadership Summit', councilorName: 'Juan Cruz',   totalCost: 15000, status: 'APPROVED', createdAt: '2025-02-10' },
      { projectName: 'Barangay Clean-Up Drive', councilorName: 'Maria Reyes', totalCost: 3500,  status: 'APPROVED', createdAt: '2025-01-20' },
    ] : [];
    renderProjects(panel, sample);
  }
}

function renderProjects(panel, projects) {
  if (!projects.length) {
    panel.innerHTML = '<p class="pub-empty-msg">No published projects for this committee yet.</p>';
    return;
  }
  panel.innerHTML = projects.map(p => `
    <div class="pub-project-row">
      <div>
        <div class="pr-name">${esc(p.projectName)}</div>
        <div class="pr-meta">👤 ${esc(p.councilorName)} &nbsp;·&nbsp; 📅 ${fmtDate(p.createdAt)}</div>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem">
        <div class="pr-cost">₱${(p.totalCost||0).toLocaleString('en-PH')}</div>
        <span class="pill pill-approved">Published</span>
      </div>
    </div>`).join('');
}

function switchTab(tab, el) {
  document.querySelectorAll('.pub-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.pub-tab-panel').forEach(p => p.classList.remove('active'));
  const map = { projects: 'panel-projects', docs: 'panel-docs', files: 'panel-files' };
  document.getElementById(map[tab])?.classList.add('active');
}

// Init
document.addEventListener('DOMContentLoaded', renderGrid);
