
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // Shared API configuration from api-config.js.
    const API_BASE_URL = window.BIZBRIDGE_API_BASE_URL;

    if (!API_BASE_URL) {
        console.error(
            "API base URL is missing. Check that api-config.js loads before dashboard.js."
        );
        return;
    }

    const token = localStorage.getItem("token");

    // Page elements.
    const dashboardMessage =
        document.getElementById("dashboardMessage");

    const logoutButton =
        document.getElementById("logoutButton");

    const noBusinessSection =
        document.getElementById("noBusinessSection");

    const businessSection =
        document.getElementById("businessSection");

    const financialSummaryMessage =
        document.getElementById("financialSummaryMessage");

    let businessId = null;
    let isLoadingSummary = false;

    // Display a dashboard message.
    function showMessage(message, type = "danger") {
        dashboardMessage.textContent = message;
        dashboardMessage.className = `alert alert-${type}`;
    }

    function hideMessage() {
        dashboardMessage.textContent = "";
        dashboardMessage.className = "alert d-none";
    }

    // Log the user out.
    function logout() {
        localStorage.removeItem("token");
        window.location.replace("login.html");
    }

    logoutButton.addEventListener("click", logout);

    // Support camelCase and PascalCase API responses.
    function getProperty(object, camelCaseName, pascalCaseName) {
        return object?.[camelCaseName] ?? object?.[pascalCaseName];
    }

    // Send an authenticated API request.
    async function apiRequest(path) {
        const currentToken = localStorage.getItem("token");

        if (!currentToken) {
            logout();
            throw new Error(
                "Your session has expired. Please log in again."
            );
        }

        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
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
                    : null;

            throw new Error(
                message ||
                `The API request failed (${response.status}).`
            );
        }

        return { response, data };
    }

    // Format an amount in South African rand.
    function formatCurrency(amount) {
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount)) {
            return "—";
        }

        return new Intl.NumberFormat("en-ZA", {
            style: "currency",
            currency: "ZAR"
        }).format(numericAmount);
    }

    // Reset the financial overview cards.
    function resetFinancialSummary(message) {
        const currentBalanceElement =
            document.getElementById("currentBalance");

        const totalIncomeElement =
            document.getElementById("totalIncome");

        const totalExpensesElement =
            document.getElementById("totalExpenses");

        const netCashFlowElement =
            document.getElementById("netCashFlow");

        const transactionCountElement =
            document.getElementById("transactionCount");

        if (currentBalanceElement) {
            currentBalanceElement.textContent = "—";
            currentBalanceElement.classList.remove(
                "text-success",
                "text-danger"
            );
        }

        if (totalIncomeElement) {
            totalIncomeElement.textContent = "—";
        }

        if (totalExpensesElement) {
            totalExpensesElement.textContent = "—";
        }

        if (netCashFlowElement) {
            netCashFlowElement.textContent = "—";
            netCashFlowElement.classList.remove(
                "text-success",
                "text-danger"
            );
        }

        if (transactionCountElement) {
            transactionCountElement.textContent = "—";
        }

        financialSummaryMessage.textContent = message;
    }

    // Show the state where no business profile exists.
    function showNoBusiness() {
        businessSection.classList.add("d-none");
        noBusinessSection.classList.remove("d-none");

        businessId = null;

        resetFinancialSummary(
            "Create a business profile to view your financial summary."
        );
    }

    // Display business profile details.
    function displayBusiness(business) {
        const name = getProperty(
            business,
            "businessName",
            "BusinessName"
        );

        const industry = getProperty(
            business,
            "industry",
            "Industry"
        );

        const location = getProperty(
            business,
            "location",
            "Location"
        );

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

            establishedElement.textContent =
                Number.isNaN(establishedDate.getTime())
                    ? "Not specified"
                    : establishedDate.toLocaleDateString("en-ZA");
        } else {
            establishedElement.textContent = "Not specified";
        }

        noBusinessSection.classList.add("d-none");
        businessSection.classList.remove("d-none");
    }

    // Load authenticated account details.
    async function loadAccount() {
        const { data } = await apiRequest("/auth/me");

        const user = data?.user ?? data?.data ?? data;

        if (!user || typeof user !== "object") {
            throw new Error("Could not load your account details.");
        }

        const firstName = getProperty(
            user,
            "firstName",
            "FirstName"
        );

        const lastName = getProperty(
            user,
            "lastName",
            "LastName"
        );

        const fullName =
            getProperty(user, "fullName", "FullName") ||
            [firstName, lastName].filter(Boolean).join(" ") ||
            getProperty(user, "userName", "UserName") ||
            getProperty(user, "username", "Username") ||
            "User";

        document.getElementById("profileName").textContent =
            fullName;

        document.getElementById("profileEmail").textContent =
            getProperty(user, "email", "Email") ||
            "Not available";

        document.getElementById("profileRole").textContent =
            getProperty(user, "role", "Role") ||
            "User";
    }

    // Load the logged-in user's business.
    async function loadBusiness() {
        const { response, data } =
            await apiRequest("/businesses/mine");

        if (response.status === 204 || !data) {
            showNoBusiness();
            return;
        }

        const business =
            data?.business ?? data?.data ?? data;

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
    }

    // Load the current calendar month's financial summary.
    // CurrentBalance is calculated by the API using all transactions.
    async function loadFinancialSummary() {
        if (!businessId || isLoadingSummary) {
            return;
        }

        isLoadingSummary = true;

        financialSummaryMessage.textContent =
            "Loading financial summary...";

        try {
            // Use the browser's local calendar dates for this month's report.
            const now = new Date();

            const year = now.getFullYear();

            const month = String(
                now.getMonth() + 1
            ).padStart(2, "0");

            const day = String(
                now.getDate()
            ).padStart(2, "0");

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
                throw new Error(
                    "The API returned no financial summary."
                );
            }

            // Current balance is all-time, unlike the monthly figures.
            const currentBalance = Number(
                getProperty(
                    data,
                    "currentBalance",
                    "CurrentBalance"
                )
            );

            const totalIncome = Number(
                getProperty(
                    data,
                    "totalIncome",
                    "TotalIncome"
                ) ?? 0
            );

            const totalExpenses = Number(
                getProperty(
                    data,
                    "totalExpenses",
                    "TotalExpenses"
                ) ?? 0
            );

            const netCashFlow = Number(
                getProperty(
                    data,
                    "netCashFlow",
                    "NetCashFlow"
                ) ?? (totalIncome - totalExpenses)
            );

            const transactionCount = Number(
                getProperty(
                    data,
                    "transactionCount",
                    "TransactionCount"
                ) ?? 0
            );

            // Do not silently display a zero balance if the API
            // has not returned the CurrentBalance property.
            if (
                !Number.isFinite(currentBalance) ||
                !Number.isFinite(totalIncome) ||
                !Number.isFinite(totalExpenses) ||
                !Number.isFinite(netCashFlow) ||
                !Number.isFinite(transactionCount) ||
                transactionCount < 0
            ) {
                throw new Error(
                    "The financial summary contains invalid values. " +
                    "Check that the API returns CurrentBalance."
                );
            }

            // Display current balance.
            const currentBalanceElement =
                document.getElementById("currentBalance");

            currentBalanceElement.textContent =
                formatCurrency(currentBalance);

            currentBalanceElement.classList.remove(
                "text-success",
                "text-danger"
            );

            currentBalanceElement.classList.add(
                currentBalance >= 0
                    ? "text-success"
                    : "text-danger"
            );

            // Display monthly income.
            document.getElementById("totalIncome").textContent =
                formatCurrency(totalIncome);

            // Display monthly expenses.
            document.getElementById("totalExpenses").textContent =
                formatCurrency(totalExpenses);

            // Display monthly net cash flow.
            const netCashFlowElement =
                document.getElementById("netCashFlow");

            netCashFlowElement.textContent =
                formatCurrency(netCashFlow);

            netCashFlowElement.classList.remove(
                "text-success",
                "text-danger"
            );

            netCashFlowElement.classList.add(
                netCashFlow >= 0
                    ? "text-success"
                    : "text-danger"
            );

            // Display monthly transaction count.
            document.getElementById("transactionCount").textContent =
                String(transactionCount);

            financialSummaryMessage.textContent =
                `Summary for ${startDate} to ${endDate}. ` +
                "Current balance includes all recorded transactions.";

        } catch (error) {
            console.error(
                "Financial summary error:",
                error
            );

            resetFinancialSummary(
                `Unable to load financial summary: ${error.message}`
            );
        } finally {
            isLoadingSummary = false;
        }
    }

    // Initialise the dashboard.
    async function loadDashboard() {
        if (!localStorage.getItem("token")) {
            logout();
            return;
        }

        hideMessage();

        document.getElementById("profileName").textContent =
            "Loading...";

        document.getElementById("profileEmail").textContent =
            "Loading...";

        document.getElementById("profileRole").textContent =
            "Loading...";

        try {
            await loadAccount();
        } catch (error) {
            console.error(
                "Account loading error:",
                error
            );

            if (localStorage.getItem("token")) {
                showMessage(
                    `Could not load account details: ${error.message}`
                );
            }
        }

        if (!localStorage.getItem("token")) {
            return;
        }

        try {
            await loadBusiness();
        } catch (error) {
            console.error(
                "Business loading error:",
                error
            );

            if (localStorage.getItem("token")) {
                showMessage(
                    `Could not load your business: ${error.message}`
                );
            }
        }
    }

    // Refresh financial figures when returning to this page.
    window.addEventListener("pageshow", () => {
        if (
            businessId &&
            localStorage.getItem("token")
        ) {
            loadFinancialSummary();
        }
    });

    loadDashboard();
});
