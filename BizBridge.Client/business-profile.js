"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = window.BIZBRIDGE_API_BASE_URL;
    const TOKEN_KEY = "token";
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_IMAGE_TYPES = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    // Form elements
    const form = document.getElementById("businessForm");
    const messageBox = document.getElementById("businessMessage");
    const saveButton = document.getElementById("saveBusinessButton");
    const resetButton = document.getElementById("resetBusinessButton");
    const logoutButton = document.getElementById("logoutButton");

    // Business fields
    const nameInput = document.getElementById("businessName");
    const industryInput = document.getElementById("industry");
    const openingBalanceInput = document.getElementById("openingBalance");
    const openingBalanceGroup = document.getElementById("openingBalanceGroup");
    const locationInput = document.getElementById("location");
    const descriptionInput = document.getElementById("description");
    const establishedInput = document.getElementById("established");
    const businessEmailInput = document.getElementById("businessEmail");
    const businessPhoneInput = document.getElementById("businessPhone");
    const websiteUrlInput = document.getElementById("websiteUrl");

    // Business image elements
    const businessImageInput = document.getElementById("businessImage");
    const businessImagePreview = document.getElementById("businessImagePreview");
    const uploadImageButton = document.getElementById("uploadBusinessImageButton");
    const businessImageStatus = document.getElementById("businessImageStatus");

    // Verify that the expected HTML elements exist.
    if (
        !form ||
        !messageBox ||
        !saveButton ||
        !nameInput ||
        !industryInput ||
        !openingBalanceInput ||
        !openingBalanceGroup ||
        !locationInput ||
        !descriptionInput ||
        !establishedInput ||
        !businessImageInput ||
        !businessImagePreview ||
        !uploadImageButton ||
        !businessImageStatus||
        !businessEmailInput ||
        !businessPhoneInput ||
        !websiteUrlInput 
    ) {
        console.error(
            "Business profile HTML is missing required elements. Check the element IDs."
        );
        return;
    }

    let existingBusiness = false;
    let loading = false;
    let uploadingImage = false;
    let selectedImageFile = null;
    let currentImageUrl = "";
    let previewObjectUrl = null;

    class ApiError extends Error {
        constructor(message, status = 0) {
            super(message);
            this.name = "ApiError";
            this.status = status;
        }
    }

    // Display a message above the form.
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

    // Display image-upload status.
    function setImageStatus(message, isError = false) {
        businessImageStatus.textContent = message;
        businessImageStatus.className = isError
            ? "small text-danger mt-2 mb-0"
            : "small text-secondary mt-2 mb-0";
    }

    // Release temporary browser preview URLs when they are no longer needed.
    function releasePreviewObjectUrl() {
        if (previewObjectUrl) {
            URL.revokeObjectURL(previewObjectUrl);
            previewObjectUrl = null;
        }
    }

    // Display the selected image or previously saved image.
    function showBusinessImage(url) {
        if (!url) {
            businessImagePreview.removeAttribute("src");
            businessImagePreview.classList.add("d-none");
            return;
        }

        businessImagePreview.src = url;
        businessImagePreview.classList.remove("d-none");
    }

    // Validate the selected file in the browser.
    // The API must also validate the actual file contents.
    function validateImage(file) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return "Choose a JPEG, PNG, or WebP image.";
        }

        if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
            return "Choose a non-empty image no larger than 5 MB.";
        }

        return null;
    }

    function updateUploadButton() {
        uploadImageButton.disabled =
            !existingBusiness ||
            !selectedImageFile ||
            uploadingImage;
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

        updateUploadButton();
    }

    // Shared API request function for JSON and multipart requests.
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
            const headers = {
                Accept: "application/json",
                ...options.headers,
                Authorization: `Bearer ${token}`
            };

            // JSON requests need this header. FormData requests must not set it:
            // the browser automatically supplies multipart/form-data and its boundary.
            if (
                options.body &&
                !(options.body instanceof FormData) &&
                !Object.keys(headers).some(
                    key => key.toLowerCase() === "content-type"
                )
            ) {
                headers["Content-Type"] = "application/json";
            }

            response = await fetch(`${API_BASE_URL}${path}`, {
                ...options,
                headers
            });
        } catch {
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
                ? Object.values(data.errors)
                    .flat()
                    .filter(Boolean)
                    .join(" ")
                : "";

            const serverMessage =
                validationErrors ||
                data?.message ||
                data?.detail ||
                (response.status === 400 ? data?.title : "") ||
                "";

            let message = serverMessage;

            if (response.status === 400) {
                message ||= "Some information was rejected. Check your entries and try again.";
            } else if (response.status === 404) {
                message ||= "The requested business profile could not be found.";
            } else if (response.status === 409) {
                message ||= "This request conflicts with existing information.";
            } else if (response.status === 413) {
                message = "The uploaded file is too large. Choose an image no larger than 5 MB.";
            } else if (response.status >= 500) {
                message = "The BizBridge server encountered a problem. Please try again shortly.";
            } else {
                message ||= `The request failed (HTTP ${response.status}).`;
            }

            if (
                !serverMessage &&
                rawText &&
                rawText.length <= 200 &&
                !rawText.includes("<")
            ) {
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
            (
                candidate.businessName !== undefined ||
                candidate.BusinessName !== undefined
            );

        return hasBusinessName ? candidate : null;
    }

    // Populate the form with the saved business profile.
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

        businessEmailInput.value =
            business.businessEmail ?? business.BusinessEmail ?? "";

        businessPhoneInput.value =
            business.businessPhone ?? business.BusinessPhone ?? "";

        websiteUrlInput.value =
            business.websiteUrl ?? business.WebsiteUrl ?? "";

        currentImageUrl =
            business.imageUrl ?? business.ImageUrl ?? "";

        selectedImageFile = null;
        businessImageInput.value = "";
        releasePreviewObjectUrl();
        showBusinessImage(currentImageUrl);

        setImageStatus(
            currentImageUrl
                ? "Saved business photo loaded."
                : "No business photo uploaded yet."
        );

        setBusinessMode(true);
    }

    // Validate and prepare the business profile payload.
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
            throw new Error(
                "Select your business industry before continuing."
            );
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

            if (
                Number.isNaN(selectedDate.getTime()) ||
                selectedDate > today
            ) {
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
                : null,
            businessEmail: businessEmailInput.value.trim() || null,
            businessPhone: businessPhoneInput.value.trim() || null,
            websiteUrl: websiteUrlInput.value.trim() || null
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

    // Upload the selected image to the protected API endpoint.
    async function uploadSelectedImage() {
        if (!existingBusiness) {
            setImageStatus(
                "Save your business profile first, then upload the photo.",
                true
            );
            return false;
        }

        if (!selectedImageFile) {
            setImageStatus("Choose an image first.", true);
            return false;
        }

        const validationError = validateImage(selectedImageFile);

        if (validationError) {
            setImageStatus(validationError, true);
            return false;
        }

        const formData = new FormData();
        formData.append("image", selectedImageFile);

        uploadingImage = true;
        updateUploadButton();
        uploadImageButton.textContent = "Uploading...";
        setImageStatus("Uploading your business photo...");

        try {
            const { data } = await apiRequest(
                "/businesses/mine/image",
                {
                    method: "POST",
                    body: formData
                }
            );

            if (!data?.imageUrl) {
                throw new ApiError(
                    "The upload response did not contain an image URL."
                );
            }

            currentImageUrl = data.imageUrl;
            selectedImageFile = null;
            businessImageInput.value = "";

            releasePreviewObjectUrl();
            showBusinessImage(currentImageUrl);

            setImageStatus(
                "Business photo uploaded and saved successfully."
            );

            return true;
        } catch (error) {
            console.error("Business image upload error:", error);

            if (error.status !== 401 && error.status !== 403) {
                setImageStatus(
                    error.message ||
                        "Image upload failed. Please try again.",
                    true
                );
            }

            return false;
        } finally {
            uploadingImage = false;
            uploadImageButton.textContent = "Upload business photo";
            updateUploadButton();
        }
    }

    // Load the authenticated user's business profile.
    async function loadBusinessProfile() {
        if (loading) return;

        loading = true;
        clearMessage();
        setBusy(true, "Loading profile...");

        if (!getToken()) {
            showMessage(
                "Sign-in required",
                "Please sign in to manage your business profile. Redirecting you to login.",
                "warning"
            );

            window.setTimeout(logout, 700);
            return;
        }

        try {
            const { response, data } = await apiRequest("/businesses/mine");

            if (response.status === 204 || !data) {
                setBusinessMode(false);
                showBusinessImage("");
                setImageStatus(
                    "Create your business profile before uploading a photo."
                );

                showMessage(
                    "Create your business profile",
                    "Complete the form below and save it to continue to your Command Centre.",
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

            if (error.status === 401 || error.status === 403) {
                return;
            }

            if (error.status === 404) {
                setBusinessMode(false);
                showBusinessImage("");
                setImageStatus(
                    "Create your business profile before uploading a photo."
                );

                showMessage(
                    "No business profile found",
                    "If you have not registered a business yet, complete this form to create one. If you already have a profile, refresh the page or contact support.",
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

            if (!getToken()) {
                return;
            }

            saveButton.disabled = false;
            saveButton.textContent = existingBusiness
                ? "Update Business Profile"
                : "Create Business Profile";

            updateUploadButton();
        }
    }

    // Handle choosing an image and displaying its preview.
    businessImageInput.addEventListener("change", () => {
        const file = businessImageInput.files?.[0];

        selectedImageFile = null;
        updateUploadButton();
        releasePreviewObjectUrl();

        if (!file) {
            showBusinessImage(currentImageUrl);
            setImageStatus("");
            return;
        }

        const validationError = validateImage(file);

        if (validationError) {
            businessImageInput.value = "";
            showBusinessImage(currentImageUrl);
            setImageStatus(validationError, true);
            return;
        }

        selectedImageFile = file;
        previewObjectUrl = URL.createObjectURL(file);
        showBusinessImage(previewObjectUrl);
        updateUploadButton();

        setImageStatus(
            existingBusiness
                ? "Preview ready. Select Upload business photo to save it."
                : "Preview ready. Save your business profile first, then upload the photo."
        );
    });

    // Handle uploading the photo.
    uploadImageButton.addEventListener("click", async () => {
        await uploadSelectedImage();
    });

    // Save or update the business profile.
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
            showMessage(
                "Check your business information",
                error.message,
                "warning"
            );
            return;
        }

        const updating = existingBusiness;
        const endpoint = updating
            ? "/businesses/mine"
            : "/businesses";

        setBusy(true, updating ? "Updating..." : "Creating...");

        try {
            await apiRequest(endpoint, {
                method: updating ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });

            setBusinessMode(true);

            // If an image was selected while creating the profile,
            // stay on this page so the user can upload it.
            if (selectedImageFile) {
                showMessage(
                    "Business profile saved",
                    "Your profile has been saved. Now select Upload business photo to upload your chosen image.",
                    "success"
                );

                setImageStatus(
                    "Your image is ready. Select Upload business photo to save it."
                );

                updateUploadButton();
                return;
            }

            showMessage(
                updating
                    ? "Profile updated successfully"
                    : "Business created successfully",
                "Your changes have been saved. Taking you to your Command Centre...",
                "success"
            );

            window.setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);
        } catch (error) {
            console.error("Business profile save error:", error);

            if (error.status === 401 || error.status === 403) {
                return;
            }

            let suggestion = "Please check your entries and try again.";

            if (error.status === 0) {
                suggestion =
                    "Check your connection and API configuration, then try again.";
            } else if (error.status === 404) {
                suggestion =
                    "Check that the API route exists and that the deployed API is up to date.";
            } else if (error.status === 409) {
                suggestion =
                    "Check whether you already have a business profile, then refresh this page.";
            } else if (error.status >= 500) {
                suggestion =
                    "Wait a moment and retry. If it continues, check the API server logs.";
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

    // Reset the form or reload the existing profile.
    resetButton?.addEventListener("click", () => {
        if (uploadingImage || loading) return;

        clearMessage();

        selectedImageFile = null;
        businessImageInput.value = "";
        releasePreviewObjectUrl();

        if (existingBusiness) {
            loadBusinessProfile();
        } else {
            form.reset();
            openingBalanceInput.value = "0";

            currentImageUrl = "";
            showBusinessImage("");
            setImageStatus(
                "Create your business profile before uploading a photo."
            );

            setBusinessMode(false);

            showMessage(
                "Form reset",
                "The form has been cleared. Enter your business information when you're ready.",
                "info"
            );
        }

        updateUploadButton();
    });

    logoutButton?.addEventListener("click", logout);

    // Clean up the temporary preview when leaving the page.
    window.addEventListener("pagehide", releasePreviewObjectUrl);

    loadBusinessProfile();
});