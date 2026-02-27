    const signInBtn = document.getElementById("signInBtn");
    const accountForm = document.getElementById("accountForm");
    const viewDetailsBtn = document.getElementById("viewDetailsBtn");
    const haveAccountBtn = document.getElementById("haveAccountBtn");
    const accountDetails = document.getElementById("accountDetails");

    // Show registration form
    signInBtn.addEventListener("click", function() {
      accountForm.classList.remove("hidden");
      signInBtn.style.display = "none";
    });

    // Move to Log-in form
    haveAccountBtn.addEventListener("click", function() {
        window.location.replace("/Log-in/Login.html");
    });

    // Show account details dynamically
    viewDetailsBtn.addEventListener("click", function() {
      const name = document.getElementById("name").value;
      const password = document.getElementById("password").value;
      const barangay = document.getElementById("barangay").value;

      fetch("http://localhost:8080/api/addAccount", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            password: password,
            barangay: barangay
        })
    })
    .then(response => response.text())
    .then(data => {
        alert(data);
    })
    .catch(error => console.error("Error: ", error));
    });