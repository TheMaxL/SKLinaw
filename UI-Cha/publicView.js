document.addEventListener('DOMContentLoaded', function() {
  const navButtons = document.querySelectorAll('.pv-nav-item');
  const contentArea = document.querySelector('.pv-content-area');
  
  const committeeContainer = document.createElement('div');
  committeeContainer.className = 'committee-container';
  committeeContainer.style.display = 'none';
  
  const committeeItems = [
    'ACTIVE CITIZENSHIP',
    'ECONOMIC',
    'EDUCATION',
    'ENVIRONMENT',
    'GLOBAL MOBILITY',
    'GOVERNANCE',
    'HEALTH',
    'PEACE-BUILDING AND SECURITY', 
    'SOCIAL INCLUSION AND EQUITY',
    'TREASURY',
    'SECRETARIAL',
    'OTHERS'
  ];
  
  committeeItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'committee-btn';
    btn.textContent = item;
    committeeContainer.appendChild(btn);
  });
  
  contentArea.appendChild(committeeContainer);
  
  navButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      contentArea.innerHTML = '';
      
      if (btn.textContent === 'COMMITTEE SELECTION') {
        contentArea.appendChild(committeeContainer);
        committeeContainer.style.display = 'grid';
      } else if (btn.textContent === 'ANNOUNCEMENTS') {
        // announcements content
        const placeholder = document.createElement('div');
        placeholder.style.padding = '32px';
        placeholder.style.color = '#fff';
        placeholder.style.fontSize = '1.5em';
        placeholder.textContent = 'ANNOUNCEMENTS CONTENT';
        contentArea.appendChild(placeholder);
      } else if (btn.textContent === 'GENERAL INFORMATION') {
        // general info content
        const placeholder = document.createElement('div');
        placeholder.style.padding = '32px';
        placeholder.style.color = '#fff';
        placeholder.style.fontSize = '1.5em';
        placeholder.textContent = 'GENERAL INFORMATION CONTENT';
        contentArea.appendChild(placeholder);
      }
    });
  });
});