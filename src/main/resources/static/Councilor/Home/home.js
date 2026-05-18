document.addEventListener('DOMContentLoaded', () => {

  // 🔹 NAVBAR BUTTONS
  document.getElementById('nav-signup')?.addEventListener('click', () => {
    location.href = '../Sign-in';
  });

  document.getElementById('nav-login')?.addEventListener('click', () => {
    location.href = '../Log-in/Login';
  });

  // 🔹 ENTRY CARDS
  document.getElementById('card-public')?.addEventListener('click', () => {
    location.href = '../../Public/Feedback/Feedback';
  });

  document.getElementById('card-login')?.addEventListener('click', () => {
    location.href = '../Log-in/Login';
  });

  document.getElementById('card-signup')?.addEventListener('click', () => {
    location.href = '../Sign-in/signup';
  });

});