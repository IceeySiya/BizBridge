
"use strict";

const API_BASE_URL = "http://localhost:5214/api";

const token = localStorage.getItem("token");

const businessForm = document.getElementById("businessForm");
const businessMessage = document.getElementById("businessMessage");
const saveBusinessButton = document.getElementById("saveBusinessButton");
const resetBusinessButton = document.getElementById("resetBusinessButton");
const logoutButton = document.getElementById("logoutButton");

let existingBusiness = false;

// Display a success, error, or information message.
function showMessage(message, type) {
    businessMessage.textContent = message;
    businessMessage.className = `alert alert-${type}`;
}

// Clear the message when the user starts editing.
function clearMessage() {
    businessMessage.textContent = "";
    businessMessage.className = "alert d-none";
}

// Redirect unauthenticated users to the login page.
function logout() {
    localStorage.removeItem("token");
    window.location.replace("login.html");
}

// Fill the form using the business profile returned by the API.
function populateForm(business) {
    document.getElementById("businessName").value =
        business.businessName ?? business.BusinessName ?? "";

    document.getElementById("industry").value =
        business.industry ?? business.Industry ?? "";

    document.getElementById("location").value =
        business.location ?? business.Location ?? "";

    document.getElementById("description").value =
        business.description ?? business.Description ?? "";

    const established =
        business.established ?? business.Established ?? null;

    document.getElementById("established").value =
        established ? String(established).substring(0, 10) : "";

    existingBusiness = true;
    saveBusinessButton.textContent = "Update Business Profile";
}

// Get the user's existing business profile.
async function loadBusinessProfile() {
    if (!token) {
        logout();
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/businesses/mine`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            }
        );

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        // A 404 means there is no profile yet, if that is how
        // your controller represents a missing business.
        if (response.status === 404) {
            existingBusiness = false;
            saveBusinessButton.textContent = "Create Business Profile";
            return;
        }

        if (!response.ok) {
            throw new Error("Could not load your business profile.");
        }

        const data = await response.json();

        // Support either a direct business object or a wrapped response.
        const business = data.business ?? data;

        populateForm(business);

    } catch (error) {
        console.error("Business profile loading error:", error);

        showMessage(
            "Unable to load your business profile. Check that the API is running.",
            "danger"
        );
    }
}

// Create or update the business profile.
businessForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    if (!token) {
        logout();
        return;
    }

    const businessName =
        document.getElementById("businessName").value.trim();

    const industry =
        document.getElementById("industry").value.trim();

    const location =
        document.getElementById("location").value.trim();

    const description =
        document.getElementById("description").value.trim();

    const establishedDate =
        document.getElementById("established").value;

    // Match the required string lengths in the C# DTOs.
    if (businessName.length < 2 || businessName.length > 150) {
        showMessage(
            "Business name must contain between 2 and 150 characters.",
            "warning"
        );
        return;
    }

    if (industry.length < 2 || industry.length > 100) {
        showMessage(
            "Industry must contain between 2 and 100 characters.",
            "warning"
        );
        return;
    }

    if (location.length > 150) {
        showMessage(
            "Location cannot exceed 150 characters.",
            "warning"
        );
        return;
    }

    if (description.length > 2000) {
        showMessage(
            "Description cannot exceed 2,000 characters.",
            "warning"
        );
        return;
    }

    // DateTimeOffset expects a date-time value, so convert the
    // optional date input to an ISO date-time string.
    const established = establishedDate
        ? `${establishedDate}T00:00:00Z`
        : null;

    const businessData = {
        businessName,
        industry,
        location: location || null,
        description: description || null,
        established
    };

    const isUpdating = existingBusiness;

    const endpoint = isUpdating
        ? `${API_BASE_URL}/businesses/mine`
        : `${API_BASE_URL}/businesses`;

    saveBusinessButton.disabled = true;
    saveBusinessButton.textContent = isUpdating
        ? "Updating..."
        : "Creating...";

    try {
        const response = await fetch(endpoint, {
            method: isUpdating ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            },
            body: JSON.stringify(businessData)
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }

        if (!response.ok) {
            const errorMessage =
                data.message ||
                data.title ||
                (response.status === 409
                    ? "You already have a business profile."
                    : "Could not save your business profile.");

            showMessage(errorMessage, "danger");
            return;
        }

        existingBusiness = true;

        showMessage(
            isUpdating
                ? "Business profile updated successfully! Redirecting..."
                : "Business profile created successfully! Redirecting...",
            "success"
        );

        saveBusinessButton.textContent = "Update Business Profile";

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1200);

    } catch (error) {
        console.error("Business profile save error:", error);

        showMessage(
            "Unable to connect to BizBridge. Check that the API is running and CORS is configured.",
            "danger"
        );
    } finally {
        saveBusinessButton.disabled = false;

        if (existingBusiness) {
            saveBusinessButton.textContent = "Update Business Profile";
        } else {
            saveBusinessButton.textContent = "Create Business Profile";
        }
    }
});

// Restore the existing profile, or clear the form for a new profile.
resetBusinessButton.addEventListener("click", () => {
    clearMessage();

    if (existingBusiness) {
        loadBusinessProfile();
    } else {
        businessForm.reset();
    }
});

// Protect the page and load the profile.
if (logoutButton) {
    logoutButton.addEventListener("click", logout);
}

loadBusinessProfile();

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
