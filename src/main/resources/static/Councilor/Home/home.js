document.addEventListener('DOMContentLoaded', () => {

  // 🔹 NAVBAR BUTTONS
  document.getElementById('nav-signup')?.addEventListener('click', () => {
    location.href = '../Sign-in/signup.html';
  });

  document.getElementById('nav-login')?.addEventListener('click', () => {
    location.href = '../Log-in/Login.html';
  });

  // 🔹 ENTRY CARDS
  document.getElementById('card-public')?.addEventListener('click', () => {
    location.href = '../../Public/Feedback/Feedback.html';
  });

  document.getElementById('card-login')?.addEventListener('click', () => {
    location.href = '../Log-in/Login.html';
  });

  document.getElementById('card-signup')?.addEventListener('click', () => {
    location.href = '../Sign-in/signup.html';
  });

});