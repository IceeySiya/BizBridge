"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = window.BIZBRIDGE_API_BASE_URL;

    if (!API_BASE_URL) {
        console.error(
            "API base URL is missing. Check that api-config.js loads before dashboard.js."
        );
        return;
    }

    const dashboardMessage = document.getElementById("dashboardMessage");
    const logoutButton = document.getElementById("logoutButton");
    const noBusinessSection = document.getElementById("noBusinessSection");
    const businessSection = document.getElementById("businessSection");
    const financialSummaryMessage =
        document.getElementById("financialSummaryMessage");

    let businessId = null;
    let isLoadingDashboard = false;
    let isLoadingSummary = false;
    let refreshAfterPageShow = false;

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

    function logout() {
        localStorage.removeItem("token");
        window.location.replace("login.html");
    }

    logoutButton?.addEventListener("click", logout);

    function getProperty(object, camelCaseName, pascalCaseName) {
        return object?.[camelCaseName] ?? object?.[pascalCaseName];
    }

    function getErrorMessage(data, status) {
        if (typeof data === "object" && data !== null) {
            return data.message ||
                data.title ||
                data.detail ||
                data.error ||
                `The API request failed (${status}).`;
        }

        return typeof data === "string" && data.trim()
            ? data
            : `The API request failed (${status}).`;
    }

    async function apiRequest(path, method = "GET", body = null) {
        const currentToken = localStorage.getItem("token");

        if (!currentToken) {
            logout();
            throw new Error("Your session has expired. Please log in again.");
        }

        const response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers: {
                Accept: "application/json",
                ...(body === null ? {} : {
                    "Content-Type": "application/json"
                }),
                Authorization: `Bearer ${currentToken}`
            },
            body: body === null ? undefined : JSON.stringify(body)
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
            const error = new Error(
                getErrorMessage(data, response.status)
            );
            error.status = response.status;
            throw error;
        }

        return { response, data };
    }

    function formatCurrency(amount) {
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount)) return "—";

        return new Intl.NumberFormat("en-ZA", {
            style: "currency",
            currency: "ZAR"
        }).format(numericAmount);
    }

    function setText(id, value, fallback = "—") {
        const element = document.getElementById(id);
        if (element) {
            element.textContent =
                value === null || value === undefined || value === ""
                    ? fallback
                    : String(value);
        }
    }

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
                "text-success", "text-danger"
            );
        }

        if (totalIncomeElement) totalIncomeElement.textContent = "—";
        if (totalExpensesElement) totalExpensesElement.textContent = "—";

        if (netCashFlowElement) {
            netCashFlowElement.textContent = "—";
            netCashFlowElement.classList.remove(
                "text-success", "text-danger"
            );
        }

        if (transactionCountElement) {
            transactionCountElement.textContent = "—";
        }

        if (financialSummaryMessage) {
            financialSummaryMessage.textContent = message;
        }
    }

    function showNoBusiness() {
        if (businessSection) businessSection.classList.add("d-none");
        if (noBusinessSection) {
            noBusinessSection.classList.remove("d-none");
        }

        businessId = null;

        resetFinancialSummary(
            "Create a business profile to view your financial summary."
        );

        document.getElementById("readinessSection")?.classList.add("d-none");
        document.getElementById("insightsSection")?.classList.add("d-none");
    }

    function displayBusiness(business) {
        const imageUrl = getProperty(
        business,
        "imageUrl",
        "ImageUrl"
        );

        displayBusinessImage(imageUrl);
        setText(
            "businessName",
            getProperty(business, "businessName", "BusinessName"),
            "Unnamed Business"
        );
        setText(
            "businessIndustry",
            getProperty(business, "industry", "Industry"),
            "Industry not specified"
        );
        setText(
            "businessLocation",
            getProperty(business, "location", "Location"),
            "Location not specified"
        );
        setText(
            "businessDescription",
            getProperty(business, "description", "Description"),
            "No description provided."
        );

        const established = getProperty(
            business, "established", "Established"
        );
        const establishedElement =
            document.getElementById("businessEstablished");

        if (establishedElement) {
            if (established) {
                const date = new Date(established);
                establishedElement.textContent =
                    Number.isNaN(date.getTime())
                        ? "Not specified"
                        : date.toLocaleDateString("en-ZA");
            } else {
                establishedElement.textContent = "Not specified";
            }
        }

        noBusinessSection?.classList.add("d-none");
        businessSection?.classList.remove("d-none");
    }

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

        setText("profileName", fullName, "User");
        setText(
            "profileEmail",
            getProperty(user, "email", "Email"),
            "Not available"
        );
        setText(
            "profileRole",
            getProperty(user, "role", "Role"),
            "User"
        );
    }

    async function loadBusiness() {
        let result;

        try {
            result = await apiRequest("/businesses/mine");
        } catch (error) {
            // Only treat 404 as "no business" if that is the documented
            // response contract of the BusinessesController.
            throw error;
        }

        const { response, data } = result;

        if (response.status === 204 || !data) {
            showNoBusiness();
            return;
        }

        const business = data?.business ?? data?.data ?? data;
        const id = getProperty(business, "businessID", "BusinessID");

        if (id === null || id === undefined || id === "") {
            throw new Error(
                "The business response did not include a business ID."
            );
        }

        businessId = id;
        displayBusiness(business);

        await Promise.all([
            loadFinancialSummary(),
            loadReadiness(),
            loadFinancialInsights()
        ]);
    }

    async function loadFinancialSummary() {
        if (!businessId || isLoadingSummary) return;

        isLoadingSummary = true;

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
                throw new Error(
                    "The API returned no financial summary."
                );
            }

            const currentBalance = Number(
                getProperty(data, "currentBalance", "CurrentBalance")
            );
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
                getProperty(data, "transactionCount", "TransactionCount") ?? 0
            );

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
                    "Check the API response and CurrentBalance property."
                );
            }

            const balanceElement =
                document.getElementById("currentBalance");
            if (balanceElement) {
                balanceElement.textContent = formatCurrency(currentBalance);
                balanceElement.classList.remove(
                    "text-success", "text-danger"
                );
                balanceElement.classList.add(
                    currentBalance >= 0 ? "text-success" : "text-danger"
                );
            }

            setText("totalIncome", formatCurrency(totalIncome));
            setText("totalExpenses", formatCurrency(totalExpenses));

            const netElement = document.getElementById("netCashFlow");
            if (netElement) {
                netElement.textContent = formatCurrency(netCashFlow);
                netElement.classList.remove(
                    "text-success", "text-danger"
                );
                netElement.classList.add(
                    netCashFlow >= 0 ? "text-success" : "text-danger"
                );
            }

            setText("transactionCount", transactionCount);

            if (financialSummaryMessage) {
                financialSummaryMessage.textContent =
                    `Summary for ${startDate} to ${endDate}. ` +
                    "Current balance includes the opening balance and all recorded transactions.";
            }
        } catch (error) {
            console.error("Financial summary error:", error);
            resetFinancialSummary(
                `Unable to load financial summary: ${error.message}`
            );
        } finally {
            isLoadingSummary = false;
        }
    }

    function renderReadiness(data) {
        const checks = getProperty(data, "checks", "Checks");
        const completedCount = Number(
            getProperty(data, "completedCount", "CompletedCount")
        );
        const totalCount = Number(
            getProperty(data, "totalCount", "TotalCount")
        );
        const progressPercent = Number(
            getProperty(data, "progressPercent", "ProgressPercent")
        );

        if (
            !Array.isArray(checks) ||
            !Number.isFinite(completedCount) ||
            !Number.isFinite(totalCount) ||
            !Number.isFinite(progressPercent)
        ) {
            throw new Error("The readiness response is incomplete.");
        }

        const safePercent = Math.max(0, Math.min(100, progressPercent));

        setText("readinessPercent", `${safePercent}%`);
        setText(
            "readinessSummary",
            `${completedCount} of ${totalCount} readiness steps complete.`
        );

        const progress = document.getElementById("readinessProgress");
        if (progress) {
            progress.setAttribute("aria-valuenow", String(safePercent));
        }

        const progressBar = document.getElementById("readinessProgressBar");
        if (progressBar) progressBar.style.width = `${safePercent}%`;

        setText("readinessBasis", getProperty(data, "basis", "Basis"), "");

        const checksElement = document.getElementById("readinessChecks");
        if (checksElement) checksElement.replaceChildren();

        for (const check of checks) {
            const wrapper = document.createElement("div");
            wrapper.className = "form-check readiness-check";

            const checkbox = document.createElement("input");
            const checkId = getProperty(check, "checkId", "CheckID");
            const canEdit = Boolean(
                getProperty(check, "canEdit", "CanEdit")
            );
            const key = getProperty(check, "id", "Id") ?? checkId;

            checkbox.type = "checkbox";
            checkbox.className = "form-check-input";
            checkbox.id = `readiness-${key}`;
            checkbox.checked = Boolean(
                getProperty(check, "isCompleted", "IsCompleted")
            );
            checkbox.disabled = !canEdit || checkId == null;

            const label = document.createElement("label");
            label.className = "form-check-label fw-semibold";
            label.htmlFor = checkbox.id;
            label.textContent =
                getProperty(check, "title", "Title") || "Readiness item";

            const description = document.createElement("p");
            description.className = "text-secondary small mb-0";
            description.textContent = [
                getProperty(check, "description", "Description"),
                canEdit ? "Self-reported" : "Based on BizBridge records"
            ].filter(Boolean).join(" · ");

            checkbox.addEventListener("change", async () => {
                const previousValue = !checkbox.checked;
                checkbox.disabled = true;
                setText(
                    "readinessMessage",
                    "Saving checklist progress...",
                    ""
                );

                try {
                    const { data: updated } = await apiRequest(
                        `/readiness/mine/${checkId}`,
                        "PUT",
                        { isCompleted: checkbox.checked }
                    );

                    renderReadiness(updated);
                    setText(
                        "readinessMessage",
                        "Checklist progress saved.",
                        ""
                    );
                } catch (error) {
                    console.error("Readiness update error:", error);
                    checkbox.checked = previousValue;
                    checkbox.disabled = false;
                    setText(
                        "readinessMessage",
                        `Unable to save checklist progress: ${error.message}`,
                        ""
                    );
                }
            });

            wrapper.append(checkbox, label, description);
            checksElement?.append(wrapper);
        }

        const nextStepsElement =
            document.getElementById("readinessNextSteps");
        if (nextStepsElement) nextStepsElement.replaceChildren();

        const nextSteps = getProperty(
            data, "recommendedNextSteps", "RecommendedNextSteps"
        ) || [];

        if (nextStepsElement && nextSteps.length === 0) {
            const item = document.createElement("li");
            item.textContent =
                "All listed readiness steps are complete. Keep your records up to date.";
            nextStepsElement.append(item);
        } else if (nextStepsElement) {
            for (const step of nextSteps) {
                const item = document.createElement("li");
                item.className = "mb-1";
                item.append(document.createTextNode(
                    getProperty(step, "nextStep", "NextStep") ||
                    getProperty(step, "title", "Title") ||
                    "Review this readiness item."
                ));

                const actionUrl = getProperty(
                    step, "actionUrl", "ActionUrl"
                );

                if (actionUrl) {
                    const link = document.createElement("a");
                    link.href = actionUrl;
                    link.className = "ms-2";
                    link.textContent = "Open";
                    item.append(link);
                }

                nextStepsElement.append(item);
            }
        }

        document.getElementById("readinessSection")?.classList.remove("d-none");
    }

    async function loadReadiness() {
        try {
            const { data } = await apiRequest("/readiness/mine");
            renderReadiness(data);
            setText("readinessMessage", "", "");
        } catch (error) {
            console.error("Readiness loading error:", error);
            setText(
                "readinessMessage",
                `Unable to load readiness checklist: ${error.message}`,
                ""
            );
            document.getElementById("readinessSection")
                ?.classList.remove("d-none");
        }
    }

    function renderFinancialInsights(data) {
        const cashFlow = getProperty(
            data, "cashFlowByMonth", "CashFlowByMonth"
        );
        const spending = getProperty(
            data, "spendingByCategory", "SpendingByCategory"
        );
        const warnings = getProperty(data, "warnings", "Warnings");

        if (
            !Array.isArray(cashFlow) ||
            !Array.isArray(spending) ||
            !Array.isArray(warnings)
        ) {
            throw new Error("The financial insights response is incomplete.");
        }

        const periodStart = getProperty(data, "periodStart", "PeriodStart");
        const periodEnd = getProperty(data, "periodEnd", "PeriodEnd");

        const formatDate = value => {
            if (!value) return "Unknown";
            const date = new Date(value);
            return Number.isNaN(date.getTime())
                ? "Unknown"
                : date.toLocaleDateString("en-ZA");
        };

        setText(
            "insightsPeriod",
            `Recorded activity: ${formatDate(periodStart)} – ${formatDate(periodEnd)}`,
            ""
        );
        setText("insightsBasis", getProperty(data, "basis", "Basis"), "");

        const warningContainer =
            document.getElementById("financialWarnings");
        if (warningContainer) warningContainer.replaceChildren();

        for (const warning of warnings) {
            const alert = document.createElement("div");
            const level = getProperty(warning, "level", "Level");
            alert.className = level === "warning"
                ? "alert alert-warning py-2 mb-2"
                : "alert alert-info py-2 mb-2";
            alert.textContent =
                getProperty(warning, "message", "Message") || "";
            warningContainer?.append(alert);
        }

        const cashValues = cashFlow.map(point => Number(
            getProperty(point, "netCashFlow", "NetCashFlow")
        )).filter(Number.isFinite);

        const maxCashFlow = Math.max(
            1,
            ...cashValues.map(Math.abs)
        );

        const trendContainer = document.getElementById("cashFlowTrend");
        if (trendContainer) trendContainer.replaceChildren();

        for (const point of cashFlow) {
            const monthValue = getProperty(point, "month", "Month");
            const net = Number(
                getProperty(point, "netCashFlow", "NetCashFlow")
            );

            if (!Number.isFinite(net)) continue;

            const row = document.createElement("div");
            row.className = "cash-flow-row";

            const month = document.createElement("span");
            month.className = "small text-secondary";
            const monthDate = new Date(`${monthValue}-01T00:00:00`);
            month.textContent = Number.isNaN(monthDate.getTime())
                ? String(monthValue ?? "Unknown")
                : monthDate.toLocaleDateString("en-ZA", {
                    month: "short",
                    year: "2-digit"
                });

            const track = document.createElement("div");
            track.className = "cash-flow-track";

            const fill = document.createElement("div");
            fill.className = net >= 0
                ? "cash-flow-fill cash-flow-positive"
                : "cash-flow-fill cash-flow-negative";
            fill.style.width =
                `${Math.max(2, Math.abs(net) / maxCashFlow * 100)}%`;
            fill.setAttribute("aria-hidden", "true");
            track.append(fill);

            const value = document.createElement("span");
            value.className = `small fw-semibold ${
                net < 0 ? "text-danger" : "text-success"
            }`;
            value.textContent = formatCurrency(net);
            value.setAttribute(
                "aria-label",
                `${monthValue} net cash flow ${value.textContent}`
            );

            row.append(month, track, value);
            trendContainer?.append(row);
        }

        const spendingContainer =
            document.getElementById("spendingPatterns");
        if (spendingContainer) spendingContainer.replaceChildren();

        if (spendingContainer && spending.length === 0) {
            const empty = document.createElement("p");
            empty.className = "text-secondary small";
            empty.textContent =
                "No expense transactions are recorded for this period.";
            spendingContainer.append(empty);
        } else if (spendingContainer) {
            for (const pattern of spending) {
                const wrapper = document.createElement("div");
                wrapper.className = "spending-pattern mb-3";

                const heading = document.createElement("div");
                heading.className =
                    "d-flex justify-content-between gap-2 small mb-1";

                const category = document.createElement("span");
                category.textContent =
                    getProperty(pattern, "category", "Category") ??
                    getProperty(pattern, "name", "Name") ??
                    "Uncategorised";

                const total = Number(
                    getProperty(pattern, "total", "Total")
                );
                const share = Number(
                    getProperty(pattern, "sharePercent", "SharePercent") ??
                    getProperty(pattern, "percentage", "Percentage")
                );

                const amount = document.createElement("span");
                amount.className = "fw-semibold text-nowrap";
                amount.textContent =
                    `${formatCurrency(total)} · ${
                        Number.isFinite(share) ? share : 0
                    }%`;

                heading.append(category, amount);

                const progress = document.createElement("div");
                progress.className = "progress";
                progress.setAttribute(
                    "aria-label",
                    `${category.textContent} share of recorded expenses`
                );

                const bar = document.createElement("div");
                bar.className = "progress-bar bg-success";
                bar.style.width = `${
                    Number.isFinite(share)
                        ? Math.max(0, Math.min(100, share))
                        : 0
                }%`;
                progress.append(bar);

                wrapper.append(heading, progress);
                spendingContainer.append(wrapper);
            }
        }

        document.getElementById("insightsSection")?.classList.remove("d-none");
        setText("insightsMessage", "", "");
    }

    async function loadFinancialInsights() {
        if (!businessId) return;

        try {
            const { data } = await apiRequest(
                `/businesses/${businessId}/financial-insights`
            );
            renderFinancialInsights(data);
        } catch (error) {
            console.error("Financial insights error:", error);
            setText(
                "insightsMessage",
                `Unable to load financial insights: ${error.message}`,
                ""
            );
            document.getElementById("insightsSection")
                ?.classList.remove("d-none");
        }
    }

    async function loadDashboard() {
        if (isLoadingDashboard) {
            refreshAfterPageShow = true;
            return;
        }

        if (!localStorage.getItem("token")) {
            logout();
            return;
        }

        isLoadingDashboard = true;
        hideMessage();

        setText("profileName", "Loading...");
        setText("profileEmail", "Loading...");
        setText("profileRole", "Loading...");

        try {
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
        } finally {
            isLoadingDashboard = false;

            if (refreshAfterPageShow) {
                refreshAfterPageShow = false;
                refreshDashboardData();
            }
        }
    }

    function refreshDashboardData() {
        if (!businessId || !localStorage.getItem("token")) return;

        loadFinancialSummary();
        loadReadiness();
        loadFinancialInsights();
    }

    // Avoid duplicate requests during the initial page load.
    window.addEventListener("pageshow", event => {
        if (event.persisted) {
            refreshDashboardData();
        }
    });

    function displayBusinessImage(imageUrl) {
    const image = document.getElementById("businessImage");
    const placeholder = document.getElementById(
        "businessImagePlaceholder"
    );

    if (!image || !placeholder) return;

    if (!imageUrl) {
        image.removeAttribute("src");
        image.classList.add("d-none");
        placeholder.classList.remove("d-none");
        return;
    }

    image.onerror = () => {
        image.classList.add("d-none");
        placeholder.classList.remove("d-none");
    };

    image.onload = () => {
        image.classList.remove("d-none");
        placeholder.classList.add("d-none");
    };

    image.src = imageUrl;
}

    loadDashboard();
});
