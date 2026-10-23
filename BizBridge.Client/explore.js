"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const businesses = [
        {
            id: "urban-roots",
            name: "Urban Roots Pantry",
            category: "Food & drink",
            location: "Soweto, Johannesburg",
            description: "Fresh, locally grown herbs and pantry staples from our community garden in Soweto. Grown with care, picked fresh and packed by hand.",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
            cover: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85",
            followers: "1.2k",
            products: [
                { name: "Fresh herb bundle", price: "R 45" },
                { name: "Garden-to-table box", price: "R 180" }
            ]
        },
        {
            id: "moya-studio",
            name: "Moya Studio",
            category: "Fashion",
            location: "Durban, KwaZulu-Natal",
            description: "Everyday pieces with a little more meaning. Moya Studio brings contemporary South African design to your wardrobe.",
            avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&h=120&q=80",
            cover: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85",
            followers: "860",
            products: [
                { name: "Everyday carry-all", price: "R 420" },
                { name: "Handwoven weekend tote", price: "R 560" }
            ]
        },
        {
            id: "kasi-cycle",
            name: "Kasi Cycle Co.",
            category: "Services",
            location: "Khayelitsha, Cape Town",
            description: "Keeping our neighbourhood moving with friendly bike repairs, reliable parts and refurbished rides for every budget.",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
            cover: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=85",
            followers: "2.1k",
            products: [
                { name: "Neighbourhood tune-up", price: "R 250" },
                { name: "City commuter bicycle", price: "R 3,800" }
            ]
        },
        {
            id: "lerato-bakehouse",
            name: "Lerato Bakehouse",
            category: "Food & drink",
            location: "Mamelodi, Pretoria",
            description: "Small-batch bakes, big-hearted flavours. We make celebration cakes and fresh treats with a proudly local touch.",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80",
            cover: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=85",
            followers: "975",
            products: [
                { name: "Cinnamon morning buns", price: "R 95" },
                { name: "Custom celebration cake", price: "From R 650" }
            ]
        },
        {
            id: "rea-dira",
            name: "Rea Dira Woodworks",
            category: "Home & crafts",
            location: "Alexandra, Johannesburg",
            description: "Furniture made to last, shaped from reclaimed timber and built by local hands in our Alexandra workshop.",
            avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80",
            cover: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85",
            followers: "740",
            products: [
                { name: "Reclaimed wood side table", price: "R 1,250" },
                { name: "Made-to-measure shelves", price: "From R 850" }
            ]
        },
        {
            id: "thokos-market",
            name: "Thoko's Fresh Market",
            category: "Food & drink",
            location: "KwaMashu, Durban",
            description: "Your neighbourhood stop for seasonal produce, friendly service and everyday essentials sourced from local growers.",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80",
            cover: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85",
            followers: "1.4k",
            products: [
                { name: "Seasonal family produce box", price: "R 220" },
                { name: "Market-day fruit bundle", price: "R 110" }
            ]
        },
        {
            id: "pulse-print",
            name: "PulsePrint Studio",
            category: "Creative services",
            location: "Braamfontein, Johannesburg",
            description: "Bold ideas, beautifully printed. A local creative studio for small-run packaging, signage and all the details that make a brand.",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
            cover: "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=1000&q=85",
            followers: "690",
            products: [
                { name: "Small business starter pack", price: "R 680" },
                { name: "Custom market-day signage", price: "From R 350" }
            ]
        },
        {
            id: "kasiglow",
            name: "KasiGlow Beauty",
            category: "Beauty & wellness",
            location: "Soweto, Johannesburg",
            description: "Feel-good skincare made for our South African climate. Thoughtful ingredients, small batches and a whole lot of glow.",
            avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&h=120&q=80",
            cover: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1000&q=85",
            followers: "1.8k",
            products: [
                { name: "Daily glow face oil", price: "R 290" },
                { name: "KasiGlow starter set", price: "R 520" }
            ]
        },
        {
            id: "green-thread",
            name: "The Green Thread",
            category: "Fashion",
            location: "Gqeberha, Eastern Cape",
            description: "Thoughtful fashion, made slowly. Meet the local makers turning rescued fabrics into one-of-a-kind pieces.",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
            cover: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85",
            followers: "520",
            products: [
                { name: "Reworked denim jacket", price: "R 890" },
                { name: "Everyday patchwork pouch", price: "R 240" }
            ]
        },
        {
            id: "khula-home",
            name: "Khula Home Collective",
            category: "Home & crafts",
            location: "Tembisa, Johannesburg",
            description: "Small-batch homewares for the moments that make a house feel like yours. Made together, right here in Tembisa.",
            avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80",
            cover: "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1000&q=85",
            followers: "430",
            products: [
                { name: "Hand-poured table candles", price: "R 160" },
                { name: "Woven cotton cushion", price: "R 390" }
            ]
        }
    ];

    const posts = [
        {
            id: "post-urban-roots",
            businessId: "urban-roots",
            kind: "post",
            caption: "A little harvest, a lot of heart 🌿 These fresh herb bundles were grown just around the corner. Pop by our Saturday market and say hello.",
            media: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1100&q=85",
            alt: "Fresh seasonal produce arranged at a local market",
            age: "2 hours ago",
            likes: 128,
            comments: 18
        },
        {
            id: "post-moya-tote",
            businessId: "moya-studio",
            kind: "product",
            caption: "Made slowly, carried everywhere. Meet the everyday carry-all, hand-finished by our Durban studio team.",
            media: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1100&q=85",
            alt: "A hand-crafted neutral canvas tote bag",
            age: "4 hours ago",
            likes: 94,
            comments: 11,
            productName: "Everyday carry-all",
            price: "R 420",
            availability: "Made to order · 3–5 days"
        },
        {
            id: "post-kasi-cycle",
            businessId: "kasi-cycle",
            kind: "sponsored",
            caption: "Your next ride is waiting. Refurbished, road-ready bikes with a proper tune-up and neighbourhood support included.",
            media: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1100&q=85",
            alt: "A freshly serviced city bicycle",
            age: "Sponsored",
            likes: 76,
            comments: 8,
            productName: "City commuter bicycle",
            price: "R 3,800",
            availability: "In stock · Khayelitsha"
        },
        {
            id: "post-lerato-reel",
            businessId: "lerato-bakehouse",
            kind: "video",
            caption: "The secret to a good morning? A warm cinnamon bun and nowhere else to be. Fresh from our ovens today.",
            media: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1100&q=85",
            alt: "Freshly baked bread cooling in a bakery",
            age: "Yesterday",
            likes: 203,
            comments: 26,
            duration: "0:18"
        },
        {
            id: "post-rea-dira",
            businessId: "rea-dira",
            kind: "post",
            caption: "From salvaged timber to a new favourite corner. This side table was built by hand in our Alexandra workshop — every piece has its own story.",
            media: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1100&q=85",
            alt: "Thoughtfully crafted furniture in a warm home",
            age: "Yesterday",
            likes: 61,
            comments: 7
        },
        {
            id: "post-thoko-box",
            businessId: "thokos-market",
            kind: "product",
            caption: "This week's family box is packed with seasonal favourites from growers up the road. Fresh food, fair prices, local hands.",
            media: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1100&q=85",
            alt: "A colourful basket of fresh vegetables",
            age: "2 days ago",
            likes: 119,
            comments: 14,
            productName: "Seasonal family produce box",
            price: "R 220",
            availability: "Available for collection"
        },
        {
            id: "post-pulse-print",
            businessId: "pulse-print",
            kind: "sponsored",
            caption: "Make your next market day unforgettable. Get your first brand starter pack designed and printed with a local creative team.",
            media: "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=1100&q=85",
            alt: "A creative designer working on a branding project",
            age: "Sponsored",
            likes: 45,
            comments: 4,
            productName: "Small business starter pack",
            price: "R 680",
            availability: "Custom made · 5–7 days"
        },
        {
            id: "post-kasiglow-reel",
            businessId: "kasiglow",
            kind: "video",
            caption: "A slow Sunday routine, made with local botanicals. Meet your new daily glow ritual.",
            media: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1100&q=85",
            alt: "Locally made skincare products in warm light",
            age: "3 days ago",
            likes: 172,
            comments: 21,
            duration: "0:24"
        },
        {
            id: "post-green-thread",
            businessId: "green-thread",
            kind: "post",
            caption: "Second life, first choice. Every jacket in this drop is reworked by hand in our Gqeberha studio — no two are quite the same.",
            media: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1100&q=85",
            alt: "A collection of colorful, thoughtfully styled clothing",
            age: "4 days ago",
            likes: 88,
            comments: 9
        },
        {
            id: "post-khula-candles",
            businessId: "khula-home",
            kind: "product",
            caption: "A little light, poured by hand. Our Tembisa-made table candles are back in stock in three new scents.",
            media: "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1100&q=85",
            alt: "Handmade candles and home decor",
            age: "5 days ago",
            likes: 53,
            comments: 6,
            productName: "Hand-poured table candles",
            price: "R 160",
            availability: "In stock · Tembisa"
        }
    ];

    const businessById = new Map(
        businesses.map((business) => [business.id, business])
    );
    const feedElement = document.getElementById("exploreFeed");
    const searchInput = document.getElementById("exploreSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const feedMessage = document.getElementById("feedMessage");
    const loadMoreButton = document.getElementById("loadMoreButton");
    const sentinel = document.getElementById("feedSentinel");
    const signInDialog = document.getElementById("signInDialog");
    const profileDialog = document.getElementById("businessProfileDialog");
    const profileContent = document.getElementById("businessProfileContent");
    const videoDialog = document.getElementById("videoPreviewDialog");
    const toast = document.getElementById("exploreToast");
    const followedBusinessIds = new Set();
    const likedPostIds = new Set();
    const savedPostIds = new Set();
    let activeFilter = "for-you";
    let visibleCount = 4;
    let toastTimer = null;
    let intersectionObserver = null;

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (character) => {
            const replacements = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#39;"
            };

            return replacements[character];
        });
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("is-visible");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toast.classList.remove("is-visible");
        }, 3000);
    }

    function requireAccount(action) {
        if (localStorage.getItem("token")) {
            showToast(`${action} is preview-only until the marketplace is connected.`);
            return true;
        }

        const message = action === "Orders" || action === "Enquiries"
            ? `Sign in to manage your ${action.toLowerCase()} and contact businesses.`
            : "Sign in to follow local businesses, save your favourites and start a conversation.";
        document.getElementById("signInMessage").textContent = message;
        signInDialog.showModal();
        return false;
    }

    function getPostBusiness(post) {
        return businessById.get(post.businessId);
    }

    function getFilteredPosts() {
        const query = searchInput.value.trim().toLocaleLowerCase();
        const category = categoryFilter.value;

        return posts.filter((post) => {
            const business = getPostBusiness(post);
            const matchesFilter =
                activeFilter === "for-you"
                || (activeFilter === "following"
                    && followedBusinessIds.has(post.businessId))
                || (activeFilter === "saved" && savedPostIds.has(post.id))
                || (activeFilter === "products"
                    && ["product", "sponsored"].includes(post.kind));
            const matchesCategory =
                category === "all" || business.category === category;
            const searchText = [
                business.name,
                business.category,
                business.location,
                business.description,
                post.caption,
                post.productName
            ].filter(Boolean).join(" ").toLocaleLowerCase();

            return matchesFilter
                && matchesCategory
                && (!query || searchText.includes(query));
        });
    }

    function renderBusinessStories() {
        const stories = businesses.slice(0, 6);
        document.getElementById("businessStories").innerHTML = stories
            .map((business) => `
                <button class="story-button" type="button"
                        data-business-profile="${escapeHtml(business.id)}"
                        aria-label="View ${escapeHtml(business.name)} business profile">
                    <span class="story-avatar-wrap">
                        <img class="story-avatar"
                             src="${escapeHtml(business.avatar)}"
                             alt="" loading="lazy">
                    </span>
                    <span class="story-name">${escapeHtml(business.name)}</span>
                </button>
            `).join("");
    }

    function renderCategories() {
        const categories = [...new Set(businesses.map((business) => business.category))];
        categoryFilter.insertAdjacentHTML(
            "beforeend",
            categories.map((category) =>
                `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`
            ).join("")
        );

        document.getElementById("popularCategories").innerHTML = categories
            .slice(0, 5)
            .map((category) => {
                const count = businesses.filter(
                    (business) => business.category === category
                ).length;
                return `
                    <button class="category-link" type="button"
                            data-category="${escapeHtml(category)}">
                        <span>${escapeHtml(category)}</span>
                        <span>${count} businesses →</span>
                    </button>
                `;
            }).join("");
    }

    function renderTrendingBusinesses() {
        const trending = [
            { businessId: "kasi-cycle", growth: "+24%" },
            { businessId: "kasiglow", growth: "+18%" },
            { businessId: "urban-roots", growth: "+15%" },
            { businessId: "lerato-bakehouse", growth: "+12%" }
        ];

        document.getElementById("trendingBusinesses").innerHTML = trending
            .map((item, index) => {
                const business = businessById.get(item.businessId);
                return `
                    <li>
                        <button class="trending-business-button" type="button"
                                data-business-profile="${escapeHtml(business.id)}">
                            <span class="trending-rank">${index + 1}</span>
                            <img class="trending-avatar"
                                 src="${escapeHtml(business.avatar)}"
                                 alt="" loading="lazy">
                            <span class="trending-business-info">
                                <span class="trending-business-name">${escapeHtml(business.name)}</span>
                                <span class="trending-business-category">${escapeHtml(business.category)}</span>
                            </span>
                            <span class="trending-growth">${escapeHtml(item.growth)}</span>
                        </button>
                    </li>
                `;
            }).join("");
    }

    function renderPost(post) {
        const business = getPostBusiness(post);
        const sponsored = post.kind === "sponsored";
        const product = ["product", "sponsored"].includes(post.kind);
        const mediaTag = sponsored
            ? `<span class="media-tag is-sponsored">✦ Sponsored</span>`
            : post.kind === "video"
                ? `<span class="media-tag">▶ Short video preview</span>`
                : "";
        const mediaAction = post.kind === "video"
            ? `<button class="video-play-button" type="button"
                       data-video-preview aria-label="Open video preview">▶</button>
               <span class="video-duration">${escapeHtml(post.duration)}</span>`
            : "";
        const currentLikes = post.likes + (likedPostIds.has(post.id) ? 1 : 0);
        const isFollowing = followedBusinessIds.has(business.id);
        const isLiked = likedPostIds.has(post.id);
        const isSaved = savedPostIds.has(post.id);

        return `
            <article class="feed-card" id="${escapeHtml(post.id)}"
                     data-post-id="${escapeHtml(post.id)}">
                <header class="feed-card-header">
                    <img class="business-avatar"
                         src="${escapeHtml(business.avatar)}"
                         alt="" loading="lazy">
                    <div class="business-meta">
                        <button class="business-name-button" type="button"
                                data-business-profile="${escapeHtml(business.id)}">
                            ${escapeHtml(business.name)}
                        </button>
                        <span class="business-subline">
                            ${escapeHtml(business.location)} · ${escapeHtml(post.age)}
                        </span>
                    </div>
                    <button class="follow-button${isFollowing ? " is-following" : ""}"
                            type="button" data-follow-business="${escapeHtml(business.id)}"
                            aria-pressed="${isFollowing}">
                        ${isFollowing ? "Following" : "Follow"}
                    </button>
                    <button class="feed-more-button" type="button"
                            data-share-post="${escapeHtml(post.id)}"
                            aria-label="Share ${escapeHtml(business.name)} post">↗</button>
                </header>
                <p class="feed-card-copy">${escapeHtml(post.caption)}</p>
                <div class="feed-media-wrap">
                    <img class="feed-media"
                         src="${escapeHtml(post.media)}"
                         alt="${escapeHtml(post.alt)}" loading="lazy">
                    ${mediaTag}
                    ${mediaAction}
                </div>
                ${product ? `
                    <div class="product-summary">
                        <div>
                            <h3>${escapeHtml(post.productName)}</h3>
                            <p>${escapeHtml(business.category)} · ${escapeHtml(business.location)}</p>
                        </div>
                        <span class="product-price">${escapeHtml(post.price)}</span>
                    </div>
                    <div class="product-availability">
                        <span></span>${escapeHtml(post.availability)}
                    </div>
                    <button class="product-request-button" type="button"
                            data-account-action="Orders">
                        Request to order <span aria-hidden="true">&nbsp;→</span>
                    </button>
                ` : ""}
                <div class="feed-card-actions">
                    <button class="feed-action${isLiked ? " is-liked" : ""}"
                            type="button" data-like-post="${escapeHtml(post.id)}"
                            aria-pressed="${isLiked}">
                        <span aria-hidden="true">${isLiked ? "♥" : "♡"}</span>
                        <span>${currentLikes}</span>
                    </button>
                    <button class="feed-action" type="button"
                            data-comment-post="${escapeHtml(post.id)}"
                            aria-expanded="false">
                        <span aria-hidden="true">◌</span>
                        <span>${post.comments} comments</span>
                    </button>
                    <button class="feed-action feed-action-save${isSaved ? " is-saved" : ""}"
                            type="button" data-save-post="${escapeHtml(post.id)}"
                            aria-label="${isSaved ? "Remove saved post" : "Save post"}"
                            aria-pressed="${isSaved}">
                        <span aria-hidden="true">${isSaved ? "♧" : "♧"}</span>
                    </button>
                </div>
                <div class="feed-card-foot">A community preview · Interactions are not saved</div>
            </article>
        `;
    }

    function renderEmptyState(filteredPosts) {
        if (activeFilter === "saved" && filteredPosts.length === 0) {
            return `
                <div class="feed-empty-state">
                    <span aria-hidden="true">♧</span>
                    <h3>Your saved finds will live here.</h3>
                    <p>Save a post to keep a little inspiration close.</p>
                </div>
            `;
        }

        if (activeFilter === "following" && filteredPosts.length === 0) {
            return `
                <div class="feed-empty-state">
                    <span aria-hidden="true">♡</span>
                    <h3>Your local circle starts here.</h3>
                    <p>Follow a business to see more of what they're making.</p>
                </div>
            `;
        }

        return `
            <div class="feed-empty-state">
                <span aria-hidden="true">⌕</span>
                <h3>No discoveries found just yet.</h3>
                <p>Try a different search or choose another category.</p>
            </div>
        `;
    }

    function updateLoadMore(filteredPosts) {
        const hasMore = visibleCount < filteredPosts.length;
        loadMoreButton.hidden = !hasMore;

        if (intersectionObserver) {
            intersectionObserver.disconnect();
        }

        if (hasMore && "IntersectionObserver" in window) {
            intersectionObserver = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    visibleCount = Math.min(visibleCount + 4, filteredPosts.length);
                    renderFeed();
                }
            }, { rootMargin: "450px 0px" });
            intersectionObserver.observe(sentinel);
        }
    }

    function renderFeed() {
        const filteredPosts = getFilteredPosts();
        const visiblePosts = filteredPosts.slice(0, visibleCount);

        feedElement.innerHTML = visiblePosts.length
            ? visiblePosts.map(renderPost).join("")
            : renderEmptyState(filteredPosts);

        feedMessage.textContent = searchInput.value.trim()
            ? `Showing sample results for “${searchInput.value.trim()}”.`
            : "";
        updateLoadMore(filteredPosts);
    }

    function renderProfile(businessId) {
        const business = businessById.get(businessId);

        if (!business) {
            return;
        }

        profileContent.innerHTML = `
            <div class="profile-cover"
                 style="background-image: linear-gradient(0deg, rgba(27,48,36,.22), transparent), url('${escapeHtml(business.cover)}')"></div>
            <div class="profile-identity">
                <img class="profile-avatar" src="${escapeHtml(business.avatar)}" alt="">
                <h2 id="businessProfileTitle">${escapeHtml(business.name)}</h2>
            </div>
            <p class="profile-description">${escapeHtml(business.description)}</p>
            <div class="profile-details">
                <span>⌖ ${escapeHtml(business.location)}</span>
                <span>✦ ${escapeHtml(business.category)}</span>
                <span>♡ ${escapeHtml(business.followers)} sample followers</span>
            </div>
            <div class="profile-products">
                <h3>From the business</h3>
                ${business.products.map((product) => `
                    <div class="profile-product-row">
                        <span>${escapeHtml(product.name)}</span>
                        <span>${escapeHtml(product.price)}</span>
                    </div>
                `).join("")}
            </div>
            <button class="product-request-button profile-cta" type="button"
                    data-account-action="Enquiries">
                Ask this business a question <span aria-hidden="true">&nbsp;→</span>
            </button>
            <p class="dialog-preview-note">Sample business profile · Public profiles are not connected yet.</p>
        `;
        profileDialog.showModal();
    }

    function resetFeed() {
        visibleCount = 4;
        renderFeed();
    }

    function setFilter(filter) {
        activeFilter = filter;
        document.querySelectorAll("[data-feed-filter]").forEach((button) => {
            const isActive = button.dataset.feedFilter === filter;
            button.classList.toggle("is-active", isActive);

            if (button.classList.contains("feed-tab")) {
                button.setAttribute("aria-selected", String(isActive));
            }
        });
        resetFeed();
    }

    function toggleAccountAction(action) {
        if (action !== "Orders" && action !== "Enquiries" && action !== "Messages"
            && action !== "Saved") {
            return;
        }

        if (action === "Saved") {
            if (!requireAccount("Saved posts")) {
                return;
            }
            setFilter("saved");
            document.getElementById("feedHeading").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
            return;
        }

        requireAccount(action);
    }

    renderBusinessStories();
    renderCategories();
    renderTrendingBusinesses();
    renderFeed();

    const sharedPostId = window.location.hash.slice(1);
    const sharedPostIndex = posts.findIndex((post) => post.id === sharedPostId);
    if (sharedPostIndex >= 0) {
        visibleCount = sharedPostIndex + 1;
        renderFeed();
        window.requestAnimationFrame(() => {
            const sharedPost = document.getElementById(sharedPostId);
            if (sharedPost) {
                sharedPost.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    }

    document.getElementById("exploreSearchForm").addEventListener("submit", (event) => {
        event.preventDefault();
        searchInput.blur();
        resetFeed();
    });

    searchInput.addEventListener("input", resetFeed);
    categoryFilter.addEventListener("change", resetFeed);
    loadMoreButton.addEventListener("click", () => {
        const filteredPosts = getFilteredPosts();
        visibleCount = Math.min(visibleCount + 4, filteredPosts.length);
        renderFeed();
    });

    document.addEventListener("click", async (event) => {
        const target = event.target.closest("button, a");

        if (!target) {
            return;
        }

        if (target.dataset.feedFilter) {
            const filter = target.dataset.feedFilter;
            if ((filter === "following" || filter === "saved")
                && !requireAccount(filter === "saved" ? "Saved posts" : "Following")) {
                return;
            }
            setFilter(filter);
            return;
        }

        if (target.dataset.category) {
            categoryFilter.value = target.dataset.category;
            resetFeed();
            document.getElementById("feedHeading").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
            return;
        }

        if (target.dataset.businessProfile) {
            renderProfile(target.dataset.businessProfile);
            return;
        }

        if (target.dataset.accountAction) {
            toggleAccountAction(target.dataset.accountAction);
            return;
        }

        if (target.dataset.followBusiness) {
            const businessId = target.dataset.followBusiness;
            if (!requireAccount("Following")) {
                return;
            }

            if (followedBusinessIds.has(businessId)) {
                followedBusinessIds.delete(businessId);
            } else {
                followedBusinessIds.add(businessId);
            }
            renderFeed();
            return;
        }

        if (target.dataset.likePost) {
            const postId = target.dataset.likePost;
            if (!requireAccount("Likes")) {
                return;
            }

            if (likedPostIds.has(postId)) {
                likedPostIds.delete(postId);
            } else {
                likedPostIds.add(postId);
            }
            renderFeed();
            return;
        }

        if (target.dataset.savePost) {
            const postId = target.dataset.savePost;
            if (!requireAccount("Saving posts")) {
                return;
            }

            if (savedPostIds.has(postId)) {
                savedPostIds.delete(postId);
            } else {
                savedPostIds.add(postId);
            }
            renderFeed();
            return;
        }

        if (target.dataset.commentPost) {
            const card = target.closest(".feed-card");
            const existingPreview = card.querySelector(".comment-preview");
            if (existingPreview) {
                existingPreview.remove();
                target.setAttribute("aria-expanded", "false");
                return;
            }

            const preview = document.createElement("div");
            preview.className = "comment-preview";
            preview.innerHTML = `
                <p><strong>Amara M.</strong> Love seeing local makers thrive 🌱</p>
                <p><strong>Neo K.</strong> Where can I find you this weekend?</p>
                <form>
                    <label class="visually-hidden" for="comment-${escapeHtml(target.dataset.commentPost)}">
                        Write a comment
                    </label>
                    <input id="comment-${escapeHtml(target.dataset.commentPost)}"
                           type="text" placeholder="Add to the conversation...">
                    <button type="submit">Send</button>
                </form>
            `;
            card.querySelector(".feed-card-actions").after(preview);
            target.setAttribute("aria-expanded", "true");
            return;
        }

        if (target.dataset.sharePost) {
            const shareUrl = new URL("explore.html", window.location.href);
            shareUrl.hash = target.dataset.sharePost;
            try {
                if (navigator.share) {
                    await navigator.share({
                        title: "Discover local businesses on BizBridge",
                        text: `Find ${getPostBusiness(posts.find((post) =>
                            post.id === target.dataset.sharePost
                        )).name} on BizBridge Explore.`,
                        url: shareUrl.href
                    });
                } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(shareUrl.href);
                    showToast("Explore link copied. Share the local love.");
                } else {
                    window.prompt("Copy this BizBridge Explore link:", shareUrl.href);
                }
            } catch (error) {
                if (error.name !== "AbortError") {
                    showToast("Sharing isn't available here. Copy the page link to share.");
                }
            }
            return;
        }

        if (target.hasAttribute("data-video-preview")) {
            videoDialog.showModal();
        }
    });

    document.addEventListener("submit", (event) => {
        if (!event.target.matches(".comment-preview form")) {
            return;
        }

        event.preventDefault();
        if (!requireAccount("Commenting")) {
            return;
        }

        const input = event.target.querySelector("input");
        if (input.value.trim()) {
            showToast("Commenting is preview-only until the marketplace is connected.");
            input.value = "";
        }
    });
});
