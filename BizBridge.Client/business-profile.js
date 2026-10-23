

"use strict";

const API_BASE_URL = window.BIZBRIDGE_API_BASE_URL;
const TOKEN_KEY = "token";


document.addEventListener("DOMContentLoaded", () => {
    const businessForm = document.getElementById("businessForm");
    const businessMessage = document.getElementById("businessMessage");
    const saveButton = document.getElementById("saveBusinessButton");
    const resetButton = document.getElementById("resetBusinessButton");
    const logoutButton = document.getElementById("logoutButton");

    const businessNameInput = document.getElementById("businessName");
    const industryInput = document.getElementById("industry");
    const locationInput = document.getElementById("location");
    const descriptionInput = document.getElementById("description");
    const establishedInput = document.getElementById("established");

    const requiredElements = [
        businessForm,
        saveButton,
        businessNameInput,
        industryInput,
        locationInput,
        descriptionInput,
        establishedInput
    ];

    if (requiredElements.some(element => !element)) {
        console.error(
            "Business profile elements are missing. Check business-profile.html."
        );
        return;
    }

    let existingBusiness = false;
    let originalButtonText = "Create Business Profile";

    function showMessage(message, type = "info") {
        if (!businessMessage) return;

        businessMessage.textContent = message;
        businessMessage.className = `alert alert-${type}`;
    }

    function clearMessage() {
        if (!businessMessage) return;

        businessMessage.textContent = "";
        businessMessage.className = "alert d-none";
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("user");
        window.location.replace("login.html");
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    async function apiRequest(path, options = {}) {
        const token = getToken();

        if (!token) {
            logout();
            throw new Error("Please log in again.");
        }

        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                Accept: "application/json",
                ...(options.body
                    ? { "Content-Type": "application/json" }
                    : {}),
                ...options.headers,
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json().catch(() => null);

        if (response.status === 401 || response.status === 403) {
            logout();
            throw new Error("Your session has expired. Please log in again.");
        }

        if (!response.ok) {
            const validationErrors = data?.errors
                ? Object.values(data.errors).flat().join(" ")
                : "";

            throw new Error(
                validationErrors ||
                data?.message ||
                data?.title ||
                `Request failed with status ${response.status}.`
            );
        }

        return { response, data };
    }

    function populateForm(business) {
        businessNameInput.value =
            business.businessName ?? business.BusinessName ?? "";

        industryInput.value =
            business.industry ?? business.Industry ?? "";

        locationInput.value =
            business.location ?? business.Location ?? "";

        descriptionInput.value =
            business.description ?? business.Description ?? "";

        const established =
            business.established ?? business.Established ?? null;

        establishedInput.value = established
            ? String(established).substring(0, 10)
            : "";

        existingBusiness = true;
        saveButton.textContent = "Update Business Profile";
    }

    function getBusinessPayload() {
        const businessName = businessNameInput.value.trim();
        const industry = industryInput.value.trim();
        const location = locationInput.value.trim();
        const description = descriptionInput.value.trim();
        const establishedDate = establishedInput.value;

        if (businessName.length < 2 || businessName.length > 150) {
            throw new Error(
                "Business name must contain between 2 and 150 characters."
            );
        }

        if (industry.length < 2 || industry.length > 100) {
            throw new Error(
                "Industry must contain between 2 and 100 characters."
            );
        }

        if (location.length > 150) {
            throw new Error("Location cannot exceed 150 characters.");
        }

        if (description.length > 2000) {
            throw new Error("Description cannot exceed 2,000 characters.");
        }

        return {
            businessName,
            industry,
            location: location || null,
            description: description || null,
            established: establishedDate
                ? `${establishedDate}T00:00:00Z`
                : null
        };
    }

    async function loadBusinessProfile() {
        clearMessage();

        if (!getToken()) {
            logout();
            return;
        }

        try {
            const { response, data } = await apiRequest(
                "/businesses/mine"
            );

            if (response.status === 204 || !data) {
                existingBusiness = false;
                saveButton.textContent = "Create Business Profile";
                return;
            }

            populateForm(data.business ?? data);
        } catch (error) {
            if (
                error.message.includes("session has expired") ||
                error.message.includes("Please log in again")
            ) {
                return;
            }

            // A 404 means no profile exists yet.
            if (error.message.includes("status 404")) {
                existingBusiness = false;
                saveButton.textContent = "Create Business Profile";
                return;
            }

            console.error("Business profile loading error:", error);
            showMessage(error.message, "danger");
        }
    }

    businessForm.addEventListener("submit", async event => {
        event.preventDefault();
        clearMessage();

        let payload;

        try {
            payload = getBusinessPayload();
        } catch (error) {
            showMessage(error.message, "warning");
            return;
        }

        const isUpdating = existingBusiness;
        const endpoint = isUpdating
            ? "/businesses/mine"
            : "/businesses";

        originalButtonText = isUpdating
            ? "Update Business Profile"
            : "Create Business Profile";

        saveButton.disabled = true;
        saveButton.textContent = isUpdating
            ? "Updating..."
            : "Creating...";

        try {
            await apiRequest(endpoint, {
                method: isUpdating ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });

            existingBusiness = true;

            showMessage(
                isUpdating
                    ? "Business profile updated successfully!"
                    : "Business profile created successfully!",
                "success"
            );

            saveButton.textContent = "Update Business Profile";

            window.setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1200);
        } catch (error) {
            console.error("Business profile save error:", error);
            showMessage(error.message, "danger");
        } finally {
            saveButton.disabled = false;

            if (!businessForm.isConnected) return;

            saveButton.textContent = existingBusiness
                ? "Update Business Profile"
                : originalButtonText;
        }
    });

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            clearMessage();

            if (existingBusiness) {
                loadBusinessProfile();
            } else {
                businessForm.reset();
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    loadBusinessProfile();
});
