    const logInBtn = document.getElementById("logInBtn");
    const logInForm = document.getElementById("loginForm");

    logInBtn.addEventListener("click", function () {

    const name = document.getElementById("name").value;
    const password = document.getElementById("password").value;

    fetch("/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            password: password
        })
    })
    .then(response => response.text())
    .then(data => {

        if (data === "SUCCESS") {
            window.location.replace("/Homepage/UI.html");
        } else if (data === "INVALID") {
            alert("Invalid name or password.");
        } else {
            alert("Server error.");
        }

    })
    .catch(error => {
        console.error("Error:", error);
    });

});
