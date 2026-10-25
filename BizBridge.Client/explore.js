
"use strict";

/* =========================================================
   BizBridge Explore
   Public business discovery powered by the BizBridge API
   ========================================================= */

const API_BASE_URL = (
    window.BIZBRIDGE_API_BASE_URL ||
    "https://bizbridge-api.onrender.com/api"
).replace(/\/+$/, "").replace(/\/api$/, "");

const API_URL = `${API_BASE_URL}/api`;
const EXPLORE_API_URL = `${API_URL}/businesses/explore`;

const PAGE_SIZE = 8;

let businesses = [];
let filteredBusinesses = [];
let posts = [];
let filteredPosts = [];
let products = [];
let filteredProducts = [];
let visibleCount = PAGE_SIZE;
let loadingBusinesses = false;
let businessLoadError = null;
let postsLoadError = null;
let productsLoadError = null;
let activeCategory = "all";
let activeLocation = "all";
let activeFeedFilter = "for-you";
let searchTerm = "";
let currentBusiness = null;
let followedBusinessIds = new Set();
let savedBusinessIds = new Set();
let savedPostIds = new Set();
let savedProductIds = new Set();

async function apiRequest(path, options = {}) {
    const token = localStorage.getItem("token");
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers
    });

    if (response.status === 204) {
        return null;
    }

    const result = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            result?.message ||
            `The server returned HTTP ${response.status}.`
        );
    }

    return result;
}

function requireSignIn(message) {
    if (localStorage.getItem("token")) {
        return true;
    }

    const dialog = getElement("signInDialog");
    const dialogMessage = getElement("signInMessage");

    if (dialogMessage) dialogMessage.textContent = message;

    if (dialog && !dialog.open) {
        dialog.showModal();
    }

    return false;
}

function getProperty(item, camelName, pascalName = camelName) {
    return item?.[camelName] ?? item?.[pascalName];
}

/* =========================================================
   DOM helpers
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

function getElement(id) {
    return document.getElementById(id);
}

function updateHeaderAuthState() {
    const isSignedIn = Boolean(localStorage.getItem("token"));
    const loginLink = getElement("exploreLoginLink");
    const logoutButton = getElement("exploreLogoutButton");
    const joinLink = getElement("exploreJoinLink");

    if (loginLink) loginLink.hidden = isSignedIn;
    if (logoutButton) logoutButton.hidden = !isSignedIn;
    if (joinLink) joinLink.hidden = isSignedIn;
}

updateHeaderAuthState();
window.addEventListener("storage", (event) => {
    if (event.key === "token") updateHeaderAuthState();
});

getElement("exploreLogoutButton")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.reload();
});

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
    toast.classList.add("is-visible");
    toast.setAttribute("aria-live", "polite");

    if (toast._hideTimeout) {
        clearTimeout(toast._hideTimeout);
    }

    toast._hideTimeout = setTimeout(() => {
        toast.classList.remove("is-visible");
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

        isFollowing: false,
        isSaved: false,

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
    } catch (error) {
        console.error("Failed to load Explore businesses:", error);

        loadingBusinesses = false;
        businessLoadError = error.message || "Unable to load businesses.";

        businesses = [];
        filteredBusinesses = [];

        renderExplorePage();
    }
}

async function loadExploreContent(followingOnly = false) {
    try {
        const query = followingOnly ? "?followingOnly=true" : "";
        const result = await apiRequest(`/explore/posts${query}`);
        posts = Array.isArray(result) ? result : [];
        postsLoadError = null;
    } catch (error) {
        posts = [];
        postsLoadError = error.message;
        console.error("Failed to load Explore posts:", error);
    }

    try {
        const result = await apiRequest("/explore/products");
        products = Array.isArray(result) ? result : [];
        productsLoadError = null;
    } catch (error) {
        products = [];
        productsLoadError = error.message;
        console.error("Failed to load Explore products:", error);
    }

    applyFilters();
    renderExplorePage();
}

async function loadExploreAccountState() {
    if (!localStorage.getItem("token")) {
        return;
    }

    try {
        const [following, saved] = await Promise.all([
            apiRequest("/explore/following"),
            apiRequest("/explore/saved")
        ]);

        followedBusinessIds = new Set(
            (Array.isArray(following) ? following : [])
                .map((item) => String(getProperty(item, "businessID")))
        );
        savedBusinessIds = new Set(
            (saved?.businessIDs || []).map(String)
        );
        savedPostIds = new Set((saved?.postIDs || []).map(String));
        savedProductIds = new Set((saved?.productIDs || []).map(String));

        businesses = businesses.map((business) => ({
            ...business,
            isFollowing: followedBusinessIds.has(business.id),
            isSaved: savedBusinessIds.has(business.id)
        }));

        posts = posts.map((post) => ({
            ...post,
            isSaved: savedPostIds.has(
                String(getProperty(post, "explorePostID"))
            )
        }));
        products = products.map((product) => ({
            ...product,
            isSaved: savedProductIds.has(
                String(getProperty(product, "exploreProductID"))
            )
        }));

        applyFilters();
        renderExplorePage();
    } catch (error) {
        console.error("Failed to load Explore account data:", error);
        showToast(`Your saved and followed items could not be loaded: ${error.message}`);
    }
}

async function loadOwnerBusiness() {
    if (!localStorage.getItem("token")) return;

    try {
        currentBusiness = await apiRequest("/businesses/mine");
        const tools = getElement("businessTools");
        const ownerName = getElement("ownerBusinessName");

        if (tools) tools.hidden = false;
        if (ownerName) {
            ownerName.textContent =
                getProperty(currentBusiness, "businessName") || "";
        }
    } catch (error) {
        if (!error.message.toLowerCase().includes("no business profile")) {
            console.error("Failed to load the owner's business:", error);
        }
    }
}

/* =========================================================
   Search and category filtering
   ========================================================= */

function applyFilters() {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesLocation = (location) =>
        activeLocation === "all" ||
        String(location || "")
            .toLowerCase()
            .includes(activeLocation.toLowerCase());
    const matchesCategory = (category) =>
        activeCategory === "all" ||
        String(category || "").toLowerCase() ===
            activeCategory.toLowerCase();

    filteredBusinesses = businesses.filter((business) => {
        const searchableText = [
            business.name,
            business.category,
            business.location,
            business.description
        ].join(" ").toLowerCase();

        const matchesSearch =
            !normalizedSearch ||
            searchableText.includes(normalizedSearch);

        return (
            matchesCategory(business.category) &&
            matchesLocation(business.location) &&
            matchesSearch
        );
    });

    filteredProducts = products.filter((product) => {
        const searchableText = [
            getProperty(product, "name"),
            getProperty(product, "category"),
            getProperty(product, "businessName"),
            getProperty(product, "description"),
            getProperty(product, "location")
        ].join(" ").toLowerCase();

        return (
            matchesCategory(getProperty(product, "category")) &&
            matchesLocation(getProperty(product, "location")) &&
            (!normalizedSearch || searchableText.includes(normalizedSearch))
        );
    });

    filteredPosts = posts.filter((post) => {
        const searchableText = [
            getProperty(post, "businessName"),
            getProperty(post, "industry"),
            getProperty(post, "location"),
            getProperty(post, "content")
        ].join(" ").toLowerCase();

        return (
            matchesCategory(getProperty(post, "industry")) &&
            matchesLocation(getProperty(post, "location")) &&
            (!normalizedSearch || searchableText.includes(normalizedSearch))
        );
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
    activeLocation = "all";

    const searchInput = getElement("exploreSearch");
    const categorySelect = getElement("categoryFilter");

    if (searchInput) searchInput.value = "";
    if (categorySelect) categorySelect.value = "all";

    applyFilters();
    renderExplorePage();
}

function renderLocationFilters() {
    document.querySelectorAll("[data-action='location']").forEach((button) => {
        const isActive = button.dataset.location === activeLocation;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
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

/* =========================================================
   Categories
   ========================================================= */

function renderCategories() {
    const categorySelect = getElement("categoryFilter");
    const categoryLabel = getElement("categoryFilterLabel");
    const popularContainer = getElement("popularCategories");
    const popularHeading = getElement("popularCategoriesHeading");
    const productView = activeFeedFilter === "products";
    const followingView = activeFeedFilter === "following";

    const categories = [
        ...new Set(
            (productView
                ? products.map((product) => getProperty(product, "category"))
                : followingView
                    ? posts.map((post) => getProperty(post, "industry"))
                    : [
                        ...businesses.map((business) => business.category),
                        ...products.map((product) => getProperty(product, "category")),
                        ...posts.map((post) => getProperty(post, "industry"))
                    ]
            )
                .map((category) => String(category || "").trim())
                .filter((category) => category !== "")
        )
    ].sort((a, b) => a.localeCompare(b));

    if (categorySelect) {
        const previousValue = activeCategory;

        categorySelect.innerHTML = `
            <option value="all">All ${productView ? "product " : ""}categories</option>
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

    if (categoryLabel) {
        categoryLabel.textContent = productView
            ? "Filter products by category"
            : followingView
                ? "Filter posts by business industry"
                : "Filter businesses and products by category";
    }

    if (popularHeading) {
        popularHeading.textContent = productView
            ? "Product categories"
            : followingView
                ? "Business industries"
                : "Business and product categories";
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
                All categories
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

                <div class="explore-card-actions">
                    <button
                        type="button"
                        class="btn btn-outline-primary"
                        data-action="follow-business"
                        data-business-id="${escapeHtml(business.id)}"
                        aria-pressed="${business.isFollowing}"
                    >
                        ${business.isFollowing ? "Following" : "Follow"}
                    </button>
                    <button
                        type="button"
                        class="btn btn-outline-secondary"
                        data-action="save-business"
                        data-business-id="${escapeHtml(business.id)}"
                        aria-pressed="${business.isSaved}"
                    >
                        ${business.isSaved ? "Saved" : "Save"}
                    </button>
                    <button
                        type="button"
                        class="btn btn-primary"
                        data-action="start-enquiry"
                        data-business-id="${escapeHtml(business.id)}"
                    >
                        Enquire
                    </button>
                </div>
                <button type="button" class="btn btn-link p-0" data-action="profile" data-business-id="${escapeHtml(business.id)}">
                    View business profile
                </button>
            </div>
        </article>
    `;
}

function renderProductCard(product) {
    const productId = String(
        getProperty(product, "exploreProductID") || ""
    );
    const businessId = String(getProperty(product, "businessID") || "");
    const formattedPrice = new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(getProperty(product, "price") || 0));
    const imageUrl = safeUrl(getProperty(product, "imageUrl"));
    const location = getProperty(product, "location");

    return `
        <article class="explore-product-card">
            ${imageUrl
                ? `<img class="explore-product-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(getProperty(product, "name"))}" loading="lazy" data-business-image>`
                : `<div class="product-image-placeholder" aria-hidden="true"><span>${escapeHtml(getInitials(getProperty(product, "name")))}</span></div>`
            }

            <div class="explore-product-card-body">
                <span class="explore-category-badge">
                    ${escapeHtml(getProperty(product, "category"))}
                </span>
                <h3>${escapeHtml(getProperty(product, "name"))}</h3>
                <p class="explore-product-business">
                    From ${escapeHtml(getProperty(product, "businessName"))}
                </p>
                ${location ? `<p class="explore-product-business">${escapeHtml(location)}</p>` : ""}
                <p class="explore-product-description">
                    ${escapeHtml(getProperty(product, "description"))}
                </p>
                <div class="explore-product-card-footer">
                    <strong>${escapeHtml(formattedPrice)}</strong>
                    <span class="product-availability">Available</span>
                    <button
                        type="button"
                        class="product-request-button"
                        data-action="start-enquiry"
                        data-product-id="${escapeHtml(productId)}"
                        data-business-id="${escapeHtml(businessId)}"
                    >
                        Enquire
                    </button>
                </div>
                <button
                    type="button"
                    class="btn btn-link explore-product-business-link"
                    data-action="profile"
                    data-business-id="${escapeHtml(businessId)}"
                >
                    View business
                </button>
                <button
                    type="button"
                    class="feed-action product-save-button ${product.isSaved ? "is-saved" : ""}"
                    data-action="save-product"
                    data-product-id="${escapeHtml(productId)}"
                    aria-pressed="${Boolean(product.isSaved)}"
                >
                    ${product.isSaved ? "Saved" : "Save product"}
                </button>
            </div>
        </article>
    `;
}

function renderPostCard(post) {
    const postId = String(getProperty(post, "explorePostID") || "");
    const businessId = String(getProperty(post, "businessID") || "");
    const postImage = safeUrl(getProperty(post, "imageUrl"));
    const businessImage = safeUrl(getProperty(post, "businessImageUrl"));
    const isLiked = Boolean(getProperty(post, "isLiked"));
    const isSaved =
        Boolean(getProperty(post, "isSaved")) ||
        savedPostIds.has(postId);
    const likeCount = Number(getProperty(post, "likeCount") || 0);

    return `
        <article class="feed-card business-update-card">
            <div class="feed-card-header">
                ${businessImage
                    ? `<img class="business-avatar" src="${escapeHtml(businessImage)}" alt="" loading="lazy">`
                    : `<span class="business-avatar business-avatar-placeholder" aria-hidden="true">${escapeHtml(getInitials(getProperty(post, "businessName")))}</span>`
                }
                <div class="business-meta">
                    <button
                        class="business-name-button"
                        type="button"
                        data-action="profile"
                        data-business-id="${escapeHtml(businessId)}"
                    >
                        ${escapeHtml(getProperty(post, "businessName"))}
                    </button>
                    <span class="business-subline">
                        ${escapeHtml(getProperty(post, "industry"))}
                        ${getProperty(post, "location") ? ` · ${escapeHtml(getProperty(post, "location"))}` : ""}
                        · ${escapeHtml(formatDate(getProperty(post, "createdAt")))}
                    </span>
                </div>
                <span class="business-update-badge">BUSINESS UPDATE</span>
            </div>

            <p class="feed-card-copy">${escapeHtml(getProperty(post, "content"))}</p>
            ${postImage
                ? `<div class="feed-media-wrap"><img class="feed-media" src="${escapeHtml(postImage)}" alt="Post from ${escapeHtml(getProperty(post, "businessName"))}" loading="lazy"></div>`
                : ""
            }
            <div class="feed-card-actions">
                <button
                    class="feed-action ${isLiked ? "is-liked" : ""}"
                    type="button"
                    data-action="like-post"
                    data-post-id="${escapeHtml(postId)}"
                    aria-pressed="${isLiked}"
                >
                    <span aria-hidden="true">${isLiked ? "♥" : "♡"}</span>
                    <span>${likeCount} ${likeCount === 1 ? "like" : "likes"}</span>
                </button>
                <button
                    class="feed-action feed-action-save ${isSaved ? "is-saved" : ""}"
                    type="button"
                    data-action="save-post"
                    data-post-id="${escapeHtml(postId)}"
                    aria-pressed="${isSaved}"
                >
                    <span aria-hidden="true">♧</span>
                    <span>${isSaved ? "Saved" : "Save"}</span>
                </button>
            </div>
        </article>
    `;
}

function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "Recently"
        : new Intl.DateTimeFormat("en-ZA", {
            dateStyle: "medium"
        }).format(date);
}

function renderProductsFeed(feed, message, loadMoreButton) {
    feed.setAttribute("aria-busy", "false");

    if (productsLoadError) {
        feed.innerHTML = `
            <div class="explore-error" role="alert">
                <p>${escapeHtml(productsLoadError)}</p>
                <button type="button" class="btn btn-outline-primary" data-action="retry-all">
                    Retry
                </button>
            </div>
        `;
        if (loadMoreButton) loadMoreButton.hidden = true;
        return;
    }

    if (filteredProducts.length === 0) {
        const hasFilters =
            searchTerm.trim() !== "" ||
            activeCategory !== "all" ||
            activeLocation !== "all";

        feed.innerHTML = renderEmptyMessage(
            hasFilters ? "No matching products" : "No products listed yet",
            hasFilters
                ? "Try another search term, category or location."
                : "Product listings will appear here when businesses add them."
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

    const visibleProducts = filteredProducts.slice(0, visibleCount);

    feed.innerHTML = `
        <div class="explore-product-grid">
            ${visibleProducts.map(renderProductCard).join("")}
        </div>
    `;

    if (loadMoreButton) {
        loadMoreButton.hidden = visibleCount >= filteredProducts.length;
    }

    if (message) {
        message.textContent =
            `Showing ${visibleProducts.length} of ` +
            `${filteredProducts.length} available products. Enquiries do not create orders or payments.`;
    }
}

function renderSavedFeed(feed, message, loadMoreButton) {
    const savedBusinesses = filteredBusinesses.filter((business) =>
        savedBusinessIds.has(business.id)
    );
    const savedPosts = filteredPosts.filter((post) =>
        savedPostIds.has(String(getProperty(post, "explorePostID")))
    );
    const savedProducts = filteredProducts.filter((product) =>
        savedProductIds.has(String(getProperty(product, "exploreProductID")))
    );
    const items = [
        ...savedPosts.map(renderPostCard),
        ...savedProducts.map(renderProductCard),
        ...savedBusinesses.map(renderBusinessCard)
    ];

    feed.setAttribute("aria-busy", "false");

    if (items.length === 0) {
        feed.innerHTML = renderEmptyMessage(
            "Nothing saved yet",
            "Save a business, post, or product to find it here later."
        );
    } else {
        feed.innerHTML = items.slice(0, visibleCount).join("");
    }

    if (message) {
        message.textContent =
            `${items.length} saved item${items.length === 1 ? "" : "s"}`;
    }
    if (loadMoreButton) {
        loadMoreButton.hidden = visibleCount >= items.length;
    }
}

function renderExploreStream(feed, message, loadMoreButton) {
    const errors = [
        businessLoadError && `Businesses: ${businessLoadError}`,
        postsLoadError && `Business updates: ${postsLoadError}`,
        productsLoadError && `Products: ${productsLoadError}`
    ].filter(Boolean);
    const items = [
        ...filteredPosts.map((item) => ({
            type: "post",
            item,
            createdAt: Date.parse(getProperty(item, "createdAt")) || 0
        })),
        ...filteredProducts.map((item) => ({
            type: "product",
            item,
            createdAt: Date.parse(getProperty(item, "createdAt")) || 0
        })),
        ...filteredBusinesses.map((item) => ({
            type: "business",
            item,
            createdAt: 0
        }))
    ].sort((left, right) => right.createdAt - left.createdAt);

    feed.setAttribute(
        "aria-busy",
        String(
            loadingBusinesses &&
            posts.length === 0 &&
            products.length === 0 &&
            errors.length === 0
        )
    );

    if (items.length === 0 && loadingBusinesses && errors.length === 0) {
        feed.innerHTML = renderLoadingMessage();
        if (loadMoreButton) loadMoreButton.hidden = true;
        return;
    }

    if (items.length === 0) {
        const hasFilters =
            searchTerm.trim() !== "" ||
            activeCategory !== "all" ||
            activeLocation !== "all";
        feed.innerHTML = errors.length
            ? `
                <div class="explore-error" role="alert">
                    <h3>Explore content could not be loaded</h3>
                    <p>${errors.map(escapeHtml).join("<br>")}</p>
                    <button type="button" class="btn btn-outline-primary" data-action="retry-all">
                        Try again
                    </button>
                </div>
            `
            : renderEmptyMessage(
                hasFilters ? "No matching results" : "Explore is getting started",
                hasFilters
                    ? "Try another search, category or location."
                    : "Public business updates, available products and profiles will appear here as businesses publish them."
            );
        if (loadMoreButton) loadMoreButton.hidden = true;
        if (message) {
            if (errors.length) {
                message.textContent = "";
            } else if (hasFilters) {
                message.innerHTML = `
                    <button type="button" class="btn btn-link" data-action="reset-filters">
                        Clear filters
                    </button>
                `;
            } else {
                message.textContent =
                    "No public updates, available products or business profiles yet.";
            }
        }
        return;
    }

    const visibleItems = items.slice(0, visibleCount);
    const renderItem = ({ type, item }) => {
        if (type === "post") return renderPostCard(item);
        if (type === "product") return renderProductCard(item);
        return renderBusinessCard(item);
    };

    feed.innerHTML = `
        ${errors.length ? `
            <div class="explore-inline-error" role="status">
                Some content could not be loaded: ${errors.map(escapeHtml).join(" · ")}
                <button type="button" class="btn btn-link" data-action="retry-all">Retry</button>
            </div>
        ` : ""}
        ${visibleItems.map(renderItem).join("")}
    `;

    if (loadMoreButton) {
        loadMoreButton.hidden = visibleCount >= items.length;
    }
    if (message) {
        message.textContent =
            `Showing ${visibleItems.length} of ${items.length} results. ` +
            "Enquiries do not create orders or payments.";
    }
}

function renderFeed() {
    const feed = getElement("exploreFeed");
    const message = getElement("feedMessage");
    const loadMoreButton = getElement("loadMoreButton");
    const feedHeading = getElement("feedHeading");
    const feedDescription = getElement("feedDescription");
    const feedModeLabel = getElement("feedModeLabel");
    const searchLabel = getElement("exploreSearchLabel");
    const searchInput = getElement("exploreSearch");
    const searchHelp = getElement("searchHelp");

    if (!feed) return;

    const isProductsView = activeFeedFilter === "products";
    if (feedHeading) {
        feedHeading.textContent = isProductsView
            ? "Products from local makers"
            : activeFeedFilter === "following"
                ? "Updates from businesses you follow"
                : activeFeedFilter === "saved"
                    ? "Your saved items"
                    : "Explore local businesses";
    }

    if (feedDescription) {
        feedDescription.textContent = isProductsView
            ? "Browse public product listings. Enquiries contact businesses directly; they do not place orders."
            : activeFeedFilter === "following"
                ? "See real updates from the public businesses you follow."
                : activeFeedFilter === "saved"
                    ? "Businesses, products and updates you have saved."
                    : "Real business updates, available products and public profiles from across South Africa.";
    }

    if (feedModeLabel) {
        feedModeLabel.textContent = isProductsView
            ? "BUSINESS PRODUCTS"
            : activeFeedFilter === "following"
                ? "FOLLOWING"
                : activeFeedFilter === "saved"
                    ? "SAVED ITEMS"
                    : "REAL BUSINESS ACTIVITY";
    }

    if (searchLabel && searchInput) {
        const label = isProductsView
            ? "Search products by name, category, business or location"
            : "Search businesses, products, updates or locations";

        searchLabel.textContent = label;
        searchInput.placeholder = isProductsView
            ? "Search products..."
            : "Search businesses, products, services or locations...";
    }

    if (searchHelp) {
        searchHelp.textContent = isProductsView
            ? "Available product results update as you type."
            : "Business, product and update results update as you type.";
    }

    if (isProductsView) {
        renderProductsFeed(feed, message, loadMoreButton);
        return;
    }

    if (activeFeedFilter === "saved") {
        renderSavedFeed(feed, message, loadMoreButton);
        return;
    }

    if (activeFeedFilter === "following") {
        feed.setAttribute("aria-busy", "false");
        if (postsLoadError) {
            feed.innerHTML = `
                <div class="explore-error" role="alert">
                    <p>${escapeHtml(postsLoadError)}</p>
                    <button type="button" class="btn btn-outline-primary" data-action="retry-content">
                        Retry
                    </button>
                </div>
            `;
            if (loadMoreButton) loadMoreButton.hidden = true;
            return;
        }
        const followingPosts = filteredPosts.slice(0, visibleCount);
        feed.innerHTML = followingPosts.length
            ? followingPosts.map(renderPostCard).join("")
            : renderEmptyMessage(
                "No posts from followed businesses yet",
                "Follow a business to see its updates here."
            );
        if (message) {
            message.textContent = `${followingPosts.length} post${followingPosts.length === 1 ? "" : "s"} from businesses you follow`;
        }
        if (loadMoreButton) {
            loadMoreButton.hidden = visibleCount >= filteredPosts.length;
        }
        return;
    }

    renderExploreStream(feed, message, loadMoreButton);
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
    renderCategories();
    renderLocationFilters();
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

const postForm = getElement("postForm");
if (postForm) {
    postForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!requireSignIn("Sign in as a business owner to publish updates.")) {
            return;
        }

        const submitButton = postForm.querySelector('[type="submit"]');
        submitButton.disabled = true;

        try {
            await apiRequest("/explore/posts", {
                method: "POST",
                body: JSON.stringify({
                    content: getElement("postContent").value.trim(),
                    imageUrl: getElement("postImageUrl").value.trim() || null
                })
            });
            postForm.reset();
            showToast("Your post was published.");
            await loadExploreContent(activeFeedFilter === "following");
        } catch (error) {
            console.error("Failed to publish Explore post:", error);
            showToast(error.message);
        } finally {
            submitButton.disabled = false;
        }
    });
}

const productForm = getElement("productForm");
if (productForm) {
    productForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!requireSignIn("Sign in as a business owner to list products.")) {
            return;
        }

        const submitButton = productForm.querySelector('[type="submit"]');
        submitButton.disabled = true;

        try {
            await apiRequest("/explore/products", {
                method: "POST",
                body: JSON.stringify({
                    name: getElement("productName").value.trim(),
                    category: getElement("productCategory").value.trim(),
                    description:
                        getElement("productDescription").value.trim(),
                    price: Number(getElement("productPrice").value),
                    imageUrl:
                        getElement("productImageUrl").value.trim() || null
                })
            });
            productForm.reset();
            showToast("Your product listing was published.");
            await loadExploreContent(activeFeedFilter === "following");
        } catch (error) {
            console.error("Failed to publish Explore product:", error);
            showToast(error.message);
        } finally {
            submitButton.disabled = false;
        }
    });
}

const enquiryForm = getElement("enquiryForm");
if (enquiryForm) {
    enquiryForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!requireSignIn("Sign in to send an enquiry to a business.")) {
            return;
        }

        const submitButton = enquiryForm.querySelector('[type="submit"]');
        submitButton.disabled = true;

        try {
            await apiRequest("/explore/enquiries", {
                method: "POST",
                body: JSON.stringify({
                    businessID: Number(
                        getElement("enquiryBusinessId").value
                    ),
                    exploreProductID:
                        Number(getElement("enquiryProductId").value) || null,
                    message: getElement("enquiryMessage").value.trim()
                })
            });
            enquiryForm.reset();
            getElement("enquiryDialog").close();
            showToast("Your enquiry was sent to the business.");
        } catch (error) {
            console.error("Failed to send business enquiry:", error);
            showToast(error.message);
        } finally {
            submitButton.disabled = false;
        }
    });
}

async function showEnquiries() {
    if (!requireSignIn("Sign in to view your enquiries.")) return;

    const dialog = getElement("enquiryInboxDialog");
    const content = getElement("enquiryInboxContent");
    if (!dialog || !content) return;

    content.innerHTML = '<p class="text-muted">Loading enquiries...</p>';
    if (!dialog.open) dialog.showModal();

    try {
        const [sent, received] = await Promise.all([
            apiRequest("/explore/enquiries/sent"),
            apiRequest("/explore/enquiries/received")
        ]);

        const renderEnquiry = (item, receivedEnquiry) => `
            <article class="enquiry-inbox-item">
                <div class="enquiry-inbox-heading">
                    <strong>${escapeHtml(
                        receivedEnquiry
                            ? getProperty(item, "customerName")
                            : getProperty(item, "businessName")
                    )}</strong>
                    <span>${escapeHtml(getProperty(item, "status"))}</span>
                </div>
                ${getProperty(item, "productName")
                    ? `<p class="small text-muted mb-1">${escapeHtml(getProperty(item, "productName"))}</p>`
                    : ""
                }
                <p>${escapeHtml(getProperty(item, "message"))}</p>
                <small>${escapeHtml(formatDate(getProperty(item, "createdAt")))}</small>
                ${getProperty(item, "businessResponse") ? `
                    <div class="business-response">
                        <strong>${receivedEnquiry ? "Your reply" : "Business response"}</strong>
                        <p>${escapeHtml(getProperty(item, "businessResponse"))}</p>
                        <small>${escapeHtml(formatDate(getProperty(item, "responseAt")))}</small>
                    </div>
                ` : ""}
                ${receivedEnquiry && getProperty(item, "status") !== "Closed"
                    ? `
                        <form class="business-response-form" data-form="enquiry-response" data-enquiry-id="${escapeHtml(getProperty(item, "businessEnquiryID"))}">
                            <label for="response-${escapeHtml(getProperty(item, "businessEnquiryID"))}">Reply to this customer</label>
                            <textarea id="response-${escapeHtml(getProperty(item, "businessEnquiryID"))}" name="message" minlength="5" maxlength="2000" rows="3" required placeholder="Answer their question or let them know what happens next."></textarea>
                            <button type="submit" class="btn btn-sm btn-primary">Send reply</button>
                        </form>
                        <div class="enquiry-inbox-actions">
                            <button type="button" class="btn btn-sm btn-outline-secondary" data-action="enquiry-status" data-enquiry-id="${escapeHtml(getProperty(item, "businessEnquiryID"))}" data-status="Closed">Close enquiry</button>
                        </div>
                    `
                    : receivedEnquiry
                        ? `
                            <div class="enquiry-inbox-actions">
                                <button type="button" class="btn btn-sm btn-outline-primary" data-action="enquiry-status" data-enquiry-id="${escapeHtml(getProperty(item, "businessEnquiryID"))}" data-status="InProgress">Reopen enquiry</button>
                            </div>
                        `
                        : ""
                }
            </article>
        `;

        content.innerHTML = `
            <h3>Received by your business</h3>
            ${received.length
                ? received.map((item) => renderEnquiry(item, true)).join("")
                : '<p class="text-muted">No enquiries received yet.</p>'
            }
            <h3 class="mt-4">Sent by you</h3>
            ${sent.length
                ? sent.map((item) => renderEnquiry(item, false)).join("")
                : '<p class="text-muted">No enquiries sent yet.</p>'
            }
        `;
    } catch (error) {
        console.error("Failed to load enquiries:", error);
        content.innerHTML = `
            <div class="explore-error" role="alert">${escapeHtml(error.message)}</div>
        `;
    }
}

document.addEventListener("submit", async (event) => {
    const form = event.target.closest('[data-form="enquiry-response"]');
    if (!form) return;

    event.preventDefault();
    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;

    try {
        await apiRequest(
            `/explore/enquiries/${form.dataset.enquiryId}/response`,
            {
                method: "PUT",
                body: JSON.stringify({
                    message: form.elements.message.value.trim()
                })
            }
        );
        showToast("Your reply was sent to the customer.");
        await showEnquiries();
    } catch (error) {
        console.error("Failed to respond to business enquiry:", error);
        showToast(error.message);
    } finally {
        submitButton.disabled = false;
    }
});

window.addEventListener("explore:show-enquiries", showEnquiries);

// Load more businesses
const loadMoreButton = getElement("loadMoreButton");

if (loadMoreButton) {
    loadMoreButton.addEventListener("click", () => {
        visibleCount += PAGE_SIZE;
        renderFeed();
    });
}

// One delegated handler supports feed actions, filters and profile buttons.
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

    if (action === "location") {
        activeLocation = target.dataset.location || "all";
        applyFilters();
        renderExplorePage();
        return;
    }

    if (action === "retry") {
        loadExploreBusinesses();
        return;
    }

    if (action === "retry-content") {
        loadExploreContent(activeFeedFilter === "following");
        return;
    }

    if (action === "retry-all") {
        Promise.all([
            loadExploreBusinesses(),
            loadExploreContent(activeFeedFilter === "following")
        ]);
        return;
    }

    if (action === "follow-business" || action === "save-business") {
        const businessId = String(target.dataset.businessId || "");
        const relationSet =
            action === "follow-business"
                ? followedBusinessIds
                : savedBusinessIds;
        const isActive = !relationSet.has(businessId);
        const path = action === "follow-business"
            ? `/explore/businesses/${businessId}/follow`
            : `/explore/businesses/${businessId}/save`;

        if (!requireSignIn("Sign in to follow or save businesses.")) return;

        apiRequest(path, {
            method: "PUT",
            body: JSON.stringify({ isActive })
        }).then(() => {
            if (isActive) relationSet.add(businessId);
            else relationSet.delete(businessId);

            businesses = businesses.map((business) =>
                business.id === businessId
                    ? {
                        ...business,
                        isFollowing: action === "follow-business"
                            ? isActive
                            : business.isFollowing,
                        isSaved: action === "save-business"
                            ? isActive
                            : business.isSaved
                    }
                    : business
            );

            if (action === "follow-business") {
                showToast(isActive
                    ? "You are now following this business."
                    : "You unfollowed this business.");
                if (activeFeedFilter === "following") {
                    loadExploreContent(true);
                }
            } else {
                showToast(isActive ? "Business saved." : "Business removed from saved items.");
            }
            renderExplorePage();
        }).catch((error) => {
            console.error("Failed to update business follow/save:", error);
            showToast(error.message);
        });
        return;
    }

    if (action === "like-post" || action === "save-post") {
        const postId = String(target.dataset.postId || "");
        if (!requireSignIn("Sign in to like or save business posts.")) return;

        const isActive = target.getAttribute("aria-pressed") !== "true";
        const isLike = action === "like-post";
        const path = `/explore/posts/${postId}/${isLike ? "like" : "save"}`;

        apiRequest(path, {
            method: "PUT",
            body: JSON.stringify({ isActive })
        }).then(() => {
            if (isLike) {
                posts = posts.map((post) => {
                    if (String(getProperty(post, "explorePostID")) !== postId) {
                        return post;
                    }
                    const currentLikes =
                        Number(getProperty(post, "likeCount") || 0);
                    return {
                        ...post,
                        isLiked: isActive,
                        likeCount: Math.max(
                            0,
                            currentLikes + (isActive ? 1 : -1)
                        )
                    };
                });
            } else {
                if (isActive) savedPostIds.add(postId);
                else savedPostIds.delete(postId);
                posts = posts.map((post) =>
                    String(getProperty(post, "explorePostID")) === postId
                        ? { ...post, isSaved: isActive }
                        : post
                );
            }
            applyFilters();
            renderExplorePage();
        }).catch((error) => {
            console.error("Failed to update post interaction:", error);
            showToast(error.message);
        });
        return;
    }

    if (action === "save-product") {
        const productId = String(target.dataset.productId || "");
        if (!requireSignIn("Sign in to save products.")) return;

        const isActive = !savedProductIds.has(productId);
        apiRequest(`/explore/products/${productId}/save`, {
            method: "PUT",
            body: JSON.stringify({ isActive })
        }).then(() => {
            if (isActive) savedProductIds.add(productId);
            else savedProductIds.delete(productId);
            products = products.map((product) =>
                String(getProperty(product, "exploreProductID")) === productId
                    ? { ...product, isSaved: isActive }
                    : product
            );
            applyFilters();
            renderExplorePage();
        }).catch((error) => {
            console.error("Failed to save product:", error);
            showToast(error.message);
        });
        return;
    }

    if (action === "start-enquiry") {
        if (!requireSignIn("Sign in to send an enquiry to this business.")) {
            return;
        }

        getElement("enquiryBusinessId").value =
            target.dataset.businessId || "";
        getElement("enquiryProductId").value =
            target.dataset.productId || "";

        const product = products.find(
            (item) =>
                String(getProperty(item, "exploreProductID")) ===
                target.dataset.productId
        );
        getElement("enquiryProductName").textContent = product
            ? `Enquiry about ${getProperty(product, "name")} from ${getProperty(product, "businessName")}.`
            : "Your message will be sent to the business.";
        getElement("enquiryDialog").showModal();
        return;
    }

    if (action === "enquiry-status") {
        const enquiryId = target.dataset.enquiryId;
        apiRequest(`/explore/enquiries/${enquiryId}/status`, {
            method: "PUT",
            body: JSON.stringify({ status: target.dataset.status })
        }).then(() => {
            showToast("Enquiry status updated.");
            showEnquiries();
        }).catch((error) => {
            console.error("Failed to update enquiry status:", error);
            showToast(error.message);
        });
        return;
    }

    if (action === "reset-filters") {
        resetFilters();
        return;
    }
});

window.addEventListener("explore:feed-filter", (event) => {
    const filter = event.detail?.filter;

    if (!["for-you", "following", "products", "saved"].includes(filter)) {
        return;
    }

    activeFeedFilter = filter;
    activeCategory = "all";
    const categorySelect = getElement("categoryFilter");
    if (categorySelect) categorySelect.value = "all";
    applyFilters();
    renderExplorePage();

    if (filter === "for-you") {
        loadExploreContent(false);
    } else if (filter === "following") {
        loadExploreContent(true);
    } else if (filter === "saved") {
        loadExploreAccountState();
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
Promise.all([
    loadExploreBusinesses(),
    loadExploreContent(false)
]).then(() => Promise.all([
    loadExploreAccountState(),
    loadOwnerBusiness()
]));
