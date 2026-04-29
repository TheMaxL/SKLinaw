// ── Data ─────────────────────────────────────────────────────────────────────

const COMMITTEES = [
  'Active Citizenship', 'Agriculture',            'Economic',
  'Education',          'Environment',             'Global Mobility',
  'Governance',         'Health',                  'Peace-Building and Security',
  'Social Inclusion and Equity', 'Treasury',       'Secretariat',
];

const COMMITTEE_BUDGETS = {
  'Active Citizenship':            45000,
  'Agriculture':                   62000,
  'Economic':                      55000,
  'Education':                     80000,
  'Environment':                   38000,
  'Global Mobility':               30000,
  'Governance':                    42000,
  'Health':                        95000,
  'Peace-Building and Security':   50000,
  'Social Inclusion and Equity':   70000,
  'Treasury':                      25000,
  'Secretariat':                   20000,
};

const SAMPLE_PROJECTS = {
  'Active Citizenship': [
    { projectName: 'Youth Leadership Summit',    councilorName: 'Juan Cruz',      totalCost: 15000, createdAt: '2025-02-10' },
    { projectName: 'Barangay Clean-Up Drive',    councilorName: 'Maria Reyes',    totalCost: 3500,  createdAt: '2025-01-20' },
    { projectName: 'Voter Registration Assist',  councilorName: 'Pedro Santos',   totalCost: 6200,  createdAt: '2025-03-05' },
  ],
  'Agriculture': [
    { projectName: 'Urban Farming Workshop',     councilorName: 'Liza Fernandez', totalCost: 22000, createdAt: '2025-01-15' },
    { projectName: 'Seed Distribution Program',  councilorName: 'Noel Dacera',    totalCost: 18000, createdAt: '2025-02-28' },
  ],
  'Economic': [
    { projectName: 'Livelihood Skills Training', councilorName: 'Ana Villaluz',   totalCost: 30000, createdAt: '2025-03-01' },
    { projectName: 'Micro-enterprise Fair',      councilorName: 'Rico Buenaobra', totalCost: 12500, createdAt: '2025-02-14' },
  ],
  'Education': [
    { projectName: 'Scholarship Grant 2025',     councilorName: 'Dra. Celine Uy',totalCost: 50000, createdAt: '2025-01-10' },
    { projectName: 'School Supplies Drive',      councilorName: 'Jeff Manalo',    totalCost: 15000, createdAt: '2025-01-25' },
    { projectName: 'Reading Hour Program',       councilorName: 'Claire Tan',     totalCost: 8000,  createdAt: '2025-03-12' },
  ],
  'Environment': [
    { projectName: 'Tree-Planting Activity',     councilorName: 'Gio Lapitan',    totalCost: 9000,  createdAt: '2025-02-22' },
    { projectName: 'Coastal Clean-Up 2025',      councilorName: 'Maria Reyes',    totalCost: 11500, createdAt: '2025-03-18' },
  ],
  'Global Mobility': [
    { projectName: 'OFW Assistance Forum',       councilorName: 'Rosa del Mar',   totalCost: 20000, createdAt: '2025-02-05' },
  ],
  'Governance': [
    { projectName: 'Barangay Assembly Q1',       councilorName: 'Kapitan Lim',    totalCost: 7500,  createdAt: '2025-01-30' },
    { projectName: 'Transparency Board Posting', councilorName: 'Juan Cruz',      totalCost: 4500,  createdAt: '2025-02-17' },
  ],
  'Health': [
    { projectName: 'Free Medical Mission',       councilorName: 'Dra. Celine Uy',totalCost: 60000, createdAt: '2025-01-08' },
    { projectName: 'Anti-Drug Awareness Drive',  councilorName: 'Pedro Santos',   totalCost: 18000, createdAt: '2025-02-19' },
    { projectName: 'Mental Health Seminar',      councilorName: 'Ana Villaluz',   totalCost: 12000, createdAt: '2025-03-22' },
  ],
  'Peace-Building and Security': [
    { projectName: 'Community Dialogue Forum',   councilorName: 'Noel Dacera',    totalCost: 25000, createdAt: '2025-02-10' },
    { projectName: 'VAWC Awareness Campaign',    councilorName: 'Claire Tan',     totalCost: 15000, createdAt: '2025-03-05' },
  ],
  'Social Inclusion and Equity': [
    { projectName: 'PWD Assistance Program',     councilorName: 'Rico Buenaobra', totalCost: 35000, createdAt: '2025-01-20' },
    { projectName: 'Senior Citizens Outreach',   councilorName: 'Liza Fernandez', totalCost: 28000, createdAt: '2025-02-25' },
  ],
  'Treasury':    [],
  'Secretariat': [
    { projectName: 'Records Digitisation Drive', councilorName: 'Jeff Manalo',    totalCost: 9500,  createdAt: '2025-03-01' },
  ],
};

const SAMPLE_ALBUMS = {
  'Active Citizenship': [
    {
      title: 'Youth Leadership Summit',
      photos: [
        { url: 'https://picsum.photos/seed/yls1/600/450', caption: 'Opening ceremony' },
        { url: 'https://picsum.photos/seed/yls2/600/450', caption: 'Workshop session' },
        { url: 'https://picsum.photos/seed/yls3/600/450', caption: 'Group activity' },
        { url: 'https://picsum.photos/seed/yls4/600/450', caption: 'Certificate awarding' },
        { url: 'https://picsum.photos/seed/yls5/600/450', caption: 'Closing program' },
      ]
    },
    {
      title: 'Barangay Clean-Up Drive',
      photos: [
        { url: 'https://picsum.photos/seed/bcd1/600/450', caption: 'Volunteers gathering' },
        { url: 'https://picsum.photos/seed/bcd2/600/450', caption: 'Cleaning in progress' },
        { url: 'https://picsum.photos/seed/bcd3/600/450', caption: 'After clean-up' },
      ]
    },
  ],
  'Agriculture': [
    {
      title: 'Urban Farming Workshop',
      photos: [
        { url: 'https://picsum.photos/seed/ufw1/600/450', caption: 'Planting demo' },
        { url: 'https://picsum.photos/seed/ufw2/600/450', caption: 'Soil preparation' },
        { url: 'https://picsum.photos/seed/ufw3/600/450', caption: 'Participants at work' },
        { url: 'https://picsum.photos/seed/ufw4/600/450', caption: 'Harvest showcase' },
      ]
    },
    {
      title: 'Seed Distribution Program',
      photos: [
        { url: 'https://picsum.photos/seed/sdp1/600/450', caption: 'Registration day' },
        { url: 'https://picsum.photos/seed/sdp2/600/450', caption: 'Distribution proper' },
      ]
    },
  ],
  'Economic': [
    {
      title: 'Livelihood Skills Training',
      photos: [
        { url: 'https://picsum.photos/seed/lst1/600/450', caption: 'Hands-on training' },
        { url: 'https://picsum.photos/seed/lst2/600/450', caption: 'Products display' },
        { url: 'https://picsum.photos/seed/lst3/600/450', caption: 'Trainers briefing' },
      ]
    },
    {
      title: 'Micro-enterprise Fair',
      photos: [
        { url: 'https://picsum.photos/seed/mef1/600/450', caption: 'Stall set-up' },
        { url: 'https://picsum.photos/seed/mef2/600/450', caption: 'Customers visiting' },
        { url: 'https://picsum.photos/seed/mef3/600/450', caption: 'Best stall award' },
      ]
    },
  ],
  'Education': [
    {
      title: 'Scholarship Grant 2025',
      photos: [
        { url: 'https://picsum.photos/seed/sg1/600/450', caption: 'Awarding ceremony' },
        { url: 'https://picsum.photos/seed/sg2/600/450', caption: 'Scholars with officials' },
        { url: 'https://picsum.photos/seed/sg3/600/450', caption: 'Signing of contracts' },
        { url: 'https://picsum.photos/seed/sg4/600/450', caption: 'Group photo' },
      ]
    },
    {
      title: 'Reading Hour Program',
      photos: [
        { url: 'https://picsum.photos/seed/rhp1/600/450', caption: 'Story time' },
        { url: 'https://picsum.photos/seed/rhp2/600/450', caption: 'Children reading' },
        { url: 'https://picsum.photos/seed/rhp3/600/450', caption: 'Book donations' },
      ]
    },
  ],
  'Environment': [
    {
      title: 'Tree-Planting Activity',
      photos: [
        { url: 'https://picsum.photos/seed/tpa1/600/450', caption: 'Site preparation' },
        { url: 'https://picsum.photos/seed/tpa2/600/450', caption: 'Planting saplings' },
        { url: 'https://picsum.photos/seed/tpa3/600/450', caption: 'Group photo at site' },
      ]
    },
    {
      title: 'Coastal Clean-Up 2025',
      photos: [
        { url: 'https://picsum.photos/seed/ccu1/600/450', caption: 'Shoreline clean-up' },
        { url: 'https://picsum.photos/seed/ccu2/600/450', caption: 'Collected waste sorting' },
        { url: 'https://picsum.photos/seed/ccu3/600/450', caption: 'Volunteers debrief' },
      ]
    },
  ],
  'Global Mobility': [
    {
      title: 'OFW Assistance Forum',
      photos: [
        { url: 'https://picsum.photos/seed/oaf1/600/450', caption: 'Forum opening' },
        { url: 'https://picsum.photos/seed/oaf2/600/450', caption: 'Resource speakers' },
        { url: 'https://picsum.photos/seed/oaf3/600/450', caption: 'Q&A session' },
      ]
    },
  ],
  'Governance': [
    {
      title: 'Barangay Assembly Q1',
      photos: [
        { url: 'https://picsum.photos/seed/ba1/600/450', caption: 'Assembly proper' },
        { url: 'https://picsum.photos/seed/ba2/600/450', caption: 'Announcements' },
        { url: 'https://picsum.photos/seed/ba3/600/450', caption: 'Open forum' },
      ]
    },
  ],
  'Health': [
    {
      title: 'Free Medical Mission',
      photos: [
        { url: 'https://picsum.photos/seed/fmm1/600/450', caption: 'Registration queue' },
        { url: 'https://picsum.photos/seed/fmm2/600/450', caption: 'Medical check-up' },
        { url: 'https://picsum.photos/seed/fmm3/600/450', caption: 'Medicine distribution' },
        { url: 'https://picsum.photos/seed/fmm4/600/450', caption: 'Dental services' },
        { url: 'https://picsum.photos/seed/fmm5/600/450', caption: 'Doctors on duty' },
      ]
    },
    {
      title: 'Mental Health Seminar',
      photos: [
        { url: 'https://picsum.photos/seed/mhs1/600/450', caption: 'Talk proper' },
        { url: 'https://picsum.photos/seed/mhs2/600/450', caption: 'Group discussion' },
        { url: 'https://picsum.photos/seed/mhs3/600/450', caption: 'Certificates' },
      ]
    },
  ],
  'Peace-Building and Security': [
    {
      title: 'Community Dialogue Forum',
      photos: [
        { url: 'https://picsum.photos/seed/cdf1/600/450', caption: 'Panel discussion' },
        { url: 'https://picsum.photos/seed/cdf2/600/450', caption: 'Open dialogue' },
        { url: 'https://picsum.photos/seed/cdf3/600/450', caption: 'Closing remarks' },
      ]
    },
    {
      title: 'VAWC Awareness Campaign',
      photos: [
        { url: 'https://picsum.photos/seed/vaw1/600/450', caption: 'Campaign launch' },
        { url: 'https://picsum.photos/seed/vaw2/600/450', caption: 'Street walk' },
      ]
    },
  ],
  'Social Inclusion and Equity': [
    {
      title: 'PWD Assistance Program',
      photos: [
        { url: 'https://picsum.photos/seed/pwd1/600/450', caption: 'Assistive devices' },
        { url: 'https://picsum.photos/seed/pwd2/600/450', caption: 'Beneficiaries' },
        { url: 'https://picsum.photos/seed/pwd3/600/450', caption: 'Livelihood kits' },
        { url: 'https://picsum.photos/seed/pwd4/600/450', caption: 'Group photo' },
      ]
    },
    {
      title: 'Senior Citizens Outreach',
      photos: [
        { url: 'https://picsum.photos/seed/sco1/600/450', caption: 'Health check' },
        { url: 'https://picsum.photos/seed/sco2/600/450', caption: 'Welfare packages' },
        { url: 'https://picsum.photos/seed/sco3/600/450', caption: 'Lolo & Lola smiling' },
      ]
    },
  ],
  'Treasury':    [],
  'Secretariat': [
    {
      title: 'Records Digitisation Drive',
      photos: [
        { url: 'https://picsum.photos/seed/rdd1/600/450', caption: 'Scanning station' },
        { url: 'https://picsum.photos/seed/rdd2/600/450', caption: 'Data entry' },
        { url: 'https://picsum.photos/seed/rdd3/600/450', caption: 'Archive setup' },
      ]
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Screens ───────────────────────────────────────────────────────────────────

function showCommittees() {
  document.getElementById('screen-committees').classList.add('active');
  document.getElementById('screen-detail').classList.remove('active');
  document.getElementById('screen-treasury').classList.remove('active');
}

function openCommittee(name) {
  if (name === 'Treasury') {
    openTreasury();
    return;
  }

  document.getElementById('detail-name').textContent = name.toUpperCase();
  document.getElementById('screen-committees').classList.remove('active');
  document.getElementById('screen-detail').classList.add('active');
  document.getElementById('screen-treasury').classList.remove('active');

  // Reset tabs to first
  document.querySelectorAll('.pub-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.querySelectorAll('.pub-tab-panel').forEach((p, i) => p.classList.toggle('active', i === 0));

  loadProjects(name);
  loadDocs(name);
}

// ── Grid ──────────────────────────────────────────────────────────────────────

function renderGrid() {
  const grid = document.getElementById('committee-grid');
  grid.innerHTML = COMMITTEES.map(name => `
    <button class="pub-committee-btn" onclick="openCommittee('${name.replace(/'/g, "\\'")}')">
      ${esc(name.toUpperCase())}
    </button>`).join('');
}

// ── Projects ─────────────────────────────────────────────────────────────────

async function loadProjects(committeeName) {
  const panel = document.getElementById('panel-projects');
  panel.innerHTML = '<div class="loader"><span></span><span></span><span></span></div>';

  let data = null;
  try {
    if (typeof API !== 'undefined') {
      const res = await fetch(`${API}/getProjects?barangay=${encodeURIComponent('Komsai B')}&committeeName=${encodeURIComponent(committeeName)}`);
      data = await res.json();
    }
  } catch (_) {}

  let projects = Array.isArray(data) ? data.filter(p => p.status === 'APPROVED') : null;
  if (!projects) projects = (SAMPLE_PROJECTS[committeeName] || []).map(p => ({ ...p, status: 'APPROVED' }));

  renderProjects(panel, projects);
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
        <div class="pr-cost">₱${(p.totalCost || 0).toLocaleString('en-PH')}</div>
        <span class="pill pill-approved">Published</span>
      </div>
    </div>`).join('');
}

// ── Docs / Albums ─────────────────────────────────────────────────────────────

function loadDocs(committeeName) {
  const panel = document.getElementById('panel-docs');
  const albums = SAMPLE_ALBUMS[committeeName] || [];

  if (!albums.length) {
    panel.innerHTML = '<p class="pub-empty-msg">No documentation albums yet.</p>';
    return;
  }

  panel.innerHTML = `<div class="album-list">${albums.map(album => renderAlbum(album)).join('')}</div>`;
}

function renderAlbum(album) {
  const photos = album.photos || [];
  const MAX_VISIBLE = 6;
  const visible = photos.slice(0, MAX_VISIBLE);
  const extra   = photos.length - MAX_VISIBLE;

  const thumbsHtml = visible.map((ph, idx) => {
    const isLast = idx === MAX_VISIBLE - 1 && extra > 0;
    const photosAttr = esc(JSON.stringify(photos));
    if (isLast) {
      return `<div class="album-thumb more-overlay" data-more="+${extra}"
                   onclick="openLightbox(${photosAttr}, ${idx})">
                <img src="${esc(ph.url)}" alt="${esc(ph.caption)}" loading="lazy"/>
              </div>`;
    }
    return `<div class="album-thumb"
                 onclick="openLightbox(${photosAttr}, ${idx})">
              <img src="${esc(ph.url)}" alt="${esc(ph.caption)}" loading="lazy"/>
            </div>`;
  }).join('');

  return `
    <div class="album-card">
      <div class="album-header">
        <span class="album-title">📁 ${esc(album.title)}</span>
        <span class="album-count">${photos.length} photo${photos.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="album-thumbs">${thumbsHtml}</div>
    </div>`;
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

let _lbPhotos = [];
let _lbIdx    = 0;

function openLightbox(photosAttr, idx) {
  const photos = typeof photosAttr === 'string' ? JSON.parse(photosAttr) : photosAttr;
  _lbPhotos = photos;
  _lbIdx    = idx;
  setLightboxImg(_lbIdx);
  document.getElementById('lightbox').classList.add('open');
}

function setLightboxImg(idx) {
  const ph = _lbPhotos[idx];
  document.getElementById('lightbox-img').src = ph.url;
  document.getElementById('lightbox-caption').textContent = ph.caption;
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function switchTab(tab, el) {
  document.querySelectorAll('.pub-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.pub-tab-panel').forEach(p => p.classList.remove('active'));
  const map = { projects: 'panel-projects', docs: 'panel-docs', files: 'panel-files' };
  document.getElementById(map[tab])?.classList.add('active');
}

// ── Treasury ──────────────────────────────────────────────────────────────────

function openTreasury() {
  document.getElementById('screen-committees').classList.remove('active');
  document.getElementById('screen-detail').classList.remove('active');
  document.getElementById('screen-treasury').classList.add('active');
  renderBudget();
}

function renderBudget() {
  const entries = Object.entries(COMMITTEE_BUDGETS);
  const total   = entries.reduce((s, [, v]) => s + v, 0);
  const maxVal  = Math.max(...entries.map(([, v]) => v));

  // Bar chart
  const chartEl = document.getElementById('budget-chart');
  chartEl.innerHTML = entries.map(([name, val], i) => {
    const pct = Math.round((val / maxVal) * 100);
    return `
      <div class="chart-row">
        <div class="chart-label">${esc(name)}</div>
        <div class="chart-bar-track">
          <div class="chart-bar" style="width:${pct}%;--delay:${i * 0.06}s">
            <span class="chart-bar-val">₱${(val / 1000).toFixed(0)}k</span>
          </div>
        </div>
      </div>`;
  }).join('');

  // Table
  const tbody   = document.querySelector('#budget-table tbody');
  const totalTd = document.querySelectorAll('#budget-total-row td');
  tbody.innerHTML = entries.map(([name, val]) => `
    <tr>
      <td>${esc(name)}</td>
      <td>₱${val.toLocaleString('en-PH')}</td>
      <td>${((val / total) * 100).toFixed(1)}%</td>
    </tr>`).join('');

  totalTd[1].textContent = '₱' + total.toLocaleString('en-PH');
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', renderGrid);
