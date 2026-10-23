
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // Shared API configuration from api-config.js
    const API_BASE_URL = window.BIZBRIDGE_API_BASE_URL;

    if (!API_BASE_URL) {
        console.error(
            "API base URL is missing. Ensure api-config.js loads before dashboard.js."
        );
        return;
    }

    const TOKEN_KEY = "token";
    const token = localStorage.getItem(TOKEN_KEY);

    // Page elements
    const dashboardMessage = document.getElementById("dashboardMessage");
    const logoutButton = document.getElementById("logoutButton");
    const noBusinessSection = document.getElementById("noBusinessSection");
    const businessSection = document.getElementById("businessSection");

    const financialSummaryMessage = document.getElementById(
        "financialSummaryMessage"
    );

    let businessId = null;

    // Display a dashboard message safely.
    function showMessage(message, type = "danger") {
        if (!dashboardMessage) return;

        dashboardMessage.textContent = message;
        dashboardMessage.className = `alert alert-${type}`;
    }

    function hideMessage() {
        if (!dashboardMessage) return;

        dashboardMessage.textContent = "";
        dashboardMessage.className = "alert d-none";
    }

    // Log the user out.
    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("user");
        window.location.replace("login.html");
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }

    // Support camelCase and PascalCase API responses.
    function getProperty(object, camelCaseName, pascalCaseName) {
        return object?.[camelCaseName] ?? object?.[pascalCaseName];
    }

    // Send an authenticated API request.
    async function apiRequest(path, options = {}) {
        const currentToken = localStorage.getItem(TOKEN_KEY);

        if (!currentToken) {
            logout();
            throw new Error("Your session has expired. Please log in again.");
        }

        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                Accept: "application/json",
                ...options.headers,
                Authorization: `Bearer ${currentToken}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            logout();

            throw new Error(
                "Your session is no longer valid. Please log in again."
            );
        }

        if (response.status === 204) {
            return { response, data: null };
        }

        const responseText = await response.text();
        let data = null;

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch {
                data = responseText;
            }
        }

        if (!response.ok) {
            const message =
                typeof data === "object" && data !== null
                    ? data.message ||
                      data.title ||
                      data.detail ||
                      data.error
                    : typeof data === "string"
                        ? data
                        : null;

            const error = new Error(
                message || `The API request failed (${response.status}).`
            );

            error.status = response.status;
            throw error;
        }

        return { response, data };
    }

    // Format an amount in South African rand.
    function formatCurrency(amount) {
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount)) {
            return "R 0.00";
        }

        return new Intl.NumberFormat("en-ZA", {
            style: "currency",
            currency: "ZAR"
        }).format(numericAmount);
    }

    // Reset the financial overview cards.
    function resetFinancialSummary(message) {
        const totalIncome = document.getElementById("totalIncome");
        const totalExpenses = document.getElementById("totalExpenses");
        const netCashFlow = document.getElementById("netCashFlow");
        const transactionCount = document.getElementById("transactionCount");

        if (totalIncome) totalIncome.textContent = "—";
        if (totalExpenses) totalExpenses.textContent = "—";
        if (netCashFlow) {
            netCashFlow.textContent = "—";
            netCashFlow.classList.remove("text-success", "text-danger");
        }
        if (transactionCount) transactionCount.textContent = "—";

        if (financialSummaryMessage) {
            financialSummaryMessage.textContent = message;
        }
    }

    // Show a helpful state when no business profile is available.
    function showNoBusiness() {
        if (businessSection) {
            businessSection.classList.add("d-none");
        }

        if (noBusinessSection) {
            noBusinessSection.classList.remove("d-none");
        }

        businessId = null;

        resetFinancialSummary(
            "Your financial summary is unavailable until your business profile is found."
        );

        showMessage(
            "We couldn't find your business profile. You can create a profile or check your existing profile using the button below.",
            "warning"
        );
    }

    // Display business profile details.
    function displayBusiness(business) {
        const name = getProperty(business, "businessName", "BusinessName");
        const industry = getProperty(business, "industry", "Industry");
        const location = getProperty(business, "location", "Location");
        const description = getProperty(
            business,
            "description",
            "Description"
        );
        const established = getProperty(
            business,
            "established",
            "Established"
        );

        document.getElementById("businessName").textContent =
            name || "Unnamed Business";

        document.getElementById("businessIndustry").textContent =
            industry || "Industry not specified";

        document.getElementById("businessLocation").textContent =
            location || "Location not specified";

        document.getElementById("businessDescription").textContent =
            description || "No description provided.";

        const establishedElement =
            document.getElementById("businessEstablished");

        if (established) {
            const establishedDate = new Date(established);

            establishedElement.textContent = Number.isNaN(
                establishedDate.getTime()
            )
                ? "Not specified"
                : establishedDate.toLocaleDateString("en-ZA");
        } else {
            establishedElement.textContent = "Not specified";
        }

        if (noBusinessSection) {
            noBusinessSection.classList.add("d-none");
        }

        if (businessSection) {
            businessSection.classList.remove("d-none");
        }

        hideMessage();
    }

    // Load authenticated account details.
    async function loadAccount() {
        const { data } = await apiRequest("/auth/me");
        const user = data?.user ?? data?.data ?? data;

        if (!user || typeof user !== "object") {
            throw new Error("Could not load your account details.");
        }

        const firstName = getProperty(user, "firstName", "FirstName");
        const lastName = getProperty(user, "lastName", "LastName");

        const fullName =
            getProperty(user, "fullName", "FullName") ||
            [firstName, lastName].filter(Boolean).join(" ") ||
            getProperty(user, "userName", "UserName") ||
            getProperty(user, "username", "Username") ||
            "User";

        document.getElementById("profileName").textContent = fullName;

        document.getElementById("profileEmail").textContent =
            getProperty(user, "email", "Email") || "Not available";

        document.getElementById("profileRole").textContent =
            getProperty(user, "role", "Role") || "User";
    }

    // Load the logged-in user's business.
    async function loadBusiness() {
        try {
            const { response, data } = await apiRequest("/businesses/mine");

            if (response.status === 204 || !data) {
                showNoBusiness();
                return;
            }

            const business = data?.business ?? data?.data ?? data;

            const id = getProperty(
                business,
                "businessID",
                "BusinessID"
            );

            if (!id) {
                showNoBusiness();
                return;
            }

            businessId = id;

            displayBusiness(business);

            await loadFinancialSummary();
        } catch (error) {
            const message = error.message.toLowerCase();

            const profileNotFound =
                error.status === 404 ||
                message.includes("no business profile found") ||
                message.includes("business not found");

            if (profileNotFound) {
                showNoBusiness();
                return;
            }

            throw error;
        }
    }

    // Load the current calendar month's financial summary.
    async function loadFinancialSummary() {
        if (!businessId) return;

        if (financialSummaryMessage) {
            financialSummaryMessage.textContent =
                "Loading financial summary...";
        }

        try {
            const now = new Date();

            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");

            const startDate = `${year}-${month}-01`;
            const endDate = `${year}-${month}-${day}`;

            const query = new URLSearchParams({
                startDate,
                endDate
            });

            const { data } = await apiRequest(
                `/businesses/${businessId}/financial-summary?${query}`
            );

            if (!data || typeof data !== "object") {
                throw new Error("The API returned no financial summary.");
            }

            const totalIncome = Number(
                getProperty(data, "totalIncome", "TotalIncome") ?? 0
            );

            const totalExpenses = Number(
                getProperty(data, "totalExpenses", "TotalExpenses") ?? 0
            );

            const netCashFlow = Number(
                getProperty(data, "netCashFlow", "NetCashFlow") ??
                (totalIncome - totalExpenses)
            );

            const transactionCount = Number(
                getProperty(
                    data,
                    "transactionCount",
                    "TransactionCount"
                ) ?? 0
            );

            if (
                !Number.isFinite(totalIncome) ||
                !Number.isFinite(totalExpenses) ||
                !Number.isFinite(netCashFlow) ||
                !Number.isFinite(transactionCount)
            ) {
                throw new Error(
                    "The financial summary contains invalid values."
                );
            }

            document.getElementById("totalIncome").textContent =
                formatCurrency(totalIncome);

            document.getElementById("totalExpenses").textContent =
                formatCurrency(totalExpenses);

            const netCashFlowElement =
                document.getElementById("netCashFlow");

            netCashFlowElement.textContent = formatCurrency(netCashFlow);

            netCashFlowElement.classList.remove(
                "text-success",
                "text-danger"
            );

            netCashFlowElement.classList.add(
                netCashFlow >= 0 ? "text-success" : "text-danger"
            );

            document.getElementById("transactionCount").textContent =
                String(transactionCount);

            if (financialSummaryMessage) {
                financialSummaryMessage.textContent =
                    `Summary for ${startDate} to ${endDate}.`;
            }
        } catch (error) {
            console.error("Financial summary error:", error);

            resetFinancialSummary(
                `Your business profile was found, but the financial summary could not be loaded: ${error.message}`
            );
        }
    }

    // Initialise the dashboard.
    async function loadDashboard() {
        if (!token) {
            logout();
            return;
        }

        hideMessage();

        document.getElementById("profileName").textContent = "Loading...";
        document.getElementById("profileEmail").textContent = "Loading...";
        document.getElementById("profileRole").textContent = "Loading...";

        try {
            await loadAccount();
        } catch (error) {
            console.error("Account loading error:", error);

            if (localStorage.getItem(TOKEN_KEY)) {
                showMessage(
                    `Could not load account details: ${error.message}`
                );
            }
        }

        if (!localStorage.getItem(TOKEN_KEY)) return;

        try {
            await loadBusiness();
        } catch (error) {
            console.error("Business loading error:", error);

            if (localStorage.getItem(TOKEN_KEY)) {
                showMessage(
                    `We couldn't load your business information. Please try again later. Details: ${error.message}`,
                    "warning"
                );
            }
        }
    }

    // Refresh financial figures when returning to this page.
    window.addEventListener("pageshow", () => {
        if (businessId && localStorage.getItem(TOKEN_KEY)) {
            loadFinancialSummary();
        }
    });

    loadDashboard();
});
