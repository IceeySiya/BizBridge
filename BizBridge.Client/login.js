
"use strict";

const API_BASE_URL = "http://localhost:5214/api";

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

function showMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = `alert alert-${type}`;
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";
    loginMessage.className = "alert d-none";

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            showMessage(
                data.message || data.title || "Invalid email or password.",
                "danger"
            );
            return;
        }

        if (!data.accessToken) {
            showMessage(
                "Login response did not contain an access token.",
                "danger"
            );
            return;
        }

        localStorage.setItem("token", data.accessToken);

        showMessage("Login successful! Redirecting...", "success");

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);

    } catch (error) {
        console.error("Login error:", error);

        showMessage(
            "Unable to connect to BizBridge. Check the API and CORS settings.",
            "danger"
        );
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Login";
    }
});
