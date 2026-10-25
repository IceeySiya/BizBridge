"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = window.BIZBRIDGE_API_BASE_URL;

    // Page elements
    const pageMessage = document.getElementById("pageMessage");
    const categoryForm = document.getElementById("categoryForm");
    const transactionForm = document.getElementById("transactionForm");

    const categoryNameInput = document.getElementById("categoryName");
    const categoryTypeSelect = document.getElementById("categoryType");
    const categorySelect = document.getElementById("transactionCategory");

    const createCategoryButton =
        document.getElementById("createCategoryButton");
    const saveTransactionButton =
        document.getElementById("saveTransactionButton");
    const refreshTransactionsButton =
        document.getElementById("refreshTransactionsButton");
    const logoutButton = document.getElementById("logoutButton");

    const transactionAmountInput =
        document.getElementById("transactionAmount");
    const transactionDateInput =
        document.getElementById("transactionDate");
    const transactionDescriptionInput =
        document.getElementById("transactionDescription");
    const paymentReferenceInput =
        document.getElementById("paymentReference");

    const transactionFilter =
        document.getElementById("transactionFilter");
    const transactionCount =
        document.getElementById("transactionCount");
    const transactionsTableBody =
        document.getElementById("transactionsTableBody");

    // Current page data
    let businessId = null;
    let categories = [];
    let transactions = [];
    const deletingTransactionIds = new Set();

    function showMessage(message, type = "info") {
        pageMessage.textContent = message;
        pageMessage.className = `alert alert-${type}`;
        pageMessage.classList.remove("d-none");
    }

    function clearMessage() {
        pageMessage.textContent = "";
        pageMessage.className = "alert d-none";
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.replace("login.html");
    }

    // Authenticated API helper.
    async function apiRequest(path, options = {}) {
        const token = localStorage.getItem("token");

        if (!token) {
            logout();
            throw new Error(
                "Your session has expired. Please log in again."
            );
        }

        if (!API_BASE_URL) {
            throw new Error(
                "The API URL is not configured in api-config.js."
            );
        }

        let response;

        try {
            response = await fetch(`${API_BASE_URL}${path}`, {
                ...options,
                headers: {
                    Accept: "application/json",
                    ...(options.body
                        ? { "Content-Type": "application/json" }
                        : {}),
                    ...options.headers,
                    Authorization: `Bearer ${token}`
                }
            });
        } catch {
            throw new Error(
                "Cannot connect to the BizBridge API. Check the backend and API URL."
            );
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

        if (response.status === 401 || response.status === 403) {
            logout();
            throw new Error(
                "Your session is invalid or has expired. Please log in again."
            );
        }

        if (!response.ok) {
            let errorMessage = "The request failed.";

            if (data && typeof data === "object") {
                if (data.errors && typeof data.errors === "object") {
                    errorMessage = Object.values(data.errors)
                        .flat()
                        .join(" ");
                } else if (data.message) {
                    errorMessage = data.message;
                } else if (data.title) {
                    errorMessage = data.title;
                } else if (data.detail) {
                    errorMessage = data.detail;
                }
            } else if (typeof data === "string" && data.trim()) {
                errorMessage = data;
            }

            const error = new Error(errorMessage);
            error.status = response.status;
            throw error;
        }

        return { response, data };
    }

    function getTodayLocalDate() {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    // Accept camelCase or PascalCase API properties.
    function getProperty(object, camelCaseName, pascalCaseName) {
        return object?.[camelCaseName] ?? object?.[pascalCaseName];
    }

    // Resolve a transaction ID from common API property names.
    function getTransactionId(transaction) {
        return getProperty(transaction, "transactionID", "TransactionID")
            ?? getProperty(transaction, "id", "Id");
    }

    async function loadBusiness() {
        const { response, data } =
            await apiRequest("/businesses/mine");

        const business = data?.business ?? data?.data ?? data;
        const id = getProperty(business, "businessID", "BusinessID");

        if (response.status === 204 || id === null ||
            id === undefined || id === "") {
            throw new Error(
                "You need to create your business profile before recording transactions."
            );
        }

        businessId = id;
    }

    async function loadCategories() {
        const { data } = await apiRequest(
            `/businesses/${businessId}/categories`
        );

        categories = Array.isArray(data) ? data : [];

        categorySelect.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = categories.length > 0
            ? "Select a category"
            : "No categories yet — create one above";

        categorySelect.appendChild(placeholder);

        categories.forEach(category => {
            const categoryId = getProperty(
                category, "categoryID", "CategoryID"
            );
            const name = getProperty(category, "name", "Name");
            const type = getProperty(
                category, "transactionType", "TransactionType"
            );

            const option = document.createElement("option");
            option.value = categoryId;
            option.textContent = `${name} (${type})`;

            categorySelect.appendChild(option);
        });

        saveTransactionButton.disabled = categories.length === 0;
    }

    function createEmptyRow(message) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.className = "transactions-empty-state";
        cell.textContent = message;

        row.appendChild(cell);
        return row;
    }

    function renderTransactions() {
        const selectedFilter = transactionFilter.value;

        const filteredTransactions = transactions.filter(transaction => {
            const type = getProperty(
                transaction, "transactionType", "TransactionType"
            );

            return selectedFilter === "All" ||
                type === selectedFilter;
        });

        transactionsTableBody.replaceChildren();

        transactionCount.textContent =
            `${filteredTransactions.length} transaction(s) displayed`;

        if (filteredTransactions.length === 0) {
            transactionsTableBody.appendChild(
                createEmptyRow(
                    transactions.length === 0
                        ? "No transactions recorded yet. Add your first transaction using the form."
                        : "No transactions match this filter."
                )
            );
            return;
        }

        filteredTransactions.forEach(transaction => {
            const row = document.createElement("tr");

            const transactionId = getTransactionId(transaction);
            const transactionDate = getProperty(
                transaction, "transactionDate", "TransactionDate"
            );
            const categoryName = getProperty(
                transaction, "categoryName", "CategoryName"
            ) ?? "Uncategorised";
            const description = getProperty(
                transaction, "description", "Description"
            ) ?? "—";
            const type = getProperty(
                transaction, "transactionType", "TransactionType"
            );
            const amount = Number(
                getProperty(transaction, "amount", "Amount")
            );

            const dateCell = document.createElement("td");
            const categoryCell = document.createElement("td");
            const descriptionCell = document.createElement("td");
            const typeCell = document.createElement("td");
            const amountCell = document.createElement("td");
            const actionsCell = document.createElement("td");

            if (transactionDate) {
                const date = new Date(transactionDate);

                dateCell.textContent = Number.isNaN(date.getTime())
                    ? "—"
                    : date.toLocaleDateString("en-ZA");
            } else {
                dateCell.textContent = "—";
            }

            categoryCell.textContent = categoryName;
            descriptionCell.textContent = description;

            const typeBadge = document.createElement("span");
            typeBadge.className = type === "Income"
                ? "transaction-type-badge transaction-type-income"
                : "transaction-type-badge transaction-type-expense";
            typeBadge.textContent = type ?? "Unknown";
            typeCell.appendChild(typeBadge);

            amountCell.className = "text-end";

            const formattedAmount = Number.isFinite(amount)
                ? amount.toLocaleString("en-ZA", {
                    style: "currency",
                    currency: "ZAR"
                })
                : "—";

            amountCell.textContent = type === "Income"
                ? `+${formattedAmount}`
                : `-${formattedAmount}`;

            amountCell.classList.add(
                type === "Income"
                    ? "transaction-amount-income"
                    : "transaction-amount-expense"
            );

            actionsCell.className = "text-end";

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "btn btn-outline-danger btn-sm";
            deleteButton.textContent = "Delete";

            // Without a known ID, do not send an unsafe delete request.
            if (transactionId === null ||
                transactionId === undefined ||
                transactionId === "") {
                deleteButton.disabled = true;
                deleteButton.title =
                    "This transaction does not include an ID.";
            } else {
                deleteButton.disabled =
                    deletingTransactionIds.has(String(transactionId));

                deleteButton.addEventListener("click", () => {
                    deleteTransaction(transaction, deleteButton);
                });
            }

            actionsCell.appendChild(deleteButton);

            row.append(
                dateCell,
                categoryCell,
                descriptionCell,
                typeCell,
                amountCell,
                actionsCell
            );

            transactionsTableBody.appendChild(row);
        });
    }

    async function loadTransactions() {
        transactionsTableBody.replaceChildren();
        transactionsTableBody.appendChild(
            createEmptyRow("Loading transactions...")
        );

        try {
            const { data } = await apiRequest(
                `/businesses/${businessId}/transactions`
            );

            transactions = Array.isArray(data) ? data : [];
            renderTransactions();
        } catch (error) {
            transactionCount.textContent =
                "Could not load transactions.";

            transactionsTableBody.replaceChildren();
            transactionsTableBody.appendChild(
                createEmptyRow(error.message)
            );

            throw error;
        }
    }

    // Delete only after confirmation and a successful API response.
    async function deleteTransaction(transaction, button) {
        const transactionId = getTransactionId(transaction);

        if (transactionId === null ||
            transactionId === undefined ||
            transactionId === "") {
            showMessage(
                "Cannot delete this transaction because its ID is missing.",
                "danger"
            );
            return;
        }

        const categoryName = getProperty(
            transaction, "categoryName", "CategoryName"
        ) ?? "this category";

        const amount = Number(
            getProperty(transaction, "amount", "Amount")
        );

        const type = getProperty(
            transaction, "transactionType", "TransactionType"
        ) ?? "transaction";

        const formattedAmount = Number.isFinite(amount)
            ? amount.toLocaleString("en-ZA", {
                style: "currency",
                currency: "ZAR"
            })
            : "this amount";

        const confirmed = window.confirm(
            `Are you sure you want to permanently delete this ${type.toLowerCase()} transaction?\n\n` +
            `Category: ${categoryName}\n` +
            `Amount: ${formattedAmount}\n\n` +
            "This action cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        const idKey = String(transactionId);

        if (deletingTransactionIds.has(idKey)) {
            return;
        }

        deletingTransactionIds.add(idKey);
        button.disabled = true;
        button.textContent = "Deleting...";
        clearMessage();

        try {
            // This route must match the DELETE endpoint implemented
            // by the BizBridge backend.
            await apiRequest(
                `/businesses/${businessId}/transactions/${encodeURIComponent(transactionId)}`,
                { method: "DELETE" }
            );

            // Refresh from the API only after deletion succeeds.
            await loadTransactions();

            showMessage(
                "Transaction deleted successfully.",
                "success"
            );

            // Notify other open pages if they listen for this event.
            window.dispatchEvent(
                new CustomEvent("bizbridge:transactions-changed", {
                    detail: { businessId }
                })
            );
        } catch (error) {
            showMessage(
                `Could not delete transaction: ${error.message}`,
                "danger"
            );
        } finally {
            deletingTransactionIds.delete(idKey);
            renderTransactions();
        }
    }

    categoryForm.addEventListener("submit", async event => {
        event.preventDefault();
        clearMessage();

        const name = categoryNameInput.value.trim();
        const transactionType = categoryTypeSelect.value;

        if (name.length < 2 || name.length > 80) {
            showMessage(
                "The category name must contain between 2 and 80 characters.",
                "warning"
            );
            return;
        }

        createCategoryButton.disabled = true;
        createCategoryButton.textContent = "Saving...";

        try {
            const { data } = await apiRequest(
                `/businesses/${businessId}/categories`,
                {
                    method: "POST",
                    body: JSON.stringify({ name, transactionType })
                }
            );

            await loadCategories();
            categoryForm.reset();

            const savedCategory =
                data?.category ?? data?.Category ?? data;

            const savedName = getProperty(
                savedCategory, "name", "Name"
            );

            showMessage(
                savedName
                    ? `Category "${savedName}" is ready to use.`
                    : "Category created or already exists and is ready to use.",
                "success"
            );
        } catch (error) {
            showMessage(
                `Could not save category: ${error.message}`,
                "danger"
            );
        } finally {
            createCategoryButton.disabled = false;
            createCategoryButton.textContent = "Create Category";
        }
    });

    transactionForm.addEventListener("submit", async event => {
        event.preventDefault();
        clearMessage();

        if (!businessId) {
            showMessage(
                "Your business profile has not loaded yet.",
                "warning"
            );
            return;
        }

        const categoryID = Number(categorySelect.value);
        const amount = Number(transactionAmountInput.value);
        const dateValue = transactionDateInput.value;

        if (!categoryID || !Number.isInteger(categoryID)) {
            showMessage("Please select a valid category.", "warning");
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            showMessage(
                "Enter an amount greater than R0.00.",
                "warning"
            );
            return;
        }

        if (!dateValue) {
            showMessage("Please select a transaction date.", "warning");
            return;
        }

        const payload = {
            categoryID,
            amount,
            description:
                transactionDescriptionInput.value.trim() || null,
            paymentReference:
                paymentReferenceInput.value.trim() || null,
            transactionDate: `${dateValue}T12:00:00Z`
        };

        saveTransactionButton.disabled = true;
        saveTransactionButton.textContent = "Saving...";

        try {
            await apiRequest(
                `/businesses/${businessId}/transactions`,
                {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            );

            transactionForm.reset();
            transactionDateInput.value = getTodayLocalDate();

            await loadTransactions();

            showMessage(
                "Transaction saved successfully.",
                "success"
            );

            window.dispatchEvent(
                new CustomEvent("bizbridge:transactions-changed", {
                    detail: { businessId }
                })
            );
        } catch (error) {
            showMessage(
                `Could not save transaction: ${error.message}`,
                "danger"
            );
        } finally {
            saveTransactionButton.disabled = categories.length === 0;
            saveTransactionButton.textContent = "Save Transaction";
        }
    });

    transactionFilter.addEventListener("change", renderTransactions);

    refreshTransactionsButton.addEventListener("click", async () => {
        clearMessage();
        refreshTransactionsButton.disabled = true;
        refreshTransactionsButton.textContent = "Refreshing...";

        try {
            await loadCategories();
            await loadTransactions();

            showMessage("Transaction data refreshed.", "success");
        } catch (error) {
            showMessage(
                `Could not refresh transaction data: ${error.message}`,
                "danger"
            );
        } finally {
            refreshTransactionsButton.disabled = false;
            refreshTransactionsButton.textContent = "Refresh";
        }
    });

    logoutButton.addEventListener("click", logout);

    async function initialisePage() {
        if (!localStorage.getItem("token")) {
            logout();
            return;
        }

        transactionDateInput.value = getTodayLocalDate();

        try {
            await loadBusiness();
            await loadCategories();
            await loadTransactions();
        } catch (error) {
            showMessage(error.message, "danger");
        }
    }

    initialisePage();
});
