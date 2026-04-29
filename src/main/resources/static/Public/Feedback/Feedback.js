const API = 'http://localhost:8085/api';
const ADMIN_API = 'http://localhost:8085/admin';
let currentBarangay = '';
let currentProjectId = null;
let currentProjectName = '';
let currentRating = 0; // Add this for tracking rating

// Load barangays on page load using AdminController
async function loadBarangays() {
  console.log('Loading barangays from:', `${ADMIN_API}/councilors`);
  try {
    const response = await fetch(`${ADMIN_API}/councilors`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    const councilors = await response.json();
    console.log('Councilors data:', councilors);
    
    const barangays = [...new Set(councilors.map(c => c.barangay).filter(b => b))];
    console.log('Unique barangays:', barangays);
    
    const select = document.getElementById('barangaySelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">— Select a barangay —</option>';
    barangays.forEach(barangay => {
      select.innerHTML += `<option value="${escapeHtml(barangay)}">${escapeHtml(barangay)}</option>`;
    });
    
    if (barangays.length === 0) {
      select.innerHTML = '<option value="">— Select a barangay —</option>' +
        '<option value="Lahug">Lahug</option>' +
        '<option value="Apas">Apas</option>' +
        '<option value="Banilad">Banilad</option>';
    }
    
  } catch (error) {
    console.error('Error loading barangays:', error);
    showToast('Could not load barangays.', true);
    
    const select = document.getElementById('barangaySelect');
    if (select) {
      select.innerHTML = '<option value="">— Select a barangay —</option>' +
        '<option value="Lahug">Lahug</option>' +
        '<option value="Apas">Apas</option>' +
        '<option value="Banilad">Banilad</option>';
    }
  }
}

// Initialize rating stars
function initRatingStars() {
  const stars = document.querySelectorAll('#feedbackModal .star');
  console.log('Initializing stars, found:', stars.length);
  
  stars.forEach(star => {
    star.removeEventListener('click', handleStarClick);
    star.addEventListener('click', handleStarClick);
  });
}

function handleStarClick() {
  const rating = parseInt(this.dataset.rating);
  currentRating = rating;
  
  // Update the hidden input
  const ratingInput = document.getElementById('feedbackRating');
  if (ratingInput) ratingInput.value = rating;
  
  // Update all stars in the modal
  const stars = document.querySelectorAll('#feedbackModal .star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add('active');
      star.textContent = '★';
    } else {
      star.classList.remove('active');
      star.textContent = '☆';
    }
  });
  
  console.log('Rating set to:', rating);
}

// Load committees when barangay changes
async function loadCommittees(barangay) {
  const sel = document.getElementById('committeeSelect');
  if (!sel) return;
  
  sel.innerHTML = '<option value="">All committees</option>';
  if (!barangay) return;

  try {
    const res = await fetch(`${API}/getCommittees?barangay=${encodeURIComponent(barangay)}`);
    if (!res.ok) throw new Error('Failed to fetch committees');
    
    const data = await res.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      sel.innerHTML = '<option value="">No committees found</option>';
      return;
    }
    
    data.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.committeeName || c.name;
      opt.textContent = c.committeeName || c.name;
      sel.appendChild(opt);
    });
  } catch (e) {
    console.error('Error loading committees:', e);
    sel.innerHTML = '<option value="">Error loading committees</option>';
  }
}

// Load comments for a specific project
async function loadProjectComments(projectId) {
  try {
    const response = await fetch(`${API}/getProjectComments?projectId=${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    
    const comments = await response.json();
    return comments;
  } catch (error) {
    console.error('Error loading comments:', error);
    return [];
  }
}

async function loadProjects() {
  const barangaySelect = document.getElementById('barangaySelect');
  const committeeSelect = document.getElementById('committeeSelect');
  const searchInput = document.getElementById('searchInput');
  
  const barangay = barangaySelect ? barangaySelect.value : '';
  const committee = committeeSelect ? committeeSelect.value : '';
  const search = searchInput ? searchInput.value.toLowerCase() : '';

  if (!barangay) {
    showToast('Please select a barangay first.', true);
    return;
  }

  currentBarangay = barangay;
  const listEl = document.getElementById('projectList');
  if (listEl) {
    listEl.innerHTML = `<div class="loader"><span></span><span></span><span></span></div>`;
  }
  
  const statsBar = document.getElementById('statsBar');
  const listLabel = document.getElementById('listLabel');
  
  if (statsBar) statsBar.style.display = 'none';
  if (listLabel) listLabel.style.display = 'none';

  try {
    let allProjects = [];

    if (committee) {
      const res = await fetch(`${API}/getProjects?barangay=${encodeURIComponent(barangay)}&committeeName=${encodeURIComponent(committee)}`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      allProjects = Array.isArray(data) ? data.map(p => ({ ...p, committeeName: committee })) : [];
    } else {
      const cRes = await fetch(`${API}/getCommittees?barangay=${encodeURIComponent(barangay)}`);
      if (!cRes.ok) throw new Error('Failed to fetch committees');
      const committees = await cRes.json();

      for (const c of committees) {
        const committeeName = c.committeeName || c.name;
        const pRes = await fetch(`${API}/getProjects?barangay=${encodeURIComponent(barangay)}&committeeName=${encodeURIComponent(committeeName)}`);
        if (pRes.ok) {
          const projects = await pRes.json();
          if (Array.isArray(projects)) {
            projects.forEach(p => allProjects.push({ ...p, committeeName: committeeName }));
          }
        }
      }
    }

    // Only show APPROVED to public
    let visible = allProjects.filter(p => p.status === 'APPROVED');

    // Apply search filter
    if (search) {
      visible = visible.filter(p =>
        (p.projectName || '').toLowerCase().includes(search) ||
        (p.purpose || '').toLowerCase().includes(search)
      );
    }

    renderStats(visible);
    await renderProjectsWithComments(visible);

  } catch (e) {
    console.error('Error loading projects:', e);
    if (listEl) {
      listEl.innerHTML = `<div class="empty-state"><p>⚠️ Could not connect to the server.</p></div>`;
    }
    showToast('Could not load projects.', true);
  }
}

function renderStats(projects) {
  const total = projects.length;
  const cost = projects.reduce((sum, p) => sum + (p.totalCost || 0), 0);

  const statTotal = document.getElementById('statTotal');
  const statCost = document.getElementById('statCost');
  const statsBar = document.getElementById('statsBar');
  const listLabel = document.getElementById('listLabel');
  
  if (statTotal) statTotal.textContent = total;
  if (statCost) statCost.textContent = '₱' + cost.toLocaleString('en-PH');
  if (statsBar) statsBar.style.display = 'grid';
  if (listLabel) listLabel.style.display = 'block';
}

async function renderProjectsWithComments(projects) {
  const listEl = document.getElementById('projectList');
  if (!listEl) return;
  
  if (projects.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/>
        </svg>
        <p>No published projects found for this selection.</p>
      </div>`;
    return;
  }

  let html = '';
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const commentContainerId = `comments-${p.id}`;
    const comments = await loadProjectComments(p.id);
    
    html += `
      <div class="project-card" data-project-id="${p.id}" style="animation-delay:${i * 0.05}s">
        <div class="project-header" onclick="toggleCard(this.parentElement)">
          <div class="project-title-block">
            <div class="project-name">${escapeHtml(p.projectName)}</div>
            <div class="project-meta">
              <span>📁 ${escapeHtml(p.committeeName || '')}</span>
              <span>👤 ${escapeHtml(p.councilorName || '')}</span>
              <span>📅 ${formatDate(p.createdAt)}</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.6rem;flex-shrink:0">
            <div class="project-cost">₱${(p.totalCost || 0).toLocaleString('en-PH')}</div>
            <div class="status-pill status-${p.status}">${p.status}</div>
          </div>
        </div>
        <div class="project-details">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Purpose</label>
              <p>${escapeHtml(p.purpose || '—')}</p>
            </div>
            <div class="detail-item">
              <label>Total Cost</label>
              <p>₱${(p.totalCost || 0).toLocaleString('en-PH')}</p>
            </div>
            <div class="detail-item">
              <label>Committee</label>
              <p>${escapeHtml(p.committeeName || '—')}</p>
            </div>
            <div class="detail-item">
              <label>Submitted by</label>
              <p>${escapeHtml(p.councilorName || '—')}</p>
            </div>
          </div>
          
          <div class="comments-section">
            <div class="comments-header">
              <h4>💬 Community Feedback</h4>
              <button class="btn-feedback-small" onclick="openFeedbackModal(${p.id}, '${escapeHtml(p.projectName)}')">
                + Add Feedback
              </button>
            </div>
            <div class="comments-list" id="${commentContainerId}">
              ${renderCommentsHtml(comments)}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  listEl.innerHTML = html;
}

function renderCommentsHtml(comments) {
  if (!comments || comments.length === 0) {
    return '<div class="no-comments">No feedback yet. Click "+ Add Feedback" to share your thoughts!</div>';
  }
  
  return comments.map(c => `
    <div class="comment-item">
      <div class="comment-header">
        <span class="comment-name">${escapeHtml(c.authorName || 'Anonymous')}</span>
        <span class="comment-date">${formatDate(c.createdAt)}</span>
      </div>
      <div class="comment-message">${escapeHtml(c.message)}</div>
      ${c.rating ? `<div class="comment-rating">${'★'.repeat(c.rating)}${'☆'.repeat(5-c.rating)}</div>` : ''}
      ${c.reaction && !c.rating ? `<div class="comment-reaction">👍 ${escapeHtml(c.reaction)}</div>` : ''}
    </div>
  `).join('');
}

function toggleCard(card) {
  card.classList.toggle('open');
}

// Feedback functions for individual projects
function openFeedbackModal(projectId, projectName) {
  currentProjectId = projectId;
  currentProjectName = projectName;
  currentRating = 0; // Reset rating
  
  const modal = document.getElementById('feedbackModal');
  const projectNameSpan = document.getElementById('feedbackProjectName');
  
  if (projectNameSpan) {
    projectNameSpan.textContent = `Project: ${projectName}`;
  }
  
  // Reset form
  const feedbackName = document.getElementById('feedbackName');
  const feedbackMessage = document.getElementById('feedbackMessage');
  const ratingInput = document.getElementById('feedbackRating');
  
  if (feedbackName) feedbackName.value = '';
  if (feedbackMessage) feedbackMessage.value = '';
  if (ratingInput) ratingInput.value = '0';
  
  // Reset stars
  const stars = document.querySelectorAll('#feedbackModal .star');
  stars.forEach(star => {
    star.classList.remove('active');
    star.textContent = '☆';
  });
  
  if (modal) modal.style.display = 'flex';
  
  // Re-initialize stars when modal opens
  setTimeout(() => {
    initRatingStars();
  }, 100);
}

function closeFeedbackModal() {
  const modal = document.getElementById('feedbackModal');
  if (modal) modal.style.display = 'none';
  currentProjectId = null;
  currentProjectName = null;
  currentRating = 0;
}

async function submitFeedback() {
  const messageInput = document.getElementById('feedbackMessage');
  const message = messageInput ? messageInput.value.trim() : '';
  
  if (!message) {
    showToast('Please enter your feedback.', true);
    return;
  }
  
  if (!currentProjectId) {
    showToast('Error: No project selected.', true);
    return;
  }
  
  const nameInput = document.getElementById('feedbackName');
  const name = nameInput ? nameInput.value.trim() : '';
  const rating = currentRating;
  
  const feedbackData = {
    projectId: currentProjectId,
    barangay: currentBarangay,
    authorName: name || 'Anonymous',
    message: message,
    reaction: rating > 0 ? rating.toString() : ''
  };
  
  console.log('Submitting feedback:', feedbackData); // Debug log
  
  try {
    const response = await fetch(`${API}/submitProjectComment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData)
    });
    
    const result = await response.text();
    console.log('Server response:', result); // Debug log
    
    if (result === 'SUCCESS') {
      showToast('Thank you for your feedback!');
      closeFeedbackModal();
      
      const commentsContainer = document.getElementById(`comments-${currentProjectId}`);
      if (commentsContainer) {
        const comments = await loadProjectComments(currentProjectId);
        commentsContainer.innerHTML = renderCommentsHtml(comments);
      }
    } else if (result === 'EMPTY_MESSAGE') {
      showToast('Please enter a message.', true);
    } else if (result === 'MESSAGE_TOO_LONG') {
      showToast('Message is too long (max 500 characters).', true);
    } else {
      showToast('Error submitting feedback: ' + result, true);
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    showToast('Could not submit feedback: ' + error.message, true);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(str) {
  if (!str) return '—';
  try { 
    return new Date(str).toLocaleDateString('en-PH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch { 
    return str; 
  }
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = msg;
  toast.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  const barangaySelect = document.getElementById('barangaySelect');
  if (barangaySelect) {
    barangaySelect.addEventListener('change', (e) => {
      loadCommittees(e.target.value);
    });
  }
  
  const loadBtn = document.getElementById('loadBtn');
  if (loadBtn) {
    loadBtn.addEventListener('click', loadProjects);
  }
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const cards = document.querySelectorAll('.project-card');
      const q = this.value.toLowerCase();
      cards.forEach(card => {
        const name = card.querySelector('.project-name')?.textContent.toLowerCase() || '';
        card.style.display = (!q || name.includes(q)) ? '' : 'none';
      });
    });
  }
  
  // Initialize rating stars
  initRatingStars();
  
  // Load barangays
  loadBarangays();
});

// Make functions global for onclick handlers
window.openFeedbackModal = openFeedbackModal;
window.closeFeedbackModal = closeFeedbackModal;
window.submitFeedback = submitFeedback;
window.toggleCard = toggleCard;