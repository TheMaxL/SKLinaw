document.addEventListener('DOMContentLoaded', function() {
  const navButtons = document.querySelectorAll('.pv-nav-item');
  
  navButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  navButtons[0].classList.add('active'); 
});
