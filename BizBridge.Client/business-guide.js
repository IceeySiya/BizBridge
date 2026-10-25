
const API_BASE_URL = "https://bizbridge-api.onrender.com/api";

const loadingElement = document.getElementById("guideLoading");
const errorElement = document.getElementById("guideError");
const contentElement = document.getElementById("guideContent");

async function loadBusinessGuide() {
    try {
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "login.html";
            return;
        }

        const headers = {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
        };

        const businessResponse = await fetch(
            `${API_BASE_URL}/businesses/mine`,
            { headers }
        );

        if (businessResponse.status === 401 ||
            businessResponse.status === 403) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!businessResponse.ok) {
            throw new Error(
                businessResponse.status === 404
                    ? "Create a business profile before opening your guide."
                    : "Unable to load your business profile."
            );
        }

        const businessResult = await businessResponse.json();
        const business =
            businessResult?.business ??
            businessResult?.data ??
            businessResult;

        const businessId = business.businessID ?? business.BusinessID;

        if (businessId === undefined || businessId === null) {
            throw new Error("Your business ID could not be found.");
        }

        const readinessResponse = await fetch(
            `${API_BASE_URL}/readiness/mine`,
            { headers }
        );

        if (readinessResponse.status === 401 ||
            readinessResponse.status === 403) {
            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!readinessResponse.ok) {
            throw new Error("Unable to load your readiness information.");
        }

        const readiness = await readinessResponse.json();

        renderReadiness(readiness);

        loadingElement.classList.add("d-none");
        contentElement.classList.remove("d-none");

        // Financial endpoint integration comes next.
        await loadFinancialGuide(businessId, headers);

    } catch (error) {
        loadingElement.classList.add("d-none");
        errorElement.textContent =
            error.message || "Something went wrong while loading your guide.";
        errorElement.classList.remove("d-none");
    }
}

function renderReadiness(readiness) {
    const completedCount = readiness.completedCount ?? 0;
    const totalCount = readiness.totalCount ?? 0;
    const percent = readiness.progressPercent ?? 0;

    document.getElementById("readinessCount").textContent =
        `${completedCount} of ${totalCount} completed`;

    document.getElementById("readinessPercent").textContent =
        `${percent}%`;

    const progressBar = document.getElementById("readinessProgress");

    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute("aria-valuenow", percent);
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", "100");

    document.getElementById("readinessBasis").textContent =
        readiness.basis ?? "";

    const recommendationsElement =
        document.getElementById("recommendations");

    recommendationsElement.replaceChildren();

    const recommendations = readiness.recommendedNextSteps ?? [];

    if (recommendations.length === 0) {
        const message = document.createElement("p");
        message.className = "text-success mb-0";
        message.textContent =
            "All current readiness checklist items are complete. " +
            "Keep your business information and records up to date.";

        recommendationsElement.appendChild(message);
        return;
    }

    recommendations.forEach(item => {
        const card = document.createElement("div");
        card.className = "border rounded p-3 mb-3";

        const title = document.createElement("h3");
        title.className = "h6 fw-bold";
        title.textContent = item.title;

        const description = document.createElement("p");
        description.className = "text-secondary mb-2";
        description.textContent =
            item.nextStep || "Review this requirement and complete it.";

        card.append(title, description);

        if (item.actionUrl) {
            const link = document.createElement("a");
            link.className = "btn btn-sm btn-outline-primary";
            link.href = item.actionUrl;
            link.textContent = "Take Next Step";

            card.appendChild(link);
        }

        recommendationsElement.appendChild(card);
    });
}


async function loadFinancialGuide(businessId, headers) {
    const statusElement =
        document.getElementById("financialGuideStatus");

    statusElement.textContent = "Loading financial information...";

    const [summaryResponse, insightsResponse] = await Promise.all([
        fetch(
            `${API_BASE_URL}/businesses/${businessId}/financial-summary`,
            { headers }
        ),
        fetch(
            `${API_BASE_URL}/businesses/${businessId}/financial-insights`,
            { headers }
        )
    ]);

    if (
        summaryResponse.status === 401 ||
        summaryResponse.status === 403 ||
        insightsResponse.status === 401 ||
        insightsResponse.status === 403
    ) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
    }

    if (!summaryResponse.ok || !insightsResponse.ok) {
        throw new Error(
            "Your business was loaded, but financial information could not be retrieved."
        );
    }

    const summary = await summaryResponse.json();
    const insights = await insightsResponse.json();

    renderFinancialSummary(summary);
    renderFinancialInsights(insights);
}

function formatRand(value) {
    return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR"
    }).format(Number(value ?? 0));
}

function renderFinancialSummary(summary) {
    const container =
        document.getElementById("financialGuideStatus");

    container.replaceChildren();

    const metrics = [
        { label: "Current balance", value: summary.currentBalance },
        { label: "Income this period", value: summary.totalIncome },
        { label: "Expenses this period", value: summary.totalExpenses },
        { label: "Net cash flow", value: summary.netCashFlow }
    ];

    const grid = document.createElement("div");
    grid.className = "row g-3";

    metrics.forEach(metric => {
        const column = document.createElement("div");
        column.className = "col-6";

        const card = document.createElement("div");
        card.className = "bg-light rounded p-3 h-100";

        const label = document.createElement("div");
        label.className = "small text-secondary mb-1";
        label.textContent = metric.label;

        const value = document.createElement("div");
        value.className = "fw-bold";
        value.textContent = formatRand(metric.value);

        card.append(label, value);
        column.appendChild(card);
        grid.appendChild(column);
    });

    const period = document.createElement("p");
    period.className = "small text-secondary mt-3 mb-0";
    period.textContent =
        `Reporting period: ${summary.periodStart} to ${summary.periodEnd}. ` +
        `Transactions recorded: ${summary.transactionCount ?? 0}.`;

    container.append(grid, period);
}

function renderFinancialInsights(insights) {
    const container = document.getElementById("guideContent");

    const section = document.createElement("section");
    section.className = "card border-0 shadow-sm mb-4";

    const body = document.createElement("div");
    body.className = "card-body p-4";

    const heading = document.createElement("h2");
    heading.className = "h5 fw-bold";
    heading.textContent = "Your financial patterns";

    const explanation = document.createElement("p");
    explanation.className = "small text-secondary";
    explanation.textContent = insights.basis ?? "";

    body.append(heading, explanation);

    const warnings = insights.warnings ?? [];

    const warningHeading = document.createElement("h3");
    warningHeading.className = "h6 fw-bold mt-4";
    warningHeading.textContent = "Items to review";

    body.appendChild(warningHeading);

    if (warnings.length === 0) {
        const message = document.createElement("p");
        message.className = "text-secondary";
        message.textContent =
            "There are no financial warnings for the available recorded data.";
        body.appendChild(message);
    } else {
        warnings.forEach(warning => {
            const alert = document.createElement("div");

            alert.className =
                warning.level === "warning"
                    ? "alert alert-warning"
                    : "alert alert-info";

            alert.textContent = warning.message;
            body.appendChild(alert);
        });
    }

    const cashFlowHeading = document.createElement("h3");
    cashFlowHeading.className = "h6 fw-bold mt-4";
    cashFlowHeading.textContent = "Six-month cash flow";

    body.appendChild(cashFlowHeading);

    const tableWrapper = document.createElement("div");
    tableWrapper.className = "table-responsive";

    const table = document.createElement("table");
    table.className = "table table-sm align-middle";

    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th scope="col">Month</th>
            <th scope="col">Income</th>
            <th scope="col">Expenses</th>
            <th scope="col">Net cash flow</th>
        </tr>
    `;

    const tbody = document.createElement("tbody");

    (insights.cashFlowByMonth ?? []).forEach(month => {
        const row = document.createElement("tr");

        [
            month.month,
            formatRand(month.income),
            formatRand(month.expenses),
            formatRand(month.netCashFlow)
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });

    table.append(thead, tbody);
    tableWrapper.appendChild(table);
    body.appendChild(tableWrapper);

    const spendingHeading = document.createElement("h3");
    spendingHeading.className = "h6 fw-bold mt-4";
    spendingHeading.textContent = "Spending by category";

    body.appendChild(spendingHeading);

    const spending = insights.spendingByCategory ?? [];

    if (spending.length === 0) {
        const message = document.createElement("p");
        message.className = "text-secondary";
        message.textContent =
            "No expense categories are available for this period yet.";
        body.appendChild(message);
    } else {
        spending.forEach(item => {
            const line = document.createElement("div");
            line.className = "d-flex justify-content-between gap-3 py-2 border-bottom";

            const name = document.createElement("span");
            name.textContent = item.category;

            const amount = document.createElement("span");
            amount.className = "text-end";
            amount.textContent =
                `${formatRand(item.total)} (${item.sharePercent}%)`;

            line.append(name, amount);
            body.appendChild(line);
        });
    }

    section.appendChild(body);

    const financialSection = container.querySelector(
        "#financialGuideStatus"
    )?.closest(".row");

    if (financialSection) {
        financialSection.after(section);
    } else {
        container.appendChild(section);
    }
}


loadBusinessGuide();
