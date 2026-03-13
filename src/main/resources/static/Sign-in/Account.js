const signInBtn = document.getElementById("signInBtn");
const accountForm = document.getElementById("accountForm");
const haveAccountBtn = document.getElementById("haveAccountBtn");
const submitCredentialsBtn = document.getElementById("submitCredentialsBtn");
const photoInput = document.getElementById("photo");

// Show form
signInBtn.addEventListener("click", function() {
    accountForm.classList.remove("hidden");
    signInBtn.style.display = "none";
});

// Go to login
haveAccountBtn.addEventListener("click", function() {
    window.location.replace("/Log-in/Login.html");
});

// Submit credentials
submitCredentialsBtn.addEventListener("click", function() {

    const name = document.getElementById("name").value;
    const password = document.getElementById("password").value;
    const barangay = document.getElementById("barangay").value;
    const photo = photoInput.files[0];

    if (!photo) {
        alert("Please upload your identification photo.");
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("password", password);
    formData.append("barangay", barangay);
    formData.append("photo", photo);

    fetch("/api/submitCredentials", {
        method: "POST",
        body: formData
    })
    .then(res => res.text())
    .then(data => {

        if (data === "SUCCESS") {
            alert("Credentials submitted. Please wait for admin approval.");
            window.location.replace("/Log-in/Login.html");
        }
        else if (data === "NOT_VERIFIED") {
            alert("You are not in the verified SK list.");
        }
        else if (data === "ALREADY_SUBMITTED") {
            alert("Your credentials are already under review.");
        }
        else {
            alert("Server error.");
        }

    });

});