/* ─────────────────────────────────────────────
   SK Linaw – public.js
   Committees, Projects/Activities, and Files tabs
───────────────────────────────────────────── */

const COMMITTEES = [
  'Active Citizenship', 'Agriculture',            'Economic',
  'Education',          'Environment',             'Global Mobility',
  'Governance',         'Health',                  'Peace-Building and Security',
  'Social Inclusion and Equity', 'Treasury',       'Secretariat',
];

/* ── Static data (replace/extend with API calls as needed) ── */
const COMMITTEE_DB = {
  'Active Citizenship': {
    activities: [
      {
        projectName:   'Linggo ng Kabataan',
        description:   'An avenue for the youth to showcase their skills and talents',
        period:        'August',
        totalCost:     180000,
      },
      {
        projectName:   "Children's Month",
        description:   "An initiative participation to the Children's Month to promote the rights, welfare, and well-being of children",
        period:        'November',
        totalCost:     60000,
      },
      {
        projectName:   'Barangay Youth Leadership Camp',
        description:   'A barangay-based youth camp for leadership development',
        period:        'May - June',
        totalCost:     210000,
      },
      {
        projectName:   'Cebu City Youth Summer Camp',
        description:   'An initiative participation to city-wide youth summer camp',
        period:        'TBA',
        totalCost:     60000,
      },
    ],
    files: [
      {
        name:       'Linggo ng Kabataan',
        expected:   'Increase youth participation in Linggo ng Kabataan',
        indicator:  'Number of youth participated in Linggo ng Kabataan',
        person:     'SK Committee Head on Active Citizenship',
        ps: '-', mooe: '₱180,000.00', co: '-', total: '₱180,000.00',
      },
      {
        name:       "Children's Month",
        expected:   "Increased awareness of children's rights and improved community involvement in child welfare",
        indicator:  "Number of participants in Children's Month activities",
        person:     'SK Committee Head on Active Citizenship',
        ps: '-', mooe: '₱60,000.00', co: '-', total: '₱60,000.00',
      },
      {
        name:       'Barangay Youth Leadership Camp',
        expected:   'Youth will be trained in leadership through leadership camp',
        indicator:  'Number of youth participated in leadership camp',
        person:     'SK Committee Head on Active Citizenship',
        ps: '-', mooe: '₱210,000.00', co: '-', total: '₱210,000.00',
      },
      {
        name:       'Cebu City Youth Summer Camp',
        expected:   'Youth will be more active in youth involvement and participation',
        indicator:  'Number of youth participated in city-wide camp',
        person:     'SK Committee Head on Active Citizenship',
        ps: '-', mooe: '₱60,000.00', co: '-', total: '₱60,000.00',
      },
    ],
  },

  'Agriculture': {
    activities: [
      {
        projectName:  'Green Booklet',
        description:  'A project to educate and train the potential young farmers in urban gardening and farming',
        period:       'August - September',
        totalCost:    60000,
      },
      {
        projectName:  "HAPAG (Halina't Magtanim ng Prutas at Gulay)",
        description:  'An initiative participation to nationwide agricultural program of the Department of Interior and Local Government (DILG)',
        period:       'August - September',
        totalCost:    65000,
      },
    ],
    files: [
      {
        name:       'Green Booklet',
        expected:   'Skills of the youth will be enhanced on agricultural aspects',
        indicator:  'Number of youth engaged in farming and agriculture',
        person:     'SK Committee Head on Agriculture',
        ps: '-', mooe: '₱60,000.00', co: '-', total: '₱60,000.00',
      },
      {
        name:       "HAPAG (Halina't Magtanim ng Prutas at Gulay)",
        expected:   'Youth will be provided with agricultural products and resources',
        indicator:  'Number of youth provided with agricultural products and resources',
        person:     'SK Committee Head on Agriculture',
        ps: '-', mooe: '₱65,000.00', co: '-', total: '₱65,000.00',
      },
    ],
  },

  'Economic': {
    activities: [
      {
        projectName:  'Sustainable Kabuhayan',
        description:  'A youth entrepreneurship program to provide livelihood support',
        period:       'September - October',
        totalCost:    150000,
      },
    ],
    files: [
      {
        name:       'Sustainable Kabuhayan',
        expected:   'Decreasing number of unemployed youths',
        indicator:  'Number of youth provided a livelihood support',
        person:     'SK Committee Head on Economic Empowerment',
        ps: '-', mooe: '₱150,000.00', co: '-', total: '₱150,000.00',
      },
    ],
  },

  'Education': {
    activities: [
      {
        projectName:  'DeSKtop',
        description:  'An educational study lounge where students can avail free printing services and the Internet',
        period:       'June - December',
        totalCost:    100000,
      },
      {
        projectName:  'Tulong eSKwela',
        description:  'An initiative to provide students financial aid and school supplies to help sustain their education',
        period:       'June - July',
        totalCost:    100000,
      },
      {
        projectName:  'Asenso Academic Excellence Award',
        description:  'Recognition program to youth achievers who are excelled in education',
        period:       'December',
        totalCost:    120000,
      },
    ],
    files: [
      {
        name:       'DeSKtop',
        expected:   'Students gain free access to computers and the Internet for research and assignment',
        indicator:  'Number of students provided with educational services',
        person:     'SK Committee Head on Education',
        ps: '-', mooe: '₱100,000.00', co: '-', total: '₱100,000.00',
      },
      {
        name:       'Tulong eSKwela',
        expected:   'Students who are able receive financial support to aid their educational needs',
        indicator:  'Number of student beneficiaries who received cash assistance and school supplies',
        person:     'SK Committee Head on Education',
        ps: '-', mooe: '₱100,000.00', co: '-', total: '₱100,000.00',
      },
      {
        name:       'Asenso Academic Excellence Award',
        expected:   'Students will be recognized for academic excellence',
        indicator:  'Number of students recognized for academic excellence',
        person:     'SK Committee Head on Education',
        ps: '-', mooe: '₱120,000.00', co: '-', total: '₱120,000.00',
      },
    ],
  },

  'Environment': {
    activities: [
      {
        projectName:  'Project eSKina',
        description:  'Provision of DIY large trash bins to different areas',
        period:       'September - October',
        totalCost:    100000,
      },
      {
        projectName:  'KALINISAN Program',
        description:  'An initiative participation to nationwide environmental program of the Department of Interior and Local Government (DILG)',
        period:       'June - December',
        totalCost:    30000,
      },
      {
        projectName:  'Aksyon Kalamidad',
        description:  'Information dissemination and provision of supplies for disaster preparedness and management',
        period:       'November - December',
        totalCost:    100000,
      },
      {
        projectName:  'Katilingban ko Kalinisan ko',
        description:  'A community initiative promoting shared responsibility in maintaining cleanliness and environmental sustainability',
        period:       'June - August',
        totalCost:    60000,
      },
    ],
    files: [
      {
        name:       'Project eSKina',
        expected:   'Youth will be encouraged to promote proper waste management',
        indicator:  'Number of trash bins provided in different areas',
        person:     'SK Committee Head on Environment',
        ps: '-', mooe: '₱100,000.00', co: '-', total: '₱100,000.00',
      },
      {
        name:       'KALINISAN Program',
        expected:   'Youth will participate in environmental program',
        indicator:  'Number of youth participated in environmental program',
        person:     'SK Committee Head on Environment',
        ps: '-', mooe: '₱30,000.00', co: '-', total: '₱30,000.00',
      },
      {
        name:       'Aksyon Kalamidad',
        expected:   'Youth will be provided with information and supplies for disaster preparedness',
        indicator:  'Number of trash bins provided in different areas',
        person:     'SK Committee Head on Environment',
        ps: '-', mooe: '₱100,000.00', co: '-', total: '₱100,000.00',
      },
      {
        name:       'Katilingban ko Kalinisan ko',
        expected:   'Community hotspot areas are cleaned regularly through youth-led clean-up drives',
        indicator:  'Number of clean-up drives conducted and areas cleaned',
        person:     'SK Committee Head on Environment',
        ps: '-', mooe: '₱60,000.00', co: '-', total: '₱60,000.00',
      },
    ],
  },

  'Governance': {
    activities: [
      {
        projectName:  'Assemblies of the Katipunan ng Kabataan',
        description:  'An assembly of the Katipunan ng Kabataan members to identify youth issues and concerns',
        period:       'May - June',
        totalCost:    140000,
      },
      {
        projectName:  'SK Learning Hub',
        description:  'Free services and maintenance to the SK Hub',
        period:       'June - December',
        totalCost:    70000,
      },
      {
        projectName:  'Asenso Kabataan',
        description:  'An official music video and jingle to promote good governance',
        period:       'July',
        totalCost:    90000,
      },
      {
        projectName:  'Barangay Youth Summit',
        description:  'A summit to gather all youth leaders from different sitios and to register in Youth Organization Registration Program (YORP) of National Youth Commission',
        period:       'June - July',
        totalCost:    70000,
      },
    ],
    files: [
      {
        name:       'Assemblies of the Katipunan ng Kabataan',
        expected:   'Youth will be aware about youth issues and concerns',
        indicator:  'Number of youth participated in general assemblies',
        person:     'SK Committee Head on Governance',
        ps: '-', mooe: '₱140,000.00', co: '-', total: '₱140,000.00',
      },
      {
        name:       'SK Learning Hub',
        expected:   'Students receive educational materials thru the SK Hub to support their academic needs',
        indicator:  'Number of students who availed of the services of the SK Hub',
        person:     'SK Committee Head on Governance',
        ps: '-', mooe: '₱70,000.00', co: '-', total: '₱70,000.00',
      },
      {
        name:       'Asenso Kabataan',
        expected:   'More youth will be encouraged to participate',
        indicator:  'Number of youth encouraged to participate',
        person:     'SK Committee Head on Governance',
        ps: '-', mooe: '₱90,000.00', co: '-', total: '₱90,000.00',
      },
      {
        name:       'Barangay Youth Summit',
        expected:   'Youth leaders from youth organization will be empowered and accredited by National Youth Commission',
        indicator:  'Number of youth leaders participated in barangay youth summit and registered in YORP',
        person:     'SK Committee Head on Governance',
        ps: '-', mooe: '₱70,000.00', co: '-', total: '₱70,000.00',
      },
    ],
  },

  'Health': {
    activities: [
      {
        projectName:  'Arise & Shine',
        description:  'Various activities and projects to celebrate the World Mental Health Day',
        period:       'August - September',
        totalCost:    60000,
      },
      {
        projectName:  'Pulang Laso',
        description:  'An initiative participation to nationwide HIV awareness program of the Department of Interior and Local Government (DILG)',
        period:       'June - July',
        totalCost:    70000,
      },
      {
        projectName:  'Project Tin-Aw',
        description:  'Provision of free eyeglasses to youth who have eye conditions',
        period:       'November - December',
        totalCost:    90000,
      },
      {
        projectName:  'Asenso sa Nutrisyon',
        description:  'A yearly celebration promoting good nutrition and healthy lifestyle',
        period:       'July - August',
        totalCost:    70000,
      },
      {
        projectName:  'Teenage Pregnancy',
        description:  'A training educating young people on the causes, consequences, and prevention of early pregnancy',
        period:       'September - October',
        totalCost:    70000,
      },
    ],
    files: [
      {
        name:       'Arise & Shine',
        expected:   'Decrease the prevalence of mental health cases in barangay',
        indicator:  'Number of depressed youth recovered from mental health',
        person:     'SK Committee Head on Health',
        ps: '-', mooe: '₱60,000.00', co: '-', total: '₱60,000.00',
      },
      {
        name:       'Pulang Laso',
        expected:   'Decrease HIV cases among youth',
        indicator:  'Number of youth educated in HIV prevention',
        person:     'SK Committee Head on Health',
        ps: '-', mooe: '₱70,000.00', co: '-', total: '₱70,000.00',
      },
      {
        name:       'Project Tin-Aw',
        expected:   'Youth will be provided with free optical services',
        indicator:  'Number of youth benefited the health services',
        person:     'SK Committee Head on Health',
        ps: '-', mooe: '₱90,000.00', co: '-', total: '₱90,000.00',
      },
      {
        name:       'Asenso sa Nutrisyon',
        expected:   'Decreased the malnutrition rate among the youth',
        indicator:  'Number of youth became health conscious',
        person:     'SK Committee Head on Health',
        ps: '-', mooe: '₱70,000.00', co: '-', total: '₱70,000.00',
      },
      {
        name:       'Teenage Pregnancy',
        expected:   'The youth are educated on teenage pregnancy prevention through a comprehensive training',
        indicator:  'Number of participants who completed the teenage pregnancy prevention training',
        person:     'SK Committee Head on Health',
        ps: '-', mooe: '₱70,000.00', co: '-', total: '₱70,000.00',
      },
    ],
  },

  'Peace-Building and Security': {
    activities: [
      {
        projectName:  'Summer Kick-off',
        description:  'A summer sports league to divert the attention of the youth from illegal drugs',
        period:       'September - December',
        totalCost:    280000,
      },
      {
        projectName:  'Kabataan Kontra Droga at Terorismo',
        description:  'An initiative participation to nationwide anti-drug abuse program of the (DILG)',
        period:       'June - July',
        totalCost:    30000,
      },
    ],
    files: [
      {
        name:       'Summer Kick-off',
        expected:   'Decreasing number of drug dependent',
        indicator:  'Number of youth participated in sports',
        person:     'SK Committee Head on Peace Building and Security',
        ps: '-', mooe: '₱280,000.00', co: '-', total: '₱280,000.00',
      },
      {
        name:       'Kabataan Kontra Droga at Terorismo',
        expected:   'Increasing awareness on effects of drugs and terrorism',
        indicator:  'Number of youths educated in anti-drug abuse and anti-terrorism',
        person:     'SK Committee Head on Peace Building and Security',
        ps: '-', mooe: '₱30,000.00', co: '-', total: '₱30,000.00',
      },
    ],
  },

  'Social Inclusion and Equity': {
    activities: [
      {
        projectName:  'APMAR',
        description:  'A pride month celebration where LGBT youth can showcase their talents and advocacies',
        period:       'June',
        totalCost:    85000,
      },
    ],
    files: [
      {
        name:       'APMAR',
        expected:   'LGBT individuals will be recognized',
        indicator:  'Number of youth participated in LGBT activities',
        person:     'SK Committee Head on Social Inclusion and Equity',
        ps: '-', mooe: '₱85,000.00', co: '-', total: '₱85,000.00',
      },
    ],

  },
  'Global Mobility': {
    activities: [
      {
        projectName:  'Assistance to Local & Global Conferences',
        description:  'A financial assistance to youth who are engaged in local and global and conferences',
        period:       'TBA',
        totalCost:    20000,
      },
    ],
    files: [
      {
        name:       'Assistance to Local & Global Conferences',
        expected:   'Youth will be supported in global and local conferences',
        indicator:  'Number of youth supported in local and global conferences',
        person:     'SK Committee Head on Peace Building and Security',
        ps: '-', mooe: '₱20,000.00', co: '-', total: '₱20,000.00',
      },
    ],
  },
};

/* ─── Helpers ─────────────────────────────── */
let currentCommittee = null;

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ─── Screen navigation ────────────────────── */
function showCommittees() {
  document.getElementById('screen-committees').classList.add('active');
  document.getElementById('screen-detail').classList.remove('active');
}

function renderGrid() {
  const grid = document.getElementById('committee-grid');
  grid.innerHTML = COMMITTEES.map(name => `
    <button class="pub-committee-btn" onclick="openCommittee('${name.replace(/'/g, "\\'")}')">
      ${esc(name.toUpperCase())}
    </button>`).join('');
}

async function openCommittee(name) {
  currentCommittee = name;
  document.getElementById('detail-name').textContent = name.toUpperCase();
  document.getElementById('screen-committees').classList.remove('active');
  document.getElementById('screen-detail').classList.add('active');

  // Reset to first tab
  document.querySelectorAll('.pub-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.querySelectorAll('.pub-tab-panel').forEach((p, i) => p.classList.toggle('active', i === 0));

  await loadProjects(name);
  renderFiles(name);
}

/* ─── Projects / Activities tab ───────────── */
async function loadProjects(committeeName) {
  const panel = document.getElementById('panel-projects');
  panel.innerHTML = '<div class="loader"><span></span><span></span><span></span></div>';

  try {
    const res  = await fetch(`${API}/getProjects?barangay=${encodeURIComponent('Komsai B')}&committeeName=${encodeURIComponent(committeeName)}`);
    const data = await res.json();
    const visible = Array.isArray(data) ? data.filter(p => p.status === 'APPROVED') : [];
    renderProjects(panel, visible);
  } catch {
    // Fallback to static data
    const local = COMMITTEE_DB[committeeName];
    const items = local ? local.activities : [];
    renderProjects(panel, items);
  }
}

function renderProjects(panel, projects) {
  if (!projects.length) {
    panel.innerHTML = '<p class="pub-empty-msg">No published projects for this committee yet.</p>';
    return;
  }

  const rows = projects.map(p => {
    const cost     = p.totalCost || 0;
    const name     = p.projectName || p.name || '';
    const person   = p.councilorName || '';
    const dateStr  = p.createdAt ? `📅 ${fmtDate(p.createdAt)}` : '';
    const period   = p.period   ? `Period: ${esc(p.period)}` : dateStr;
    const desc     = p.description ? `<div class="pr-meta">${esc(p.description)}</div>` : '';

    return `
      <div class="pub-project-row">
        <div style="flex:1">
          <div class="pr-name">${esc(name)}</div>
          ${desc}
          <div class="pr-meta" style="margin-top:2px;color:rgba(0,0,0,0.45);">${person ? `👤 ${esc(person)} &nbsp;·&nbsp; ` : ''}${period}</div>
        </div>
        <div class="pr-right">
          <div class="pr-cost">₱${cost.toLocaleString('en-PH')}</div>
          <span class="pill-published">PUBLISHED</span>
        </div>
      </div>`;
  }).join('');

  const total = projects.reduce((s, p) => s + (p.totalCost || 0), 0);
  const totalRow = `
    <div class="pr-total-row">
      <span>TOTAL: ₱${total.toLocaleString('en-PH')}</span>
    </div>`;

  panel.innerHTML = rows + totalRow;
}

/* ─── Files tab ────────────────────────────── */
function renderFiles(committeeName) {
  const panel = document.getElementById('panel-files');
  const local = COMMITTEE_DB[committeeName];

  if (!local || !local.files.length) {
    panel.innerHTML = '<p class="pub-empty-msg">No files uploaded yet.</p>';
    return;
  }

  panel.innerHTML = local.files.map(f => `
    <div class="pub-detail-card">
      <div class="pub-detail-card-title">${esc(f.name)}</div>
      <div class="pub-detail-row">
        <span class="pub-detail-label">Expected Result</span>
        <span class="pub-detail-value" style="max-width:55%;text-align:right;">${esc(f.expected)}</span>
      </div>
      <div class="pub-detail-row">
        <span class="pub-detail-label">Performance Indicator</span>
        <span class="pub-detail-value" style="max-width:55%;text-align:right;">${esc(f.indicator)}</span>
      </div>
      <div class="pub-detail-row">
        <span class="pub-detail-label">Person Responsible</span>
        <span class="pub-detail-value">${esc(f.person)}</span>
      </div>
      <table class="pub-budget-table">
        <thead>
          <tr><th>PS</th><th>MOOE</th><th>CO</th><th>TOTAL</th></tr>
        </thead>
        <tbody>
          <tr class="total-row">
            <td>${esc(f.ps)}</td>
            <td>${esc(f.mooe)}</td>
            <td>${esc(f.co)}</td>
            <td>${esc(f.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>`).join('');
}

/* ─── Tab switching ────────────────────────── */
function switchTab(tab, el) {
  document.querySelectorAll('.pub-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.pub-tab-panel').forEach(p => p.classList.remove('active'));
  const map = { projects: 'panel-projects', docs: 'panel-docs', files: 'panel-files' };
  document.getElementById(map[tab])?.classList.add('active');
}

/* ─── Init ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', renderGrid);
