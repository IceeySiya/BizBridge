
"use strict";

/* =========================================================
   BizBridge Explore
   Public business discovery powered by the BizBridge API
   ========================================================= */

const API_BASE_URL = (
    window.BIZBRIDGE_API_BASE_URL ||
    "https://bizbridge-api.onrender.com"
).replace(/\/+$/, "");

const EXPLORE_API_URL = `${API_BASE_URL}/api/businesses/explore`;

const PAGE_SIZE = 8;

let businesses = [];
let filteredBusinesses = [];
let visibleCount = PAGE_SIZE;
let loadingBusinesses = false;
let businessLoadError = null;
let activeCategory = "all";
let searchTerm = "";

/* =========================================================
   DOM helpers
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

function getElement(id) {
    return document.getElementById(id);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function safeUrl(value, allowedProtocols = ["https:", "http:"]) {
    if (!value || typeof value !== "string") {
        return null;
    }

    try {
        const url = new URL(value.trim());

        if (!allowedProtocols.includes(url.protocol)) {
            return null;
        }

        return url.href;
    } catch {
        return null;
    }
}

function getInitials(name) {
    return String(name || "Business")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

function showToast(message) {
    const toast = getElement("exploreToast");

    if (!toast) {
        console.info(message);
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");
    toast.setAttribute("aria-live", "polite");

    if (toast._hideTimeout) {
        clearTimeout(toast._hideTimeout);
    }

    toast._hideTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function getBusinessId(business) {
    return String(business.businessID ?? business.BusinessID ?? "");
}

/* =========================================================
   API data mapping
   Handles both camelCase and PascalCase JSON properties.
   ========================================================= */

function mapBusiness(item) {
    const id = item.businessID ?? item.BusinessID;

    return {
        id: String(id ?? ""),
        name:
            item.businessName ??
            item.BusinessName ??
            "Unnamed business",

        category:
            item.industry ??
            item.Industry ??
            "Other",

        location:
            item.location ??
            item.Location ??
            "Location not provided",

        description:
            item.description ??
            item.Description ??
            "",

        email:
            item.businessEmail ??
            item.BusinessEmail ??
            "",

        phone:
            item.businessPhone ??
            item.BusinessPhone ??
            "",

        website:
            item.websiteUrl ??
            item.WebsiteUrl ??
            "",

        image:
            item.imageUrl ??
            item.ImageUrl ??
            "",

        established:
            item.established ??
            item.Established ??
            null
    };
}

/* =========================================================
   API loading
   ========================================================= */

async function loadExploreBusinesses() {
    loadingBusinesses = true;
    businessLoadError = null;

    renderExplorePage();

    try {
        const response = await fetch(EXPLORE_API_URL, {
            method: "GET",
            headers: {
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(
                `The server returned HTTP ${response.status}.`
            );
        }

        const result = await response.json();

        // Supports either a plain array or a common wrapped response.
        const items = Array.isArray(result)
            ? result
            : Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.businesses)
                    ? result.businesses
                    : Array.isArray(result?.$values)
                        ? result.$values
                        : null;

        if (!items) {
            throw new Error(
                "The API response was not a list of businesses."
            );
        }

        businesses = items
            .map(mapBusiness)
            .filter((business) => business.id !== "");

        loadingBusinesses = false;
        businessLoadError = null;

        applyFilters();
        renderExplorePage();

        if (businesses.length === 0) {
            showToast(
                "No public businesses yet. Businesses must enable Explore visibility."
            );
        }
    } catch (error) {
        console.error("Failed to load Explore businesses:", error);

        loadingBusinesses = false;
        businessLoadError = error.message || "Unable to load businesses.";

        businesses = [];
        filteredBusinesses = [];

        renderExplorePage();
    }
}

/* =========================================================
   Search and category filtering
   ========================================================= */

function applyFilters() {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    filteredBusinesses = businesses.filter((business) => {
        const matchesCategory =
            activeCategory === "all" ||
            business.category.toLowerCase() ===
                activeCategory.toLowerCase();

        const searchableText = [
            business.name,
            business.category,
            business.location,
            business.description
        ].join(" ").toLowerCase();

        const matchesSearch =
            !normalizedSearch ||
            searchableText.includes(normalizedSearch);

        return matchesCategory && matchesSearch;
    });

    visibleCount = PAGE_SIZE;
}

function setCategory(category) {
    activeCategory = category || "all";
    applyFilters();
    renderExplorePage();
}

function resetFilters() {
    searchTerm = "";
    activeCategory = "all";

    const searchInput = getElement("exploreSearch");
    const categorySelect = getElement("categoryFilter");

    if (searchInput) searchInput.value = "";
    if (categorySelect) categorySelect.value = "all";

    applyFilters();
    renderExplorePage();
}

/* =========================================================
   Shared rendering helpers
   ========================================================= */

function renderBusinessImage(business, className = "") {
    const imageUrl = safeUrl(business.image);

    if (imageUrl) {
        return `
            <img
                class="${escapeHtml(className)}"
                src="${escapeHtml(imageUrl)}"
                alt="${escapeHtml(business.name)}"
                loading="lazy"
                referrerpolicy="no-referrer"
                data-business-image
            >
        `;
    }

    return `
        <div
            class="${escapeHtml(className)} business-image-placeholder"
            role="img"
            aria-label="${escapeHtml(business.name)}"
        >
            <span>${escapeHtml(getInitials(business.name))}</span>
        </div>
    `;
}

function renderEmptyMessage(title, message) {
    return `
        <div class="explore-empty-state" role="status">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

function renderLoadingMessage() {
    return `
        <div class="explore-loading" role="status">
            <span class="explore-spinner" aria-hidden="true"></span>
            <p>Discovering businesses on BizBridge...</p>
        </div>
    `;
}

function renderErrorMessage() {
    return `
        <div class="explore-error" role="alert">
            <h3>We couldn't load businesses</h3>
            <p>
                ${escapeHtml(businessLoadError || "Something went wrong.")}
            </p>
            <button
                type="button"
                class="btn btn-primary"
                data-action="retry"
            >
                Try again
            </button>
        </div>
    `;
}

/* =========================================================
   Business stories
   ========================================================= */

function renderBusinessStories() {
    const container = getElement("businessStories");

    if (!container) return;

    if (loadingBusinesses) {
        container.innerHTML = `
            <p class="text-muted">Loading businesses...</p>
        `;
        return;
    }

    if (businessLoadError) {
        container.innerHTML = `
            <button
                type="button"
                class="btn btn-outline-primary"
                data-action="retry"
            >
                Reload businesses
            </button>
        `;
        return;
    }

    if (businesses.length === 0) {
        container.innerHTML = `
            <p class="text-muted">
                Public business profiles will appear here.
            </p>
        `;
        return;
    }

    container.innerHTML = businesses
        .slice(0, 12)
        .map((business) => `
            <button
                type="button"
                class="explore-business-story"
                data-action="profile"
                data-business-id="${escapeHtml(business.id)}"
                aria-label="View ${escapeHtml(business.name)}"
            >
                <span class="explore-story-image">
                    ${renderBusinessImage(business)}
                </span>
                <span class="explore-story-name">
                    ${escapeHtml(business.name)}
                </span>
            </button>
        `)
        .join("");
}

/* =========================================================
   Categories
   ========================================================= */

function renderCategories() {
    const categorySelect = getElement("categoryFilter");
    const popularContainer = getElement("popularCategories");

    const categories = [
        ...new Set(
            businesses
                .map((business) => business.category.trim())
                .filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    if (categorySelect) {
        const previousValue = activeCategory;

        categorySelect.innerHTML = `
            <option value="all">All categories</option>
            ${categories.map((category) => `
                <option value="${escapeHtml(category)}">
                    ${escapeHtml(category)}
                </option>
            `).join("")}
        `;

        const categoryStillExists =
            previousValue === "all" ||
            categories.some(
                (category) =>
                    category.toLowerCase() === previousValue.toLowerCase()
            );

        if (categoryStillExists) {
            categorySelect.value = previousValue;
        } else {
            activeCategory = "all";
            categorySelect.value = "all";
        }
    }

    if (popularContainer) {
        if (categories.length === 0) {
            popularContainer.innerHTML = `
                <p class="text-muted">Categories will appear here.</p>
            `;
            return;
        }

        popularContainer.innerHTML = `
            <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                data-action="category"
                data-category="all"
            >
                All businesses
            </button>

            ${categories.map((category) => `
                <button
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    data-action="category"
                    data-category="${escapeHtml(category)}"
                >
                    ${escapeHtml(category)}
                </button>
            `).join("")}
        `;
    }
}

/* =========================================================
   Featured business list
   ========================================================= */

function renderTrendingBusinesses() {
    const container = getElement("trendingBusinesses");

    if (!container) return;

    if (loadingBusinesses) {
        container.innerHTML = `
            <p class="text-muted">Loading businesses...</p>
        `;
        return;
    }

    if (businessLoadError) {
        container.innerHTML = `
            <button
                type="button"
                class="btn btn-link"
                data-action="retry"
            >
                Retry loading businesses
            </button>
        `;
        return;
    }

    if (businesses.length === 0) {
        container.innerHTML = `
            <p class="text-muted">
                No public listings are available yet.
            </p>
        `;
        return;
    }

    container.innerHTML = businesses
        .slice(0, 5)
        .map((business) => `
            <button
                type="button"
                class="explore-featured-business"
                data-action="profile"
                data-business-id="${escapeHtml(business.id)}"
            >
                <span class="explore-featured-image">
                    ${renderBusinessImage(business)}
                </span>

                <span class="explore-featured-details">
                    <strong>${escapeHtml(business.name)}</strong>
                    <small>${escapeHtml(business.category)}</small>
                    <small>${escapeHtml(business.location)}</small>
                </span>
            </button>
        `)
        .join("");
}

/* =========================================================
   Business listing cards
   ========================================================= */

function renderBusinessCard(business) {
    const description = business.description.trim();

    return `
        <article class="explore-business-card">
            <button
                type="button"
                class="explore-business-card-image"
                data-action="profile"
                data-business-id="${escapeHtml(business.id)}"
                aria-label="View ${escapeHtml(business.name)}"
            >
                ${renderBusinessImage(business)}
            </button>

            <div class="explore-business-card-body">
                <div class="explore-business-card-meta">
                    <span class="explore-category-badge">
                        ${escapeHtml(business.category)}
                    </span>
                </div>

                <h3>
                    <button
                        type="button"
                        class="explore-business-title"
                        data-action="profile"
                        data-business-id="${escapeHtml(business.id)}"
                    >
                        ${escapeHtml(business.name)}
                    </button>
                </h3>

                <p class="explore-business-location">
                    <span aria-hidden="true">📍</span>
                    ${escapeHtml(business.location)}
                </p>

                <p class="explore-business-description">
                    ${escapeHtml(
                        description || "Discover this business on BizBridge."
                    )}
                </p>

                <button
                    type="button"
                    class="btn btn-primary"
                    data-action="profile"
                    data-business-id="${escapeHtml(business.id)}"
                >
                    View business
                </button>
            </div>
        </article>
    `;
}


function renderFeed() {
    const feed = getElement("exploreFeed");
    const message = getElement("feedMessage");
    const loadMoreButton = getElement("loadMoreButton");

    if (!feed) return;

    // Tell assistive technologies when the feed is loading.
    feed.setAttribute("aria-busy", String(loadingBusinesses));

    if (message) {
        message.textContent = "";
    }

    // 1. Loading state
    if (loadingBusinesses) {
        feed.innerHTML = renderLoadingMessage();

        if (loadMoreButton) {
            loadMoreButton.hidden = true;
        }

        return;
    }

    // 2. API error state
    if (businessLoadError) {
        feed.innerHTML = renderErrorMessage();

        if (loadMoreButton) {
            loadMoreButton.hidden = true;
        }

        return;
    }

    // 3. No matching businesses
    if (filteredBusinesses.length === 0) {
        const hasFilters =
            searchTerm.trim() !== "" ||
            activeCategory !== "all";

        feed.innerHTML = renderEmptyMessage(
            hasFilters
                ? "No matching businesses"
                : "Explore is getting started",
            hasFilters
                ? "Try another search term or select a different category."
                : "Public business profiles will appear here when available."
        );

        if (message && hasFilters) {
            message.innerHTML = `
                <button
                    type="button"
                    class="btn btn-link"
                    data-action="reset-filters"
                >
                    Clear filters
                </button>
            `;
        }

        if (loadMoreButton) {
            loadMoreButton.hidden = true;
        }

        return;
    }

    // 4. Render the current page of business listings
    const visibleBusinesses = filteredBusinesses.slice(
        0,
        visibleCount
    );

    feed.innerHTML = `
        <div class="explore-business-grid">
            ${visibleBusinesses.map(renderBusinessCard).join("")}
        </div>
    `;

    // 5. Show or hide the load-more button
    if (loadMoreButton) {
        loadMoreButton.hidden =
            visibleCount >= filteredBusinesses.length;
    }

    // 6. Update the result count
    if (message) {
        message.textContent =
            `Showing ${visibleBusinesses.length} of ` +
            `${filteredBusinesses.length} businesses`;
    }
}

/* =========================================================
   Business profile dialog
   ========================================================= */

function renderProfile(businessId) {
    const dialog = getElement("businessProfileDialog");
    const content = getElement("businessProfileContent");

    if (!dialog || !content) {
        showToast("The business profile dialog is missing from explore.html.");
        return;
    }

    const business = businesses.find(
        (item) => item.id === String(businessId)
    );

    if (!business) {
        showToast("This business could not be found.");
        return;
    }

    const website = safeUrl(business.website);
    const email = String(business.email || "").trim();
    const phone = String(business.phone || "").trim();

    const safeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? email
        : "";

    const safePhone = /^[+()\d\s.-]{7,25}$/.test(phone)
        ? phone
        : "";

    content.innerHTML = `
        <div class="explore-profile">
            <div class="explore-profile-image">
                ${renderBusinessImage(business)}
            </div>

            <div class="explore-profile-details">
                <span class="explore-category-badge">
                    ${escapeHtml(business.category)}
                </span>

                <h2>${escapeHtml(business.name)}</h2>

                <p>
                    <strong>Location:</strong>
                    ${escapeHtml(business.location)}
                </p>

                <p>
                    <strong>About this business:</strong>
                    ${escapeHtml(
                        business.description ||
                        "This business has not added a description yet."
                    )}
                </p>

                ${business.established ? `
                    <p>
                        <strong>Established:</strong>
                        ${escapeHtml(business.established)}
                    </p>
                ` : ""}

                <div class="explore-profile-contact">
                    ${safeEmail ? `
                        <a
                            class="btn btn-primary"
                            href="mailto:${escapeHtml(safeEmail)}"
                        >
                            Email business
                        </a>
                    ` : ""}

                    ${safePhone ? `
                        <a
                            class="btn btn-outline-primary"
                            href="tel:${escapeHtml(safePhone.replace(/\s/g, ""))}"
                        >
                            Call business
                        </a>
                    ` : ""}

                    ${website ? `
                        <a
                            class="btn btn-outline-primary"
                            href="${escapeHtml(website)}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Visit website
                        </a>
                    ` : ""}
                </div>

                ${!safeEmail && !safePhone && !website ? `
                    <p class="text-muted">
                        This business has not provided public contact details yet.
                    </p>
                ` : ""}
            </div>
        </div>
    `;

    if (typeof dialog.showModal === "function") {
        if (!dialog.open) dialog.showModal();
    } else {
        dialog.setAttribute("open", "");
    }
}

/* =========================================================
   Main render
   ========================================================= */

function renderExplorePage() {
    renderBusinessStories();
    renderCategories();
    renderTrendingBusinesses();
    renderFeed();
}

/* =========================================================
   Event handlers
   ========================================================= */

// Search form
const searchForm = getElement("exploreSearchForm");

if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const searchInput = getElement("exploreSearch");
        searchTerm = searchInput?.value?.trim() || "";

        applyFilters();
        renderExplorePage();
    });
}

// Update search results while the user types.
const searchInput = getElement("exploreSearch");

if (searchInput) {
    searchInput.addEventListener("input", () => {
        searchTerm = searchInput.value.trim();
        applyFilters();
        renderExplorePage();
    });
}

// Category selector
const categorySelect = getElement("categoryFilter");

if (categorySelect) {
    categorySelect.addEventListener("change", () => {
        setCategory(categorySelect.value);
    });
}

// Load more businesses
const loadMoreButton = getElement("loadMoreButton");

if (loadMoreButton) {
    loadMoreButton.addEventListener("click", () => {
        visibleCount += PAGE_SIZE;
        renderFeed();
    });
}

// One delegated handler supports business cards, category buttons,
// retry buttons and profile buttons without relying on old sample posts.
document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");

    if (!target) return;

    const action = target.dataset.action;

    if (action === "profile") {
        renderProfile(target.dataset.businessId);
        return;
    }

    if (action === "category") {
        const category = target.dataset.category || "all";

        const categorySelect = getElement("categoryFilter");

        if (categorySelect) {
            const matchingOption = [...categorySelect.options].find(
                (option) =>
                    option.value.toLowerCase() === category.toLowerCase()
            );

            if (matchingOption) {
                categorySelect.value = matchingOption.value;
            }
        }

        setCategory(category);
        return;
    }

    if (action === "retry") {
        loadExploreBusinesses();
        return;
    }

    if (action === "reset-filters") {
        resetFilters();
    }
});

// If an image URL fails, replace it with business initials.
document.addEventListener("error", (event) => {
    const image = event.target;

    if (!(image instanceof HTMLImageElement)) return;
    if (!image.hasAttribute("data-business-image")) return;

    const name = image.alt || "Business";
    const placeholder = document.createElement("div");

    placeholder.className =
        `${image.className} business-image-placeholder`;

    placeholder.setAttribute("role", "img");
    placeholder.setAttribute("aria-label", name);

    const initials = document.createElement("span");
    initials.textContent = getInitials(name);

    placeholder.appendChild(initials);
    image.replaceWith(placeholder);
}, true);

// Start Explore.
renderExplorePage();
loadExploreBusinesses();
