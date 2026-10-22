"use strict";

const API_BASE_URL = "https://localhost:7142/api";
const ACCESS_TOKEN_KEY = "bizBridgeAccessToken";

const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
const form = document.getElementById("businessForm");
const formSection = document.getElementById("businessFormSection");
const summary = document.getElementById("businessSummary");
const messageBox = document.getElementById("dashboardMessage");
const saveButton = document.getElementById("saveBusinessButton");
const cancelButton = document.getElementById("cancelEditButton");
const editButton = document.getElementById("editBusinessButton");
const formTitle = document.getElementById("profileFormTitle");

let currentBusiness = null;
let isEditing = false;

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

function getErrorMessage(result) {
    const validationMessages = Object.values(result.errors || {})
        .flat()
        .filter((message) => typeof message === "string");

    if (validationMessages.length) {
        return validationMessages.join(" ");
    }

    return result.message || result.title || "The request could not be completed.";
}

async function requestJson(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new ApiError(getErrorMessage(result), response.status);
    }

    return result;
}

function showMessage(message, type) {
    if (!messageBox) {
        return;
    }

    messageBox.textContent = message;
    messageBox.className = type
        ? `alert alert-${type}`
        : "alert d-none";
}

function showForm(editing = false) {
    isEditing = editing;
    formSection.classList.remove("d-none");
    summary.classList.add("d-none");
    formTitle.textContent = editing
        ? "Update your BizBridge profile"
        : "Create your BizBridge profile";
    saveButton.textContent = editing
        ? "Update business profile"
        : "Save business profile";
    cancelButton.classList.toggle("d-none", !editing);

    if (editing && currentBusiness) {
        form.elements.businessName.value = currentBusiness.businessName || "";
        form.elements.industry.value = currentBusiness.industry || "";
        form.elements.location.value = currentBusiness.location || "";
        form.elements.description.value = currentBusiness.description || "";
        form.elements.established.value = currentBusiness.established
            ? currentBusiness.established.slice(0, 10)
            : "";
    } else {
        form.reset();
    }
}

function showBusinessSummary(business) {
    currentBusiness = business;
    document.getElementById("businessName").textContent =
        business.businessName || "Business profile";
    document.getElementById("businessMeta").textContent = business.location
        ? `${business.location} • ${business.industry || "Business"}`
        : business.industry || "Business";
    document.getElementById("businessIndustry").textContent =
        business.industry || "Not provided";
    document.getElementById("businessLocation").textContent =
        business.location || "Not provided";
    document.getElementById("businessDescription").textContent =
        business.description || "No business description yet.";
    document.getElementById("businessEstablished").textContent =
        business.established
            ? business.established.slice(0, 10)
            : "Not provided";
    summary.classList.remove("d-none");
    formSection.classList.add("d-none");
    cancelButton.classList.add("d-none");
    isEditing = false;
}

function createProfilePayload() {
    const formData = new FormData(form);
    const businessName = formData.get("businessName").toString().trim();
    const industry = formData.get("industry").toString().trim();

    if (businessName.length < 2 || businessName.length > 150) {
        throw new Error("Business name must contain 2 to 150 characters.");
    }

    if (industry.length < 2 || industry.length > 100) {
        throw new Error("Industry must contain 2 to 100 characters.");
    }

    const establishedDate = formData.get("established").toString();

    return {
        businessName,
        industry,
        location: formData.get("location").toString().trim() || null,
        description: formData.get("description").toString().trim() || null,
        established: establishedDate
            ? new Date(`${establishedDate}T00:00:00.000Z`).toISOString()
            : null
    };
}

async function loadBusinessProfile() {
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const business = await requestJson("/businesses/mine");
        showBusinessSummary(business);
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            showForm();
            return;
        }

        if (error instanceof ApiError && error.status === 401) {
            sessionStorage.removeItem(ACCESS_TOKEN_KEY);
            window.location.href = "login.html";
            return;
        }

        console.error("Unable to fetch business profile:", error);
        showMessage(error.message, "danger");
    }
}

async function saveBusinessProfile(event) {
    event.preventDefault();
    showMessage("", "");
    saveButton.disabled = true;
    saveButton.textContent = isEditing ? "Updating..." : "Saving...";

    try {
        const payload = createProfilePayload();
        const business = await requestJson(
            isEditing ? "/businesses/mine" : "/businesses",
            {
                method: isEditing ? "PUT" : "POST",
                body: JSON.stringify(payload)
            }
        );

        showBusinessSummary(business);
        showMessage(
            isEditing
                ? "Business profile updated successfully."
                : "Business profile created successfully.",
            "success"
        );
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            sessionStorage.removeItem(ACCESS_TOKEN_KEY);
            window.location.href = "login.html";
            return;
        }

        showMessage(error.message, "danger");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = isEditing
            ? "Update business profile"
            : "Save business profile";
    }
}

function handleLogout() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    form.addEventListener("submit", saveBusinessProfile);
    editButton.addEventListener("click", () => showForm(true));
    cancelButton.addEventListener("click", () => {
        if (currentBusiness) {
            showBusinessSummary(currentBusiness);
        } else {
            showForm();
        }
    });
    document.getElementById("logoutButton")
        .addEventListener("click", handleLogout);

    loadBusinessProfile();
});
