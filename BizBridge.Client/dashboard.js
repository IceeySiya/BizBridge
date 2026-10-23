
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // API configuration
    const API_BASE_URL =
        window.BIZBRIDGE_API_BASE_URL || "http://localhost:5214/api";

    const token = localStorage.getItem("token");

    // Page elements
    const dashboardMessage = document.getElementById("dashboardMessage");
    const logoutButton = document.getElementById("logoutButton");
    const noBusinessSection = document.getElementById("noBusinessSection");
    const businessSection = document.getElementById("businessSection");

    const financialSummaryMessage = document.getElementById(
        "financialSummaryMessage"
    );

    let businessId = null;

    // Display a message on the dashboard
    function showMessage(message, type = "danger") {
        dashboardMessage.textContent = message;
        dashboardMessage.className = `alert alert-${type}`;
    }

    function hideMessage() {
        dashboardMessage.textContent = "";
        dashboardMessage.className = "alert d-none";
    }

    // Log the user out
    function logout() {
        localStorage.removeItem("token");
        window.location.replace("login.html");
    }

    logoutButton.addEventListener("click", logout);

    // Support camelCase and PascalCase API responses
    function getProperty(object, camelCaseName, pascalCaseName) {
        return object?.[camelCaseName] ?? object?.[pascalCaseName];
    }

    // Send an authenticated API request
    async function apiRequest(path) {
        if (!localStorage.getItem("token")) {
            logout();
            throw new Error("Your session has expired. Please log in again.");
        }

        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
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
                    ? data.message || data.title || data.detail || data.error
                    : null;

            throw new Error(
                message || `The API request failed (${response.status}).`
            );
        }

        return { response, data };
    }

    // Format an amount in South African rand
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

    // Reset financial overview cards
    function resetFinancialSummary(message) {
        document.getElementById("totalIncome").textContent = "—";
        document.getElementById("totalExpenses").textContent = "—";
        document.getElementById("netCashFlow").textContent = "—";
        document.getElementById("transactionCount").textContent = "—";

        financialSummaryMessage.textContent = message;
    }

    // Show the state where no business profile exists
    function showNoBusiness() {
        businessSection.classList.add("d-none");
        noBusinessSection.classList.remove("d-none");

        businessId = null;

        resetFinancialSummary(
            "Create a business profile to view your financial summary."
        );
    }

    // Display business profile details
    function displayBusiness(business) {
        const name = getProperty(business, "businessName", "BusinessName");
        const industry = getProperty(business, "industry", "Industry");
        const location = getProperty(business, "location", "Location");
        const description = getProperty(
            business, "description", "Description"
        );
        const established = getProperty(
            business, "established", "Established"
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

        noBusinessSection.classList.add("d-none");
        businessSection.classList.remove("d-none");
    }

    // Load authenticated account details
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

    // Load the logged-in user's business
    async function loadBusiness() {
        const { response, data } = await apiRequest("/businesses/mine");

        if (response.status === 204 || !data) {
            showNoBusiness();
            return;
        }

        const business = data?.business ?? data?.data ?? data;

        const id = getProperty(business, "businessID", "BusinessID");

        if (!id) {
            showNoBusiness();
            return;
        }

        businessId = id;
        displayBusiness(business);

        await loadFinancialSummary();
    }

    // Load the current calendar month's financial summary
    async function loadFinancialSummary() {
        if (!businessId) return;

        financialSummaryMessage.textContent =
            "Loading financial summary...";

        try {
            // Use local calendar dates for the requested period.
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
                    data, "transactionCount", "TransactionCount"
                ) ?? 0
            );

            if (
                !Number.isFinite(totalIncome) ||
                !Number.isFinite(totalExpenses) ||
                !Number.isFinite(netCashFlow) ||
                !Number.isFinite(transactionCount)
            ) {
                throw new Error("The financial summary contains invalid values.");
            }

            document.getElementById("totalIncome").textContent =
                formatCurrency(totalIncome);

            document.getElementById("totalExpenses").textContent =
                formatCurrency(totalExpenses);

            const netCashFlowElement =
                document.getElementById("netCashFlow");

            netCashFlowElement.textContent = formatCurrency(netCashFlow);

            netCashFlowElement.classList.remove(
                "text-success", "text-danger"
            );

            netCashFlowElement.classList.add(
                netCashFlow >= 0 ? "text-success" : "text-danger"
            );

            document.getElementById("transactionCount").textContent =
                String(transactionCount);

            financialSummaryMessage.textContent =
                `Summary for ${startDate} to ${endDate}.`;

        } catch (error) {
            console.error("Financial summary error:", error);

            resetFinancialSummary(
                `Unable to load financial summary: ${error.message}`
            );
        }
    }

    // Initialise the dashboard
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

            if (localStorage.getItem("token")) {
                showMessage(
                    `Could not load account details: ${error.message}`
                );
            }
        }

        if (!localStorage.getItem("token")) return;

        try {
            await loadBusiness();
        } catch (error) {
            console.error("Business loading error:", error);

            if (localStorage.getItem("token")) {
                showMessage(
                    `Could not load your business: ${error.message}`
                );
            }
        }
    }

    // Refresh financial figures when returning to this page.
    window.addEventListener("pageshow", () => {
        if (businessId && localStorage.getItem("token")) {
            loadFinancialSummary();
        }
    });

    loadDashboard();
});
