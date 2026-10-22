
"use strict";

const API_BASE_URL = "http://localhost:5214/api";
const token = localStorage.getItem("token");

const dashboardMessage = document.getElementById("dashboardMessage");
const logoutButton = document.getElementById("logoutButton");
const noBusinessSection = document.getElementById("noBusinessSection");
const businessSection = document.getElementById("businessSection");

function showMessage(message, type) {
    dashboardMessage.textContent = message;
    dashboardMessage.className = `alert alert-${type}`;
}

function hideMessage() {
    dashboardMessage.textContent = "";
    dashboardMessage.className = "alert d-none";
}

function logout() {
    localStorage.removeItem("token");
    window.location.replace("login.html");
}

logoutButton.addEventListener("click", logout);

function showNoBusiness() {
    noBusinessSection.classList.remove("d-none");
    businessSection.classList.add("d-none");
}

function displayBusiness(business) {
    document.getElementById("businessName").textContent =
        business.businessName ?? business.BusinessName ?? "Unnamed business";

    document.getElementById("businessIndustry").textContent =
        business.industry ?? business.Industry ?? "Industry not provided";

    document.getElementById("businessLocation").textContent =
        business.location ?? business.Location ?? "Location not provided";

    document.getElementById("businessDescription").textContent =
        business.description ?? business.Description ??
        "No description provided.";

    const established =
        business.established ?? business.Established ?? null;

    let establishedText = "Not provided";

    if (established) {
        const date = new Date(established);

        establishedText = Number.isNaN(date.getTime())
            ? "Not provided"
            : date.toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "UTC"
            });
    }

    document.getElementById("businessEstablished").textContent =
        establishedText;

    noBusinessSection.classList.add("d-none");
    businessSection.classList.remove("d-none");
}

async function loadAccount() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (response.status === 401 || response.status === 403) {
        logout();
        return false;
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

    return true;
}

async function loadBusiness() {
    const response = await fetch(`${API_BASE_URL}/businesses/mine`, {
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

    if (response.status === 404 || response.status === 204) {
        showNoBusiness();
        return;
    }

    if (!response.ok) {
        throw new Error("Could not load your business profile.");
    }

    const data = await response.json();

    // Accommodate a direct object or a wrapped API response.
    const business = data?.business ?? data?.data ?? data;

    if (!business || typeof business !== "object") {
        showNoBusiness();
        return;
    }

    displayBusiness(business);
}

async function loadDashboard() {
    if (!token) {
        logout();
        return;
    }

    hideMessage();

    try {
        const accountLoaded = await loadAccount();

        if (!accountLoaded) {
            return;
        }
    } catch (error) {
        console.error("Account loading error:", error);

        showMessage(
            "Unable to load your account. Check that the API is running and CORS is configured.",
            "danger"
        );

        return;
    }

    try {
        await loadBusiness();
    } catch (error) {
        console.error("Business loading error:", error);

        showMessage(
            "Your account loaded, but we couldn't retrieve your business details. Please try refreshing the page.",
            "warning"
        );
    }
}

loadDashboard();
