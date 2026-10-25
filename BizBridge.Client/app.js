"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const apiBaseUrl = window.BIZBRIDGE_API_BASE_URL;
    const businessesContainer = document.getElementById("featuredBusinesses");
    const status = document.getElementById("businessDiscoveryStatus");
    const loginLink = document.getElementById("loginNavLink");
    const loginItem = document.getElementById("loginNavItem");
    const logoutItem = document.getElementById("logoutNavItem");
    const registerItem = document.getElementById("registerNavItem");
    const logoutButton = document.getElementById("logoutButton");

    function updateAuthenticationNavigation() {
        const signedIn = Boolean(localStorage.getItem("token"));

        if (loginItem) loginItem.hidden = signedIn;
        if (logoutItem) logoutItem.hidden = !signedIn;
        if (registerItem) registerItem.hidden = signedIn;
        if (signedIn && loginLink) loginLink.href = "dashboard.html";
    }

    updateAuthenticationNavigation();
    window.addEventListener("storage", event => {
        if (event.key === "token") updateAuthenticationNavigation();
    });

    logoutButton?.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
    });

    function readProperty(object, camelCaseName, pascalCaseName) {
        return object?.[camelCaseName] ?? object?.[pascalCaseName];
    }

    function safeImageUrl(value) {
        if (typeof value !== "string" || !value.trim()) return null;

        try {
            const url = new URL(value, window.location.href);
            return ["https:", "http:"].includes(url.protocol)
                ? url.href
                : null;
        } catch {
            return null;
        }
    }

    function createBusinessCard(business) {
        const column = document.createElement("div");
        column.className = "col-12 col-md-6 col-lg-4";

        const card = document.createElement("article");
        card.className = "card h-100 border-0 shadow-sm";

        const imageUrl = safeImageUrl(
            readProperty(business, "imageUrl", "ImageUrl")
        );
        if (imageUrl) {
            const image = document.createElement("img");
            image.src = imageUrl;
            image.alt = "";
            image.className = "card-img-top";
            image.loading = "lazy";
            image.style.height = "180px";
            image.style.objectFit = "cover";
            card.append(image);
        }

        const body = document.createElement("div");
        body.className = "card-body d-flex flex-column";

        const industry = document.createElement("p");
        industry.className = "small text-success fw-semibold mb-2";
        industry.textContent =
            readProperty(business, "industry", "Industry") ||
            "Local business";

        const name = document.createElement("h3");
        name.className = "h5 fw-bold";
        name.textContent =
            readProperty(business, "businessName", "BusinessName") ||
            "Unnamed business";

        const location = document.createElement("p");
        location.className = "small text-secondary mb-2";
        location.textContent =
            readProperty(business, "location", "Location") ||
            "South Africa";

        const description = document.createElement("p");
        description.className = "text-secondary mb-3";
        description.textContent =
            readProperty(business, "description", "Description") ||
            "View this public business profile on BizBridge.";

        const link = document.createElement("a");
        link.className = "btn btn-outline-success mt-auto align-self-start";
        link.href = "explore.html";
        link.textContent = "View on Explore";

        body.append(industry, name, location, description, link);
        card.append(body);
        column.append(card);
        return column;
    }

    async function loadPublicBusinesses() {
        if (!apiBaseUrl || !businessesContainer || !status) {
            console.error("Business discovery is missing API configuration or page elements.");
            if (status) {
                status.textContent =
                    "Business discovery is unavailable because the API is not configured.";
            }
            return;
        }

        try {
            const response = await fetch(`${apiBaseUrl}/businesses/explore`, {
                headers: { Accept: "application/json" }
            });

            if (!response.ok) {
                throw new Error(`The API returned HTTP ${response.status}.`);
            }

            const businesses = await response.json();
            if (!Array.isArray(businesses)) {
                throw new Error("The API returned an invalid business list.");
            }

            businessesContainer.replaceChildren(
                ...businesses.slice(0, 3).map(createBusinessCard)
            );

            status.textContent = businesses.length
                ? `${businesses.length} public business profile${
                    businesses.length === 1 ? "" : "s"
                } currently discoverable on BizBridge.`
                : "No businesses have chosen to share a public profile yet.";
        } catch (error) {
            console.error("Public business discovery failed:", error);
            status.textContent =
                "Public business listings could not be loaded. Please try Explore again later.";
        }
    }

    loadPublicBusinesses();
});
