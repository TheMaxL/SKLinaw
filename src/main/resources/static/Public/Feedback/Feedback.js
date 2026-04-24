const API      = 'http://localhost:8080/api';
  const BARANGAY = 'Lahug'; // ← update to match your client's barangay

  const REACTION_MAP = { like:'👍', dislike:'👎' };

  let selectedGeneralReaction = '';
  let allProjects = [];

  // ── TABS ──────────────────────────────────────────────────────────
  function switchTab(tab, btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`panel-${tab}`).classList.add('active');
  }

  // ── REACTION PICKER ───────────────────────────────────────────────
  function pickReaction(scope, reaction, btn) {
    if (scope === 'general') {
      document.querySelectorAll('#generalReactions .reaction-btn').forEach(b => b.classList.remove('selected'));
      if (selectedGeneralReaction === reaction) {
        selectedGeneralReaction = '';
      } else {
        selectedGeneralReaction = reaction;
        btn.classList.add('selected');
      }
    }
  }

  function pickInlineReaction(projectId, reaction, btn) {
    const row = document.querySelectorAll(`[data-project-id="${projectId}"] .inline-reaction-btn`);
    row.forEach(b => b.classList.remove('selected'));
    btn.dataset.selected = btn.dataset.selected === reaction ? '' : reaction;
    if (btn.dataset.selected) btn.classList.add('selected');
  }

  // ── CHAR COUNTER ──────────────────────────────────────────────────
  function updateCharCount(inputId, countId) {
    const len = document.getElementById(inputId).value.length;
    document.getElementById(countId).textContent = len;
  }

  // ── GENERAL FEEDBACK ──────────────────────────────────────────────
  async function submitGeneralFeedback() {
    const message = document.getElementById('generalMessage').value.trim();
    const alertEl = document.getElementById('generalAlert');
    const btn     = document.getElementById('generalSubmitBtn');

    alertEl.className = 'alert';

    if (!message) {
      alertEl.textContent = 'Please write a message before submitting.';
      alertEl.className = 'alert error show';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Posting…';

    try {
      const res  = await fetch(`${API}/submitFeedback`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barangay:   BARANGAY,
          authorName: 'Anonymous',
          message,
          reaction: selectedGeneralReaction
        })
      });
      const text = await res.text();

      if (text === 'SUCCESS') {
        alertEl.textContent = '✓ Your feedback has been posted!';
        alertEl.className = 'alert success show';
        document.getElementById('generalMessage').value = '';
        document.getElementById('generalCount').textContent = '0';
        selectedGeneralReaction = '';
        document.querySelectorAll('#generalReactions .reaction-btn').forEach(b => b.classList.remove('selected'));
        setTimeout(() => alertEl.classList.remove('show'), 3500);
        loadGeneralFeed();
      } else {
        alertEl.textContent = 'Could not post feedback: ' + text;
        alertEl.className = 'alert error show';
      }
    } catch (e) {
      alertEl.textContent = '⚠️ Could not connect to server.';
      alertEl.className = 'alert error show';
    }

    btn.disabled = false;
    btn.innerHTML = 'Post Feedback';
  }

  async function loadGeneralFeed() {
    const feedEl = document.getElementById('generalFeed');
    try {
      const res  = await fetch(`${API}/getFeedback?barangay=${encodeURIComponent(BARANGAY)}`);
      const data = await res.json();
      renderFeed(data);
    } catch (e) {
      // Demo data
      renderFeed([
        { id:1, authorName:'Maria S.',  message:'Great job on the basketball court renovation! The kids love it.',     reaction:'clap',  createdAt:'2025-03-15T10:30:00' },
        { id:2, authorName:'Anonymous', message:'Can we have more info on how the education budget was spent?',        reaction:'question', createdAt:'2025-03-12T08:15:00' },
        { id:3, authorName:'Pedro R.',  message:'The medical mission really helped our community. Thank you SK!',     reaction:'heart', createdAt:'2025-03-10T14:00:00' },
        { id:4, authorName:'Anonymous', message:'Suggestion: Can you organize more livelihood programs for parents?', reaction:'suggest', createdAt:'2025-03-08T09:45:00' },
      ]);
    }
  }

  function renderFeed(items) {
    const feedEl  = document.getElementById('generalFeed');
    const countEl = document.getElementById('feedCount');
    countEl.textContent = `${items.length} message${items.length !== 1 ? 's' : ''}`;

    if (!items.length) {
      feedEl.innerHTML = `<div class="empty-feed">No feedback yet. Be the first to leave a message!</div>`;
      return;
    }

    feedEl.innerHTML = items.map((item, i) => `
      <div class="comment-card" style="animation-delay:${i*0.05}s">
        <div class="comment-top">
          <div class="comment-avatar">${esc(item.authorName).charAt(0).toUpperCase()}</div>
          <div>
            <div class="comment-author">${esc(item.authorName)}</div>
          </div>
          ${item.reaction ? `<span class="comment-reaction-badge">${REACTION_MAP[item.reaction] || ''}</span>` : ''}
          <div class="comment-time">${timeAgo(item.createdAt)}</div>
        </div>
        <div class="comment-body">${esc(item.message)}</div>
      </div>
    `).join('');
  }

  // ── PROJECT COMMENTS ──────────────────────────────────────────────
  async function loadProjects() {
    try {
      const cRes = await fetch(`${API}/getCommittees?barangay=${encodeURIComponent(BARANGAY)}`);
      const coms = await cRes.json();
      allProjects = [];
      for (const c of coms) {
        const pRes = await fetch(`${API}/getProjects?barangay=${encodeURIComponent(BARANGAY)}&committeeName=${encodeURIComponent(c.name)}`);
        const ps   = await pRes.json();
        if (Array.isArray(ps)) ps.filter(p => p.status === 'APPROVED').forEach(p => allProjects.push({ ...p, committeeName: c.name }));
      }
      renderProjectList(allProjects);
    } catch (e) {
      // Demo projects
      allProjects = [
        { id:1, projectName:'Basketball Court Renovation', committeeName:'Sports',    councilorName:'Juan Dela Cruz', totalCost:85000 },
        { id:2, projectName:'School Supplies Drive',       committeeName:'Education', councilorName:'Maria Santos',   totalCost:45000 },
        { id:3, projectName:'Medical Mission',             committeeName:'Health',    councilorName:'Ana Gomez',      totalCost:60000 },
      ];
      renderProjectList(allProjects);
    }
  }

  function filterProjects() {
    const q = document.getElementById('projectSearch').value.toLowerCase();
    const filtered = allProjects.filter(p =>
      p.projectName.toLowerCase().includes(q) ||
      p.committeeName.toLowerCase().includes(q)
    );
    renderProjectList(filtered);
  }

  function renderProjectList(projects) {
    const el = document.getElementById('projectCommentsList');
    if (!projects.length) {
      el.innerHTML = `<div class="empty-feed">No projects found.</div>`;
      return;
    }
    el.innerHTML = projects.map(p => `
      <div class="project-comment-block" id="pcb-${p.id}" data-project-id="${p.id}">
        <div class="pcb-header" onclick="toggleProject(${p.id})">
          <div>
            <div class="pcb-name">${esc(p.projectName)}</div>
            <div class="pcb-meta">📁 ${esc(p.committeeName)} · 👤 ${esc(p.councilorName)} · ₱${(p.totalCost||0).toLocaleString('en-PH')}</div>
          </div>
          <div class="pcb-right">
            <div class="pcb-reactions" id="reactions-${p.id}"></div>
            <div class="pcb-comment-count" id="ccount-${p.id}">💬 —</div>
            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div class="pcb-body" id="pcbbody-${p.id}">
          <!-- Reaction + comment form -->
          <div style="margin-bottom:1rem">
            <div style="font-size:0.72rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:6px">React & Comment</div>
            <div class="inline-reaction-row" id="inlineReactions-${p.id}">
              <button class="inline-reaction-btn" data-selected="" onclick="pickInlineReaction(${p.id}, 'like', this)">👍</button>
              <button class="inline-reaction-btn" data-selected="" onclick="pickInlineReaction(${p.id}, 'dislike', this)">👎</button>
            </div>
            <div class="inline-form">
              <input class="inline-input" type="text" id="pmsg-${p.id}" placeholder="Write a comment…" maxlength="500"/>
              <button class="btn-inline-submit" onclick="submitProjectComment(${p.id})">Post</button>
            </div>
            <div class="alert" id="palert-${p.id}" style="margin-bottom:0.5rem"></div>
          </div>
          <!-- Comments list -->
          <div class="pcb-comments-list" id="pcomments-${p.id}">
            <div class="pcb-no-comments">Loading comments…</div>
          </div>
        </div>
      </div>
    `).join('');

    // Load reaction counts for all projects
    projects.forEach(p => loadProjectReactions(p.id));
  }

  async function toggleProject(projectId) {
    const block = document.getElementById(`pcb-${projectId}`);
    const isOpen = block.classList.contains('open');
    block.classList.toggle('open');
    if (!isOpen) {
      loadProjectComments(projectId);
    }
  }

  async function loadProjectReactions(projectId) {
    try {
      const res  = await fetch(`${API}/getProjectReactions?projectId=${projectId}`);
      const data = await res.json();
      const el   = document.getElementById(`reactions-${projectId}`);
      if (el) {
        el.innerHTML = Object.entries(data)
          .filter(([, count]) => count > 0)
          .map(([r, count]) => `<div class="reaction-chip">${REACTION_MAP[r]||r} <span>${count}</span></div>`)
          .join('');
      }
    } catch (e) {}
  }

  async function loadProjectComments(projectId) {
    const listEl = document.getElementById(`pcomments-${projectId}`);
    const countEl = document.getElementById(`ccount-${projectId}`);
    try {
      const res  = await fetch(`${API}/getProjectComments?projectId=${projectId}`);
      const data = await res.json();
      if (countEl) countEl.textContent = `💬 ${data.length}`;
      if (!data.length) {
        listEl.innerHTML = `<div class="pcb-no-comments">No comments yet. Be the first!</div>`;
        return;
      }
      listEl.innerHTML = data.map(c => `
        <div class="pcb-comment">
          <div class="pcb-comment-top">
            ${c.reaction ? `<span>${REACTION_MAP[c.reaction]||''}</span>` : ''}
            <span class="pcb-comment-author">${esc(c.authorName)}</span>
            <span class="pcb-comment-time">${timeAgo(c.createdAt)}</span>
          </div>
          <div class="pcb-comment-text">${esc(c.message)}</div>
        </div>
      `).join('');
    } catch (e) {
      // Demo comments
      if (countEl) countEl.textContent = '💬 2';
      listEl.innerHTML = `
        <div class="pcb-comment">
          <div class="pcb-comment-top"><span>👍</span><span class="pcb-comment-author">Juan M.</span><span class="pcb-comment-time">2 days ago</span></div>
          <div class="pcb-comment-text">This was badly needed in our community, thank you!</div>
        </div>
        <div class="pcb-comment">
          <div class="pcb-comment-top"><span class="pcb-comment-author">Anonymous</span><span class="pcb-comment-time">1 week ago</span></div>
          <div class="pcb-comment-text">Can we see the receipts for this project?</div>
        </div>`;
    }
  }

  async function submitProjectComment(projectId) {
    const message = document.getElementById(`pmsg-${projectId}`).value.trim();
    const alertEl = document.getElementById(`palert-${projectId}`);
    const reactionBtn = document.querySelector(`#inlineReactions-${projectId} .inline-reaction-btn.selected`);
    const reaction = reactionBtn?.dataset.selected || '';

    alertEl.className = 'alert';
    if (!message && !reaction) {
      alertEl.textContent = 'Please write a comment or pick a reaction.';
      alertEl.className = 'alert error show';
      return;
    }

    try {
      const res  = await fetch(`${API}/submitProjectComment`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          barangay:   BARANGAY,
          authorName: 'Anonymous',
          message:    message || '(reacted)',
          reaction
        })
      });
      const text = await res.text();
      if (text === 'SUCCESS') {
        document.getElementById(`pmsg-${projectId}`).value = '';
        document.querySelectorAll(`#inlineReactions-${projectId} .inline-reaction-btn`).forEach(b => {
          b.classList.remove('selected');
          b.dataset.selected = '';
        });
        alertEl.className = 'alert';
        loadProjectComments(projectId);
        loadProjectReactions(projectId);
      } else {
        alertEl.textContent = 'Error: ' + text;
        alertEl.className = 'alert error show';
      }
    } catch (e) {
      alertEl.textContent = '⚠️ Could not connect to server.';
      alertEl.className = 'alert error show';
    }
  }

  // ── HELPERS ───────────────────────────────────────────────────────
  function timeAgo(dateStr) {
    if (!dateStr) return '—';
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1)   return 'just now';
      if (mins < 60)  return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24)   return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7)   return `${days}d ago`;
      return new Date(dateStr).toLocaleDateString('en-PH', { month:'short', day:'numeric' });
    } catch { return '—'; }
  }

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── INIT ─────────────────────────────────────────────────────────
  loadGeneralFeed();
  loadProjects();