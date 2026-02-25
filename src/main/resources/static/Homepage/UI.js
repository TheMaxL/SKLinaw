// Committee dropdown
document.getElementById("committeeSelect").addEventListener("change", function() {
    if (this.value !== "") {
        alert("You selected committee: " + this.value);
    }
});

// Top right menu dropdown
document.getElementById("userSelect").addEventListener("change", function() {
    if (this.value === "public") {
        alert("Redirecting to Public View...");
    }

    if (this.value === "signin") {
        alert("Redirecting to Sign In...");
    }
});