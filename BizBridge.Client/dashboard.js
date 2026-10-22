"use strict";

const API_BASE_URL = window.BIZBRIDGE_API_BASE_URL;
const ACCESS_TOKEN_KEY = "bizBridgeAccessToken";
const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
const zarFormatter = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR"
});

const form = document.getElementById("businessForm");
const formSection = document.getElementById("businessFormSection");
const summary = document.getElementById("businessSummary");
const dashboardContent = document.getElementById("dashboardContent");
const transactionForm = document.getElementById("transactionForm");
const transactionEntry = document.getElementById("transactionEntry");
const messageBox = document.getElementById("dashboardMessage");
const saveBusinessButton = document.getElementById("saveBusinessButton");
const saveTransactionButton = document.getElementById("saveTransactionButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const formTitle = document.getElementById("profileFormTitle");

let currentBusiness = null;
let isEditingBusiness = false;

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

function errorMessage(result, status, statusText, path, method) {
    const validationErrors = Object.values(result.errors || {})
        .flat()
        .filter((message) => typeof message === "string");

    return validationErrors.length
        ? validationErrors.join(" ")
        : result.message ||
            result.title ||
            `The API returned HTTP ${status}${statusText ? ` ${statusText}` : ""} for ${method} ${path}.`;
}

async function requestJson(path, options = {}) {
    const method = options.method || "GET";
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new ApiError(
            errorMessage(result, response.status, response.statusText, path, method),
            response.status
        );
    }

    return result;
}

function showMessage(message, type) {
    messageBox.textContent = message;
    messageBox.className = type
        ? `alert alert-${type}`
        : "alert d-none";
}

function handleUnauthorized(error) {
    if (error instanceof ApiError && error.status === 401) {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        window.location.href = "login.html";
        return true;
    }

    return false;
}

function addTextElement(parent, tagName, text, className = "") {
    const element = document.createElement(tagName);
    element.textContent = text;
    if (className) {
        element.className = className;
    }
    parent.append(element);
    return element;
}

function showBusinessForm(editing = false) {
    isEditingBusiness = editing;
    formSection.classList.remove("d-none");
    summary.classList.toggle("d-none", editing && !currentBusiness);
    if (editing) {
        summary.classList.add("d-none");
    }
    if (!currentBusiness) {
        dashboardContent.classList.add("d-none");
    }

    formTitle.textContent = editing
        ? "Update your BizBridge profile"
        : "Create your BizBridge profile";
    saveBusinessButton.textContent = editing
        ? "Update business profile"
        : "Save business profile";
    cancelEditButton.classList.toggle("d-none", !editing);

    if (editing && currentBusiness) {
        form.elements.businessName.value = currentBusiness.businessName || "";
        form.elements.industry.value = currentBusiness.industry || "";
        form.elements.location.value = currentBusiness.location || "";
        form.elements.description.value = currentBusiness.description || "";
        form.elements.established.value = currentBusiness.established
            ? currentBusiness.established.slice(0, 10)
            : "";
    } else {
        form.reset();
    }
}

function renderBusiness(business) {
    currentBusiness = business;
    document.getElementById("businessName").textContent =
        business.businessName || "Business profile";
    document.getElementById("businessMeta").textContent = business.location
        ? `${business.location} · ${business.industry || "Business"}`
        : business.industry || "Business";
    document.getElementById("businessIndustry").textContent =
        business.industry || "Not provided";
    document.getElementById("businessLocation").textContent =
        business.location || "Not provided";
    document.getElementById("businessEstablished").textContent =
        business.established
            ? new Date(business.established).toLocaleDateString("en-ZA", {
                timeZone: "UTC"
            })
            : "Not provided";
    document.getElementById("businessDescription").textContent =
        business.description || "No business description provided.";
    document.getElementById("welcomeBusiness").textContent =
        `${business.businessName} · ${business.industry}`;
    summary.classList.remove("d-none");
    formSection.classList.add("d-none");
    dashboardContent.classList.remove("d-none");
    cancelEditButton.classList.add("d-none");
    isEditingBusiness = false;
}

function createBusinessPayload() {
    const data = new FormData(form);
    const businessName = data.get("businessName").toString().trim();
    const industry = data.get("industry").toString().trim();
    const description = data.get("description").toString().trim();

    if (businessName.length < 2 || businessName.length > 150) {
        throw new Error("Business name must contain 2 to 150 characters.");
    }
    if (industry.length < 2 || industry.length > 100) {
        throw new Error("Industry must contain 2 to 100 characters.");
    }
    if (description.length > 1000) {
        throw new Error("Business description must not exceed 1000 characters.");
    }

    const establishedDate = data.get("established").toString();
    return {
        businessName,
        industry,
        location: data.get("location").toString().trim() || null,
        description: description || null,
        established: establishedDate
            ? new Date(`${establishedDate}T00:00:00.000Z`).toISOString()
            : null
    };
}

async function saveBusiness(event) {
    event.preventDefault();
    showMessage("", "");
    saveBusinessButton.disabled = true;
    saveBusinessButton.textContent = isEditingBusiness
        ? "Updating..."
        : "Saving...";

    try {
        const wasEditing = isEditingBusiness;
        const business = await requestJson(
            wasEditing ? "/businesses/mine" : "/businesses",
            {
                method: wasEditing ? "PUT" : "POST",
                body: JSON.stringify(createBusinessPayload())
            }
        );
        renderBusiness(business);
        showMessage(
            wasEditing
                ? "Business profile updated successfully."
                : "Business profile created successfully.",
            "success"
        );
        if (!wasEditing) {
            await loadDashboardData();
        }
    } catch (error) {
        if (!handleUnauthorized(error)) {
            showMessage(error.message, "danger");
        }
    } finally {
        saveBusinessButton.disabled = false;
        saveBusinessButton.textContent = isEditingBusiness
            ? "Update business profile"
            : "Save business profile";
    }
}

function renderFinancialSummary(summaryData) {
    document.getElementById("monthlyIncome").textContent =
        zarFormatter.format(summaryData.income);
    document.getElementById("monthlyExpenses").textContent =
        zarFormatter.format(summaryData.expenses);
    document.getElementById("netCashFlow").textContent =
        zarFormatter.format(summaryData.netCashFlow);
}

function renderTransactions(transactions) {
    const list = document.getElementById("transactionsList");
    const empty = document.getElementById("transactionsEmpty");
    const table = document.getElementById("transactionsTable");
    list.replaceChildren();
    empty.classList.toggle("d-none", transactions.length > 0);
    table.classList.toggle("d-none", transactions.length === 0);

    for (const transaction of transactions) {
        const row = document.createElement("tr");
        addTextElement(row, "td", new Date(transaction.transactionDate)
            .toLocaleDateString("en-ZA", { timeZone: "UTC" }));
        addTextElement(
            row,
            "td",
            transaction.description || transaction.category
        );
        const typeCell = addTextElement(
            row,
            "td",
            transaction.transactionType,
            transaction.transactionType === "Income"
                ? "text-success"
                : "text-secondary"
        );
        typeCell.setAttribute(
            "aria-label",
            `${transaction.transactionType} transaction`
        );
        addTextElement(
            row,
            "td",
            zarFormatter.format(transaction.amount),
            `text-end fw-semibold ${transaction.transactionType === "Income" ? "text-success" : ""}`
        );
        list.append(row);
    }
}

function renderReadiness(readiness) {
    document.getElementById("readinessPercent").textContent =
        `${readiness.progressPercent}%`;
    document.getElementById("readinessSummary").textContent =
        `${readiness.completedCount} of ${readiness.totalCount} steps complete`;
    document.getElementById("readinessBasis").textContent = readiness.basis;

    const progress = document.getElementById("readinessProgress");
    progress.style.width = `${readiness.progressPercent}%`;
    progress.parentElement.setAttribute(
        "aria-valuenow",
        String(readiness.progressPercent)
    );

    const list = document.getElementById("readinessChecks");
    list.replaceChildren();
    for (const check of readiness.checks) {
        const item = document.createElement("li");
        item.className = "d-flex gap-2 align-items-start py-2";
        const icon = addTextElement(
            item,
            "span",
            check.isCompleted ? "✓" : "○",
            check.isCompleted ? "text-success fw-bold" : "text-secondary"
        );
        icon.setAttribute("aria-hidden", "true");
        const content = document.createElement("div");
        addTextElement(
            content,
            "p",
            check.title,
            "fw-semibold mb-1"
        );
        addTextElement(content, "p", check.description, "small text-secondary mb-0");
        item.append(content);
        list.append(item);
    }
}

function renderAlerts(alerts) {
    const list = document.getElementById("alertsList");
    const empty = document.getElementById("alertsEmpty");
    list.replaceChildren();
    empty.classList.toggle("d-none", alerts.length > 0);

    for (const alert of alerts) {
        const item = document.createElement("li");
        item.className = "summary-box mb-2";
        addTextElement(item, "p", alert.alertType, "fw-semibold text-warning-emphasis mb-1");
        addTextElement(item, "p", alert.message, "small text-secondary mb-1");
        addTextElement(
            item,
            "p",
            `${alert.status} · ${zarFormatter.format(alert.transactionAmount)}`,
            "small mb-0"
        );
        list.append(item);
    }
}

function renderOpportunities(opportunities) {
    const list = document.getElementById("opportunitiesList");
    const empty = document.getElementById("opportunitiesEmpty");
    list.replaceChildren();
    empty.classList.toggle("d-none", opportunities.length > 0);

    for (const opportunity of opportunities) {
        const card = document.createElement("article");
        card.className = "summary-box";
        addTextElement(card, "h3", opportunity.title, "h5 fw-bold mb-1");
        addTextElement(
            card,
            "p",
            opportunity.organisation,
            "small text-success fw-semibold mb-2"
        );
        addTextElement(
            card,
            "p",
            opportunity.description,
            "text-secondary mb-2"
        );
        if (opportunity.requirements) {
            addTextElement(
                card,
                "p",
                `Requirements: ${opportunity.requirements}`,
                "small mb-2"
            );
        }
        addTextElement(
            card,
            "p",
            `Deadline: ${new Date(opportunity.deadline).toLocaleDateString("en-ZA", { timeZone: "UTC" })}`,
            "small text-secondary mb-0"
        );

        if (opportunity.sourceUrl) {
            try {
                const source = new URL(opportunity.sourceUrl);
                if (source.protocol === "https:" || source.protocol === "http:") {
                    const link = addTextElement(
                        card,
                        "a",
                        "View opportunity",
                        "btn btn-sm btn-outline-success mt-3 align-self-start"
                    );
                    link.href = source.href;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                }
            } catch {
                // An invalid optional source URL should not break the dashboard.
            }
        }
        list.append(card);
    }
}

function showSectionError(elementId, message) {
    const element = document.getElementById(elementId);
    element.replaceChildren();
    element.classList.remove("d-none");
    addTextElement(element, "p", message, "text-danger mb-0");
}

async function loadDashboardData() {
    const requests = await Promise.allSettled([
        requestJson("/transactions/summary"),
        requestJson("/transactions?limit=10"),
        requestJson("/readiness/mine"),
        requestJson("/payment-alerts/mine?limit=10"),
        requestJson("/opportunities")
    ]);

    const renderers = [
        (value) => renderFinancialSummary(value),
        (value) => renderTransactions(value),
        (value) => renderReadiness(value),
        (value) => renderAlerts(value),
        (value) => renderOpportunities(value)
    ];
    const errorTargets = [
        ["monthlyIncome", "Unable to load financial summary."],
        ["transactionsEmpty", "Unable to load transactions."],
        ["readinessChecks", "Unable to load readiness progress."],
        ["alertsEmpty", "Unable to load payment alerts."],
        ["opportunitiesEmpty", "Unable to load opportunities."]
    ];
    let failures = 0;

    requests.forEach((request, index) => {
        if (request.status === "fulfilled") {
            renderers[index](request.value);
        } else if (handleUnauthorized(request.reason)) {
            failures += 1;
        } else {
            failures += 1;
            const [elementId, message] = errorTargets[index];
            const detail = request.reason instanceof Error
                ? request.reason.message
                : "An unexpected error occurred.";
            showSectionError(elementId, `${message} ${detail}`);
            console.error(message, request.reason);
        }
    });

    if (failures > 0 && token) {
        showMessage("Some dashboard information could not be loaded. Refresh the page to try again.", "warning");
    }
}

function transactionPayload() {
    const data = new FormData(transactionForm);
    const amount = Number(data.get("amount"));
    if (!Number.isFinite(amount) || amount < 0.01 || amount > 9999999999.99) {
        throw new Error("Enter an amount between R0.01 and R9,999,999,999.99.");
    }

    const transactionDate = data.get("transactionDate").toString();
    return {
        transactionType: data.get("transactionType").toString(),
        category: data.get("category").toString().trim(),
        amount,
        description: data.get("description").toString().trim() || null,
        paymentReference: data.get("paymentReference").toString().trim() || null,
        transactionDate: transactionDate
            ? new Date(`${transactionDate}T00:00:00.000Z`).toISOString()
            : null
    };
}

async function saveTransaction(event) {
    event.preventDefault();
    showMessage("", "");
    saveTransactionButton.disabled = true;
    saveTransactionButton.textContent = "Saving...";

    try {
        const result = await requestJson("/transactions", {
            method: "POST",
            body: JSON.stringify(transactionPayload())
        });
        transactionForm.reset();
        document.getElementById("transactionDate").value =
            new Date().toLocaleDateString("en-CA");
        transactionEntry.classList.add("d-none");
        await loadDashboardData();
        showMessage(
            result.paymentReviewRequired
                ? "Transaction recorded. A duplicate payment reference needs review; this is not a fraud determination."
                : "Transaction recorded successfully.",
            result.paymentReviewRequired ? "warning" : "success"
        );
    } catch (error) {
        if (!handleUnauthorized(error)) {
            showMessage(error.message, "danger");
        }
    } finally {
        saveTransactionButton.disabled = false;
        saveTransactionButton.textContent = "Save transaction";
    }
}

function openTransactionForm() {
    transactionEntry.classList.remove("d-none");
    document.getElementById("transactionCategory").focus();
    transactionEntry.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadDashboard() {
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const [identity, business] = await Promise.all([
            requestJson("/auth/me"),
            requestJson("/businesses/mine")
        ]);
        document.getElementById("ownerName").textContent =
            identity.fullName || "there";
        renderBusiness(business);
        await loadDashboardData();
    } catch (error) {
        if (handleUnauthorized(error)) {
            return;
        }
        if (error instanceof ApiError && error.status === 404) {
            try {
                const identity = await requestJson("/auth/me");
                document.getElementById("ownerName").textContent =
                    identity.fullName || "there";
                document.getElementById("welcomeBusiness").textContent =
                    "Set up your business profile to get started.";
                showBusinessForm();
            } catch (identityError) {
                if (!handleUnauthorized(identityError)) {
                    showMessage(identityError.message, "danger");
                }
            }
            return;
        }
        showMessage(error.message, "danger");
    }
}

function handleLogout() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    form.addEventListener("submit", saveBusiness);
    transactionForm.addEventListener("submit", saveTransaction);
    document.getElementById("editBusinessButton")
        .addEventListener("click", () => showBusinessForm(true));
    cancelEditButton.addEventListener("click", () => {
        if (currentBusiness) {
            formSection.classList.add("d-none");
            summary.classList.remove("d-none");
            isEditingBusiness = false;
        } else {
            showBusinessForm();
        }
    });
    document.getElementById("recordTransactionButton")
        .addEventListener("click", openTransactionForm);
    document.getElementById("recordTransactionSecondary")
        .addEventListener("click", openTransactionForm);
    document.getElementById("closeTransactionForm")
        .addEventListener("click", () => transactionEntry.classList.add("d-none"));
    document.getElementById("logoutButton")
        .addEventListener("click", handleLogout);

    document.getElementById("transactionDate").value =
        new Date().toLocaleDateString("en-CA");
    loadDashboard();
});
