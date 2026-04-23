document.addEventListener('DOMContentLoaded', () => {

  // 🔹 NAVBAR BUTTONS
  document.getElementById('nav-signup')?.addEventListener('click', () => {
    location.href = '../Sign-in/signup.html';
  });

  document.getElementById('nav-login')?.addEventListener('click', () => {
    location.href = '../Log-in/login.html';
  });

  // 🔹 ENTRY CARDS
  document.getElementById('card-public')?.addEventListener('click', () => {
    location.href = '../Public-view/public.html';
  });

  document.getElementById('card-login')?.addEventListener('click', () => {
    location.href = '../Log-in/login.html';
  });

  document.getElementById('card-signup')?.addEventListener('click', () => {
    location.href = '../Sign-in/signup.html';
  });

});