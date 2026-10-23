"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = window.BIZBRIDGE_API_BASE_URL;
    const TOKEN_KEY = "token";

    const form = document.getElementById("businessForm");
    const messageBox = document.getElementById("businessMessage");
    const saveButton = document.getElementById("saveBusinessButton");
    const resetButton = document.getElementById("resetBusinessButton");
    const logoutButton = document.getElementById("logoutButton");

    const nameInput = document.getElementById("businessName");
    const industryInput = document.getElementById("industry");
    const openingBalanceInput = document.getElementById("openingBalance");
    const openingBalanceGroup = document.getElementById("openingBalanceGroup");
    const locationInput = document.getElementById("location");
    const descriptionInput = document.getElementById("description");
    const establishedInput = document.getElementById("established");

    if (
        !form || !messageBox || !saveButton || !nameInput ||
        !industryInput || !openingBalanceInput || !openingBalanceGroup ||
        !locationInput || !descriptionInput || !establishedInput
    ) {
        console.error("Business profile HTML is missing required elements.");
        return;
    }

    let existingBusiness = false;
    let loading = false;

    class ApiError extends Error {
        constructor(message, status = 0) {
            super(message);
            this.name = "ApiError";
            this.status = status;
        }
    }

    function showMessage(title, detail, type = "info") {
        messageBox.replaceChildren();

        const heading = document.createElement("strong");
        heading.textContent = title;

        const description = document.createElement("div");
        description.className = "mt-1";
        description.textContent = detail;

        messageBox.append(heading, description);
        messageBox.className = `alert alert-${type}`;
        messageBox.focus();
    }

    function clearMessage() {
        messageBox.replaceChildren();
        messageBox.className = "alert d-none";
    }

    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("user");
        window.location.replace("login.html");
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function setBusy(isBusy, text) {
        saveButton.disabled = isBusy;
        saveButton.textContent = text;
    }

    function setBusinessMode(hasBusiness) {
        existingBusiness = hasBusiness;
        saveButton.textContent = hasBusiness
            ? "Update Business Profile"
            : "Create Business Profile";

        // Opening balance is only set when a business is created.
        openingBalanceGroup.hidden = hasBusiness;
        openingBalanceInput.required = !hasBusiness;
        openingBalanceInput.disabled = hasBusiness;
    }

    async function apiRequest(path, options = {}) {
        if (!API_BASE_URL) {
            throw new ApiError(
                "The API address is not configured. Check api-config.js and ensure it loads before business-profile.js."
            );
        }

        const token = getToken();

        if (!token) {
            throw new ApiError(
                "You are not logged in. Please sign in to continue."
            );
        }

        let response;

        try {
            response = await fetch(`${API_BASE_URL}${path}`, {
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
        } catch (error) {
            throw new ApiError(
                "BizBridge could not reach the server. Check your internet connection and try again."
            );
        }

        const contentType = response.headers.get("content-type") || "";
        let data = null;
        let rawText = "";

        try {
            if (contentType.includes("application/json")) {
                data = await response.json();
            } else {
                rawText = await response.text();
            }
        } catch {
            // The server may return an empty or unreadable response.
        }

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem("user");
            window.location.replace("login.html");
            throw new ApiError(
                "Your session is no longer valid. Please sign in again.",
                response.status
            );
        }

        if (!response.ok) {
            const validationErrors = data?.errors
                ? Object.values(data.errors).flat().filter(Boolean).join(" ")
                : "";

            const serverMessage =
                validationErrors ||
                data?.message ||
                data?.detail ||
                (response.status === 400 ? data?.title : "") ||
                "";

            // Avoid displaying HTML or raw server internals to the user.
            let message = serverMessage;

            if (response.status === 400) {
                message ||= "Some information was rejected. Check your entries and try again.";
            } else if (response.status === 404) {
                message ||= "The requested business profile could not be found.";
            } else if (response.status === 409) {
                message ||= "This request conflicts with existing information. Check whether a business profile already exists.";
            } else if (response.status >= 500) {
                message = "The BizBridge server encountered a problem. Please try again shortly.";
            } else {
                message ||= `The request failed (HTTP ${response.status}).`;
            }

            // If a plain-text response is short and readable, it may be useful.
            if (!serverMessage && rawText && rawText.length <= 200 &&
                !rawText.includes("<")) {
                message = rawText;
            }

            throw new ApiError(message, response.status);
        }

        return { response, data };
    }

    function unwrapBusiness(data) {
        if (!data) return null;

        const candidate = data.business ?? data.data ?? data;
        const hasBusinessName =
            candidate &&
            (candidate.businessName !== undefined ||
             candidate.BusinessName !== undefined);

        return hasBusinessName ? candidate : null;
    }

    function populateForm(business) {
        nameInput.value =
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

        setBusinessMode(true);
    }

    function getBusinessPayload() {
        const businessName = nameInput.value.trim();
        const industry = industryInput.value.trim();
        const location = locationInput.value.trim();
        const description = descriptionInput.value.trim();
        const establishedDate = establishedInput.value;

        if (businessName.length < 2 || businessName.length > 150) {
            nameInput.focus();
            throw new Error(
                "Business name must contain 2–150 characters. Please correct the name."
            );
        }

        if (!industry) {
            industryInput.focus();
            throw new Error("Select your business industry before continuing.");
        }

        if (location.length > 150) {
            locationInput.focus();
            throw new Error("Location must not exceed 150 characters.");
        }

        if (description.length > 1000) {
            descriptionInput.focus();
            throw new Error("Description must not exceed 1,000 characters.");
        }

        if (establishedDate) {
            const selectedDate = new Date(`${establishedDate}T00:00:00`);
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            if (Number.isNaN(selectedDate.getTime()) || selectedDate > today) {
                establishedInput.focus();
                throw new Error(
                    "The establishment date is invalid or in the future. Choose a valid date."
                );
            }
        }

        const payload = {
            businessName,
            industry,
            location: location || null,
            description: description || null,
            established: establishedDate
                ? `${establishedDate}T00:00:00Z`
                : null
        };

        if (!existingBusiness) {
            const rawBalance = openingBalanceInput.value.trim();
            const openingBalance = Number(rawBalance);

            if (
                rawBalance === "" ||
                !Number.isFinite(openingBalance) ||
                openingBalance < 0 ||
                !/^\d+(\.\d{1,2})?$/.test(rawBalance)
            ) {
                openingBalanceInput.focus();
                throw new Error(
                    "Enter an opening balance of R0 or more, using no more than two decimal places."
                );
            }

            payload.openingBalance = openingBalance;
        }

        return payload;
    }

    async function loadBusinessProfile() {
        if (loading) return;
        loading = true;
        clearMessage();

        if (!getToken()) {
            showMessage(
                "Sign-in required",
                "Please sign in to manage your business profile. Redirecting you to login.",
                "warning"
            );
            window.setTimeout(logout, 700);
            return;
        }

        setBusy(true, "Loading profile...");

        try {
            const { response, data } = await apiRequest("/businesses/mine");

            if (response.status === 204 || !data) {
                setBusinessMode(false);
                showMessage(
                    "Create your business profile",
                    "No business profile was returned. Complete the form below and save it to continue to your Command Centre.",
                    "info"
                );
                return;
            }

            const business = unwrapBusiness(data);

            if (!business) {
                throw new ApiError(
                    "The server response did not contain a business profile. Refresh the page or try again later."
                );
            }

            populateForm(business);
            showMessage(
                "Profile loaded",
                "Your business information is ready. Make any necessary changes and select Update Business Profile to save.",
                "success"
            );
        } catch (error) {
            console.error("Business profile loading error:", error);

            if (error.status === 401 || error.status === 403) return;

            // A 404 is treated as an empty profile only if the API contract
            // explicitly uses it to mean that the current user has no business.
            if (error.status === 404) {
                setBusinessMode(false);
                showMessage(
                    "No business profile found",
                    "If you have not registered a business yet, complete this form to create one. If you already have a profile, refresh the page or contact support because the server could not find it.",
                    "warning"
                );
                return;
            }

            showMessage(
                "Unable to load your business profile",
                `${error.message} You can retry by refreshing the page. Your existing information has not been changed.`,
                "danger"
            );
        } finally {
            loading = false;
            saveButton.disabled = false;

            if (!existingBusiness) {
                saveButton.textContent = "Create Business Profile";
            } else {
                saveButton.textContent = "Update Business Profile";
            }
        }
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        clearMessage();

        if (!form.checkValidity()) {
            form.reportValidity();
            showMessage(
                "Please check your entries",
                "Complete the required fields and correct any highlighted values before saving.",
                "warning"
            );
            return;
        }

        let payload;

        try {
            payload = getBusinessPayload();
        } catch (error) {
            showMessage("Check your business information", error.message, "warning");
            return;
        }

        const updating = existingBusiness;
        const endpoint = updating ? "/businesses/mine" : "/businesses";

        setBusy(true, updating ? "Updating..." : "Creating...");

        try {
            await apiRequest(endpoint, {
                method: updating ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });

            setBusinessMode(true);
            showMessage(
                updating ? "Profile updated successfully" : "Business created successfully",
                "Your changes have been saved. Taking you to your Command Centre...",
                "success"
            );

            window.setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);
        } catch (error) {
            console.error("Business profile save error:", error);

            if (error.status === 401 || error.status === 403) return;

            let suggestion = "Please check your entries and try again.";

            if (error.status === 0) {
                suggestion = "Check your connection and API configuration, then try again.";
            } else if (error.status === 404) {
                suggestion = "Check that the API route exists and that the deployed API is up to date.";
            } else if (error.status === 409) {
                suggestion = "Check whether you already have a business profile, then refresh this page.";
            } else if (error.status >= 500) {
                suggestion = "Wait a moment and retry. If it continues, check the API server logs.";
            }

            showMessage(
                "We couldn't save your business profile",
                `${error.message} ${suggestion}`,
                "danger"
            );
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = existingBusiness
                ? "Update Business Profile"
                : "Create Business Profile";
        }
    });

    resetButton?.addEventListener("click", () => {
        clearMessage();

        if (existingBusiness) {
            loadBusinessProfile();
        } else {
            form.reset();
            openingBalanceInput.value = "0";
            showMessage(
                "Form reset",
                "The form has been cleared. Enter your business information when you're ready.",
                "info"
            );
        }
    });

    logoutButton?.addEventListener("click", logout);

    loadBusinessProfile();
});

