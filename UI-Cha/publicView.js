// publicView.js
document.addEventListener('DOMContentLoaded', function() {
  const navButtons = document.querySelectorAll('.pv-nav-item');
  
  navButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // You can add logic here to load content for each section
    });
  });
  navButtons[0].classList.add('active'); // highlights ANNOUNCEMENTS on load
});
