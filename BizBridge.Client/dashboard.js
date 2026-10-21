
"use strict";

const API_BASE_URL = "http://localhost:5214/api";

const token = localStorage.getItem("token");

const dashboardMessage = document.getElementById("dashboardMessage");
const logoutButton = document.getElementById("logoutButton");

function showMessage(message, type) {
    dashboardMessage.textContent = message;
    dashboardMessage.className = `alert alert-${type}`;
}

function logout() {
    localStorage.removeItem("token");
    window.location.replace("login.html");
}

logoutButton.addEventListener("click", logout);

async function loadDashboard() {
    if (!token) {
        window.location.replace("login.html");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error("Could not load your account details.");
        }

        const user = await response.json();

        document.getElementById("userFullName").textContent =
            user.fullName || "there";

        document.getElementById("profileName").textContent =
            user.fullName || "Not available";

        document.getElementById("profileEmail").textContent =
            user.email || "Not available";

        document.getElementById("profileRole").textContent =
            user.role || "User";

    } catch (error) {
        console.error("Dashboard error:", error);

        showMessage(
            "Unable to load your account. Check that the API is running and CORS is configured.",
            "danger"
        );
    }
}

loadDashboard();
